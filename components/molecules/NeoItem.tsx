
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { NEO } from '../../types';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';

interface NeoItemProps {
  neo: NEO;
  onAnalyze: (neo: NEO) => void;
}

export const NeoItem: React.FC<NeoItemProps> = ({ neo, onAnalyze }) => {
  const isHazardous = neo.is_potentially_hazardous_asteroid;
  const diameter = neo.estimated_diameter?.meters?.estimated_diameter_max ? Math.round(neo.estimated_diameter.meters.estimated_diameter_max) : 0;
  
  const approachData = neo.close_approach_data?.[0];
  const missDistance = approachData?.miss_distance?.lunar ? parseFloat(approachData.miss_distance.lunar).toFixed(1) : 'N/A';
  const velocity = approachData?.relative_velocity?.kilometers_per_hour ? parseFloat(approachData.relative_velocity.kilometers_per_hour).toLocaleString() : 'N/A';
  const approachDate = approachData?.close_approach_date || 'Unknown';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.005 }}
      className="glass-panel p-5 rounded-lg mb-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group border-l-2 border-l-transparent hover:border-l-electric transition-all duration-300"
    >
      <div className="flex items-center gap-5 flex-1">
        <div className={`w-14 h-14 rounded-md flex items-center justify-center shrink-0 border transition-all duration-300 ${isHazardous ? 'bg-molten-bg border-molten/30 text-molten shadow-[0_0_15px_rgba(255,61,0,0.15)]' : 'bg-void-800 border-void-700 text-gray-500'}`}>
          {isHazardous ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
                <h4 className="font-display font-bold text-xl text-white tracking-wide">{neo.name ? neo.name.replace(/[()]/g, '') : 'Unknown Object'}</h4>
                {isHazardous ? <Badge label="HAZARDOUS" type="danger" /> : <Badge label="LOW THREAT" type="neutral" />}
                <span className="text-void-600 text-[10px] font-mono">{neo.id}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mb-0.5">Diameter</div>
                    <div className="text-sm font-mono text-gray-300">{diameter}<span className="text-gray-600 text-xs ml-1">m</span></div>
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mb-0.5">Miss Dist.</div>
                    <div className="text-sm font-mono text-gray-300">{missDistance}<span className="text-gray-600 text-xs ml-1">LD</span></div>
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mb-0.5">Velocity</div>
                    <div className="text-sm font-mono text-gray-300">{velocity}<span className="text-gray-600 text-xs ml-1">km/h</span></div>
                </div>
                 <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mb-0.5">Approach</div>
                    <div className="text-sm font-mono text-electric">{approachDate}</div>
                </div>
            </div>
        </div>
      </div>
      
      <div className="w-full lg:w-auto flex justify-end">
        <Button size="sm" variant={isHazardous ? "molten" : "void"} onClick={() => onAnalyze(neo)} className="w-full lg:w-auto">
          Analyze Protocol
        </Button>
      </div>
    </motion.div>
  );
};
