import { Request, Response, NextFunction } from 'express';
import { RiskService } from '../services/risk.service';

const riskService = new RiskService();

export const getRiskAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { asteroidId } = (req as any).params;
    if (!asteroidId) {
       (res as any).status(400).json({ status: 'error', message: 'Asteroid ID is required' });
       return;
    }

    const analysis = await riskService.getRiskAnalysis(asteroidId);
    
    (res as any).json({
      status: 'success',
      data: {
        score: analysis.riskScore,
        category: analysis.riskCategory,
        // details: analysis.calculationDetails, // Removed as per schema
        explanation: analysis.summary,
        timestamp: analysis.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};