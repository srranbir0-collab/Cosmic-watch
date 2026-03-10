import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reqAny = req as any;
    const { asteroidId } = reqAny.params;
    const limit = reqAny.query.limit ? parseInt(reqAny.query.limit as string) : 50;
    const before = reqAny.query.before as string;

    if (!asteroidId) {
        return (res as any).status(400).json({ status: 'error', message: 'Asteroid ID is required' });
    }

    const messages = await chatService.getMessages(asteroidId, limit, before);
    
    (res as any).json({
      status: 'success',
      data: messages
    });
  } catch (error) {
    next(error);
  }
};