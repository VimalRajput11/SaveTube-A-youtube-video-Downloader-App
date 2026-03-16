import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, PlayCircle, HardDrive, Download, Clock, Music } from 'lucide-react';
import axios from 'axios';
import VideoCard from './VideoCard';
import ProgressBar from './ProgressBar';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '../utils/helpers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const UnifiedDownloader = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [type, setType] = useState(null); 
    const [downloadProgress, setDownloadProgress] = useState(null);
    
    const eventSourceRef = useRef(null);
    const resultRef = useRef(null);

    const isPlaylist = (url) => url.includes('list=');

    useEffect(() => {
        if (data && !loading) {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [data, loading]);

    const isValidUrl = (url) => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return pattern.test(url);
    };

    const fetchData = useCallback(async (targetUrl) => {
        if (!isValidUrl(targetUrl)) return;

        setLoading(true);
        setError(null);
        setData(null);
        setDownloadProgress(null);

        const videoType = isPlaylist(targetUrl) ? 'playlist' : 'video';
        setType(videoType);

        try {
            const endpoint = videoType === 'playlist' ? '/api/playlist/info' : '/api/video/info';
            const response = await axios.post(`${API_BASE_URL}${endpoint}`, { url: targetUrl });
            setData(response.data);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.response?.data?.message || `Failed to fetch ${videoType} details. Please check the URL.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (url && isValidUrl(url)) {
                fetchData(url);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [url, fetchData]);

    const trackProgress = (taskId) => {
        if (eventSourceRef.current) eventSourceRef.current.close();
        
        const es = new EventSource(`${API_BASE_URL}/api/progress/${taskId}`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            const taskData = JSON.parse(event.data);
            const status = taskData.status.toLowerCase();

            setDownloadProgress(prev => ({
                ...prev,
                status: status.toUpperCase(),
                progress: taskData.progress,
                title: taskData.title || prev?.title,
                thumbnail: taskData.thumbnail || prev?.thumbnail
            }));

            if (status === 'completed') {
                es.close();
                triggerFinalDownload(taskId);
                setTimeout(() => setDownloadProgress(null), 5000);
            } else if (status === 'error') {
                es.close();
                setError('An error occurred: ' + (taskData.error || 'Unknown error'));
                setDownloadProgress(null);
            } else if (status === 'cancelled') {
                es.close();
                setDownloadProgress(null);
            }
        };
    };

    const handleDownload = async (formatId, isAudio = false, targetUrl = null) => {
        const actualUrl = targetUrl || url;
        const taskId = crypto.randomUUID();
        
        let videoInfo = { title: null, thumbnail: null };
        if (targetUrl && type === 'playlist') {
            const entry = data.entries.find(e => e.url === targetUrl);
            if (entry) videoInfo = { title: entry.title, thumbnail: entry.thumbnail };
        } else if (data && type === 'video') {
            videoInfo = { title: data.title, thumbnail: data.thumbnail };
        }

        setError(null);
        setDownloadProgress({ 
            status: 'INITIALIZING', 
            progress: 0, 
            taskId,
            title: videoInfo.title,
            thumbnail: videoInfo.thumbnail
        });

        try {
            const params = { url: actualUrl, taskId, audio: isAudio, format: formatId };
            await axios.get(`${API_BASE_URL}/api/video/download`, { params });
            trackProgress(taskId);
        } catch (err) {
            setError('Failed to begin download. Please check your connection.');
            setDownloadProgress(null);
        }
    };

    const handlePlaylistDownload = async () => {
        const taskId = crypto.randomUUID();
        setDownloadProgress({ 
            status: 'OPTIMIZING PLAYLIST', 
            progress: 0, 
            taskId,
            title: data?.title,
            thumbnail: data?.entries?.[0]?.thumbnail 
        });

        try {
            await axios.get(`${API_BASE_URL}/api/playlist/download`, { params: { url, taskId } });
            trackProgress(taskId);
        } catch (err) {
            setError('Failed to begin playlist processing.');
            setDownloadProgress(null);
        }
    };

    const handleCancel = async () => {
        if (!downloadProgress?.taskId) return;
        try {
            await axios.post(`${API_BASE_URL}/api/download/cancel`, { taskId: downloadProgress.taskId });
            if (eventSourceRef.current) eventSourceRef.current.close();
            setDownloadProgress(null);
        } catch (err) {
            console.error('Cancel error:', err);
        }
    };

    const triggerFinalDownload = (taskId) => {
        // Use location.assign as it's more reliable for forced downloads via res.download
        window.location.assign(`${API_BASE_URL}/api/download/file/${taskId}`);
    };

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    return (
        <div className="w-full flex flex-col gap-8">
            <motion.div
                className="glass p-2 sm:p-4 rounded-2xl sm:rounded-full shadow-2xl relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="flex items-center gap-4 w-full h-14 bg-slate-900/50 rounded-full px-6 border border-slate-700/50 focus-within:border-indigo-500/50 transition-colors">
                    {loading ? (
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    ) : (
                        <Search className="w-6 h-6 text-slate-400" />
                    )}
                    <input
                        type="text"
                        placeholder="Paste Video or Playlist link here..."
                        className="w-full bg-transparent text-slate-100 placeholder-slate-500 outline-none text-lg h-full"
                        value={url}
                        onChange={(e) => {
                            const val = e.target.value;
                            setUrl(val);
                            if (!val) {
                                setData(null);
                                setError(null);
                                setDownloadProgress(null);
                            }
                        }}
                    />
                </div>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center font-medium"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {downloadProgress && (
                <div className="relative">
                    <ProgressBar 
                        progress={downloadProgress.progress} 
                        status={downloadProgress.status}
                        title={downloadProgress.title}
                        thumbnail={downloadProgress.thumbnail}
                        onCancel={handleCancel}
                    />
                </div>
            )}

            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="glass rounded-3xl p-8 animate-pulse flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-5/12 aspect-video bg-slate-800/80 rounded-2xl" />
                            <div className="flex-1 space-y-6">
                                <div className="h-8 bg-slate-800/80 rounded-lg w-3/4" />
                                <div className="h-12 bg-slate-800/80 rounded-xl w-48" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {data && !loading && (
                    <motion.div key="result" ref={resultRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {type === 'video' ? (
                            <VideoCard video={data} onDownload={handleDownload} />
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="glass rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden border-purple-500/20">
                                    <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] rounded-full bg-purple-600/10 blur-[80px] pointer-events-none" />
                                    <div className="flex-1 space-y-4 relative z-10">
                                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                                            {data.title}
                                        </h2>
                                        <div className="flex items-center gap-3 text-sm text-slate-400 font-medium font-mono">
                                            <PlayCircle className="w-4 h-4 text-purple-400" />
                                            {data.videoCount} VIDEOS DETECTED
                                        </div>
                                        <button
                                            onClick={handlePlaylistDownload}
                                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/40 flex items-center gap-2 active:scale-95"
                                        >
                                            <HardDrive className="w-5 h-5" /> Download All as ZIP
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {data.entries?.map((video, idx) => (
                                        <motion.div 
                                            key={video.id || idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="glass group rounded-2xl p-4 flex items-center gap-4 hover:border-purple-500/30 transition-all border border-slate-700/30"
                                        >
                                            <div className="w-24 sm:w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black relative border border-slate-700/50">
                                                <img src={video.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                {formatDuration(video.duration) && (
                                                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-bold flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" /> {formatDuration(video.duration)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-lg font-bold text-slate-100 truncate pr-4">
                                                    {video.title}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest">Auto-HD Selection</span>
                                                    <button 
                                                        onClick={() => handleDownload('bestaudio', true, video.url)} 
                                                        className="text-[10px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                                                    >
                                                        <Music className="w-3 h-3" /> Get MP3
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDownload('best', false, video.url)}
                                                className="bg-slate-800 p-4 rounded-xl text-purple-400 hover:bg-purple-600 hover:text-white transition-all shadow-lg active:scale-90 flex-shrink-0 ml-auto"
                                            >
                                                <Download className="w-6 h-6" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UnifiedDownloader;
