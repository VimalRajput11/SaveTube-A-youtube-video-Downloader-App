const express = require('express');
const cors = require('cors');
const ytDlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const { downloadVideo, downloadPlaylist, tasks } = require('./downloader');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create tmp directory if it doesn't exist
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
}

// 0. Progress Endpoint (SSE)
app.get('/api/progress/:id', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const taskId = req.params.id;
    
    const interval = setInterval(() => {
        const task = tasks[taskId];
        if (task) {
            // Only send necessary fields to client, avoiding circular/process objects
            const { subprocess, ...safeTask } = task;
            res.write(`data: ${JSON.stringify(safeTask)}\n\n`);
            
            if (task.status === 'error' || task.status === 'completed' || task.status === 'cancelled') {
                clearInterval(interval);
                res.end();
                
                if (task.status === 'completed') {
                   // Give client 10 minutes to request the file before wiping it
                   task.cleanupTimeout = setTimeout(() => {
                       if (task.taskDir && fs.existsSync(task.taskDir)) {
                           try { fs.rmSync(task.taskDir, { recursive: true, force: true }); } catch(e) {}
                       }
                       delete tasks[taskId];
                   }, 10 * 60 * 1000);
                } else if (task.status === 'error' || task.status === 'cancelled') {
                   // Delete immediately on error or cancel
                   if (task.taskDir && fs.existsSync(task.taskDir)) {
                       try { fs.rmSync(task.taskDir, { recursive: true, force: true }); } catch(e) {}
                   }
                   delete tasks[taskId];
                }
            }
        } else {
            res.write(`data: ${JSON.stringify({ progress: 0, status: 'initializing' })}\n\n`);
        }
    }, 150);

    req.on('close', () => {
        clearInterval(interval);
    });
});

// 0.1 Cancel Download
app.post('/api/download/cancel', (req, res) => {
    const { taskId } = req.body;
    const task = tasks[taskId];
    if (task && task.subprocess) {
        task.subprocess.kill();
        task.status = 'cancelled';
        // Cleanup folder
        if (task.taskDir && fs.existsSync(task.taskDir)) {
            try { fs.rmSync(task.taskDir, { recursive: true, force: true }); } catch(e) {}
        }
        res.json({ message: 'Download cancelled' });
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
});

// 1. Fetch Video Info
app.post('/api/video/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required.' });

    try {
        const rawData = await ytDlp(url, {
            dumpJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            noPlaylist: true,
            flatPlaylist: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });

        // Grouping logic to find available resolutions up to 1080p
        const maxResolution = 1080;
        const availableHeights = [...new Set(rawData.formats.map(f => f.height).filter(h => h && h <= maxResolution))].sort((a, b) => b - a);
        
        const qualities = availableHeights.map(height => {
            let label = `${height}p`;
            if (height >= 1080) label = '1080p Full HD';
            else if (height >= 720) label = '720p HD';
            else if (height >= 480) label = '480p SD';
            else if (height >= 360) label = '360p SD';

            return {
                id: height.toString(),
                height,
                label,
                isAudio: false
            };
        });

        // Filter duplicates (some heights might map to same label, keep highest for that label)
        const uniqueQualities = [];
        const seenLabels = new Set();
        for (const q of qualities) {
            if (!seenLabels.has(q.label)) {
                uniqueQualities.push(q);
                seenLabels.add(q.label);
            }
        }

        // Always add MP3
        uniqueQualities.push({ id: 'bestaudio', label: 'MP3 High Quality', isAudio: true });

        res.json({
            title: rawData.title,
            thumbnail: rawData.thumbnail,
            duration: rawData.duration,
            formats: uniqueQualities,
            url: rawData.webpage_url
        });
    } catch (err) {
        console.error('Error fetching video info:', err);
        const errorMessage = err.stderr || err.message || 'Failed to fetch video information';
        res.status(500).json({ message: errorMessage.includes('video is not available') ? 'This video is restricted or unavailable. Try another URL.' : 'Error fetching video data.' });
    }
});

// 2. Start Video Download (Background)
app.get('/api/video/download', async (req, res) => {
    const { url, format, audio, taskId } = req.query;
    if (!url) return res.status(400).send('URL is required');
    if (!taskId) return res.status(400).send('taskId is required');

    try {
        downloadVideo(url, format, audio, taskId);
        res.json({ message: 'Download started', taskId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to start download');
    }
});

// 3. Final File Retrieval
app.get('/api/download/file/:taskId', (req, res) => {
    const task = tasks[req.params.taskId];
    if (!task || !task.filePath || !fs.existsSync(task.filePath)) {
        return res.status(404).send('File not found or task expired');
    }

    // Stop the 10-minute wipe timer now that the user has started receiving the file
    if (task.cleanupTimeout) {
        clearTimeout(task.cleanupTimeout);
    }

    // Send the file down to the client device
    res.download(task.filePath, task.fileName, (err) => {
        // This runs when the file has fully transferred to the user's browser, or if they cancelled it mid-transfer
        if (task.taskDir && fs.existsSync(task.taskDir)) {
            try { fs.rmSync(task.taskDir, { recursive: true, force: true }); } catch (e) { console.error('Cleanup failed:', e.message); }
        }
        delete tasks[req.params.taskId];
    });
});

// 4. Fetch Playlist Info
app.post('/api/playlist/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required.' });

    try {
        const rawData = await ytDlp(url, {
            dumpSingleJson: true,
            flatPlaylist: true,
            noWarnings: true,
            noCheckCertificate: true,
            extractorArgs: 'youtube:player_client=android,web'
        });

        res.json({
            title: rawData.title,
            videoCount: rawData.entries ? rawData.entries.length : 0,
            entries: (rawData.entries || []).map(entry => ({
                title: entry.title,
                url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
                duration: entry.duration,
                id: entry.id,
                thumbnail: entry.thumbnail || (entry.thumbnails && entry.thumbnails[0]?.url)
            }))
        });
    } catch (err) {
        console.error('Error fetching playlist:', err);
        res.status(500).json({ message: 'Failed to fetch playlist information' });
    }
});

// 5. Download Playlist as ZIP (Background)
app.get('/api/playlist/download', async (req, res) => {
    const { url, taskId } = req.query;
    if (!url) return res.status(400).send('URL is required');
    if (!taskId) return res.status(400).send('taskId is required');

    try {
        downloadPlaylist(url, taskId);
        res.json({ message: 'Playlist preparation started', taskId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to download playlist');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
