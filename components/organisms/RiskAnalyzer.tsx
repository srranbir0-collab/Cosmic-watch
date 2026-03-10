
import React, { useEffect } from 'react';
import { useCosmicStore } from '../../store/useCosmicStore';
import { analyzeRisk } from '../../services/geminiService';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { motion, AnimatePresence } from 'framer-motion';

export const RiskAnalyzer: React.FC = () => {
  const { selectedNeo, riskAnalysis, analyzing, setRiskAnalysis, setAnalyzing } = useCosmicStore();

  useEffect(() => {
    if (selectedNeo && !riskAnalysis) {
        handleAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNeo]);

  const handleAnalysis = async () => {
    if (!selectedNeo) return;
    setAnalyzing(true);
    const result = await analyzeRisk(selectedNeo);
    setRiskAnalysis(result);
    setAnalyzing(false);
  };

  if (!selectedNeo) {
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-12 glass-panel rounded-xl border border-dashed border-void-700">
            <div className="w-24 h-24 bg-void-800 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-black">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-void-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">TARGET NOT ACQUIRED</h3>
            <p className="text-gray-400 max-w-md font-sans leading-relaxed">Select a Near-Earth Object from the Live Feed to initialize the Gemini AI Threat Assessment Protocol.</p>
        </div>
    );
  }

  // Safe Data Extraction
  const approachData = selectedNeo.close_approach_data?.[0];
  const velocity = approachData?.relative_velocity?.kilometers_per_hour ? parseFloat(approachData.relative_velocity.kilometers_per_hour).toLocaleString() : 'N/A';
  const missDist = approachData?.miss_distance?.astronomical ? parseFloat(approachData.miss_distance.astronomical).toFixed(4) : 'N/A';
  const diameter = selectedNeo.estimated_diameter?.meters?.estimated_diameter_max ? Math.round(selectedNeo.estimated_diameter.meters.estimated_diameter_max) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Object Details */}
        <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-8 rounded-xl relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-32 bg-electric/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10">
                    <div className="text-xs font-mono text-electric mb-2 uppercase tracking-widest">Target Designation</div>
                    <h2 className="text-4xl font-display font-black text-white mb-8 tracking-tight">{selectedNeo.name.replace(/[()]/g, '')}</h2>
                    
                    <div className="space-y-1 mb-8">
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-gray-400 text-sm font-sans">Absolute Magnitude</span>
                            <span className="font-mono text-lg text-white">{selectedNeo.absolute_magnitude_h} <span className="text-xs text-void-600">H</span></span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                             <span className="text-gray-400 text-sm font-sans">Max Diameter</span>
                             <span className="font-mono text-lg text-white">{diameter} <span className="text-xs text-void-600">m</span></span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                             <span className="text-gray-400 text-sm font-sans">Relative Velocity</span>
                             <span className="font-mono text-lg text-white">{velocity} <span className="text-xs text-void-600">km/h</span></span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                             <span className="text-gray-400 text-sm font-sans">Miss Distance</span>
                             <span className="font-mono text-lg text-white">{missDist} <span className="text-xs text-void-600">au</span></span>
                        </div>
                    </div>

                    <Button onClick={handleAnalysis} isLoading={analyzing} variant="void" className="w-full">
                        {analyzing ? 'RUNNING SIMULATION...' : 'RE-RUN ANALYSIS'}
                    </Button>
                </div>
            </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="lg:col-span-7 relative min-h-[500px]">
            <AnimatePresence mode="wait">
                {analyzing ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center glass-panel rounded-xl"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-t-2 border-l-2 border-electric animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-electric rounded-full shadow-[0_0_20px_#00F0FF]"></div>
                            </div>
                        </div>
                        <div className="mt-8 text-center space-y-2">
                            <h3 className="font-display font-bold text-2xl text-white">ANALYZING TRAJECTORY</h3>
                            <p className="font-mono text-electric text-sm animate-pulse">Running Kinetic Impact Scenarios...</p>
                        </div>
                    </motion.div>
                ) : riskAnalysis ? (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-8 rounded-xl border-t border-t-electric/50 h-full flex flex-col relative overflow-hidden"
                    >
                         <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br ${riskAnalysis.dangerLevel === 'EXTREME' || riskAnalysis.dangerLevel === 'HIGH' ? 'from-molten/10' : 'from-electric/10'} to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Risk Classification</div>
                                <h3 className="font-display text-2xl text-white flex items-center gap-3">
                                    ASSESSMENT REPORT
                                </h3>
                            </div>
                            <Badge 
                                label={riskAnalysis.dangerLevel} 
                                type={riskAnalysis.dangerLevel === 'EXTREME' || riskAnalysis.dangerLevel === 'HIGH' ? 'danger' : riskAnalysis.dangerLevel === 'MODERATE' ? 'warning' : 'electric'} 
                            />
                        </div>

                        <div className="space-y-8 flex-1 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-void-950/30 p-5 rounded-lg border border-white/5">
                                    <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">Impact Probability</h4>
                                    <p className="text-white text-lg font-medium leading-relaxed">
                                        {riskAnalysis.impactProbability}
                                    </p>
                                </div>
                                <div className="bg-void-950/30 p-5 rounded-lg border border-white/5">
                                    <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">Kinetic Energy</h4>
                                    <p className={`font-mono text-2xl ${riskAnalysis.dangerLevel === 'EXTREME' ? 'text-molten' : 'text-electric'}`}>
                                        {riskAnalysis.kineticEnergy} <span className="text-sm text-gray-600">MT</span>
                                    </p>
                                </div>
                            </div>

                             <div>
                                <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">Projected Consequences</h4>
                                <p className="text-gray-300 font-sans leading-relaxed border-l-2 border-void-700 pl-4">
                                    {riskAnalysis.potentialDamage}
                                </p>
                            </div>

                             <div className="bg-void-800/50 p-6 rounded-lg border border-electric/10 mt-auto">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-electric" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <h4 className="text-xs font-mono text-electric uppercase tracking-wider">AI Synopsis</h4>
                                </div>
                                <p className="text-gray-300 text-sm italic font-serif leading-relaxed opacity-90">
                                    "{riskAnalysis.summary}"
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    </div>
  );
};
