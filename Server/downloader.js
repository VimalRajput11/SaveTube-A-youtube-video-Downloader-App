const ytDlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const { createZip } = require('./zipCreator');
const ffmpegPath = require('ffmpeg-static');

const tasks = {};

const parseProgress = (data, taskId) => {
    const message = data.toString();
    // Do not overwrite progress if already merging
    if (tasks[taskId]?.status === 'merging') return;

    const match = message.match(/(\d+(?:\.\d+)?)%/);
    if (match) {
        const rawProgress = parseFloat(match[1]);
        
        if (!tasks[taskId].stage) tasks[taskId].stage = 1;
        if (tasks[taskId].lastRaw === undefined) tasks[taskId].lastRaw = 0;

        // Detect major drop in progress, assuming it moved from Video to Audio stream
        if (rawProgress < tasks[taskId].lastRaw - 40 && tasks[taskId].stage === 1) {
            tasks[taskId].stage = 2;
        }
        
        tasks[taskId].lastRaw = rawProgress;

        // Map Stage 1 (Video) to 0-80%, Stage 2 (Audio) to 80-100%
        if (tasks[taskId].stage === 1) {
            tasks[taskId].progress = rawProgress * 0.8;
        } else {
            tasks[taskId].progress = 80 + (rawProgress * 0.2);
        }

        if (tasks[taskId].status !== 'merging') {
            tasks[taskId].status = 'downloading';
        }
    } else if (message.toLowerCase().includes('merg')) {
        tasks[taskId].status = 'merging';
        tasks[taskId].progress = 100;
    }
};

const downloadVideo = async (url, formatId, isAudio, taskId) => {
    const taskDir = path.join(__dirname, 'tmp', taskId);
    if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true });

    tasks[taskId] = { progress: 0, status: 'initializing', url, taskDir };
    
    try {
        const info = await ytDlp(url, {
            dumpJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            // extractorArgs: 'youtube:player_client=android,web', // Removed to fix 360p limit
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            ffmpegLocation: ffmpegPath
        });

        const title = info.title.replace(/[^\w\s-]/g, '');
        const ext = isAudio === 'true' ? 'mp3' : 'mp4';
        const fileName = `${title}.${ext}`;
        const filePath = path.join(taskDir, `${taskId}.${ext}`);

        tasks[taskId].fileName = fileName;
        tasks[taskId].filePath = filePath;
        tasks[taskId].title = info.title;
        tasks[taskId].thumbnail = info.thumbnail;

        const args = {
            noWarnings: true,
            noCheckCertificate: true,
            o: filePath,
            paths: `temp:${path.join(taskDir, 'temp_chunks')}`,
            // Isolate temporary files to prevent WinError 32 during rename
            noPlaylist: true,
            concurrentFragments: 5,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            ffmpegLocation: ffmpegPath,
            noWriteSubs: true,
            noEmbedSubs: true,
            noWriteAutoSubs: true,
            subLangs: '-all',
            compatOptions: 'no-keep-subs',
            // extractorArgs: 'youtube:player_client=android,web', // Removed to fix 360p limit
            noMtime: true,
            noCacheDir: true
        };

        if (isAudio === 'true') {
            args.f = 'bestaudio';
            args.extractAudio = true;
            args.audioFormat = 'mp3';
        } else {
            const cleanId = formatId ? formatId.toString().replace('p', '') : null;
            if (cleanId && cleanId !== 'best' && !isNaN(cleanId)) {
                args.f = `bestvideo[height<=${cleanId}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${cleanId}][ext=mp4]/best`;
            } else {
                args.f = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
            }
            args.mergeOutputFormat = 'mp4';
        }

        const subprocess = ytDlp.exec(url, args);
        tasks[taskId].subprocess = subprocess;

        subprocess.stdout.on('data', (data) => parseProgress(data, taskId));
        
        await subprocess;

        if (tasks[taskId].status !== 'cancelled') {
            tasks[taskId].progress = 100;
            tasks[taskId].status = 'completed';
        }

    } catch (err) {
        if (tasks[taskId].status !== 'cancelled') {
            console.error('Download error:', err);
            tasks[taskId].status = 'error';
            tasks[taskId].error = err.message;
        }
    }
};

const downloadPlaylist = async (url, taskId) => {
    const taskDir = path.join(__dirname, 'tmp', taskId);
    if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true });

    tasks[taskId] = { progress: 0, status: 'preparing', url, taskDir };
    const outputDir = path.join(taskDir, 'raw');

    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const info = await ytDlp(url, {
            dumpSingleJson: true,
            flatPlaylist: true,
            noWarnings: true,
            // extractorArgs: 'youtube:player_client=android,web', // Removed to fix 360p limit
            noCheckCertificate: true
        });
        tasks[taskId].title = info.title;
        tasks[taskId].videoCount = info.entries ? info.entries.length : 0;

        const subprocess = ytDlp.exec(url, {
            yesPlaylist: true,
            f: 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160][ext=mp4]/best',
            mergeOutputFormat: 'mp4',
            o: path.join(outputDir, '%(title)s.%(ext)s'),
            paths: `temp:${path.join(outputDir, 'temp_chunks')}`,
            noWarnings: true,
            noCheckCertificate: true,
            concurrentFragments: 5,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            ffmpegLocation: ffmpegPath,
            noWriteSubs: true,
            noEmbedSubs: true,
            noWriteAutoSubs: true,
            subLangs: '-all',
            compatOptions: 'no-keep-subs',
            // extractorArgs: 'youtube:player_client=android,web', // Removed to fix 360p limit
            noMtime: true,
            noCacheDir: true
        });
        tasks[taskId].subprocess = subprocess;

        subprocess.stdout.on('data', (data) => {
            const message = data.toString();
            
            // Track playlist video index: [download] Downloading item 1 of 5
            const itemMatch = message.match(/Downloading item (\d+) of (\d+)/);
            if (itemMatch) {
                tasks[taskId].currentIndex = parseInt(itemMatch[1]);
                tasks[taskId].totalVideos = parseInt(itemMatch[2]);
            }

            const match = message.match(/(\d+(?:\.\d+)?)%/);
            if (match) {
                const currentVideoProgress = parseFloat(match[1]);
                const currentIndex = tasks[taskId].currentIndex || 1;
                const totalVideos = tasks[taskId].totalVideos || tasks[taskId].videoCount || 1;

                // Overall progress = (videos_already_done + current_video_fraction) / total_videos
                // We reserve the last 5% for zipping
                const baseProgress = ((currentIndex - 1) / totalVideos) * 90;
                const incrementalProgress = (currentVideoProgress / 100) * (90 / totalVideos);
                
                tasks[taskId].progress = baseProgress + incrementalProgress;
                tasks[taskId].status = 'downloading';
            }
        });

        await subprocess;

        if (tasks[taskId].status !== 'cancelled') {
            tasks[taskId].status = 'zipping';
            tasks[taskId].progress = 95;
            const zipPath = path.join(__dirname, 'tmp', `${taskId}.zip`);
            await createZip(outputDir, zipPath);
            tasks[taskId].filePath = zipPath;
            tasks[taskId].fileName = 'playlist.zip';
            tasks[taskId].progress = 100;
            tasks[taskId].status = 'completed';
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
    } catch (err) {
        if (tasks[taskId].status !== 'cancelled') {
            tasks[taskId].status = 'error';
            tasks[taskId].error = err.message;
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
        }
    }
};

module.exports = { downloadVideo, downloadPlaylist, tasks };
