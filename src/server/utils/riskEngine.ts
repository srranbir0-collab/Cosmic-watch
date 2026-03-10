export interface Asteroid {
  id: string;
  name: string;
  nasaJplUrl: string;
  absoluteMagnitudeH: number;
  estimatedDiameterMin: number;
  estimatedDiameterMax: number;
  isPotentiallyHazardous: boolean;
  closeApproachDate: Date;
  relativeVelocityKph: number;
  missDistanceKm: number;
  orbitingBody: string;
  lastUpdated: Date;
}

export interface RiskFactors {
  missDistanceScore: number;
  velocityScore: number;
  diameterScore: number;
  hazardousScore: number;
  lunarProximityBoost: boolean;
}

export interface CalculatedRisk {
  score: number;
  category: 'MINIMAL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  factors: RiskFactors;
  explanation: string;
}

/**
 * Scientific Constants
 */
const LUNAR_DISTANCE_KM = 384400;
const MAX_SCORE = 100;

/**
 * Pure function to calculate risk based on orbital mechanics and physical properties.
 */
export const calculateRiskScore = (asteroid: Asteroid): CalculatedRisk => {
  const {
    missDistanceKm,
    relativeVelocityKph,
    estimatedDiameterMax,
    isPotentiallyHazardous,
  } = asteroid;

  // 1. Miss Distance Factor (35% Weight)
  // Formula: Higher score for closer objects. 
  // Base scaling: 1 Million KM is the baseline for "0" score in this specific factor if linear, 
  // but we use a curve to emphasize very close objects.
  // Prompt Formula: Math.max(0, 100 - (missDistanceKm / 1000000) * 100)
  let missDistanceScore = Math.max(0, 100 - (missDistanceKm / 1000000) * 100);
  
  // Lunar Proximity Boost: If within 1 LD, ensure this factor is maximized
  const isWithinLunarDistance = missDistanceKm <= LUNAR_DISTANCE_KM;
  if (isWithinLunarDistance) {
    missDistanceScore = Math.min(100, missDistanceScore * 1.2); // 20% boost for lunar proximity
  }

  // 2. Velocity Factor (25% Weight)
  // Convert KPH to KM/S
  const velocityKmS = relativeVelocityKph / 3600;
  // Formula: Faster objects = higher energy = higher risk
  const velocityScore = Math.min(100, (velocityKmS / 50) * 100);

  // 3. Diameter Factor (25% Weight)
  // Larger objects = global consequences
  // 140m is considered a "City Killer" threshold by NASA
  let diameterScore = Math.min(100, (estimatedDiameterMax / 1000) * 100);
  if (estimatedDiameterMax >= 140) {
     diameterScore = Math.min(100, diameterScore * 1.1); // 10% boost for city killers
  }

  // 4. Hazardous Classification (15% Weight)
  const hazardousScore = isPotentiallyHazardous ? 100 : 0;

  // Calculate Weighted Sum
  const weightedScore = 
    (missDistanceScore * 0.35) +
    (velocityScore * 0.25) +
    (diameterScore * 0.25) +
    (hazardousScore * 0.15);

  const finalScore = Math.min(MAX_SCORE, Math.max(0, weightedScore));

  // Determine Category
  let category: CalculatedRisk['category'];
  if (finalScore <= 15) category = 'MINIMAL';
  else if (finalScore <= 35) category = 'LOW';
  else if (finalScore <= 55) category = 'MODERATE';
  else if (finalScore <= 75) category = 'ELEVATED';
  else category = 'CRITICAL';

  // Generate Explanation
  const factors: RiskFactors = {
    missDistanceScore: Number(missDistanceScore.toFixed(2)),
    velocityScore: Number(velocityScore.toFixed(2)),
    diameterScore: Number(diameterScore.toFixed(2)),
    hazardousScore,
    lunarProximityBoost: isWithinLunarDistance
  };

  const explanation = generateExplanation(category, factors, asteroid);

  return {
    score: Number(finalScore.toFixed(2)),
    category,
    factors,
    explanation
  };
};

function generateExplanation(category: string, factors: RiskFactors, asteroid: Asteroid): string {
  const parts = [];
  
  if (factors.lunarProximityBoost) {
    parts.push(`CRITICAL PROXIMITY: Object passes within ${LUNAR_DISTANCE_KM.toLocaleString()} km (1 LD).`);
  } else {
    parts.push(`Passes at ${(asteroid.missDistanceKm / LUNAR_DISTANCE_KM).toFixed(1)} Lunar Distances.`);
  }

  if (asteroid.estimatedDiameterMax > 140) {
    parts.push(`Significant size (${Math.round(asteroid.estimatedDiameterMax)}m) poses regional destruction threat.`);
  }

  if (factors.velocityScore > 80) {
    parts.push(`High relative velocity increases potential impact energy.`);
  }

  return `Risk Level: ${category}. ${parts.join(' ')}`;
}