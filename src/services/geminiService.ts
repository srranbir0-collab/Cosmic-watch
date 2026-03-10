
import { NEO, RiskAnalysis } from '../types';

export const analyzeRisk = async (neo: NEO): Promise<RiskAnalysis> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ neo })
    });

    if (!response.ok) {
        throw new Error("Backend analysis failed");
    }

    const data = await response.json();
    return data as RiskAnalysis;
    
  } catch (error) {
    console.error("Analysis Failed:", error);
    return {
      impactProbability: "Unknown",
      kineticEnergy: "Calculating...",
      potentialDamage: "Data unavailable",
      summary: "AI analysis service is currently unreachable.",
      dangerLevel: "LOW"
    };
  }
};
