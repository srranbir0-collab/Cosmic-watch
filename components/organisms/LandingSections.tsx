
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion';
import { useCosmicStore } from '../../store/useCosmicStore';
import { Button } from '../atoms/Button';
import { NEO } from '../../types';
import { ScrambledText } from '../molecules/ScrambledText';

// --- SHARED UTILS ---
const SectionContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`relative w-full overflow-hidden ${className}`}>
    {children}
  </section>
);

// --- SECTION 1: ACTIVE THREATS DASHBOARD ---
const CountdownDigit: React.FC<{ value: number }> = ({ value }) => {
    return (
        <div className="relative w-6 h-8 bg-void-800 rounded flex items-center justify-center border border-white/10 overflow-hidden">
            <AnimatePresence mode="popLayout">
                <motion.span 
                    key={value}
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '-100%' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute font-mono text-sm font-bold text-electric"
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

const ThreatCard: React.FC<{ neo: NEO; index: number }> = ({ neo, index }) => {
    const isHazardous = neo.is_potentially_hazardous_asteroid;
    const tilt = (index % 2 === 0 ? 1 : -1) * (Math.random() * 2 + 1);
    
    // Mock countdown
    const [timeLeft, setTimeLeft] = useState({ h: 12, m: 45, s: 30 });
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { h, m, s } = prev;
                s--;
                if (s < 0) { s = 59; m--; }
                if (m < 0) { m = 59; h--; }
                if (h < 0) { h = 23; } // Reset loop
                return { h, m, s };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const riskScore = isHazardous ? 85 : 25;
    const circumference = 2 * Math.PI * 18; // r=18
    const strokeDashoffset = circumference - (riskScore / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: tilt }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 20 }}
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
            className="relative bg-void-900/80 backdrop-blur-md border border-white/5 p-6 rounded-xl mb-6 break-inside-avoid group"
            style={{ boxShadow: isHazardous ? '0 0 20px -5px rgba(255, 61, 0, 0.1)' : '0 0 20px -5px rgba(0, 240, 255, 0.1)' }}
        >
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${isHazardous ? 'from-molten/20 to-transparent' : 'from-electric/20 to-transparent'} pointer-events-none`} />
            
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-display font-bold text-2xl text-white leading-none tracking-tight">{neo.name.replace(/[()]/g, '')}</h3>
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="24" cy="24" r="18" stroke="#1A233C" strokeWidth="4" fill="transparent" />
                        <circle 
                            cx="24" cy="24" r="18" 
                            stroke={isHazardous ? '#FF3D00' : '#00F0FF'} 
                            strokeWidth="4" 
                            fill="transparent" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-gray-300">{riskScore}</span>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                    <span>APPROACH</span>
                    <div className="flex gap-1">
                        <CountdownDigit value={Math.floor(timeLeft.h / 10)} /><CountdownDigit value={timeLeft.h % 10} />
                        <span className="self-center">:</span>
                        <CountdownDigit value={Math.floor(timeLeft.m / 10)} /><CountdownDigit value={timeLeft.m % 10} />
                        <span className="self-center">:</span>
                        <CountdownDigit value={Math.floor(timeLeft.s / 10)} /><CountdownDigit value={timeLeft.s % 10} />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-void-950/50 p-2 rounded border border-white/5">
                        <div className="text-gray-500 mb-1">VELOCITY</div>
                        <div className="font-mono text-white">{parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour).toLocaleString()} <span className="text-[9px]">KPH</span></div>
                    </div>
                    <div className="bg-void-950/50 p-2 rounded border border-white/5">
                        <div className="text-gray-500 mb-1">DISTANCE</div>
                        <div className="font-mono text-white">{parseFloat(neo.close_approach_data[0].miss_distance.lunar).toFixed(1)} <span className="text-[9px]">LD</span></div>
                    </div>
                </div>
            </div>

            <Button size="sm" variant={isHazardous ? 'molten' : 'void'} className="w-full text-xs">TRACK OBJECT</Button>
        </motion.div>
    );
};

const ActiveThreats: React.FC = () => {
    const { neos } = useCosmicStore();
    const displayNeos = neos.slice(0, 6); // Mock subset

    return (
        <SectionContainer className="bg-void-950 py-32 px-6">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 animate-pulse" />
            
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <h2 className="font-hero text-4xl md:text-5xl text-white mb-4">ACTIVE THREATS DASHBOARD</h2>
                    <p className="text-gray-400 font-sans max-w-2xl mx-auto">Live tracking of high-priority Near-Earth Objects within the lunar proximity surveillance zone.</p>
                </motion.div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {displayNeos.map((neo, i) => (
                        <ThreatCard key={neo.id} neo={neo} index={i} />
                    ))}
                </div>
            </div>
        </SectionContainer>
    );
};


// --- SECTION 2: PLATFORM CAPABILITIES ---
const CapabilityCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; delay: number }> = ({ icon, title, desc, delay }) => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="group p-6 bg-void-900 border border-void-700 hover:border-electric/50 rounded-xl transition-colors duration-300 relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-electric/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
            <div className="w-12 h-12 mb-4 text-gray-400 group-hover:text-electric transition-colors duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{desc}</p>
        </div>
    </motion.div>
);

const Capabilities: React.FC = () => {
    return (
        <SectionContainer className="bg-void-950 py-32 px-6 relative">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
                
                {/* Left Text Block */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="lg:w-5/12"
                >
                    <div className="inline-block px-3 py-1 mb-6 border border-electric/30 rounded-full bg-electric/10 text-electric text-xs font-mono tracking-widest uppercase">
                        Technology
                    </div>
                    <h2 className="font-display font-bold text-5xl md:text-6xl text-white mb-8 leading-tight">
                        Planetary <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric to-gravity">Defense Grid</span>
                    </h2>
                    <p className="text-lg text-gray-400 leading-relaxed border-l-2 border-void-800 pl-6">
                        Utilizing NASA's NeoWs API combined with Google Gemini's advanced reasoning models, Cosmic Watch provides not just data, but actionable intelligence on kinetic threats to Earth.
                    </p>
                </motion.div>

                {/* Right Grid */}
                <div className="lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <CapabilityCard 
                        delay={0.1}
                        title="Autonomous Detection"
                        desc="Real-time ingestion of orbital elements to identify deviations in trajectory."
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    />
                    <CapabilityCard 
                        delay={0.2}
                        title="Impact Analysis"
                        desc="AI-driven simulations determining kinetic energy and potential fallout zones."
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    />
                    <CapabilityCard 
                        delay={0.3}
                        title="Visual Simulation"
                        desc="Generative video models visualizing impact scenarios based on atmospheric data."
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    />
                    <CapabilityCard 
                        delay={0.4}
                        title="Global Alert Network"
                        desc="Instantaneous dissemination of critical threat levels to defense partners."
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    />
                </div>
            </div>
        </SectionContainer>
    );
};


// --- SECTION 3: MISSION STATEMENT (PARTICLES) ---
const MissionStatement: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = canvas.offsetWidth;
        let h = canvas.height = canvas.offsetHeight;
        
        const particles: {x: number, y: number, vx: number, vy: number, s: number}[] = [];
        for(let i=0; i<100; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                s: Math.random() * 2 + 1
            });
        }

        const animate = () => {
            if (!canvas) return;
            ctx.clearRect(0,0,w,h);
            
            // Draw connecting lines
            ctx.strokeStyle = 'rgba(124, 58, 237, 0.1)';
            ctx.lineWidth = 1;
            
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                ctx.fill();

                // Connect
                for(let j=i+1; j<particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        };
        const animId = requestAnimationFrame(animate);

        const handleResize = () => {
            if (canvas) {
                w = canvas.width = canvas.offsetWidth;
                h = canvas.height = canvas.offsetHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    return (
        <SectionContainer className="h-[80vh] flex items-center justify-center bg-void-950 relative border-y border-white/5">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-transparent to-void-950" />
            
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                >
                    <svg className="w-16 h-16 mx-auto mb-8 text-electric opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2v20M2 12h20" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                    <div className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-8">
                        <ScrambledText>"We do not inherit the Earth from our ancestors; we borrow it from our children. </ScrambledText>
                        <span className="text-electric italic inline-block">
                            <ScrambledText>Vigilance is the rent we pay.</ScrambledText>
                        </span>
                        <ScrambledText>"</ScrambledText>
                    </div>
                    <p className="text-gray-500 font-mono uppercase tracking-[0.3em] text-sm">
                        Planetary Defense Initiative • Est. 2024
                    </p>
                </motion.div>
            </div>
        </SectionContainer>
    );
};


// --- SECTION 4: DATA INSIGHTS ---
const Counter: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const spring = useSpring(0, { stiffness: 50, damping: 20, duration: 2 });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

    useEffect(() => {
        if (isInView) spring.set(value);
    }, [isInView, spring, value]);

    return (
        <div ref={ref} className="text-center group">
            <motion.div className={`text-6xl md:text-7xl font-hero font-bold mb-2 ${color} transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`}>
                <motion.span>{display}</motion.span>
            </motion.div>
            <div className="text-sm font-mono text-gray-500 uppercase tracking-widest">{label}</div>
            <div className={`w-12 h-1 mx-auto mt-4 rounded-full ${color.replace('text-', 'bg-')} opacity-20 group-hover:opacity-100 transition-opacity`} />
        </div>
    );
};

const DataInsights: React.FC = () => {
    const { neos } = useCosmicStore();
    return (
        <SectionContainer className="bg-void-900 py-32 px-6 border-b border-white/5">
             <div className="max-w-7xl mx-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <Counter value={neos.length || 32000} label="Objects Tracked" color="text-electric" />
                    <Counter value={142} label="Approaching This Month" color="text-white" />
                    <Counter value={neos.filter(n => n.is_potentially_hazardous_asteroid).length || 3} label="Critical Alerts" color="text-molten" />
                    <Counter value={8540} label="Community Sentinels" color="text-gravity" />
                 </div>
             </div>
        </SectionContainer>
    );
};


// --- SECTION 5: ACCESS CTA ---
const CommandAccess: React.FC<{ onConnect?: () => void }> = ({ onConnect }) => {
    const handleClick = () => {
        if (onConnect) {
            onConnect();
        } else {
            const el = document.getElementById('command-center');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <SectionContainer className="relative h-[90vh] flex items-center bg-void-950 overflow-hidden">
            {/* Dramatic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-void-950 via-void-900 to-gravity/20" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-molten/10 to-transparent opacity-50" />
            
            <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                
                {/* Copy */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <h2 className="font-hero text-6xl md:text-7xl text-white leading-none">
                        JOIN THE <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-molten to-yellow-500">WATCH</span>
                    </h2>
                    <p className="text-xl text-gray-300 font-light max-w-md">
                        Access the full telemetry suite. Analyze hazards. Simulate impacts. Protect the future.
                    </p>
                    <Button onClick={handleClick} size="lg" variant="molten" className="shadow-[0_0_30px_rgba(255,61,0,0.4)] hover:shadow-[0_0_50px_rgba(255,61,0,0.6)]">
                        INITIALIZE SYSTEM
                    </Button>
                </motion.div>

                {/* UI Mockup Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 50, rotateY: -10 }}
                    whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative perspective-1000 group"
                >
                     <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-void-900 transform transition-transform duration-500 group-hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-electric/20 to-transparent pointer-events-none z-10" />
                        
                        {/* Fake UI Content (Abstract representation of dashboard) */}
                        <div className="p-4 grid grid-cols-12 gap-4 opacity-50 blur-[1px] group-hover:blur-0 transition-all duration-500">
                            <div className="col-span-3 h-full space-y-4">
                                <div className="h-10 bg-void-800 rounded w-full" />
                                <div className="h-40 bg-void-800 rounded w-full" />
                                <div className="h-20 bg-void-800 rounded w-full" />
                            </div>
                            <div className="col-span-9 space-y-4">
                                <div className="h-64 bg-void-800 rounded w-full border border-electric/30" />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-32 bg-void-800 rounded" />
                                    <div className="h-32 bg-void-800 rounded" />
                                    <div className="h-32 bg-void-800 rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Overlay Badge */}
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                             <div className="px-8 py-4 bg-void-950/80 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="font-mono text-white text-sm tracking-widest">LIVE FEED SECURE</span>
                             </div>
                        </div>
                     </div>
                </motion.div>
            </div>
        </SectionContainer>
    );
};

export const LandingSections: React.FC<{ onConnect?: () => void }> = ({ onConnect }) => {
    return (
        <div className="relative z-10 bg-void-950">
            <ActiveThreats />
            <Capabilities />
            <MissionStatement />
            <DataInsights />
            <CommandAccess onConnect={onConnect} />
        </div>
    );
};
