import { useState } from 'react';
import { formatDuration } from '../utils/helpers';
import { Download, Music, Video, HardDrive, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCard = ({ video, onDownload }) => {
    const { title, thumbnail, duration, formats } = video;
    const [activeTab, setActiveTab] = useState('video');

    // Separate formats into video and audio
    const videoFormats = formats?.filter(f => !f.isAudio) || [];
    const audioFormats = formats?.filter(f => f.isAudio) || [];

    const tabs = [
        { id: 'video', label: 'Video', icon: Video },
        { id: 'audio', label: 'Audio', icon: Music },
    ];

    const currentFormats = activeTab === 'video' ? videoFormats : audioFormats;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
        >
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    
                    {/* Left: Thumbnail & Info */}
                    <div className="w-full md:w-[35%] p-4 bg-slate-50 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-md">
                            <img
                                src={thumbnail}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                            {formatDuration(duration) && (
                                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white backdrop-blur-sm">
                                    {formatDuration(duration)}
                                </div>
                            )}
                        </div>
                        <h2 className="mt-4 text-sm sm:text-base font-semibold text-slate-800 dark:text-white leading-snug line-clamp-3">
                            {title}
                        </h2>
                    </div>

                    {/* Right: Formats Table */}
                    <div className="w-full md:w-[65%] flex flex-col">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800 px-2 pt-2">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative px-6 py-3 flex items-center gap-2 text-sm font-semibold transition-colors ${
                                            isActive 
                                                ? 'text-teal-600 dark:text-teal-400' 
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                        {isActive && (
                                            <motion.div 
                                                layoutId="activeTab" 
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Table */}
                        <div className="flex-1 p-0 overflow-x-auto relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <table className="w-full text-left border-collapse min-w-[340px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">
                                        <th className="font-bold px-3 py-3 sm:px-6 sm:py-4 rounded-tl-xl sm:rounded-none">Resolution / Quality</th>
                                        <th className="font-bold px-3 py-3 sm:px-6 sm:py-4 text-center">Format</th>
                                        <th className="font-bold px-3 py-3 sm:px-6 sm:py-4 w-16 sm:w-[140px] text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="wait">
                                        <motion.div 
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="contents"
                                        >
                                            {currentFormats.map((format, idx) => (
                                                <motion.tr 
                                                    key={format.id || idx}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all group ${activeTab === 'audio' ? 'bg-indigo-500/[0.02]' : ''}`}
                                                >
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 align-middle">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${activeTab === 'audio' ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-400'}`}>
                                                                {activeTab === 'video' ? (
                                                                    <PlayCircle className="w-4 h-4" />
                                                                ) : (
                                                                    <Music className="w-4 h-4 animate-pulse" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                                    {format.label}
                                                                </span>
                                                                {activeTab === 'audio' && (
                                                                    <span className="text-[9px] sm:text-[10px] text-indigo-400/60 font-medium truncate">320kbps Estimated</span>
                                                                )}
                                                            </div>
                                                            {format.height >= 1080 && (
                                                                <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] sm:text-[9px] font-black bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 flex-shrink-0">
                                                                    HD
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 align-middle text-center">
                                                        <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${activeTab === 'audio' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5' : 'text-slate-400 border-slate-700/50'}`}>
                                                            {activeTab === 'audio' ? 'MP3' : 'MP4'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 align-middle">
                                                        <button
                                                            onClick={() => onDownload(format.id, format.isAudio || activeTab === 'audio')}
                                                            className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg group/btn ${
                                                                activeTab === 'audio' 
                                                                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/20' 
                                                                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/5'
                                                            }`}
                                                        >
                                                            <Download className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover/btn:-translate-y-0.5 ${activeTab === 'audio' ? 'text-indigo-200' : 'text-indigo-400'}`} />
                                                            <span className="hidden sm:inline">Download</span>
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                    
                                    {currentFormats.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-40">
                                                    <Search className="w-8 h-8" />
                                                    <p className="text-sm font-medium">No formats available</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default VideoCard;
