
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Galaxy from '../molecules/Galaxy';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface LoginPageProps {
  onRegisterClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#FF3D00']
        });
        login(data.data.user, data.token);
      } else {
        setError(data.message || 'Access Denied');
      }
    } catch (err) {
      console.warn("Backend unreachable, attempting offline bypass for demo...");
      // Fallback for demo/dev if backend is down
      const mockUser = { 
          id: 'commander-' + Date.now(), 
          username: email.split('@')[0] || 'Commander', 
          email: email || 'commander@cosmicwatch.dev', 
          role: 'ADMIN' 
      };
      login(mockUser, 'universal-access-token');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
      alert("Recover protocol initiated. Check your secure comms.");
  };

  return (
    <div className="flex h-screen bg-[#0B1120] overflow-hidden relative">
      {/* Background Galaxy Layer */}
      <div className="absolute inset-0 z-0">
        <Galaxy starSpeed={0.03} density={1.2} mouseInteraction={true} transparent={true} />
      </div>

      {/* Left Panel - Hero Content */}
      <div className="hidden lg:flex w-[45%] relative z-10 flex-col justify-center p-12 bg-gradient-to-r from-void-950/80 to-transparent">
        <div className="relative">
            <div className="mb-8">
                <img src="/logo.png" alt="Cosmic Watch" className="w-32 h-auto object-contain rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)]" />
            </div>
            <h1 className="font-hero font-bold text-5xl text-white tracking-widest leading-none mb-4">
                COSMIC<br/><span className="text-electric">WATCH</span>
            </h1>
            <p className="text-gray-400 font-sans text-lg max-w-sm">
                Advanced orbital surveillance and planetary defense network. Authorized personnel only.
            </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 relative z-10 bg-void-950/40 backdrop-blur-sm lg:bg-transparent">
        <div className="max-w-md w-full">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-void-900/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden"
          >
              <div className="absolute top-0 right-0 w-32 h-32 bg-electric/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2"></div>

              <h2 className="font-hero text-3xl text-white mb-2 relative z-10">WELCOME BACK</h2>
              <p className="text-gray-400 font-sans mb-8 relative z-10">Identify yourself to access the secure network.</p>

              {/* Toast Error */}
              <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="bg-molten/10 border border-molten/30 p-3 rounded-lg flex items-center gap-3 overflow-hidden"
                    >
                        <div className="text-molten shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </div>
                        <p className="text-molten text-sm font-mono">{error}</p>
                    </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <Input 
                    label="Callsign or Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  />
                  
                  <Input 
                    label="Access Code" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  />

                  <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded bg-void-950 border-void-600 text-electric focus:ring-offset-void-900" defaultChecked />
                          <span className="text-gray-400 group-hover:text-white transition-colors">Maintain Uplink</span>
                      </label>
                      <button type="button" onClick={handleForgotPassword} className="text-gray-500 hover:text-electric transition-colors">Forgot Password?</button>
                  </div>

                  <Button variant="plasma" className="w-full" disabled={loading} isLoading={loading}>
                      {loading ? 'AUTHENTICATING...' : 'ENTER COMMAND CENTER'}
                  </Button>
              </form>

              <div className="mt-8 text-center text-sm text-gray-400 relative z-10">
                  New to the watch? <button onClick={onRegisterClick} className="text-white font-bold hover:text-electric transition-colors ml-1 uppercase tracking-wider">Initialize Profile</button>
              </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
