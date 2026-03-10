import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  asteroidId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface ChatState {
  socket: Socket | null;
  messages: Message[];
  activeRoom: string | null;
  isConnected: boolean;
  onlineCount: number;
  typingUsers: string[];
  
  connect: (token?: string) => void;
  joinRoom: (asteroidId: string) => void;
  leaveRoom: () => void;
  sendMessage: (asteroidId: string, message: string, username: string) => void;
  setTyping: (asteroidId: string, username: string, isTyping: boolean) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  disconnect: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  messages: [],
  activeRoom: null,
  isConnected: false,
  onlineCount: 1,
  typingUsers: [],

  connect: (token) => {
    if (get().socket?.connected) return;

    // In a real deployed app, this would be window.location.origin, 
    // but ensuring it points to current host usually works with relative path or auto-discovery
    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('new_message', (message: Message) => {
      // Only add if it belongs to current room
      if (get().activeRoom === message.asteroidId) {
        set((state) => ({ messages: [...state.messages, message] }));
      }
    });

    socket.on('room_users_update', ({ count }: { count: number }) => {
        set({ onlineCount: count });
    });

    socket.on('user_typing', ({ username, isTyping }: { username: string, isTyping: boolean }) => {
        set((state) => {
            let newTyping = [...state.typingUsers];
            if (isTyping && !newTyping.includes(username)) {
                newTyping.push(username);
            } else if (!isTyping) {
                newTyping = newTyping.filter(u => u !== username);
            }
            return { typingUsers: newTyping };
        });
    });

    set({ socket });
  },

  joinRoom: (asteroidId) => {
    const socket = get().socket;
    if (socket && asteroidId) {
        // Leave previous room if any
        const prevRoom = get().activeRoom;
        if(prevRoom && prevRoom !== asteroidId) {
            socket.emit('leave_asteroid_room', prevRoom);
        }
        
        socket.emit('join_asteroid_room', asteroidId);
        set({ activeRoom: asteroidId, messages: [] });
    }
  },

  leaveRoom: () => {
      const socket = get().socket;
      const room = get().activeRoom;
      if (socket && room) {
          socket.emit('leave_asteroid_room', room);
          set({ activeRoom: null, messages: [] });
      }
  },

  sendMessage: (asteroidId, message, username) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('send_message', { asteroidId, message, username });
    }
  },

  setTyping: (asteroidId, username, isTyping) => {
      const socket = get().socket;
      if (socket) {
          socket.emit('typing', { asteroidId, username, isTyping });
      }
  },

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));