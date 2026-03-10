
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ChatService } from './services/chat.service';
import logger from './utils/logger';
import { verifyToken } from './utils/auth';

const chatService = new ChatService();

// Use intersection type to ensure ChatSocket has all Socket properties plus our custom user
type ChatSocket = Socket & {
    user?: {
        id: string;
        username?: string;
    }
}

export const initSocket = (httpServer: HttpServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: true, // Allow all origins for dev/hackathon
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware for Auth
    io.use(async (socket: Socket, next) => {
        const chatSocket = socket as ChatSocket;
        try {
            const token = chatSocket.handshake.auth.token;
            // Allow bypassing for dev convenience if needed, but standard flow uses JWT
            if (token) {
                const decoded = verifyToken(token);
                chatSocket.user = { id: decoded.id, username: decoded.username };
            } else {
                // Anonymous fallback for hackathon visibility
                chatSocket.user = { id: 'anon-' + chatSocket.id.substr(0, 4), username: 'Anonymous' };
            }
            next();
        } catch (err) {
            logger.warn('Socket auth failed', err);
            next(new Error("Authentication error"));
        }
    });

    io.on('connection', (socket: Socket) => {
        const chatSocket = socket as ChatSocket;
        logger.info(`Socket connected: ${chatSocket.id}`);

        chatSocket.on('join_asteroid_room', async (asteroidId: string) => {
            if(!asteroidId) return;
            
            const roomName = `asteroid_${asteroidId}`;
            await chatSocket.join(roomName);
            logger.info(`Socket ${chatSocket.id} joined ${roomName}`);
            
            // Broadcast user count update
            const sockets = await io.in(roomName).fetchSockets();
            io.to(roomName).emit('room_users_update', { count: sockets.length });
        });

        chatSocket.on('leave_asteroid_room', (asteroidId: string) => {
            const roomName = `asteroid_${asteroidId}`;
            chatSocket.leave(roomName);
        });

        chatSocket.on('send_message', async (data: { asteroidId: string, message: string, username: string }) => {
            const { asteroidId, message, username } = data;
            if (!chatSocket.user || !asteroidId || !message) return;

            try {
                // Use username from token if available, otherwise from payload, otherwise fallback
                const safeUsername = chatSocket.user.username || username || 'Sentinel';

                // Save to DB
                let dbMessage;
                if (!chatSocket.user.id.startsWith('anon-')) {
                    dbMessage = await chatService.saveMessage(chatSocket.user.id, asteroidId, message, safeUsername);
                } else {
                    // Mock DB response for anon
                    dbMessage = {
                        id: 'temp-' + Date.now(),
                        asteroidId,
                        userId: chatSocket.user.id,
                        message,
                        createdAt: new Date(),
                        user: { id: chatSocket.user.id, username: safeUsername }
                    };
                }

                // Broadcast
                io.to(`asteroid_${asteroidId}`).emit('new_message', dbMessage);
            } catch (err) {
                logger.error('Failed to send message via socket', err);
                chatSocket.emit('error', { message: 'Failed to send message' });
            }
        });

        chatSocket.on('typing', (data: { asteroidId: string, username: string, isTyping: boolean }) => {
            chatSocket.to(`asteroid_${data.asteroidId}`).emit('user_typing', {
                userId: chatSocket.user?.id,
                username: data.username,
                isTyping: data.isTyping
            });
        });

        chatSocket.on('disconnect', () => {
            // Cleanup logic if needed (user counts update automatically on next fetch or polling)
        });
    });

    return io;
};
