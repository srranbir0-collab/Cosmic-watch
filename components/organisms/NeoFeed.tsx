
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../../store/useCosmicStore';
import { AsteroidTable } from '../molecules/AsteroidTable';
import { Input } from '../atoms/Input';
import { NEO } from '../../types';

export const NeoFeed: React.FC = () => {
  const { 
    neos, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    sortKey, 
    sortOrder, 
    setSort,
    setSelectedNeo
  } = useCosmicStore();
  const navigate = useNavigate();

  const handleAnalyze = (neo: NEO) => {
      setSelectedNeo(neo);
      navigate('/analyzer');
  };

  // Filter and Sort with Memoization to prevent lag
  const filteredNeos = useMemo(() => {
      return neos.filter(neo => {
          const nameMatch = neo.name ? neo.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
          const idMatch = neo.id ? neo.id.includes(searchTerm) : false;
          return nameMatch || idMatch;
      }).sort((a, b) => {
          let valA: any = '';
          let valB: any = '';

          // Safe access helpers
          const getVel = (n: NEO) => n.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour ? parseFloat(n.close_approach_data[0].relative_velocity.kilometers_per_hour) : 0;
          const getDist = (n: NEO) => n.close_approach_data?.[0]?.miss_distance?.lunar ? parseFloat(n.close_approach_data[0].miss_distance.lunar) : 0;
          const getDate = (n: NEO) => n.close_approach_data?.[0]?.close_approach_date_full ? new Date(n.close_approach_data[0].close_approach_date_full).getTime() : 0;
          const getDiam = (n: NEO) => n.estimated_diameter?.meters?.estimated_diameter_max || 0;

          switch(sortKey) {
              case 'date':
                  valA = getDate(a);
                  valB = getDate(b);
                  break;
              case 'risk':
                  valA = a.is_potentially_hazardous_asteroid ? 1 : 0;
                  valB = b.is_potentially_hazardous_asteroid ? 1 : 0;
                  break;
              case 'diameter':
                  valA = getDiam(a);
                  valB = getDiam(b);
                  break;
              case 'velocity':
                  valA = getVel(a);
                  valB = getVel(b);
                  break;
              case 'distance':
                  valA = getDist(a);
                  valB = getDist(b);
                  break;
              default:
                  return 0;
          }

          if (sortOrder === 'asc') return valA > valB ? 1 : -1;
          return valA < valB ? 1 : -1;
      });
  }, [neos, searchTerm, sortKey, sortOrder]);

  return (
    <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-end bg-void-900/50 p-4 rounded-xl border border-white/5">
            <div className="w-full md:w-96">
                <Input 
                    label="Search Designation or ID" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    className="mb-0"
                />
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono hidden sm:inline-block">SORT BY:</span>
                <div className="flex items-center">
                    <select 
                        value={sortKey} 
                        onChange={(e) => setSort(e.target.value as any, sortOrder)}
                        className="bg-void-950 border border-void-700 border-r-0 rounded-l-lg text-sm text-white px-3 py-2 outline-none focus:border-electric cursor-pointer h-10"
                    >
                        <option value="date">Approach Date</option>
                        <option value="risk">Risk Score</option>
                        <option value="distance">Miss Distance</option>
                        <option value="velocity">Velocity</option>
                        <option value="diameter">Diameter</option>
                    </select>
                    <button 
                        onClick={() => setSort(sortKey, sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-10 px-3 bg-void-950 border border-void-700 rounded-r-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
                        title={sortOrder === 'asc' ? "Ascending (Low to High)" : "Descending (High to Low)"}
                    >
                        {sortOrder === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* Data Table */}
        <AsteroidTable 
            neos={filteredNeos} 
            isLoading={loading} 
            onAnalyze={handleAnalyze}
            sortConfig={{ key: sortKey, direction: sortOrder }}
            onSort={(key) => setSort(key, sortOrder === 'asc' ? 'desc' : 'asc')}
        />
    </div>
  );
};
