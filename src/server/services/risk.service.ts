
import { calculateRiskScore } from '../utils/riskEngine';
import { AsteroidService } from './asteroid.service';
import { NotFoundError } from '../utils/AppError';

const asteroidService = new AsteroidService();

export class RiskService {
  
  public async getRiskAnalysis(asteroidId: string) {
    // 1. Fetch Asteroid Data
    const asteroid = await asteroidService.getAsteroidById(asteroidId);
    if (!asteroid) {
      throw new NotFoundError(`Asteroid ${asteroidId} not found`);
    }

    // 2. Calculate Risk (On-the-fly)
    const calculation = calculateRiskScore(asteroid as any);
    
    const analysisData = {
        asteroidId: asteroid.id,
        impactProb: 0,
        kineticEnergy: 0,
        potentialDamage: calculation.explanation,
        summary: calculation.explanation,
        riskScore: calculation.score,
        riskCategory: this.mapCategoryToEnum(calculation.category),
        createdAt: new Date()
    };

    return analysisData;
  }

  private mapCategoryToEnum(category: string): string {
    switch (category) {
      case 'MINIMAL': return 'LOW';
      case 'LOW': return 'LOW';
      case 'MODERATE': return 'MODERATE';
      case 'ELEVATED': return 'HIGH';
      case 'CRITICAL': return 'EXTREME';
      default: return 'LOW';
    }
  }
}
