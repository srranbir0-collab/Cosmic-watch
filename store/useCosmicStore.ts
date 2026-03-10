
import { create } from 'zustand';
import { NEO, RiskAnalysis, Alert, AlertStatus } from '../types';

interface CosmicState {
  neos: NEO[];
  loading: boolean;
  error: string | null;
  selectedNeo: NEO | null;
  riskAnalysis: RiskAnalysis | null;
  analyzing: boolean;
  
  // Sidebar State
  isSidebarCollapsed: boolean;

  // Filter & Sort State
  searchTerm: string;
  hazardousOnly: boolean;
  sortKey: 'date' | 'risk' | 'diameter' | 'velocity' | 'distance';
  sortOrder: 'asc' | 'desc';

  // Video Lab State
  videoUrl: string | null;
  generatingVideo: boolean;

  // Image Lab State
  editedImageUrl: string | null;
  isEditingImage: boolean;

  // Alert State
  alerts: Alert[];
  
  // Actions
  setNeos: (neos: NEO[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedNeo: (selectedNeo: NEO | null) => void;
  setRiskAnalysis: (riskAnalysis: RiskAnalysis | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  toggleSidebar: () => void;
  setVideoUrl: (videoUrl: string | null) => void;
  setGeneratingVideo: (generatingVideo: boolean) => void;
  
  setEditedImageUrl: (url: string | null) => void;
  setIsEditingImage: (isEditing: boolean) => void;

  setSearchTerm: (searchTerm: string) => void;
  setHazardousOnly: (hazardousOnly: boolean) => void;
  setSort: (sortKey: 'date' | 'risk' | 'diameter' | 'velocity' | 'distance', sortOrder: 'asc' | 'desc') => void;

  // Alert Actions
  markAlertRead: (id: string) => void;
  markAllRead: () => void;
  dismissAlert: (id: string) => void;
  clearDismissed: () => void;
  loadMoreAlerts: () => void;
}

// Mock Data Generator for Alerts
const generateMockAlerts = (count: number, offsetDays: number = 0): Alert[] => {
  const severities = ['CRITICAL', 'ELEVATED', 'MODERATE', 'LOW'] as const;
  const statuses = ['UNREAD', 'READ'] as const;
  
  return Array.from({ length: count }).map((_, i) => {
    const isToday = i < 2;
    const isYesterday = i >= 2 && i < 5;
    const date = new Date();
    
    if (isYesterday) date.setDate(date.getDate() - 1);
    else if (!isToday) date.setDate(date.getDate() - (Math.floor(Math.random() * 5) + 2));
    
    // Scramble time a bit
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    return {
      id: `alert-${Date.now()}-${i}-${offsetDays}`,
      asteroidId: `2024-X${i}`,
      asteroidName: `(2024 X${String.fromCharCode(65 + i)})`,
      severity,
      status: i === 0 ? 'UNREAD' : statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: date.getTime(),
      message: severity === 'CRITICAL' 
        ? "Trajectory deviation detected within Lunar Orbit proximity."
        : severity === 'ELEVATED' 
        ? "Kinetic energy potential exceeds localized threshold."
        : "Routine telemetry update received from sentry network.",
      metadata: {
        approachDate: "2024-12-15",
        missDistance: (Math.random() * 10 + 0.5).toFixed(1) + " LD",
        riskScore: Math.floor(Math.random() * 100)
      }
    };
  });
};

export const useCosmicStore = create<CosmicState>((set) => ({
  neos: [],
  loading: false,
  error: null,
  selectedNeo: null,
  riskAnalysis: null,
  analyzing: false,
  
  isSidebarCollapsed: false,

  searchTerm: '',
  hazardousOnly: false,
  sortKey: 'date',
  sortOrder: 'asc',

  videoUrl: null,
  generatingVideo: false,

  editedImageUrl: null,
  isEditingImage: false,

  alerts: generateMockAlerts(8),

  setNeos: (neos) => set({ neos }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedNeo: (selectedNeo) => set({ selectedNeo }),
  setRiskAnalysis: (riskAnalysis) => set({ riskAnalysis }),
  setAnalyzing: (analyzing) => set({ analyzing }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setGeneratingVideo: (generatingVideo) => set({ generatingVideo }),
  
  setEditedImageUrl: (url) => set({ editedImageUrl: url }),
  setIsEditingImage: (isEditing) => set({ isEditingImage: isEditing }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setHazardousOnly: (hazardousOnly) => set({ hazardousOnly }),
  setSort: (sortKey, sortOrder) => set({ sortKey, sortOrder }),

  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, status: 'READ' } : a)
  })),
  
  markAllRead: () => set((state) => ({
    alerts: state.alerts.map(a => ({ ...a, status: 'READ' }))
  })),

  dismissAlert: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, status: 'DISMISSED' } : a)
  })),

  clearDismissed: () => set((state) => ({
    alerts: state.alerts.filter(a => a.status !== 'DISMISSED')
  })),

  loadMoreAlerts: () => set((state) => ({
    alerts: [...state.alerts, ...generateMockAlerts(5, state.alerts.length)]
  }))
}));
