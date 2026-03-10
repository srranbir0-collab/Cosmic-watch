import React, { useRef, useEffect, useState, useMemo, useId } from 'react';

interface LinearLoopProps {
  marqueeText: string;
  speed?: number;
  className?: string;
  interactive?: boolean;
  direction?: 'left' | 'right';
}

export const LinearLoop: React.FC<LinearLoopProps> = ({
  marqueeText = '',
  speed = 1,
  className = '',
  interactive = true,
  direction = 'left'
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText);
    // Add spacing for loop continuity - Changed to single space to match word spacing
    return (hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + '\u00A0';
  }, [marqueeText]);

  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);
  const uid = useId();
  const pathId = `linear-path-${uid}`;
  
  // Straight line path horizontally across a wide viewBox
  const pathD = "M-100,20 L5000,20"; 

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef(direction);
  const velRef = useRef(0);

  // Calculate repeats needed to fill screen width plus buffer
  const repeats = spacing ? Math.ceil(4000 / spacing) + 2 : 1;
  const totalText = useMemo(() => Array(repeats).fill(text).join(''), [text, repeats]);

  useEffect(() => {
    if (measureRef.current) {
        const width = measureRef.current.getComputedTextLength();
        if(width > 0) setSpacing(width);
    }
  }, [text, className]);

  useEffect(() => {
    if (!spacing || !textPathRef.current) return;
    
    // Initial offset
    const initial = -spacing;
    textPathRef.current.setAttribute('startOffset', initial + 'px');
    setOffset(initial);

    let frame = 0;
    const step = () => {
        if (!dragRef.current && textPathRef.current) {
            const delta = dirRef.current === 'right' ? speed : -speed;
            const currentAttr = textPathRef.current.getAttribute('startOffset');
            let currentOffset = parseFloat(currentAttr || '0');
            
            let newOffset = currentOffset + delta;

            const wrapPoint = spacing;
            // Infinite loop logic: wrap when a full text segment has passed
            if (newOffset <= -wrapPoint) newOffset += wrapPoint;
            if (newOffset > 0) newOffset -= wrapPoint;

            textPathRef.current.setAttribute('startOffset', newOffset + 'px');
            setOffset(newOffset);
        }
        frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;

    const currentAttr = textPathRef.current.getAttribute('startOffset');
    let newOffset = parseFloat(currentAttr || '0') + dx;

    // Maintain wrapping during drag
    const wrapPoint = spacing;
    if (newOffset <= -wrapPoint) newOffset += wrapPoint;
    if (newOffset > 0) newOffset -= wrapPoint;

    textPathRef.current.setAttribute('startOffset', newOffset + 'px');
    setOffset(newOffset);
  };

  const onPointerUp = () => {
    if (!interactive) return;
    dragRef.current = false;
    // Inertia: if dragged quickly right, switch flow direction
    dirRef.current = velRef.current > 0 ? 'right' : 'left';
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ cursor: interactive ? (dragRef.current ? 'grabbing' : 'grab') : 'default' }}
    >
      <svg 
         viewBox="0 0 1440 40" 
         preserveAspectRatio="none" 
         className="w-full h-full block"
      >
        <defs>
           <path id={pathId} d={pathD} />
        </defs>
        
        {/* Hidden text for measurement */}
        <text ref={measureRef} x="-1000" y="-1000" className={className} style={{opacity: 0}}>{text}</text>
        
        {spacing > 0 && (
            <text className={className} dominantBaseline="middle">
                <textPath ref={textPathRef} href={`#${pathId}`} startOffset={offset + 'px'}>
                    {totalText}
                </textPath>
            </text>
        )}
      </svg>
    </div>
  );
};