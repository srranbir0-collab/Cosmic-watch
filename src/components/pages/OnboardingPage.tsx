
import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import Galaxy from '../molecules/Galaxy';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { motion } from 'framer-motion';

export const OnboardingPage: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [callsign, setCallsign] = useState(user?.username || user?.firstName || '');
  const [department, setDepartment] = useState('Planetary Defense');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const token = await getToken();
        const res = await fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ callsign, department })
        });
        
        if (res.ok) {
            // Force reload to get updated metadata
            await user?.reload();
            // The App component will automatically switch to the dashboard view
        } else {
            console.error("Onboarding failed");
        }
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1120] overflow-hidden relative items-center justify-center">
      {/* Background Galaxy Layer */}
      <div className="absolute inset-0 z-0">
        <Galaxy starSpeed={0.05} density={1.5} mouseInteraction={true} transparent={true} />
      </div>

      <div className="w-full max-w-lg p-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-void-900/80 backdrop-blur-xl p-8 rounded-2xl border border-electric/30 shadow-[0_0_50px_rgba(0,240,255,0.1)]"
          >
              <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-electric/30 animate-pulse">
                      <svg className="w-8 h-8 text-electric" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="font-hero text-3xl text-white mb-2 tracking-widest">SENTINEL ACTIVATION</h2>
                  <p className="text-gray-400 font-sans text-sm">Initialize your profile to access the Cosmic Watch network.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                  <Input 
                    label="Sentinel Callsign" 
                    value={callsign} 
                    onChange={(e) => setCallsign(e.target.value)} 
                    placeholder="Enter your designation"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  />
                  
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500 ml-4">Primary Directive</label>
                      <div className="relative">
                          <select 
                            value={department} 
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full bg-void-950 border border-void-700 text-white font-sans text-base px-4 py-4 rounded-lg outline-none focus:border-electric appearance-none pl-12"
                          >
                              <option value="Planetary Defense">Planetary Defense</option>
                              <option value="Orbital Mechanics">Orbital Mechanics</option>
                              <option value="Deep Space Surveillance">Deep Space Surveillance</option>
                              <option value="Research & Archive">Research & Archive</option>
                          </select>
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                      </div>
                  </div>

                  <Button variant="plasma" className="w-full mt-6" disabled={loading || !callsign} isLoading={loading}>
                      {loading ? 'ESTABLISHING UPLINK...' : 'INITIALIZE LINK'}
                  </Button>
              </form>
          </motion.div>
      </div>
    </div>
  );
};
