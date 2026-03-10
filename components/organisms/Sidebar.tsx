
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../../store/useCosmicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const { alerts, isSidebarCollapsed, toggleSidebar } = useCosmicStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile drawer state
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = alerts.filter(a => a.status === 'UNREAD').length;

  const navItems = [
    { path: '/dashboard', label: 'Mission Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { path: '/observatory', label: 'Orbital Observatory', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { path: '/analyzer', label: 'Threat Analyzer', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
    )},
    { path: '/simulation', label: 'Simulation Lab', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
    )},
    { path: '/image-lab', label: 'Image Lab', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )},
    { path: '/alerts', label: 'Alert Center', icon: (
      <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-molten shadow-[0_0_5px_#FF3D00]"></span>}
      </div>
    )},
  ];

  const handleNavigation = (path: string) => {
      navigate(path);
      setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-void-950 border-r border-white/5 relative z-50">
      {/* Header / Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Cosmic Watch" className="w-10 h-10 object-contain rounded-md" />
          {!isSidebarCollapsed && (
            <div>
              <h1 className="font-hero font-bold text-lg text-white tracking-widest leading-none">COSMIC</h1>
              <span className="text-electric text-xs font-bold tracking-[0.2em] uppercase">Watch</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
         {navItems.map((item) => (
           <button
             key={item.path}
             onClick={() => handleNavigation(item.path)}
             className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-300 relative group ${isActive(item.path) ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
           >
             {/* Active Indicator */}
             {isActive(item.path) && (
               <motion.div 
                 layoutId="activeNav"
                 className="absolute left-0 top-0 bottom-0 w-[3px] bg-electric shadow-[0_0_10px_#00F0FF]"
               />
             )}
             {/* Active Background Gradient */}
             {isActive(item.path) && (
               <div className="absolute inset-0 bg-gradient-to-r from-electric/10 to-transparent opacity-100" />
             )}

             <span className={`relative z-10 ${isActive(item.path) ? 'text-electric drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : ''}`}>
               {item.icon}
             </span>
             
             {!isSidebarCollapsed && (
               <div className="relative z-10 flex-1 flex justify-between items-center">
                    <span className={`font-display tracking-wide text-sm ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>
                        {item.label}
                    </span>
                    {item.path === '/alerts' && unreadCount > 0 && (
                        <span className="bg-molten text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">{unreadCount}</span>
                    )}
               </div>
             )}
           </button>
         ))}

         {/* Separator & Home Button */}
         <div className="my-4 mx-6 border-t border-white/5 opacity-50"></div>
         
         <button
             onClick={logout}
             className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-300 relative group text-gray-500 hover:text-white`}
           >
             <span className={`relative z-10 group-hover:text-electric transition-colors`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </span>
             
             {!isSidebarCollapsed && (
               <div className="relative z-10 flex-1 flex justify-between items-center">
                    <span className={`font-display tracking-wide text-sm font-medium`}>
                        Disconnect
                    </span>
               </div>
             )}
           </button>
      </nav>

      {/* User Widget */}
      <div className="p-4 border-t border-white/5 bg-void-900/50">
         <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric to-gravity flex items-center justify-center font-bold text-void-950 shadow-lg">
                {user?.username.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
                <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-bold text-white truncate">{user?.username}</div>
                    <div className="text-[10px] text-electric uppercase tracking-wider">Commander</div>
                </div>
            )}
         </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen fixed left-0 top-0 bottom-0 z-[60] transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
        
        {/* Collapse Toggle */}
        <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-24 w-6 h-6 bg-void-800 border border-void-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-electric transition-colors z-50"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>
      </aside>

      {/* Mobile Header & Drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-void-950/90 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Cosmic Watch" className="w-8 h-8 object-contain rounded" />
            <span className="font-hero font-bold text-white">COSMIC WATCH</span>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
      </div>

      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="md:hidden fixed inset-0 z-[60] w-64"
            >
                <SidebarContent />
                {/* Backdrop */}
                <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 -z-10 backdrop-blur-sm left-64 w-[100vw]" />
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
