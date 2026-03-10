
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';

// In-memory store for stateless mode (Fallback)
const memoryMessages: any[] = [];

export class ChatService {
  
  public async saveMessage(userId: string, asteroidId: string, message: string, username: string) {
    const newMessage = {
        userId,
        asteroidId,
        message,
        createdAt: new Date(),
        user: { id: userId, username: username || 'Sentinel' }
    };

    // Strategy: Use Supabase if available
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    { 
                        user_id: userId, 
                        asteroid_id: asteroidId, 
                        content: message,
                        username: username || 'Sentinel'
                    }
                ])
                .select();

            if (error) throw error;
            
            // Map Supabase response to app structure
            if (data && data[0]) {
                return {
                    id: data[0].id,
                    userId: data[0].user_id,
                    asteroidId: data[0].asteroid_id,
                    message: data[0].content,
                    createdAt: data[0].created_at,
                    user: { id: data[0].user_id, username: data[0].username }
                };
            }
        } catch (err: any) {
            logger.error('Supabase write failed, falling back to memory:', err.message);
        }
    }

    // Fallback: Memory Store
    const msg = {
        ...newMessage,
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    memoryMessages.push(msg);
    
    // Keep memory clean
    if (memoryMessages.length > 500) {
        memoryMessages.shift();
    }
    
    return msg;
  }

  public async getMessages(asteroidId: string, limit: number = 50, before?: string) {
    
    // Strategy: Use Supabase if available
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('asteroid_id', asteroidId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data.map((m: any) => ({
                id: m.id,
                userId: m.user_id,
                asteroidId: m.asteroid_id,
                message: m.content,
                createdAt: m.created_at,
                user: { id: m.user_id, username: m.username }
            })).reverse(); // Client expects chronological order usually
        } catch (err: any) {
            logger.error('Supabase read failed, falling back to memory:', err.message);
        }
    }

    // Fallback: Memory Store
    return memoryMessages
        .filter(m => m.asteroidId === asteroidId)
        .slice(-limit)
        .reverse(); // Reverse for display order if needed, or keep as is depending on frontend
  }
}
