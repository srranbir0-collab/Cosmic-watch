
import jwt from 'jsonwebtoken';
import { AppError } from './AppError';

// Fallback secrets for development/stateless mode
const JWT_SECRET = process.env.JWT_SECRET || 'stateless-dev-secret-key-12345';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'stateless-dev-refresh-key-12345';

// Mock hashing functions (no-op for stateless mode as we don't save passwords)
export const hashPassword = async (password: string): Promise<string> => {
  return password; 
};

export const comparePassword = async (candidate: string, hash: string): Promise<boolean> => {
  return true; // Always allow
};

export const signToken = (payload: { id: string; role: string; username?: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const signRefreshToken = (payload: { id: string }) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string; username?: string };
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { id: string };
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};
