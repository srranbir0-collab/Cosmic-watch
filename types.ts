
export interface NEODiameter {
  estimated_diameter_min: number;
  estimated_diameter_max: number;
}

export interface NEOCloseApproachData {
  close_approach_date: string;
  close_approach_date_full: string;
  epoch_date_close_approach: number;
  relative_velocity: {
    kilometers_per_second: string;
    kilometers_per_hour: string;
    miles_per_hour: string;
  };
  miss_distance: {
    astronomical: string;
    lunar: string;
    kilometers: string;
    miles: string;
  };
  orbiting_body: string;
}

export interface NEO {
  id: string;
  neo_reference_id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: NEODiameter;
    meters: NEODiameter;
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: NEOCloseApproachData[];
  is_sentry_object: boolean;
}

export interface NeoFeedResponse {
  links: {
    next: string;
    prev: string;
    self: string;
  };
  element_count: number;
  near_earth_objects: Record<string, NEO[]>;
}

export interface RiskAnalysis {
  impactProbability: string;
  kineticEnergy: string;
  potentialDamage: string;
  summary: string;
  dangerLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ANALYZER = 'ANALYZER',
  VIDEO_LAB = 'VIDEO_LAB',
  IMAGE_LAB = 'IMAGE_LAB',
  ASTEROID_DETAIL = 'ASTEROID_DETAIL',
  ALERTS = 'ALERTS',
  ORBITAL_OBSERVATORY = 'ORBITAL_OBSERVATORY',
}

export type AlertSeverity = 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'LOW';
export type AlertStatus = 'UNREAD' | 'READ' | 'DISMISSED';

export interface Alert {
  id: string;
  asteroidId: string;
  asteroidName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: number;
  message: string;
  metadata: {
    approachDate: string;
    missDistance: string;
    riskScore: number;
  };
}
