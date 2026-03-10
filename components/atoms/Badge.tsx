import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  label: string;
  type?: 'safe' | 'warning' | 'danger' | 'neutral' | 'electric';
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'neutral' }) => {
  const gradients = {
    safe: "from-emerald-900/40 via-emerald-800/40 to-emerald-900/40 border-emerald-500/30 text-emerald-400",
    warning: "from-yellow-900/40 via-yellow-800/40 to-yellow-900/40 border-yellow-500/30 text-yellow-400",
    danger: "from-molten/20 via-red-900/40 to-molten/20 border-molten/40 text-molten shadow-[0_0_15px_rgba(255,61,0,0.2)]",
    electric: "from-electric/20 via-cyan-900/40 to-electric/20 border-electric/40 text-electric shadow-[0_0_15px_rgba(0,240,255,0.2)]",
    neutral: "from-void-800 via-void-700 to-void-800 border-void-600 text-gray-400"
  };

  return (
    <motion.span 
      initial={{ scale: 0.9, opacity: 0, y: 5 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className={`relative px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold tracking-widest border backdrop-blur-md overflow-hidden bg-gradient-to-r bg-[length:200%_100%] animate-gradient-shift ${gradients[type]}`}
      style={{ backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }}
    >
      <span className="relative z-10">{label}</span>
      
      {/* Inner Glow/Sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      
      {/* Style shim for the animation within component if needed, or rely on tailwind config if added. 
          Using inline style for unique gradient animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </motion.span>
  );
};