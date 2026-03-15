import UnifiedDownloader from '../components/UnifiedDownloader';
import { motion } from 'framer-motion';
import { Video, Music, Zap } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center pt-4 pb-12 px-4 sm:px-6 relative w-full">
            {/* Ambient center glow */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center max-w-3xl mb-14 relative z-10"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-md mb-8 shadow-2xl"
                >
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-300 uppercase">100% Free & Unlimited</span>
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                    The Ultimate <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-500 animate-gradient-x">
                        SaveTube
                    </span> Downloader
                </h1>
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl mx-auto font-medium">
                    Instantly download high-quality videos and extract audio from YouTube. Paste your link below to begin magic.
                </p>
            </motion.div>

            {/* Unified Downloader Interface */}
            <div className="w-full max-w-4xl relative z-10 mb-20">
                <UnifiedDownloader />
            </div>

            {/* Features Section */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10"
            >
                {/* Feature 1 */}
                <div className="glass rounded-3xl p-8 flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300 border hover:border-indigo-500/50 group">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                        <Video className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">Full HD Video</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Download razor-sharp 1080p videos with perfectly synced audio tracks automatically.</p>
                </div>
                
                {/* Feature 2 */}
                <div className="glass rounded-3xl p-8 flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300 border hover:border-teal-500/50 group">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                        <Music className="w-8 h-8 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">Crisp Audio</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Extract pure, high-bitrate MP3 format audio directly from any video or playlist instantly.</p>
                </div>

                {/* Feature 3 */}
                <div className="glass rounded-3xl p-8 flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300 border hover:border-purple-500/50 group">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <Zap className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">Lightning Fast</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Powered by a high-speed engine, getting your files ready faster than traditional downloaders.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Home;
