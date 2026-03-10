
import NodeCache from 'node-cache';
import { NasaService } from './nasa.service';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/AppError';

const nasaService = new NasaService();
const memoryCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export class AsteroidService {
  
  public async getFeed(startDate: string, endDate: string) {
    const cacheKey = `feed-${startDate}-${endDate}`;
    
    // 1. Memory Cache
    const cachedData = memoryCache.get<any[]>(cacheKey);
    if (cachedData) {
      logger.debug(`Cache hit for feed ${cacheKey}`);
      return cachedData;
    }

    // 2. Fetch from NASA
    const neos = await nasaService.fetchFeed(startDate, endDate);
    
    // 3. Set Memory Cache
    memoryCache.set(cacheKey, neos);
    
    return neos;
  }

  public async getAsteroidById(id: string) {
    // 1. Fetch from NASA
    const apiAsteroid = await nasaService.fetchAsteroidById(id);
    if (!apiAsteroid) throw new NotFoundError(`Asteroid with ID ${id} not found`);
    
    return apiAsteroid;
  }

  public async searchAsteroids(query: { q?: string; hazardous?: boolean; min_diameter?: number }) {
    // In stateless mode, we can only search locally if we had a full feed, 
    // but without a DB we return empty or just a mock response for now to prevent errors.
    return [];
  }

  public async getStats() {
    // Return placeholder stats in stateless mode
    return {
        totalCount: 32400, // Mock total
        hazardousCount: 2300,
        approachingNext7Days: 15,
        stats: []
    };
  }

  public async getApproaching(days: number = 7) {
    // In stateless mode, cannot query future without fetching massive NASA feeds.
    // Return empty for now.
    return [];
  }
}
