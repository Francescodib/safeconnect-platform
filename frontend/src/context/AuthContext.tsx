import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@services/authService';
import apiService from '@services/api';
import type { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      // Fetch CSRF token on app initialization
      await apiService.fetchCsrfToken();

      const token = authService.getStoredToken();
      if (token) {
        // Restore in-memory token before making authenticated requests.
        // The axios instance loses its in-memory state on page reload,
        // so we must re-hydrate it from localStorage.
        apiService.setAccessToken(token);
        try {
          const response = await authService.getCurrentUser();
          if (response.success && 'data' in response) {
            setUser(response.data);
          } else {
            authService.clearTokens();
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          authService.clearTokens();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.login(credentials);
      if (response.success && 'data' in response) {
        setUser(response.data.user);
        navigate('/dashboard');
        return { success: true };
      } else {
        return {
          success: false,
          error: 'error' in response ? response.error.message : 'Login failed',
        };
      }
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.register(data);
      if (response.success && 'data' in response) {
        setUser(response.data.user);
        navigate('/dashboard');
        return { success: true };
      } else {
        return {
          success: false,
          error: 'error' in response ? response.error.message : 'Registration failed',
        };
      }
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
