import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Heart, Youtube } from 'lucide-react';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

        {/* Top left Logo Header */}
        <header className="absolute top-0 left-0 w-full pt-4 sm:pt-6 pl-0 z-50 pointer-events-none">
          <div className="flex items-center gap-1.5 w-full pointer-events-auto">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-400 to-indigo-500 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-500/20">
              <Youtube className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md ml-0.5">
              Save<span className="text-teal-400">Tube</span>
            </span>
          </div>
        </header>


        <main className="flex-grow z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>

        <footer className="z-10 bg-slate-900/50 border-t border-white/5 py-8 text-center text-slate-400 text-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
            <p>© {new Date().getFullYear()} SaveTube. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Developed with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse mx-1" /> by 
              <a 
                href="https://vimalrajput.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent hover:from-white hover:to-white transition-all duration-500"
              >
                Vimal Rajput
              </a>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
