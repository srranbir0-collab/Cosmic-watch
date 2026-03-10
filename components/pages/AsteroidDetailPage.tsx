
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../../store/useCosmicStore';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import Galaxy from '../molecules/Galaxy';
import { format } from 'date-fns';
import { ChatPanel } from '../organisms/ChatPanel';
import { useUser } from '@clerk/clerk-react';

// --- Flip Countdown Component ---
const FlipDigit: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const paddedValue = value.toString().padStart(2, '0');
    
    return (
        <div className="flex flex-col items-center mx-1 md:mx-3">
            <div className="relative w-12 h-16 md:w-20 md:h-24 bg-void-900 rounded-lg perspective-1000 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
                {/* Top Half */}
                <div className="absolute inset-x-0 top-0 h-[50%] bg-void-800 border-b border-black/50 overflow-hidden">
                     <span className="absolute bottom-0 left-0 right-0 text-center text-3xl md:text-5xl font-mono font-bold text-white leading-none translate-y-[50%]">
                         {paddedValue}
                     </span>
                </div>
                {/* Bottom Half */}
                <div className="absolute inset-x-0 bottom-0 h-[50%] bg-void-800 overflow-hidden">
                    <span className="absolute top-0 left-0 right-0 text-center text-3xl md:text-5xl font-mono font-bold text-white leading-none -translate-y-[50%]">
                         {paddedValue}
                    </span>
                </div>
                {/* Glare line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/40 z-10" />
            </div>
            <span className="mt-2 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest">{label}</span>
        </div>
    );
};

const Countdown: React.FC<{ targetDate: number }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            } else {
                setTimeLeft({
                    d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className="flex items-center justify-center md:justify-start">
            <FlipDigit value={timeLeft.d} label="DAYS" />
            <FlipDigit value={timeLeft.h} label="HRS" />
            <FlipDigit value={timeLeft.m} label="MIN" />
            <FlipDigit value={timeLeft.s} label="SEC" />
        </div>
    );
};

// --- Main Page Component ---

export const AsteroidDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedNeo, setSelectedNeo, neos } = useCosmicStore();
  const { user } = useUser();
  const [chatOpen, setChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync / Fetch logic
  useEffect(() => {
      window.scrollTo(0, 0);
      
      // If no selectedNeo or ID mismatch, try to find in store or fetch
      if (!selectedNeo || selectedNeo.id !== id) {
          const found = neos.find(n => n.id === id);
          if (found) {
              setSelectedNeo(found);
          } else {
              // In a real app, we would fetch single asteroid here if not in feed
              // fetchAsteroidById(id).then(setSelectedNeo);
          }
      }
  }, [id, neos, selectedNeo, setSelectedNeo]);

  const relatedObjects = neos.filter(n => n.id !== selectedNeo?.id).slice(0, 4);

  if (!selectedNeo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center bg-void-950">
        <h2 className="text-2xl font-bold text-white mb-4">Finding Object...</h2>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHazardous = selectedNeo.is_potentially_hazardous_asteroid;
  const diameterMin = Math.round(selectedNeo.estimated_diameter?.meters?.estimated_diameter_min || 0);
  const diameterMax = Math.round(selectedNeo.estimated_diameter?.meters?.estimated_diameter_max || 0);
  const approachData = selectedNeo.close_approach_data?.[0];
  const missDistLD = approachData?.miss_distance?.lunar ? parseFloat(approachData.miss_distance.lunar) : 0;
  const velocityKph = approachData?.relative_velocity?.kilometers_per_hour ? parseFloat(approachData.relative_velocity.kilometers_per_hour) : 0;
  const velocityKms = approachData?.relative_velocity?.kilometers_per_second ? parseFloat(approachData.relative_velocity.kilometers_per_second) : 0;
  const approachDateFull = approachData?.close_approach_date_full;
  const approachDateObj = approachDateFull ? new Date(approachDateFull) : new Date();
  const approachTimeStr = isNaN(approachDateObj.getTime()) ? "00:00 UTC" : format(approachDateObj, 'HH:mm') + " UTC";
  
  // Risk Score Simulation
  const riskScore = isHazardous ? 85 : Math.round(Math.max(10, 50 - missDistLD));
  const riskCategory = riskScore > 80 ? 'CRITICAL' : riskScore > 50 ? 'ELEVATED' : 'LOW';
  const riskColor = riskScore > 80 ? '#FF3D00' : riskScore > 50 ? '#FBBF24' : '#00F0FF';

  // Stats Card Component
  const DetailStatCard: React.FC<{ label: string; value: string; subtext: string; icon: React.ReactNode; delay: number }> = ({ label, value, subtext, icon, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="relative group p-6 bg-void-900/60 backdrop-blur-md border border-white/5 rounded-2xl hover:bg-void-800/80 hover:border-white/20 transition-all duration-300 overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
            <div className={`mb-4 w-10 h-10 rounded-lg flex items-center justify-center bg-void-950 border border-white/10 group-hover:scale-110 transition-transform ${isHazardous ? 'text-molten shadow-glow-molten' : 'text-electric shadow-glow-electric'}`}>
                {icon}
            </div>
            <div className="text-3xl font-display font-bold text-white mb-1 tracking-tight">{value}</div>
            <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-[10px] text-gray-500">{subtext}</div>
        </div>
    </motion.div>
  );

  return (
    <div className="relative min-h-screen bg-void-950 text-white overflow-x-hidden selection:bg-electric/30 pb-20">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Galaxy starSpeed={0.05} density={1.2} mouseInteraction={false} />
      </div>
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-void-950 to-transparent z-10" />
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-void-950 to-transparent z-10" />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-10 ${isHazardous ? 'bg-molten' : 'bg-electric'}`} />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-8">
        
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-12">
            <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-sm font-mono text-gray-400 hover:text-white transition-colors group"
            >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                DASHBOARD / ASTEROIDS / <span className="text-white">{selectedNeo.id}</span>
            </button>
            <div className="flex gap-4 items-center">
                {user && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono text-gray-400">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        ACCESS LOGGED: {user.username || 'SENTINEL'}
                    </div>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare}>
                    {copied ? 'LINK COPIED' : 'SHARE OBJECT'}
                </Button>
            </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-end mb-20">
            <div className="flex-1 space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                     {isHazardous && (
                         <span className="relative flex h-3 w-3">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-molten opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-molten"></span>
                         </span>
                     )}
                     <Badge label={isHazardous ? "POTENTIALLY HAZARDOUS" : "STANDARD ORBIT"} type={isHazardous ? "danger" : "safe"} />
                     <span className="text-void-600 font-mono text-sm">REF: {selectedNeo.neo_reference_id}</span>
                </motion.div>
                
                <motion.h1 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="font-hero font-black text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500"
                >
                    {selectedNeo.name.replace(/[()]/g, '')}
                </motion.h1>

                {/* Countdown Timer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="text-sm font-mono text-gray-400 mb-2 uppercase tracking-widest">Time to Closest Approach</div>
                    <Countdown targetDate={approachDateObj.getTime() || Date.now() + 86400000 * 3} />
                </motion.div>
            </div>
            
            {/* FAB */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.6 }}
            >
                <button
                    className={`group relative px-8 py-4 rounded-full font-bold tracking-wide shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 ${isHazardous ? 'bg-molten text-white shadow-molten/40' : 'bg-electric text-void-950 shadow-electric/40'}`}
                >
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse group-hover:animate-none" />
                    <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    <span className="relative z-10">WATCH OBJECT</span>
                </button>
            </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <DetailStatCard 
                delay={0.1}
                label="Approach Date"
                value={approachData?.close_approach_date || 'N/A'}
                subtext={approachDateObj.getFullYear().toString()}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            <DetailStatCard 
                delay={0.2}
                label="Approach Time"
                value={approachTimeStr}
                subtext="UTC Zone"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <DetailStatCard 
                delay={0.3}
                label="Miss Distance"
                value={`${missDistLD.toFixed(1)} LD`}
                subtext={`${(approachData?.miss_distance?.kilometers ? parseFloat(approachData.miss_distance.kilometers) : 0).toLocaleString()} km`}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
             <DetailStatCard 
                delay={0.4}
                label="Velocity"
                value={`${velocityKms.toFixed(1)}`}
                subtext={`${Math.round(velocityKph * 0.621371).toLocaleString()} mph`}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
             <DetailStatCard 
                delay={0.5}
                label="Diameter"
                value={`${diameterMax}m`}
                subtext={`Min: ${diameterMin}m`}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
            />
            <DetailStatCard 
                delay={0.6}
                label="Magnitude"
                value={`${selectedNeo.absolute_magnitude_h}`}
                subtext="Absolute (H)"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Risk Assessment Ring */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-1 bg-void-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
            >
                 <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${isHazardous ? 'from-molten' : 'from-electric'} to-transparent rounded-full blur-[80px] opacity-20`} />
                 <h3 className="absolute top-8 left-8 text-xl font-display font-bold text-white z-10">Threat Analysis</h3>
                 
                 <div className="relative w-64 h-64 mt-8">
                     {/* Background Track */}
                     <svg className="w-full h-full -rotate-90">
                        <circle cx="128" cy="128" r="100" stroke="#1A233C" strokeWidth="8" fill="none" />
                        <motion.circle 
                            cx="128" cy="128" r="100" 
                            stroke={riskColor} 
                            strokeWidth="12" 
                            fill="none" 
                            strokeLinecap="round"
                            initial={{ strokeDasharray: 628, strokeDashoffset: 628 }}
                            animate={{ strokeDashoffset: 628 - (riskScore / 100) * 628 }}
                            transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                            style={{ filter: `drop-shadow(0 0 10px ${riskColor})` }}
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <div className="text-6xl font-hero font-bold text-white drop-shadow-lg">{riskScore}</div>
                         <div className="text-sm font-mono tracking-widest font-bold" style={{ color: riskColor }}>{riskCategory}</div>
                     </div>
                 </div>

                 <p className="mt-8 text-center text-sm text-gray-400 z-10 relative">
                     This asteroid poses a <span style={{ color: riskColor, fontWeight: 'bold' }}>{riskCategory}</span> risk relative to the NEO database average.
                 </p>
            </motion.div>

            {/* Breakdown & Orbital Data */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Breakdown */}
                <div className="bg-void-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                    <h3 className="text-xl font-display font-bold text-white mb-6">Risk Factor Breakdown</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Proximity Score', value: Math.max(10, 100 - missDistLD), color: '#00F0FF', desc: 'Distance relative to Lunar Orbit' },
                            { label: 'Kinetic Potential', value: Math.min(100, velocityKms * 2.5), color: '#7C3AED', desc: 'Impact energy based on velocity' },
                            { label: 'Mass / Diameter', value: Math.min(100, diameterMax / 5), color: '#FF3D00', desc: 'Physical size classification' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end text-xs font-mono text-gray-400">
                                    <span>{item.label}</span>
                                    <span className="text-white">{Math.round(item.value)}/100</span>
                                </div>
                                <div className="h-2 bg-void-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${item.value}%` }}
                                        transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                                        className="h-full rounded-full relative"
                                        style={{ backgroundColor: item.color }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />
                                    </motion.div>
                                </div>
                                <div className="text-[10px] text-gray-600">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Orbital Data List */}
                <div className="bg-void-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-display font-bold text-white">Orbital Characteristics</h3>
                        <a href={selectedNeo.nasa_jpl_url} target="_blank" rel="noreferrer" className="text-xs text-electric hover:underline flex items-center gap-1">
                            NASA JPL DATABASE
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2 hover:bg-white/5 px-2 rounded transition-colors">
                            <span className="text-gray-500 font-mono">Orbiting Body</span>
                            <span className="text-white font-mono">{approachData?.orbiting_body || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2 hover:bg-white/5 px-2 rounded transition-colors">
                            <span className="text-gray-500 font-mono">Epoch Date</span>
                            <span className="text-white font-mono">{approachData?.epoch_date_close_approach || 'N/A'}</span>
                        </div>
                         <div className="flex justify-between border-b border-white/5 pb-2 hover:bg-white/5 px-2 rounded transition-colors">
                            <span className="text-gray-500 font-mono">Ref ID</span>
                            <span className="text-white font-mono">{selectedNeo.neo_reference_id}</span>
                        </div>
                         <div className="flex justify-between border-b border-white/5 pb-2 hover:bg-white/5 px-2 rounded transition-colors">
                            <span className="text-gray-500 font-mono">Uncertainty</span>
                            <span className="text-white font-mono">N/A (NASA)</span>
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 mt-2 italic px-2">
                            * Full orbital elements (Eccentricity, Inclination, Perihelion) available via external telemetry link.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Timeline Visualization (Mock) */}
        <div className="mb-12">
             <h3 className="text-xl font-display font-bold text-white mb-6">Approach History & Projection</h3>
             <div className="relative h-40 bg-void-900/40 border border-white/5 rounded-xl overflow-hidden flex items-center px-6 md:px-12">
                 <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-void-700" />
                 
                 <div className="relative w-full flex justify-between">
                     {[2018, 2021, 2024, 2027, 2030].map((year, i) => (
                         <div key={year} className="relative flex flex-col items-center gap-4 group cursor-pointer">
                             <div className={`w-4 h-4 rounded-full border-2 bg-void-950 z-10 transition-all duration-300 ${year === 2024 ? 'border-electric scale-150 shadow-[0_0_15px_#00F0FF]' : 'border-gray-600 group-hover:border-white group-hover:scale-125'}`} />
                             <span className={`text-xs font-mono transition-colors ${year === 2024 ? 'text-electric font-bold' : 'text-gray-500 group-hover:text-white'}`}>{year}</span>
                             {year === 2024 && (
                                 <motion.div 
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="absolute -top-16 bg-electric/10 text-electric px-3 py-1.5 rounded text-[10px] border border-electric/30 whitespace-nowrap backdrop-blur-md"
                                 >
                                     CURRENT APPROACH
                                     <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-electric/10 border-r border-b border-electric/30 rotate-45 transform"></div>
                                 </motion.div>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* Related Objects */}
        <div>
            <h3 className="text-xl font-display font-bold text-white mb-6">Similar Objects in Sector</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedObjects.map((obj, i) => (
                    <motion.div 
                        key={obj.id}
                        whileHover={{ y: -5 }}
                        onClick={() => navigate(`/asteroid/${obj.id}`)}
                        className="bg-void-900/40 border border-white/5 p-4 rounded-xl hover:border-white/20 hover:bg-void-800/60 transition-all cursor-pointer group"
                    >
                         <div className="flex justify-between items-start mb-2">
                             <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${obj.is_potentially_hazardous_asteroid ? 'bg-molten/10 text-molten' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                 {obj.is_potentially_hazardous_asteroid ? 'HAZARDOUS' : 'SAFE'}
                             </div>
                             <div className="text-gray-500 text-[10px] font-mono">{obj.close_approach_data?.[0]?.close_approach_date || 'N/A'}</div>
                         </div>
                         <h4 className="text-lg font-bold text-white mb-1 group-hover:text-electric transition-colors">{obj.name.replace(/[()]/g, '')}</h4>
                         <div className="text-xs text-gray-400">
                             Miss Dist: {parseFloat(obj.close_approach_data?.[0]?.miss_distance?.lunar || '0').toFixed(1)} LD
                         </div>
                    </motion.div>
                ))}
            </div>
        </div>

      </div>

      {/* Real-time Chat Panel */}
      <ChatPanel 
        asteroidId={selectedNeo.id}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
      
      {/* Chat Toggle Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-electric rounded-full flex items-center justify-center text-void-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-110 transition-transform z-40 group"
      >
          <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-20 group-hover:opacity-40"></div>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      </button>

    </div>
  );
};
