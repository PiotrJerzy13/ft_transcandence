// frontend/src/context/AuthContext.tsx
import { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[Auth] Checking authentication...');
      const response = await fetch('/api/user/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('[Auth] Authentication check passed:', userData);
        return true;
      } else {
        setUser(null);
        console.log('[Auth] Authentication check failed');
        return false;
      }
    } catch (error) {
      console.error('[Auth] Authentication check error:', error);
      setUser(null);
      return false;
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('[Auth] Attempting login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Auth] Login successful:', data);
        
        // Wait a bit for cookie to settle, then verify authentication
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify authentication is working
        const authVerified = await checkAuth();
        if (authVerified) {
          console.log('[Auth] Login and auth verification complete');
          return true;
        } else {
          console.warn('[Auth] Login succeeded but auth verification failed, retrying...');
          // Retry verification after a delay
          await new Promise(resolve => setTimeout(resolve, 200));
          return await checkAuth();
        }
      } else {
        console.log('[Auth] Login failed');
        return false;
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return false;
    }
  }, [checkAuth]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      console.log('[Auth] Logout successful');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    
    initializeAuth();
  }, [checkAuth]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  }), [user, isLoading, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;