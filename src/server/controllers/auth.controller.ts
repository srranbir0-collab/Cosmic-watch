
import { Request, Response, NextFunction } from 'express';
import { signToken, signRefreshToken, verifyToken } from '../utils/auth';
import { AppError } from '../utils/AppError';
import { rateLimit } from 'express-rate-limit';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Rate Limiter (lightweight)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  message: 'Too many attempts',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to create token and send response
const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken({ id: user.id, role: user.role, username: user.username });
  const refreshToken = signRefreshToken({ id: user.id });

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  (res as any).cookie('jwt_refresh', refreshToken, cookieOptions);

  (res as any).status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username } = (req as any).body;

    // Ephemeral User Creation - No Database interaction
    const newUser = {
        id: 'user-' + Date.now(),
        email: email || 'anon@cosmicwatch.dev',
        username: username || 'Cadet',
        role: 'USER',
    };

    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = (req as any).body;

    // Extract username from email or default
    const derivedName = email ? email.split('@')[0] : 'Commander';
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

    const user = {
        id: 'user-' + Date.now(),
        email: email,
        username: formattedName,
        role: 'ADMIN', // Give everyone admin in this mode
    };

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  // The protect middleware already decodes the token
  const userReq = (req as any).user;
  
  if (!userReq) {
      return next(new AppError('Not authenticated', 401));
  }

  (res as any).status(200).json({
    status: 'success',
    data: { user: userReq },
  });
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    // In stateless mode, just ask them to login again for simplicity
    next(new AppError('Session expired, please login again', 401));
};

export const logout = (req: Request, res: Response) => {
    (res as any).cookie('jwt_refresh', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    (res as any).status(200).json({ status: 'success' });
};

export const completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { callsign, department } = (req as any).body;
    const userReq = (req as any).user;

    if (!userReq || !userReq.id) {
        return next(new AppError('Not authenticated', 401));
    }

    // If using Clerk (ID doesn't start with legacy prefix)
    if (!userReq.id.startsWith('user-') && !userReq.id.startsWith('commander-')) {
        try {
            await clerkClient.users.updateUser(userReq.id, {
                publicMetadata: {
                    onboardingComplete: true,
                    callsign: callsign,
                    department: department
                },
                // Also update the root username/firstname if supported, 
                // but publicMetadata is safest for custom fields
                username: callsign.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '') || undefined
            });
        } catch (error) {
            console.error("Clerk Update Error:", error);
            // Fallback for "Stateless" or local dev where Clerk API might fail or key is readonly
        }
    }

    (res as any).status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = (req as any).body;
    if (!email) return next(new AppError('Email is required', 400));

    const userReq = (req as any).user;
    if (!userReq || !userReq.id) return next(new AppError('Not authenticated', 401));

    // Programmatically create invitation via Clerk Backend API
    // Note: This requires Secret Key to be set in backend env
    try {
        const invitation = await clerkClient.invitations.createInvitation({
            emailAddress: email,
            redirectUrl: process.env.VITE_CLERK_SIGN_UP_URL || 'http://localhost:3000/register',
            publicMetadata: {
                invitedBy: userReq.username || userReq.id,
                role: 'SENTINEL'
            }
        });
        
        (res as any).status(200).json({ status: 'success', data: invitation });
    } catch (error: any) {
        // Handle Clerk API errors (e.g. already invited, invalid email)
        logger.error('Clerk Invite Error:', error);
        
        // If stateless or Clerk not configured, just mock success for UI
        if (!process.env.CLERK_SECRET_KEY) {
             (res as any).status(200).json({ status: 'success', message: 'Invitation simulation sent.' });
             return;
        }
        
        return next(new AppError(error.errors?.[0]?.message || 'Invitation failed', 400));
    }
  } catch (error) {
    next(error);
  }
};
import logger from '../utils/logger';
