import { Request, Response, NextFunction } from 'express';
import { AsteroidService } from '../services/asteroid.service';
import { ValidationError } from '../utils/AppError';
import { format } from 'date-fns';

const asteroidService = new AsteroidService();

export const getFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const reqAny = req as any;
    const start_date = (reqAny.query.start_date as string) || today;
    const end_date = (reqAny.query.end_date as string) || today;

    // Validate dates (simple check)
    if (new Date(start_date).toString() === 'Invalid Date') {
      throw new ValidationError('Invalid start_date format');
    }

    const data = await asteroidService.getFeed(start_date, end_date);
    (res as any).json({ status: 'success', count: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const getAsteroid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).params;
    const data = await asteroidService.getAsteroidById(id);
    (res as any).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const searchAsteroids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reqAny = req as any;
    const q = reqAny.query.q as string;
    const hazardous = reqAny.query.hazardous ? reqAny.query.hazardous === 'true' : undefined;
    const min_diameter = reqAny.query.min_diameter ? parseFloat(reqAny.query.min_diameter as string) : undefined;

    const data = await asteroidService.searchAsteroids({ q, hazardous, min_diameter });
    (res as any).json({ status: 'success', count: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await asteroidService.getStats();
    (res as any).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
};

export const getApproaching = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reqAny = req as any;
    const days = reqAny.query.days ? parseInt(reqAny.query.days as string) : 7;
    const data = await asteroidService.getApproaching(days);
    (res as any).json({ status: 'success', count: data.length, data });
  } catch (error) {
    next(error);
  }
};