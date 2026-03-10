
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface ScrambledTextProps {
  children: string;
  className?: string;
  radius?: number;
  duration?: number;
  scrambleChars?: string;
  style?: React.CSSProperties;
}

export const ScrambledText: React.FC<ScrambledTextProps> = ({
  children,
  className = '',
  radius = 80,
  duration = 0.4,
  scrambleChars = '!<>-_\\/[]{}—=+*^?#________',
  style
}) => {
  const chars = children.split('');
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tweenRefs = useRef<(gsap.core.Tween | null)[]>([]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      charRefs.current.forEach((char, i) => {
        if (!char) return;
        const rect = char.getBoundingClientRect();
        // Calculate center of character
        const charX = rect.left + rect.width / 2;
        const charY = rect.top + rect.height / 2;
        
        const dx = e.clientX - charX;
        const dy = e.clientY - charY;
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          // If not actively animating (or allow overwrite for responsiveness)
          if (!tweenRefs.current[i] || !tweenRefs.current[i]?.isActive()) {
             const originalChar = chars[i];
             
             // Skip spaces to avoid layout shifts or invisible scrambles
             if (originalChar === ' ') return;

             const dummy = { value: 0 };
             
             tweenRefs.current[i] = gsap.to(dummy, {
               value: 1,
               duration: duration,
               ease: 'none',
               onUpdate: () => {
                 // Randomize character during animation
                 if (dummy.value < 1) {
                   const randIndex = Math.floor(Math.random() * scrambleChars.length);
                   char.innerText = scrambleChars[randIndex];
                   char.style.color = '#00F0FF'; // Electric color
                   char.style.textShadow = '0 0 5px #00F0FF';
                 } else {
                   char.innerText = originalChar;
                   char.style.color = '';
                   char.style.textShadow = '';
                 }
               },
               onComplete: () => {
                   char.innerText = originalChar;
                   char.style.color = '';
                   char.style.textShadow = '';
               }
             });
          }
        }
      });
    };

    window.addEventListener('pointermove', handleMove);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      tweenRefs.current.forEach(t => t?.kill());
    };
  }, [radius, duration, scrambleChars, chars]);

  return (
    <span className={`inline-block ${className}`} style={style}>
      {chars.map((char, i) => (
        <span
          key={i}
          ref={el => { charRefs.current[i] = el; }}
          className="inline-block whitespace-pre relative"
        >
          {char}
        </span>
      ))}
    </span>
  );
};
