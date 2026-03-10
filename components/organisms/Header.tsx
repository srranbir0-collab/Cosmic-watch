
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-void-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Cosmic Watch" className="w-10 h-10 object-contain rounded-md" />
            <div>
                <h1 className="font-hero font-bold text-2xl tracking-tight leading-none text-white">COSMIC<span className="text-electric">WATCH</span></h1>
                <div className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase">Orbital Surveillance</div>
            </div>
        </div>

        <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-lg border border-white/5 bg-void-900/50">
            <button 
                onClick={() => navigate('/dashboard')}
                className={`px-6 py-2 rounded-md text-sm font-display font-medium tracking-wide transition-all duration-300 ${isActive('/dashboard') ? 'bg-void-800 text-electric shadow-lg border border-white/5' : 'text-gray-500 hover:text-white'}`}
            >
                LIVE FEED
            </button>
            <button 
                onClick={() => navigate('/analyzer')}
                className={`px-6 py-2 rounded-md text-sm font-display font-medium tracking-wide transition-all duration-300 ${isActive('/analyzer') ? 'bg-void-800 text-electric shadow-lg border border-white/5' : 'text-gray-500 hover:text-white'}`}
            >
                THREAT LAB
            </button>
            <button 
                onClick={() => navigate('/simulation')}
                className={`px-6 py-2 rounded-md text-sm font-display font-medium tracking-wide transition-all duration-300 ${isActive('/simulation') ? 'bg-void-800 text-electric shadow-lg border border-white/5' : 'text-gray-500 hover:text-white'}`}
            >
                VIDEO LAB
            </button>
            <button 
                onClick={() => navigate('/image-lab')}
                className={`px-6 py-2 rounded-md text-sm font-display font-medium tracking-wide transition-all duration-300 ${isActive('/image-lab') ? 'bg-void-800 text-electric shadow-lg border border-white/5' : 'text-gray-500 hover:text-white'}`}
            >
                IMAGE LAB
            </button>
        </nav>

        <div className="flex items-center gap-4">
            <div className="hidden lg:block text-right">
                <div className="text-[9px] text-gray-600 uppercase font-mono tracking-widest mb-0.5">System Integrity</div>
                <div className="text-xs text-emerald-400 font-mono flex items-center justify-end gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    100% OPTIMAL
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};
