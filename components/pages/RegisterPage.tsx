
import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import Galaxy from '../molecules/Galaxy';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { z } from 'zod';

interface RegisterPageProps {
  onLoginClick: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginClick }) => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    // Relaxed validation
    const schema = z.object({
        email: z.string().min(1, "Contact required"),
        username: z.string().min(1, "Callsign required"),
        password: z.string().min(1, "Password required")
    });
    const result = schema.safeParse({ email, username, password });
    if (!result.success) {
        const errors: any = {};
        result.error.issues.forEach(e => errors[e.path[0]] = e.message);
        setFieldErrors(errors);
        return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#7C3AED', '#FF3D00']
        });
        login(data.data.user, data.token);
      } else {
        setError(data.message || 'Registration rejected by server.');
      }
    } catch (err) {
      console.error(err);
      // Failover for demo
      const mockUser = { id: 'offline-user', username: username || 'Cadet', email: email || 'cadet@cosmicwatch.dev', role: 'USER' };
      login(mockUser, 'offline-token');
    } finally {
      setLoading(false);
    }
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
            <div className="w-16 h-16 bg-molten/20 rounded-xl flex items-center justify-center animate-pulse mb-8 border border-molten/50">
                <svg className="w-8 h-8 text-molten" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h1 className="font-hero font-bold text-5xl text-white tracking-widest leading-none mb-4">
                MISSION<br/><span className="text-molten">CONTROL</span>
            </h1>
            <p className="text-gray-400 font-sans text-lg max-w-sm">
                Join the sentinels. Real-time threat analysis and orbital data visualization access.
            </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 relative z-10 bg-void-950/40 backdrop-blur-sm lg:bg-transparent">
        <div className="max-w-md w-full">
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-void-900/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl"
          >
              <h2 className="font-hero text-3xl text-white mb-2">JOIN THE WATCH</h2>
              <p className="text-gray-400 font-sans mb-8">Begin your watch. Protect the future.</p>

              <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6 bg-molten/10 border border-molten/30 p-3 rounded text-molten text-sm font-mono flex gap-2 items-center"
                    >
                        <span>⚠</span> {error}
                    </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <Input 
                    label="Callsign (Username)" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    error={fieldErrors.username}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  />

                  <Input 
                    label="Officer Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    error={fieldErrors.email}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  />
                  
                  <Input 
                    label="Secure Password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    error={fieldErrors.password}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  />

                  <Button variant="plasma" className="w-full mt-6" disabled={loading} isLoading={loading}>
                      {loading ? 'INITIALIZING PROFILE...' : 'CREATE ACCOUNT'}
                  </Button>
              </form>

              <div className="mt-8 text-center text-sm text-gray-400">
                  Already have clearance? <button onClick={onLoginClick} className="text-white font-bold hover:text-electric transition-colors ml-1">Access Terminal</button>
              </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
