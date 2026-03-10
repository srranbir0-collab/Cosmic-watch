
import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { AppError } from '../utils/AppError';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if Clerk Secret Key is available
    if (!process.env.CLERK_SECRET_KEY) {
        // Fallback mock data for dev/stateless mode
        return (res as any).json({ 
            status: 'success', 
            data: [
                { id: 'mock_user_1', firstName: 'Sarah', lastName: 'Connor', emailAddresses: [{ emailAddress: 'sarah@resistance.net' }], username: 'ResistanceLeader' },
                { id: 'mock_user_2', firstName: 'Ellen', lastName: 'Ripley', emailAddresses: [{ emailAddress: 'ripley@weyland.corp' }], username: 'NostromoSurvivor' }
            ] 
        });
    }

    const response = await clerkClient.users.getUserList({
        limit: 20,
        orderBy: '-created_at'
    });

    (res as any).json({ status: 'success', data: response.data });
  } catch (error) {
    next(error);
  }
};

export const impersonateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).body;
    const actorId = (req as any).user.id; // The Admin requesting impersonation

    if (!userId) {
        return next(new AppError('Target User ID is required', 400));
    }

    if (!process.env.CLERK_SECRET_KEY) {
         return next(new AppError('Clerk Secret Key missing. Impersonation unavailable in stateless mode.', 501));
    }

    // Generate Actor Token
    // The 'actor' field identifies the impersonator (the admin)
    const actorToken = await clerkClient.actorTokens.createActorToken({
        userId: userId, // The user to be impersonated
        actor: { sub: actorId } 
    });

    if (!actorToken.url) {
        return next(new AppError('Failed to generate impersonation URL', 500));
    }

    (res as any).json({ status: 'success', url: actorToken.url });
  } catch (error) {
    next(error);
  }
};
