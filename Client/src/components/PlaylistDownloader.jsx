import { useState } from 'react';
import { Search, Loader2, PlayCircle, HardDrive } from 'lucide-react';
import axios from 'axios';
import ProgressBar from './ProgressBar';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const PlaylistDownloader = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [playlistData, setPlaylistData] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(null);

    const fetchPlaylistInfo = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        setPlaylistData(null);
        setDownloadProgress(null);

        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/playlist/info`, { url });
            setPlaylistData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch playlist. Ensure it is a valid YouTube playlist URL.');
        } finally {
            setLoading(false);
        }
    };

    const downloadFullPlaylist = () => {
        setDownloadProgress({ status: 'Preparing ZIP...', progress: 10 });

        try {
            const downloadUrl = `${API_BASE_URL}/api/playlist/download?url=${encodeURIComponent(url)}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            link.remove();

            setDownloadProgress({ status: 'Zipping and Downloading...', progress: 100 });
            setTimeout(() => setDownloadProgress(null), 8000);

        } catch (err) {
            console.error('Playlist download error:', err);
            setError('An error occurred during playlist download.');
            setDownloadProgress(null);
        }
    };

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Search Section */}
            <motion.div
                className="glass p-2 sm:p-4 rounded-2xl sm:rounded-full shadow-2xl relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <form onSubmit={fetchPlaylistInfo} className="flex flex-col sm:flex-row items-center gap-4 w-full h-auto sm:h-14 bg-slate-900/50 rounded-xl sm:rounded-full px-4 py-2 sm:py-0 border border-slate-700/50 overflow-hidden focus-within:border-purple-500/50 transition-colors">
                    <PlayCircle className="w-6 h-6 text-purple-400 hidden sm:block flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Paste YouTube Playlist URL here..."
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 outline-none px-2 h-10 sm:h-full text-base sm:text-lg"
                        value={url}
                        onChange={(e) => {
                            const val = e.target.value;
                            setUrl(val);
                            if (!val) {
                                setPlaylistData(null);
                                setError(null);
                                setDownloadProgress(null);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="w-full sm:w-auto h-10 sm:h-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white px-8 rounded-lg sm:rounded-full font-semibold transition-all shadow-lg hover:shadow-purple-500/30 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch Playlist'}
                    </button>
                </form>
            </motion.div>

            {/* Error Output */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center shadow-lg"
                >
                    {error}
                </motion.div>
            )}

            {/* Progress Indicator */}
            {downloadProgress && (
                <ProgressBar 
                    progress={downloadProgress.progress} 
                    status={downloadProgress.status} 
                    onCancel={() => setDownloadProgress(null)}
                />
            )}

            {/* Data Card */}
            {playlistData && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group hover:border-purple-500/30 transition-colors"
                >
                    {/* Aesthetic Blur Backdrop */}
                    <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] rounded-full bg-purple-600/10 blur-[80px] pointer-events-none group-hover:bg-purple-600/20 transition-colors duration-500" />

                    <div className="flex-1 space-y-6 relative z-10 w-full">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 leading-tight">
                                {playlistData.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mt-3">
                                <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
                                    <PlayCircle className="w-4 h-4 text-purple-400" />
                                    {playlistData.videoCount} Videos
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
                                    <HardDrive className="w-4 h-4 text-purple-400" />
                                    ZIP Archive
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={downloadFullPlaylist}
                            className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
                        >
                            <HardDrive className="w-5 h-5" /> Download Entire Playlist as ZIP
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Skeleton Loading State */}
            {loading && (
                <div className="glass rounded-3xl p-6 sm:p-8 animate-pulse flex flex-col gap-6">
                    <div className="h-10 bg-slate-800/80 rounded-lg w-1/2" />
                    <div className="flex gap-4">
                        <div className="h-8 bg-slate-800/80 rounded-full w-24" />
                        <div className="h-8 bg-slate-800/80 rounded-full w-24" />
                    </div>
                    <div className="h-14 bg-slate-800/80 rounded-xl w-64 mt-4" />
                </div>
            )}
        </div>
    );
};

export default PlaylistDownloader;
