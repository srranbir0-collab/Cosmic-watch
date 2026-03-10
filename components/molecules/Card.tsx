import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradientColor?: 'electric' | 'molten' | 'gravity';
}

export const Card: React.FC<CardProps> = ({ children, className = '', gradientColor = 'electric' }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Motion values for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize mouse position between -0.5 and 0.5
    const mouseXPos = (e.clientX - rect.left) / width - 0.5;
    const mouseYPos = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseXPos);
    y.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const gradients = {
    electric: 'from-electric/40 via-transparent to-electric/10',
    molten: 'from-molten/40 via-transparent to-molten/10',
    gravity: 'from-gravity/40 via-transparent to-gravity/10',
  };

  const glows = {
    electric: 'group-hover:shadow-[0_0_40px_-10px_rgba(0,240,255,0.3)]',
    molten: 'group-hover:shadow-[0_0_40px_-10px_rgba(255,61,0,0.3)]',
    gravity: 'group-hover:shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)]',
  };

  return (
    <motion.div
      className="perspective-1000"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative group rounded-xl transition-shadow duration-500 ${glows[gradientColor]} ${className}`}
      >
        {/* Animated Gradient Border */}
        <div className={`absolute inset-[-1px] rounded-xl bg-gradient-to-br ${gradients[gradientColor]} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
        
        {/* Main Content Container */}
        <div className="relative bg-void-800/90 rounded-xl overflow-hidden h-full backdrop-blur-xl border border-white/5">
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC41IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')] bg-repeat" />
            
            {/* Inner Content with slight Z elevation for depth */}
            <div className="relative z-10 p-6 h-full" style={{ transform: "translateZ(20px)" }}>
                {children}
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};