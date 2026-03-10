
import axios from 'axios';
import axiosRetry from 'axios-retry';
import Bottleneck from 'bottleneck';
import logger from '../utils/logger';
import { ExternalAPIError } from '../utils/AppError';

// Rate Limiting: Max 1000 requests per hour (approx 16/min to be safe)
const limiter = new Bottleneck({
  minTime: 200, // Minimum 200ms between requests
  maxConcurrent: 5,
});

const apiClient = axios.create({
  baseURL: 'https://api.nasa.gov/neo/rest/v1',
  timeout: 10000,
});

// Exponential Backoff Retry Logic
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  },
});

export class NasaService {
  private apiKey: string;

  constructor() {
    // Use provided key as fallback instead of DEMO_KEY
    this.apiKey = process.env.NASA_API_KEY || 'HxSjrhkAkSvuAFKeWB5M7fg4mPPJ7li3MzamxLWf';
  }

  /**
   * Fetch NEO feed for a date range
   */
  public async fetchFeed(startDate: string, endDate: string) {
    try {
      logger.info(`Fetching NASA Feed from ${startDate} to ${endDate}`);
      
      const response = await limiter.schedule(() => 
        apiClient.get('/feed', {
          params: {
            start_date: startDate,
            end_date: endDate,
            api_key: this.apiKey,
          },
        })
      );

      return this.transformFeedResponse(response.data);
    } catch (error: any) {
      logger.error('NASA API Error:', error.message);
      throw new ExternalAPIError('Failed to fetch data from NASA NeoWs service');
    }
  }

  /**
   * Fetch details for a specific Asteroid ID
   */
  public async fetchAsteroidById(id: string) {
    try {
      const response = await limiter.schedule(() => 
        apiClient.get(`/neo/${id}`, {
          params: { api_key: this.apiKey },
        })
      );
      return this.transformAsteroid(response.data);
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        logger.error(`NASA API Error for ID ${id}:`, error.message);
        throw new ExternalAPIError('Failed to fetch asteroid details');
    }
  }

  /**
   * Normalize NASA's nested structure into our flattened DB schema
   */
  private transformFeedResponse(data: any) {
    const neos: any[] = [];
    if (data.near_earth_objects) {
      Object.values(data.near_earth_objects).forEach((dateGroup: any) => {
        if (Array.isArray(dateGroup)) {
          dateGroup.forEach((neo: any) => {
            neos.push(this.transformAsteroid(neo));
          });
        }
      });
    }
    return neos;
  }

  private transformAsteroid(neo: any) {
    const closeApproach = neo.close_approach_data?.[0];
    return {
      id: neo.id,
      name: neo.name,
      nasaJplUrl: neo.nasa_jpl_url,
      absoluteMagnitudeH: neo.absolute_magnitude_h,
      estimatedDiameterMin: neo.estimated_diameter?.meters?.estimated_diameter_min || 0,
      estimatedDiameterMax: neo.estimated_diameter?.meters?.estimated_diameter_max || 0,
      isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
      closeApproachDate: closeApproach ? new Date(closeApproach.close_approach_date) : new Date(),
      relativeVelocityKph: closeApproach ? parseFloat(closeApproach.relative_velocity.kilometers_per_hour) : 0,
      missDistanceKm: closeApproach ? parseFloat(closeApproach.miss_distance.kilometers) : 0,
      orbitingBody: closeApproach?.orbiting_body || 'Unknown',
    };
  }
}
