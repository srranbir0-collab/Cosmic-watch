
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCosmicStore } from './store/useCosmicStore';
import { useAuth } from './context/AuthContext';
import { fetchNeoFeed } from './services/nasaService';
import { motion, AnimatePresence } from 'framer-motion';
import { TickerFooter } from './components/molecules/TickerFooter';
import { Hero } from './components/organisms/Hero';
import { LandingSections } from './components/organisms/LandingSections';
import { Sidebar } from './components/organisms/Sidebar';
import { LoginPage } from './components/pages/LoginPage';
import { RegisterPage } from './components/pages/RegisterPage';
import { OnboardingPage } from './components/pages/OnboardingPage';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

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
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto h-full"
    >
        {children}
    </motion.div>
);

const AppContent: React.FC = () => {
  const { neos, setNeos, setLoading, isSidebarCollapsed } = useCosmicStore();
  const { isAuthenticated, user, login, isLoading } = useAuth();
  const { actor, signOut: clerkSignOut } = useClerkAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Data Loading (Only when authenticated)
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
      navigate(path);
  };

  if (isLoading) {
      return <div className="h-screen bg-void-950 flex items-center justify-center"><LoadingSpinner /></div>;
  }

  // --- UNAUTHENTICATED ROUTES ---
  if (!isAuthenticated) {
      return (
        <Routes>
            <Route path="/login" element={<LoginPage onRegisterClick={() => navigate('/register')} />} />
            <Route path="/register" element={<RegisterPage onLoginClick={() => navigate('/login')} />} />
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

  // --- IMMERSIVE ROUTES ---
  const isImmersive = location.pathname === '/observatory' || location.pathname === '/3d-view';
  if (isImmersive) {
      return (
          <Suspense fallback={<div className="bg-black h-screen flex items-center justify-center text-electric font-mono tracking-widest animate-pulse">INITIALIZING TELESCOPE...</div>}>
              <OrbitalObservatory />
          </Suspense>
      );
  }

  // --- DASHBOARD LAYOUT ---
  const userRole = (user as any)?.role || 'Sentinel';
  
  return (
    <>
      {/* Impersonation Banner */}
      {actor && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-molten text-void-950 font-bold font-mono text-center text-xs py-1 uppercase tracking-widest flex items-center justify-center gap-4">
              <span>⚠ IMPERSONATION ACTIVE: VIEWING AS {user?.username || user?.id}</span>
              <button 
                onClick={() => clerkSignOut()}
                className="bg-void-950/20 hover:bg-void-950/40 px-2 py-0.5 rounded border border-void-950/30 transition-colors"
              >
                  EXIT SESSION
              </button>
          </div>
      )}

      <div className={`flex flex-col md:flex-row h-screen bg-void-950 text-gray-200 font-sans overflow-hidden selection:bg-electric/30 ${actor ? 'pt-6' : ''}`}>
            
            <Sidebar />

            <div className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
                
                {/* Background */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-void-950">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-void-900/50 via-void-950 to-black"></div>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
                    {/* Subtle static stars */}
                    <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_10px_white]"></div>
                    <div className="absolute top-40 right-40 w-1 h-1 bg-electric rounded-full opacity-30 shadow-[0_0_10px_#00F0FF]"></div>
                    <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-molten rounded-full opacity-20 shadow-[0_0_10px_#FF3D00]"></div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-6 md:p-8 pb-20 pt-24">
                    <Suspense fallback={<LoadingSpinner />}>
                        <AnimatePresence mode="wait">
                            <Routes location={location} key={location.pathname}>
                                <Route path="/dashboard" element={
                                    <PageWrapper>
                                        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                                            <div>
                                                <h2 className="text-3xl font-display font-bold text-white tracking-tight">MISSION DASHBOARD</h2>
                                                <p className="text-gray-400 font-sans text-sm mt-1">Real-time telemetry and object tracking sector scan.</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-void-900/50 p-2 pr-4 rounded-full border border-white/5 backdrop-blur-sm">
                                                <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center text-electric border border-electric/30 font-bold">
                                                    {user?.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-[10px] font-mono text-electric uppercase tracking-widest leading-none mb-1">
                                                        {userRole}
                                                    </div>
                                                    <div className="text-xs font-bold text-white leading-none">
                                                        {user?.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <NeoFeed />
                                    </PageWrapper>
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
    </>
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
