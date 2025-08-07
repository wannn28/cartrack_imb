import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkStoredTokens: () => { access_token: string | null; refresh_token: string | null };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      console.log('🔄 Initializing auth, token found:', !!token);
      
      if (token) {
        try {
          const response = await authAPI.getProfile();
          console.log('📡 Profile response:', response);
          
          if (response && response.meta && response.meta.code === 200 && response.data) {
            setUser(response.data);
            console.log('✅ User authenticated:', response.data.name);
          } else {
            throw new Error('Profile fetch failed');
          }
        } catch (error) {
          console.log('❌ Profile fetch failed, trying refresh token...');
          
          // Try to refresh token
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const refreshResponse = await authAPI.refreshToken(refreshToken);
              console.log('🔄 Refresh response:', refreshResponse);
              
              if (refreshResponse && refreshResponse.meta && refreshResponse.meta.code === 200 && refreshResponse.data) {
                const { access_token, refresh_token, user } = refreshResponse.data;
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);
                setUser(user);
                console.log('✅ Token refreshed, user authenticated:', user.name);
              } else {
                throw new Error('Token refresh failed');
              }
            } else {
              throw new Error('No refresh token available');
            }
          } catch (refreshError) {
            console.log('❌ Token refresh failed, clearing tokens');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        }
      } else {
        console.log('❌ No access token found');
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Handle backend response structure: { meta: {...}, data: {...} }
      if (response && response.meta && response.meta.code === 200 && response.data) {
        const { access_token, refresh_token, user } = response.data;
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        // Debug logging to verify token storage
        console.log('✅ Access token stored in localStorage:', access_token.substring(0, 20) + '...');
        console.log('✅ Refresh token stored in localStorage:', refresh_token.substring(0, 20) + '...');
        
        setUser(user);
      } else {
        throw new Error(response?.meta?.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.meta?.message || error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authAPI.register(data);
      if (!response.meta || response.meta.code !== 200) {
        throw new Error(response.meta?.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.meta?.message || error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const checkStoredTokens = () => {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    return { access_token, refresh_token };
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    checkStoredTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};