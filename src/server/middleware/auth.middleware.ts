
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { AppError } from '../utils/AppError';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import logger from '../utils/logger';

export interface AuthRequest extends ExpressRequest {
  user?: {
    id: string;
    role: string;
    username: string;
    email?: string;
  };
  auth?: {
    userId: string;
    sessionId: string;
  };
}

// Check if Clerk is configured
const isClerkEnabled = !!process.env.CLERK_SECRET_KEY;

export const protect = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
  const authHeader = (req as any).headers['authorization'];
  let token;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  // 1. Bypass Tokens (For Demo/Dev modes)
  if (token === 'bypass-token' || token === 'universal-access-token' || token === 'offline-token' || token === 'social-token') {
      (req as any).user = {
          id: 'commander-bypass',
          role: 'ADMIN',
          username: 'Commander',
          email: 'commander@cosmicwatch.dev'
      };
      return next();
  }

  // 2. Clerk Authentication Strategy
  if (isClerkEnabled) {
      // Use Clerk's middleware logic manually to allow fallback
      return ClerkExpressWithAuth()(req, res, (err) => {
          if (err) {
              logger.error('Clerk Auth Error:', err);
              return next(new AppError('Authentication failed via Clerk', 401));
          }

          const clerkAuth = (req as any).auth;
          
          if (clerkAuth && clerkAuth.userId) {
              // Successfully authenticated via Clerk
              (req as any).user = {
                  id: clerkAuth.userId,
                  role: 'USER', // Clerk roles can be fetched here if needed
                  username: 'Sentinel', // Placeholder, usually fetched from Clerk API
                  email: 'sentinel@cosmicwatch.dev'
              };
              return next();
          }

          // If Clerk failed to find a user, try legacy JWT below
          verifyLegacyToken(token, req, next);
      });
  }

  // 3. Legacy / Internal JWT Strategy
  verifyLegacyToken(token, req, next);
};

const verifyLegacyToken = (token: string | undefined, req: ExpressRequest, next: NextFunction) => {
    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }

    try {
        const decoded = verifyToken(token);
        (req as any).user = {
            id: decoded.id,
            role: decoded.role,
            username: decoded.username || 'Commander',
            email: 'stateless@cosmicwatch.dev'
        };
        next();
    } catch (err) {
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
};
