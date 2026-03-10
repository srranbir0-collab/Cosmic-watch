
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CosmicGlobe } from './CosmicGlobe';
import { Button } from '../atoms/Button';
import { useCosmicStore } from '../../store/useCosmicStore';

interface HeroProps {
    onConnect?: (path?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onConnect }) => {
  const [loaded, setLoaded] = useState(false);
  const [starDensity, setStarDensity] = useState(1.0);
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToCommand = () => {
    // If onConnect is passed, we trigger Auth flow instead of scrolling
    if (onConnect) {
        onConnect('/dashboard');
    } else {
        const el = document.getElementById('command-center');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigateTo = (path: string) => {
    if (onConnect) {
        onConnect(path);
    } else {
        navigate(path);
    }
  };

  // Text Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 1
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.5, filter: "blur(10px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      filter: "blur(0px)",
      transition: { type: "spring" as const, damping: 12, stiffness: 100 }
    }
  };

  const subtitleVariants = {
    hidden: { opacity: 0, letterSpacing: "0.5em" },
    visible: { 
      opacity: 0.9, 
      letterSpacing: "0.05em",
      transition: { duration: 1.5, ease: "easeOut" as const, delay: 2 } 
    }
  };

  const controlsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { delay: 2.5, duration: 0.8 } 
    }
  };

  const title = "COSMIC WATCH";

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#020205]">
      
      {/* Top Navigation Pill - Centered Wrapper */}
      <div className="absolute top-8 left-0 w-full flex justify-center z-50 pointer-events-none">
        <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="pointer-events-auto w-auto"
        >
            <div className="flex items-center justify-center gap-1 p-1.5 bg-void-950/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <button 
                onClick={() => navigateTo('/dashboard')}
                className="flex items-center justify-center px-6 py-2 rounded-full text-xs font-display font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 uppercase tracking-wider whitespace-nowrap text-center"
            >
                Dashboard
            </button>
            <button 
                onClick={() => navigateTo('/analyzer')}
                className="flex items-center justify-center px-6 py-2 rounded-full text-xs font-display font-bold text-gray-300 hover:text-electric hover:bg-electric/10 transition-all duration-300 uppercase tracking-wider whitespace-nowrap text-center"
            >
                Threat Intel
            </button>
            <button 
                onClick={() => navigateTo('/simulation')}
                className="flex items-center justify-center px-6 py-2 rounded-full text-xs font-display font-bold text-gray-300 hover:text-molten hover:bg-molten/10 transition-all duration-300 uppercase tracking-wider whitespace-nowrap text-center"
            >
                Sim Lab
            </button>
            </div>
        </motion.div>
      </div>

      {/* --- Layer 1: WebGL Cosmic Globe & Starfield --- */}
      <div className={`transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} absolute inset-0 z-0`}>
        <CosmicGlobe starDensity={starDensity} />
      </div>

      {/* --- Layer 2: Atmospheric Gradients --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,100,0,0.15)_0%,rgba(0,0,0,0)_60%)] mix-blend-screen pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(60,0,120,0.2)_0%,rgba(0,0,0,0)_60%)] mix-blend-screen pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,61,0,0.05)_0%,rgba(0,0,0,0)_50%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#020205_100%)] opacity-70 pointer-events-none z-0" />
      
      {/* --- Content Layer --- */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center pointer-events-none">
        
        {/* Main Title with Staggered Letters */}
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={loaded ? "visible" : "hidden"}
            className="flex flex-nowrap justify-center items-center overflow-visible mb-6 pointer-events-auto w-full"
        >
            {title.split("").map((char, index) => (
                <motion.span 
                    key={index} 
                    variants={letterVariants}
                    className="font-hero font-black text-[8vw] md:text-[9vw] lg:text-[150px] leading-none text-white mix-blend-overlay"
                    style={{ 
                        textShadow: "0px 0px 40px rgba(255,61,0,0.3), 0 0 10px rgba(255,255,255,0.5)",
                        marginRight: char === " " ? "0.4em" : "-0.02em"
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p 
            variants={subtitleVariants}
            initial="hidden"
            animate={loaded ? "visible" : "hidden"}
            className="font-sans text-lg md:text-2xl text-orange-100/80 font-light tracking-wide max-w-2xl mx-auto mb-12 pointer-events-auto drop-shadow-md"
        >
            Real-Time Near-Earth Object Monitoring & Risk Analysis
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
            variants={controlsVariants}
            initial="hidden"
            animate={loaded ? "visible" : "hidden"}
            className="flex flex-col sm:flex-row gap-6 items-center pointer-events-auto"
        >
            <Button 
                variant="molten" 
                size="lg" 
                onClick={scrollToCommand}
                className="shadow-[0_0_50px_-10px_rgba(255,61,0,0.5)]"
            >
                Enter Command Center
            </Button>
            <Button variant="ghost" size="lg" className="border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md">
                Mission Briefing
            </Button>
        </motion.div>
      </div>

      {/* --- Interactive Elements --- */}

      {/* Density Slider */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 3.5 }}
        className="absolute left-8 bottom-10 z-20 pointer-events-auto flex flex-col gap-2"
      >
        <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Star Density</label>
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-500">LOW</span>
            <input 
                type="range" 
                min="0.2" 
                max="2.0" 
                step="0.1" 
                value={starDensity} 
                onChange={(e) => setStarDensity(parseFloat(e.target.value))}
                className="w-32 h-1 bg-void-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-molten [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_#FF3D00]"
            />
            <span className="text-[10px] font-mono text-molten">MAX</span>
        </div>
      </motion.div>
      
      {/* Right Side Navigation Dots */}
      <div className="absolute right-8 top-1/2 -translate-x-1/2 hidden lg:flex flex-col gap-6 z-20 pointer-events-auto">
        {[0, 1, 2].map((i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3 + i * 0.2 }}
                className="w-2 h-2 rounded-full bg-white/40 hover:bg-molten hover:scale-150 hover:shadow-[0_0_10px_#FF3D00] transition-all duration-300 cursor-pointer"
            />
        ))}
      </div>

      {/* Bottom Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20 group pointer-events-auto"
        onClick={scrollToCommand}
      >
        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-gray-400 group-hover:text-white transition-colors">Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-molten to-transparent group-hover:via-white transition-all duration-500">
             <div className="w-full h-1/2 bg-white blur-[2px] animate-border-beam"></div>
        </div>
      </motion.div>
    </section>
  );
};
