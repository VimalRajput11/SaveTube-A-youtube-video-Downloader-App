import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, X, Check, AlertTriangle } from 'lucide-react';

const ProgressBar = ({ progress, status, title, thumbnail, onCancel }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/5 overflow-hidden"
                >
                    <div className="relative z-10 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase flex items-center gap-2 ${status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {status !== 'COMPLETED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    {status === 'COMPLETED' ? 'Download Complete' : 'Downloading...'}
                                </span>
                             </div>
                             <button 
                                onClick={() => setShowConfirm(true)}
                                className="p-2 hover:bg-white/10 text-slate-400 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Media Info */}
                        <div className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                            {thumbnail ? (
                                <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0">
                                    <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-20 h-14 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                    <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-base truncate">
                                    {title || 'Loading video info...'}
                                </h4>
                                <p className="text-slate-500 text-xs mt-0.5">
                                    Processing your file
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-medium text-slate-400">
                                    Progress
                                </span>
                                <span className="text-3xl font-bold text-white">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                />
                            </div>
                        </div>

                        <p className="text-center text-xs text-slate-500">
                            Please keep this page open until finished
                        </p>
                    </div>

                    {/* Custom Confirmation Modal Overlay */}
                    <AnimatePresence>
                        {showConfirm && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-6"
                            >
                                <motion.div 
                                    initial={{ scale: 0.9, y: 20 }} 
                                    animate={{ scale: 1, y: 0 }} 
                                    exit={{ scale: 0.9, y: -20 }}
                                    className="text-center w-full"
                                >
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Cancel Download?</h3>
                                    <p className="text-slate-400 text-sm mb-8 px-4">
                                        Are you sure you want to stop this process? The downloaded progress will be lost.
                                    </p>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setShowConfirm(false)} 
                                            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-slate-800/50"
                                        >
                                            Continue
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setShowConfirm(false);
                                                if(onCancel) onCancel();
                                            }} 
                                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-red-500/30"
                                        >
                                            Yes, Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProgressBar;
