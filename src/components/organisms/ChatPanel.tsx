
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { Button } from '../atoms/Button';

interface ChatPanelProps {
  asteroidId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ asteroidId, isOpen, onClose }) => {
  const { user, token } = useAuth();
  const { 
    connect, 
    joinRoom, 
    messages, 
    sendMessage, 
    setMessages, 
    setTyping, 
    typingUsers, 
    onlineCount,
    leaveRoom
  } = useChatStore();
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Connection
  useEffect(() => {
    if (isOpen && token) {
      connect(token);
    }
  }, [isOpen, token, connect]);

  // Join Room & Fetch History
  useEffect(() => {
    if (isOpen && asteroidId) {
      joinRoom(asteroidId);
      
      // Fetch History
      const fetchHistory = async () => {
          if (!token) return;
          try {
              const res = await fetch(`/api/chat/${asteroidId}?limit=50`, {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if(data.status === 'success') {
                  setMessages(data.data);
              }
          } catch (error) {
              console.error(error);
          }
      };
      
      fetchHistory();
    }
    
    return () => {
        // Optional: Leave room on unmount or id change
        // leaveRoom(); // Kept persistent for now
    };
  }, [isOpen, asteroidId, joinRoom, token, setMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !user) return;

    sendMessage(asteroidId, inputValue, user.username);
    setInputValue('');
    handleTyping(false);
  };

  const handleTyping = (isTyping: boolean) => {
      if(!user) return;
      setTyping(asteroidId, user.username, isTyping);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      handleTyping(true);
      
      typingTimeoutRef.current = setTimeout(() => {
          handleTyping(false);
      }, 2000);
  };

  // Generate deterministic color for avatar
  const getAvatarColor = (name: string) => {
      const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-void-950/80 backdrop-blur-xl border-l border-white/10 z-[60] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-void-900/50">
            <div>
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                COMMUNITY UPLINK
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <div className="text-xs font-mono text-electric mt-0.5">
                  {onlineCount} {onlineCount === 1 ? 'SENTINEL' : 'SENTINELS'} ONLINE
              </div>
            </div>
            <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
             {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                     <div className="w-16 h-16 bg-void-800 rounded-full flex items-center justify-center mb-4">
                         <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                     </div>
                     <p className="text-sm font-mono text-gray-300">FREQUENCY QUIET</p>
                     <p className="text-xs text-gray-500">Be the first to broadcast on this channel.</p>
                 </div>
             )}

             {messages.map((msg, i) => {
                 const isMe = user?.id === msg.userId || (user?.id === undefined && msg.userId.startsWith('anon'));
                 const showHeader = i === 0 || messages[i-1].userId !== msg.userId;
                 
                 return (
                     <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                         {showHeader && !isMe && (
                             <div className="flex items-center gap-2 mb-1 ml-1">
                                 <div className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white ${getAvatarColor(msg.user.username)}`}>
                                     {msg.user.username.charAt(0).toUpperCase()}
                                 </div>
                                 <span className="text-[10px] text-gray-400 font-bold">{msg.user.username}</span>
                             </div>
                         )}
                         <div 
                            className={`
                                max-w-[85%] px-3 py-2 rounded-2xl text-sm font-sans leading-relaxed shadow-lg
                                ${isMe 
                                    ? 'bg-electric/20 text-white rounded-tr-sm border border-electric/20' 
                                    : 'bg-void-800 text-gray-200 rounded-tl-sm border border-white/5'
                                }
                            `}
                         >
                             {msg.message}
                         </div>
                         <span className="text-[9px] text-gray-600 mt-1 px-1 font-mono">
                             {format(new Date(msg.createdAt), 'HH:mm')}
                         </span>
                     </div>
                 );
             })}
             
             {/* Typing Indicator */}
             {typingUsers.length > 0 && (
                 <div className="flex items-center gap-2 ml-1 opacity-70">
                     <div className="flex gap-1">
                         <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                         <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                         <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                     <span className="text-[10px] text-gray-500 font-mono">
                         {typingUsers.join(', ')} typing...
                     </span>
                 </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-void-900/80">
              <form onSubmit={handleSend} className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={user ? "Transmit message..." : "Login to transmit"}
                    disabled={!user}
                    className="flex-1 bg-void-950 border border-void-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-electric transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button 
                    type="submit" 
                    disabled={!user || !inputValue.trim()}
                    className="w-10 h-10 rounded-full bg-electric text-void-950 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
              </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
