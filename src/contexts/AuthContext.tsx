/**
 * Authentication Context
 * Manages authentication state and provides auth-related functions
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthUser, AuthState } from '@/types';
import * as authService from '@/services/googleAuth';

interface AuthContextValue extends AuthState {
  logout: () => void;
  handleGoogleSuccess: (accessToken: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      // Check if user is already authenticated
      const user = authService.loadAuthData();

      if (user) {
        // Validate token
        const isValid = await authService.validateToken(user.accessToken);

        if (isValid) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return;
        } else {
          // Token invalid, clear data
          authService.clearAuthData();
        }
      }

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  }

  async function handleGoogleSuccess(accessToken: string): Promise<boolean> {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get user info
      const user = await authService.getUserInfo(accessToken);

      if (!user) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch user information',
        }));
        return false;
      }

      // Save auth data
      authService.saveAuthData(user);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Auth success handler error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Authentication failed',
      }));
      return false;
    }
  }

  function logout() {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  const value: AuthContextValue = {
    ...state,
    logout,
    handleGoogleSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
