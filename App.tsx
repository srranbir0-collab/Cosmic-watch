
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useCosmicStore } from './store/useCosmicStore';
import { useAuthStore } from './store/useAuthStore';
import { fetchNeoFeed } from './services/nasaService';
import { motion, AnimatePresence } from 'framer-motion';
import { TickerFooter } from './components/molecules/TickerFooter';
import { Hero } from './components/organisms/Hero';
import { LandingSections } from './components/organisms/LandingSections';
import { Sidebar } from './components/organisms/Sidebar';
import { LoginPage } from './components/pages/LoginPage';
import { RegisterPage } from './components/pages/RegisterPage';

// Lazy Load Pages for Performance
const NeoFeed = React.lazy(() => import('./components/organisms/NeoFeed').then(m => ({ default: m.NeoFeed })));
const RiskAnalyzer = React.lazy(() => import('./components/organisms/RiskAnalyzer').then(m => ({ default: m.RiskAnalyzer })));
const VideoLab = React.lazy(() => import('./components/organisms/VideoLab').then(m => ({ default: m.VideoLab })));
const ImageLab = React.lazy(() => import('./components/organisms/ImageLab').then(m => ({ default: m.ImageLab })));
const AlertCenter = React.lazy(() => import('./components/pages/AlertCenter').then(m => ({ default: m.AlertCenter })));
const OrbitalObservatory = React.lazy(() => import('./components/pages/OrbitalObservatory').then(m => ({ default: m.OrbitalObservatory })));
const AsteroidDetailPage = React.lazy(() => import('./components/pages/AsteroidDetailPage').then(m => ({ default: m.AsteroidDetailPage })));

const LoadingSpinner = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="w-12 h-12 border-4 border-void-800 border-t-electric rounded-full animate-spin"></div>
  </div>
);

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }} // Faster transition for snappier feel
        className="max-w-7xl mx-auto h-full"
    >
        {children}
    </motion.div>
);

const AppContent: React.FC = () => {
  const { neos, setNeos, setLoading, isSidebarCollapsed } = useCosmicStore();
  const { isAuthenticated, user, login } = useAuthStore();
  const location = useLocation();

  // Data Loading (Only when authenticated/active)
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && neos.length === 0) {
        setLoading(true);
        const data = await fetchNeoFeed();
        setNeos(data);
        setLoading(false);
      }
    };
    if (isAuthenticated) {
        loadData();
    }
  }, [isAuthenticated, neos.length, setNeos, setLoading]);

  const handleConnect = (path: string = '/dashboard') => {
      const mockUser = { 
          id: 'commander-' + Date.now(), 
          username: 'Commander', 
          email: 'commander@cosmicwatch.dev', 
          role: 'ADMIN' 
      };
      login(mockUser, 'bypass-token');
  };

  // Unauthenticated Routes (Landing, Login, Register)
  if (!isAuthenticated) {
      return (
        <Routes>
            <Route path="/login" element={<LoginPage onRegisterClick={() => {}} />} />
            <Route path="/register" element={<RegisterPage onLoginClick={() => {}} />} />
            <Route path="/" element={
                <div className="bg-void-950 min-h-screen flex flex-col text-white selection:bg-electric/30">
                    <Hero onConnect={() => handleConnect('/dashboard')} />
                    <LandingSections onConnect={() => handleConnect('/dashboard')} />
                    <TickerFooter />
                </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
  }

  // --- FULL SCREEN IMMERSIVE ROUTES (No Sidebar/Layout) ---
  const isImmersive = location.pathname === '/observatory' || location.pathname === '/3d-view';

  if (isImmersive) {
      return (
          <Suspense fallback={<div className="bg-black h-screen flex items-center justify-center text-electric font-mono tracking-widest animate-pulse">INITIALIZING TELESCOPE...</div>}>
              <OrbitalObservatory />
          </Suspense>
      );
  }

  // --- AUTHENTICATED DASHBOARD LAYOUT ---
  return (
    <div className="flex flex-col md:flex-row h-screen bg-void-950 text-gray-200 font-sans overflow-hidden selection:bg-electric/30">
        
        <Sidebar />

        <div className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
            
            {/* OPTIMIZATION: Static CSS Background instead of WebGL for Dashboard to fix lag */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-void-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-void-900/50 via-void-950 to-black"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
                {/* Subtle static stars */}
                <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_10px_white]"></div>
                <div className="absolute top-40 right-40 w-1 h-1 bg-electric rounded-full opacity-30 shadow-[0_0_10px_#00F0FF]"></div>
                <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-molten rounded-full opacity-20 shadow-[0_0_10px_#FF3D00]"></div>
            </div>

            {/* Top Bar */}
            <div className="h-16 flex items-center justify-end px-8 z-10 pointer-events-none absolute top-0 right-0 w-full">
                <div className="pointer-events-auto flex items-center gap-4 bg-void-900/80 backdrop-blur rounded-full px-4 py-2 border border-white/10 mt-4 shadow-lg">
                    <div className="text-right">
                        <div className="text-xs font-bold text-white">{user?.username}</div>
                        <div className="text-[9px] text-electric uppercase tracking-wider">COMMANDER</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-void-800 flex items-center justify-center text-electric border border-electric/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-6 md:p-8 pb-20 pt-24">
                <Suspense fallback={<LoadingSpinner />}>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/dashboard" element={
                                <PageWrapper><div className="mb-8"><h2 className="text-3xl font-display font-bold text-white tracking-tight">MISSION DASHBOARD</h2><p className="text-gray-400 font-sans text-sm mt-1">Real-time telemetry and object tracking sector scan.</p></div><NeoFeed /></PageWrapper>
                            } />
                            <Route path="/analyzer" element={
                                <PageWrapper><div className="mb-8"><h2 className="text-3xl font-display font-bold text-white tracking-tight">THREAT ANALYZER</h2><p className="text-gray-400 font-sans text-sm mt-1">Gemini AI-powered kinetic impact assessment.</p></div><RiskAnalyzer /></PageWrapper>
                            } />
                            <Route path="/simulation" element={
                                <PageWrapper><div className="mb-8"><h2 className="text-3xl font-display font-bold text-white tracking-tight">SIMULATION LAB</h2><p className="text-gray-400 font-sans text-sm mt-1">Generative video rendering of potential impact scenarios.</p></div><VideoLab /></PageWrapper>
                            } />
                            <Route path="/image-lab" element={
                                <PageWrapper><div className="mb-8"><h2 className="text-3xl font-display font-bold text-white tracking-tight">IMAGE LAB</h2><p className="text-gray-400 font-sans text-sm mt-1">Advanced spectrum analysis and image manipulation.</p></div><ImageLab /></PageWrapper>
                            } />
                            <Route path="/alerts" element={
                                <PageWrapper><AlertCenter /></PageWrapper>
                            } />
                            <Route path="/asteroid/:id" element={
                                <div className="absolute inset-0 z-50 bg-void-950 overflow-y-auto"><AsteroidDetailPage /></div>
                            } />
                            {/* Fallback */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </AnimatePresence>
                </Suspense>
            </main>
            
            <div className="relative z-50">
                <TickerFooter />
            </div>
        </div>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
};

export default App;
