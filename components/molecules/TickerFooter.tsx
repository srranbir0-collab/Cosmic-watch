
import React from 'react';
import { LinearLoop } from './LinearLoop';

export const TickerFooter: React.FC = () => {
  return (
    <div className="w-full z-50 bg-void-950 border-t border-white/5 py-2">
        <div className="w-full flex flex-col items-center justify-center">
            {/* Top Line: Created By */}
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-1">
                Created By
            </div>
            
            {/* Bottom Line: Scrolling Names */}
            <div className="w-full h-8 bg-void-900/50 border-y border-white/5 relative">
                <LinearLoop 
                    marqueeText="RANBIR   DIVYANI   SWAYANSH   PRITI" 
                    className="fill-white font-display font-bold text-sm tracking-[0.35em] uppercase"
                    speed={0.8}
                />
            </div>
        </div>
    </div>
  );
};
