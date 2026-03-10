
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Clerk hooks
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken, signOut } = useClerkAuth();

  // Login handler (for custom auth)
  const login = (userData: User, authToken: string) => {
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    if (isSignedIn) {
      signOut();
    }
  };

  // Sync Clerk State or Load from LocalStorage
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isLoaded) return;

      if (isSignedIn && clerkUser) {
        // Clerk is signed in
        try {
          const clerkToken = await getToken();
          if (clerkToken) {
            login({
              id: clerkUser.id,
              username: clerkUser.username || clerkUser.firstName || 'Sentinel',
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              role: (clerkUser.publicMetadata?.role as string) || 'USER'
            }, clerkToken);
          }
        } catch (err) {
          console.error("Failed to sync Clerk token", err);
          setIsLoading(false);
        }
      } else {
        // Clerk not signed in, check for custom token in localStorage (already set in initial state)
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
           setIsAuthenticated(true);
           if (!user) {
               // Restore minimal user or fetch profile (mock for demo)
               setUser({
                   id: 'restored-user',
                   username: 'Sentinel',
                   email: 'sentinel@cosmicwatch.dev',
                   role: 'USER'
               });
           }
        } else {
            setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
