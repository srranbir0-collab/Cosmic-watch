
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEO } from '../../types';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { useCosmicStore } from '../../store/useCosmicStore';

interface AsteroidTableProps {
  neos: NEO[];
  isLoading: boolean;
  onAnalyze: (neo: NEO) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: any) => void;
}

export const AsteroidTable: React.FC<AsteroidTableProps> = ({ neos, isLoading, onAnalyze, sortConfig, onSort }) => {
  const { setSelectedNeo } = useCosmicStore();
  const navigate = useNavigate();

  const handleViewDetail = (neo: NEO) => {
    setSelectedNeo(neo);
    navigate(`/asteroid/${neo.id}`);
  };
  
  if (isLoading) {
    return (
        <div className="w-full space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full rounded-lg bg-void-900 overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                </div>
            ))}
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
  }

  if (neos.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-center border border-dashed border-void-700 rounded-xl bg-void-900/50">
              <div className="w-20 h-20 mb-4 bg-void-800 rounded-full flex items-center justify-center text-void-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">NO OBJECTS DETECTED</h3>
              <p className="text-gray-500 max-w-sm">Your filters returned no results. Adjust your parameters to broaden the search sector.</p>
          </div>
      );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-void-900/50 backdrop-blur-sm shadow-xl">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-void-950/80 border-b border-white/5 text-[10px] uppercase font-mono tracking-[0.2em] text-gray-500">
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => onSort('name')}>
                  Object Designation
              </th>
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => onSort('risk')}>
                  Threat Level
              </th>
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => onSort('date')}>
                  Approach Date
              </th>
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => onSort('distance')}>
                  Miss Distance
              </th>
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors text-right" onClick={() => onSort('diameter')}>
                  Diameter (Max)
              </th>
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors text-right" onClick={() => onSort('velocity')}>
                  Velocity
              </th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {neos.map((neo, index) => {
               // Safe Access
               const approachData = neo.close_approach_data?.[0];
               const missDistLD = approachData?.miss_distance?.lunar ? parseFloat(approachData.miss_distance.lunar) : 0;
               const missDistKm = approachData?.miss_distance?.kilometers ? parseFloat(approachData.miss_distance.kilometers) : 0;
               const velocity = approachData?.relative_velocity?.kilometers_per_hour ? parseFloat(approachData.relative_velocity.kilometers_per_hour) : 0;
               const isHazardous = neo.is_potentially_hazardous_asteroid;
               const date = approachData?.close_approach_date || 'N/A';
               const diameterMax = neo.estimated_diameter?.meters?.estimated_diameter_max || 0;
               
               return (
                <motion.tr 
                    key={neo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                    onClick={() => handleViewDetail(neo)}
                >
                  <td className="p-4 font-display font-bold text-white group-hover:text-electric transition-colors">
                      {neo.name ? neo.name.replace(/[()]/g, '') : 'Unknown Object'}
                      <div className="text-[10px] font-mono font-normal text-gray-600 mt-1">ID: {neo.id}</div>
                  </td>
                  <td className="p-4">
                      {isHazardous ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-molten/10 text-molten border border-molten/20 shadow-[0_0_10px_rgba(255,61,0,0.1)]">
                              HAZARDOUS
                          </span>
                      ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              SAFE
                          </span>
                      )}
                  </td>
                  <td className="p-4 font-mono text-gray-300">
                      {date}
                  </td>
                  <td className="p-4 font-mono text-gray-300">
                      <span className={missDistLD > 0 && missDistLD < 10 ? 'text-yellow-400' : ''}>
                        {missDistLD > 0 ? `${missDistLD.toFixed(1)} LD` : 'N/A'}
                      </span>
                      <div className="text-[10px] text-gray-600">
                          {missDistKm > 0 ? `${(missDistKm / 1000000).toFixed(2)}M km` : ''}
                      </div>
                  </td>
                  <td className="p-4 font-mono text-right text-gray-300">
                      {Math.round(diameterMax).toLocaleString()} <span className="text-gray-600">m</span>
                  </td>
                  <td className="p-4 font-mono text-right text-electric">
                      {(velocity).toLocaleString()} <span className="text-gray-600 text-xs">km/h</span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAnalyze(neo); }} className="text-[10px] h-8 px-3">
                          Quick Scan
                      </Button>
                      <button className="text-gray-500 hover:text-white transition-colors p-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                  </td>
                </motion.tr>
               );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
          {neos.map((neo) => {
             const approachData = neo.close_approach_data?.[0];
             const missDistLD = approachData?.miss_distance?.lunar ? parseFloat(approachData.miss_distance.lunar) : 0;
             const velocity = approachData?.relative_velocity?.kilometers_per_hour ? parseFloat(approachData.relative_velocity.kilometers_per_hour) : 0;

             return (
             <div key={neo.id} className="p-4 border-b border-white/5 space-y-3" onClick={() => handleViewDetail(neo)}>
                 <div className="flex justify-between items-start">
                     <div>
                         <h4 className="font-display font-bold text-lg text-white">{neo.name ? neo.name.replace(/[()]/g, '') : 'Unknown'}</h4>
                         <div className="text-xs font-mono text-gray-500">ID: {neo.id}</div>
                     </div>
                     {neo.is_potentially_hazardous_asteroid ? (
                         <Badge label="HAZARDOUS" type="danger" />
                     ) : (
                         <Badge label="SAFE" type="safe" />
                     )}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 text-xs">
                     <div className="bg-void-950 p-2 rounded">
                         <div className="text-gray-500 mb-1">MISS DISTANCE</div>
                         <div className="font-mono text-white">{missDistLD > 0 ? `${missDistLD.toFixed(1)} LD` : 'N/A'}</div>
                     </div>
                     <div className="bg-void-950 p-2 rounded">
                         <div className="text-gray-500 mb-1">VELOCITY</div>
                         <div className="font-mono text-electric">{velocity > 0 ? `${velocity.toLocaleString()} KM/H` : 'N/A'}</div>
                     </div>
                 </div>
                 
                 <Button size="sm" variant="void" className="w-full" onClick={(e) => { e.stopPropagation(); onAnalyze(neo); }}>
                     Analyze Threat
                 </Button>
             </div>
          )})}
      </div>

      {/* Pagination Footer (Mock) */}
      <div className="p-4 border-t border-white/5 bg-void-950/50 flex items-center justify-between text-xs text-gray-500 font-mono">
          <div>Showing {neos.length} Objects</div>
          <div className="flex gap-2">
              <button className="px-3 py-1 hover:text-white disabled:opacity-50" disabled>&lt; PREV</button>
              <button className="px-3 py-1 text-white bg-void-800 rounded">1</button>
              <button className="px-3 py-1 hover:text-white">2</button>
              <button className="px-3 py-1 hover:text-white">3</button>
              <button className="px-3 py-1 hover:text-white">NEXT &gt;</button>
          </div>
      </div>
    </div>
  );
};
