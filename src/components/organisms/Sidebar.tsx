
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../../store/useCosmicStore';
import { useAuth } from '../../context/AuthContext';
import { UserButton, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../molecules/Modal';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';

export const Sidebar: React.FC = () => {
  const { alerts, isSidebarCollapsed, toggleSidebar } = useCosmicStore();
  const { user: clerkUser } = useUser();
  const { user: customUser, logout } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile drawer state
  const [isOpen, setIsOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  
  // Admin User List State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const unreadCount = alerts.filter(a => a.status === 'UNREAD').length;
  
  // Resolve User Info
  const user = clerkUser || customUser;
  const username = clerkUser?.username || customUser?.username || 'Sentinel';
  const role = (clerkUser?.publicMetadata?.role as string) || (customUser as any)?.role || 'USER';
  const isClerk = !!clerkUser;

  const navItems = [
    { path: '/dashboard', label: 'Mission Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
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

  const handleInvite = async () => {
      if (!inviteEmail) return;
      setInviting(true);
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/auth/invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ email: inviteEmail })
          });
          if (res.ok) {
              alert('Invitation encrypted and transmitted.');
              setShowInviteModal(false);
              setInviteEmail('');
          } else {
              alert('Transmission failed. Check frequency.');
          }
      } catch (error) {
          console.error(error);
      } finally {
          setInviting(false);
      }
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/admin/users', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.status === 'success') {
              setUsers(data.data);
          }
      } catch (error) {
          console.error("Failed to fetch users", error);
      } finally {
          setLoadingUsers(false);
      }
  };

  const handleOpenAdmin = () => {
      setShowAdminModal(true);
      fetchUsers();
  };

  const handleImpersonate = async (userId: string) => {
      if (!confirm('Warning: You are about to access another sentinel\'s terminal. Proceed?')) return;
      
      setImpersonating(userId);
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/admin/impersonate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ userId })
          });
          const data = await res.json();
          
          if (data.status === 'success' && data.url) {
              // Redirect to the impersonation URL provided by Clerk
              window.location.href = data.url;
          } else {
              alert('Impersonation uplink failed. Check server logs.');
          }
      } catch (error) {
          console.error("Impersonation Error:", error);
          alert('System Error: Unable to establish impersonation link.');
      } finally {
          setImpersonating(null);
      }
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
         
         <div className="px-6 mt-4 space-y-2">
             <button 
                onClick={() => setShowInviteModal(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-electric/30 hover:bg-electric/5 transition-all text-left group ${isSidebarCollapsed ? 'justify-center' : ''}`}
             >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-electric transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                 {!isSidebarCollapsed && (
                     <div className="text-xs font-mono text-gray-400 group-hover:text-white uppercase tracking-widest">Invite Sentinel</div>
                 )}
             </button>

             {/* Admin Console */}
             {(username === 'Commander' || role === 'ADMIN') && (
                 <button 
                    onClick={handleOpenAdmin}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border border-void-700 bg-void-800 hover:border-molten/50 hover:bg-molten/10 transition-all text-left group ${isSidebarCollapsed ? 'justify-center' : ''}`}
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-molten transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     {!isSidebarCollapsed && (
                         <div className="text-xs font-mono text-gray-400 group-hover:text-white uppercase tracking-widest">Admin Console</div>
                     )}
                 </button>
             )}
         </div>
      </nav>

      {/* User Widget */}
      <div className="p-4 border-t border-white/5 bg-void-900/50">
         <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            {isClerk ? (
                <UserButton 
                    appearance={{
                        elements: {
                            userButtonAvatarBox: "w-10 h-10 border border-electric/30",
                            userButtonTrigger: "focus:shadow-none"
                        }
                    }}
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-electric/20 border border-electric/30 flex items-center justify-center text-electric font-bold">
                    {username.charAt(0).toUpperCase()}
                </div>
            )}
            
            {!isSidebarCollapsed && (
                <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-bold text-white truncate">{username}</div>
                    <div className="text-[10px] text-electric uppercase tracking-wider">
                        {role}
                    </div>
                </div>
            )}
            
            {!isClerk && !isSidebarCollapsed && (
                <button onClick={logout} className="p-2 text-gray-500 hover:text-white transition-colors" title="Logout">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            )}
         </div>
      </div>
    </div>
  );
};
