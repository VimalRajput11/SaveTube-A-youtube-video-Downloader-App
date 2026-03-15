import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import VideoCard from './VideoCard';
import ProgressBar from './ProgressBar';
import { motion } from 'framer-motion';

const Downloader = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [videoData, setVideoData] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(null);

    const fetchVideoInfo = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        setVideoData(null);
        setDownloadProgress(null);

        try {
            const { data } = await axios.post('http://localhost:5000/api/video/info', { url });
            setVideoData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch video information. Please try another URL.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (formatId, isAudio = false) => {
        setDownloadProgress({ status: 'Preparing download...', progress: 10 });

        try {
            const fetchParams = isAudio ? `?audio=true&url=${encodeURIComponent(url)}` : `?format=${formatId}&url=${encodeURIComponent(url)}`;
            const downloadUrl = `http://localhost:5000/api/video/download${fetchParams}`;

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setDownloadProgress({ status: 'Downloading in browser...', progress: 100 });
            setTimeout(() => setDownloadProgress(null), 5000);

        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to start download.');
            setDownloadProgress(null);
        }
    };

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Search Input Section */}
            <motion.div
                className="glass p-2 sm:p-4 rounded-2xl sm:rounded-full shadow-2xl relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <form onSubmit={fetchVideoInfo} className="flex flex-col sm:flex-row items-center gap-4 w-full h-auto sm:h-14 bg-slate-900/50 rounded-xl sm:rounded-full px-4 py-2 sm:py-0 border border-slate-700/50 overflow-hidden focus-within:border-indigo-500/50 transition-colors">
                    <Search className="w-6 h-6 text-indigo-400 hidden sm:block flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Paste YouTube Video URL here..."
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 outline-none px-2 h-10 sm:h-full text-base sm:text-lg"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="w-full sm:w-auto h-10 sm:h-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-8 rounded-lg sm:rounded-full font-semibold transition-all shadow-lg hover:shadow-indigo-500/30 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch Video'}
                    </button>
                </form>
            </motion.div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center shadow-lg"
                >
                    {error}
                </motion.div>
            )}

            {/* Progress Bar */}
            {downloadProgress && (
                <ProgressBar progress={downloadProgress.progress} status={downloadProgress.status} />
            )}

            {/* Video Preview Card */}
            {videoData && !loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <VideoCard video={videoData} onDownload={handleDownload} />
                </motion.div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="glass rounded-3xl p-6 sm:p-8 animate-pulse flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-5/12 aspect-video bg-slate-800/80 rounded-2xl shrink-0" />
                    <div className="flex-1 w-full space-y-6">
                        <div className="h-8 bg-slate-800/80 rounded-lg w-3/4" />
                        <div className="space-y-3">
                            <div className="h-4 bg-slate-800/80 rounded w-1/4" />
                            <div className="h-4 bg-slate-800/80 rounded w-1/3" />
                        </div>
                        <div className="flex gap-4">
                            <div className="h-10 bg-slate-800/80 rounded-lg w-24" />
                            <div className="h-10 bg-slate-800/80 rounded-lg w-24" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Downloader;
