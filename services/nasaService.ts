
import { format } from 'date-fns';
import { NeoFeedResponse, NEO } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export const fetchNeoFeed = async (): Promise<NEO[]> => {
  const today = new Date();
  const startDate = format(today, 'yyyy-MM-dd');
  const endDate = format(today, 'yyyy-MM-dd');

  try {
    const token = useAuthStore.getState().token;
    // Call our own backend proxy instead of NASA directly
    // Using canonical endpoint /api/asteroids/feed
    const response = await fetch(
      `/api/asteroids/feed?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
       // If backend is 404 (File not found) or 500, we fallback to mock data transparently
       console.warn(`Backend fetch failed (${response.status} ${response.statusText}). Switching to autonomous mode.`);
       return generateMockNEOs();
    }

    const data = await response.json();
    
    // Support standard API response wrapper { status: 'success', data: [...] }
    if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
    }

    // Support direct NeoWs format if proxied directly
    if ((data as NeoFeedResponse).near_earth_objects) {
        const allNeos: NEO[] = Object.values((data as NeoFeedResponse).near_earth_objects).flat();
        return allNeos;
    } 

    return [];

  } catch (error) {
    console.error("Failed to fetch NEOs:", error);
    return generateMockNEOs();
  }
};

const generateMockNEOs = (): NEO[] => {
  return [
    {
      id: "2465633",
      neo_reference_id: "2465633",
      name: "465633 (2009 JR5)",
      nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2465633",
      absolute_magnitude_h: 20.48,
      estimated_diameter: {
        kilometers: { estimated_diameter_min: 0.212, estimated_diameter_max: 0.474 },
        meters: { estimated_diameter_min: 212, estimated_diameter_max: 474 }
      },
      is_potentially_hazardous_asteroid: true,
      close_approach_data: [{
        close_approach_date: format(new Date(), 'yyyy-MM-dd'),
        close_approach_date_full: format(new Date(), 'yyyy-MM-dd HH:mm'),
        epoch_date_close_approach: Date.now(),
        relative_velocity: {
          kilometers_per_second: "18.12",
          kilometers_per_hour: "65232",
          miles_per_hour: "40533"
        },
        miss_distance: {
          astronomical: "0.2",
          lunar: "78",
          kilometers: "30000000",
          miles: "18600000"
        },
        orbiting_body: "Earth"
      }],
      is_sentry_object: false
    }
  ];
};
