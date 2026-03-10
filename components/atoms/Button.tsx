import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'plasma' | 'void' | 'ghost' | 'molten';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = ({ 
  children, 
  variant = 'plasma', 
  size = 'md', 
  isLoading, 
  className = '',
  ...props 
}: ButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Magnetic spring physics
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic pull strength
    x.set(distanceX * 0.15);
    y.set(distanceY * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Ripple effect state
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) props.onClick(e);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const rippleX = e.clientX - rect.left;
    const rippleY = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x: rippleX, y: rippleY, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 1000);
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-10 py-4 text-base"
  };

  const baseStyles = "relative font-display font-semibold tracking-wide uppercase rounded-lg overflow-hidden flex items-center justify-center transition-colors duration-300 group";

  return (
    <motion.button 
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyles} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Backgrounds & Borders based on Variant */}
      
      {/* PLASMA VARIANT */}
      {variant === 'plasma' && (
        <>
          <div className="absolute inset-[-100%] bg-conic-electric animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-[1.5px] bg-void-900 rounded-[6px] z-0" />
          <div className="absolute inset-0 bg-electric/5 group-hover:bg-electric/10 transition-colors z-0" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-electric shadow-[0_0_10px_#00F0FF] opacity-50 group-hover:opacity-100 transition-opacity" />
        </>
      )}

      {/* MOLTEN VARIANT */}
      {variant === 'molten' && (
        <>
          <div className="absolute inset-[-100%] bg-conic-molten animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-[1.5px] bg-void-900 rounded-[6px] z-0" />
          <div className="absolute inset-0 bg-molten/5 group-hover:bg-molten/10 transition-colors z-0" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-molten shadow-[0_0_10px_#FF3D00] opacity-50 group-hover:opacity-100 transition-opacity" />
        </>
      )}

      {/* VOID VARIANT */}
      {variant === 'void' && (
        <>
           <div className="absolute inset-0 border border-void-700 bg-void-800/50 backdrop-blur-sm z-0" />
           <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 z-0" />
        </>
      )}

      {/* GHOST VARIANT */}
      {variant === 'ghost' && (
        <>
           <div className="absolute inset-0 border border-transparent group-hover:border-void-700 bg-transparent transition-all duration-300 z-0" />
        </>
      )}

      {/* Ripples */}
      {ripples.map(r => (
        <span 
          key={r.id}
          className="absolute bg-white/20 rounded-full pointer-events-none animate-ping"
          style={{ 
            left: r.x, 
            top: r.y, 
            width: '20px', 
            height: '20px', 
            transform: 'translate(-50%, -50%)' 
          }}
        />
      ))}

      {/* Content */}
      <span className={`relative z-10 flex items-center gap-2 ${variant === 'molten' ? 'text-molten' : variant === 'plasma' ? 'text-electric' : 'text-gray-300 group-hover:text-white'}`}>
        {isLoading && (
            <svg className="animate-spin -ml-1 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
        )}
        {children}
      </span>
    </motion.button>
  );
};