import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { User } from '@/types/user';
import { api } from '@/config/api';
import { sessionStore } from '@/state/sessionStore';
import { ApiResponse } from '@/types/api';
import type { BackendApiResponse } from '@/types/backend-api';
import { getApiData, getApiErrors, getApiMessage, getApiSuccess } from '@/types/backend-api';

type LoginResponsePayload = {
	AccessToken: string;
	RefreshToken?: string;
	ExpiresAt?: string;
	User: User;
	Success?: boolean;
	Message?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize user from localStorage immediately to prevent login on refresh
  const [user, setUser] = useState<User | null>(() => sessionStore.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const token = sessionStore.getToken();
    if (!token) {
      setUser(null);
      sessionStore.setUser(null);
      setIsLoading(false);
      return;
    }

    // Restore user from localStorage first for immediate UI rendering
    const cachedUser = sessionStore.getUser();
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
    }

    try {
      setIsLoading(true);
      const response = await api.get<BackendApiResponse<User>>('/Auth/me');
      const apiResponse = response.data;
      const currentUser = getApiData(apiResponse);
      if (getApiSuccess(apiResponse) && currentUser) {
        setUser(currentUser);
        sessionStore.setUser(currentUser);
        setError(null);
      } else {
        throw new Error(getApiMessage(apiResponse) || 'Failed to fetch user data');
      }
    } catch (err: unknown) {
      // Only clear token if it's a 401 (unauthorized) - token is invalid
      // For other errors (network, 500, etc.), keep the cached user
      const isUnauthorized = isAxiosError(err) && err.response?.status === 401;
      
      if (isUnauthorized) {
        console.error('Failed to fetch current user - unauthorized:', err);
        sessionStore.clearToken();
        setUser(null);
        sessionStore.setUser(null);
      } else {
        // For other errors, keep the cached user and just log the error
        console.warn('Failed to fetch current user (keeping cached user):', err);
        // Keep the cached user, don't clear it
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleUserAssignmentsUpdate = (event: CustomEvent<User>) => {
      const updatedUser = event.detail;
      if (updatedUser && updatedUser.id === user?.id) {
        console.log('🔄 [AuthContext] Updating user assignments from event');
        setUser(updatedUser);
        sessionStore.setUser(updatedUser);
      }
    };

    window.addEventListener('user-assignments-updated', handleUserAssignmentsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('user-assignments-updated', handleUserAssignmentsUpdate as EventListener);
    };
  }, [user]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (username: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      try {
        response = await api.post<BackendApiResponse<LoginResponsePayload>>('/Auth/login', {
          email: username,
          password
        });
      } catch (axiosError: unknown) {
        if (isAxiosError(axiosError)) {
          const errorData = axiosError.response?.data as BackendApiResponse<unknown> | undefined;
          const errorMessage = getApiMessage(errorData) || 'Invalid email or password';
          setError(errorMessage);
          throw new Error(errorMessage);
        }
        throw axiosError;
      }

      // Log the raw response for debugging
      if (import.meta.env.DEV) {
        console.log('🔍 [AuthContext] Login response:', {
          status: response.status,
          data: response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasSuccess: 'Success' in (response.data || {}),
          hasData: 'Data' in (response.data || {})
        });
      }

      // Backend returns ApiResponseDto<LoginResponseDto> with capital Data property
      // Handle both capital and lowercase properties for compatibility
      const apiResponse = response.data;
      const isSuccess = apiResponse?.Success ?? apiResponse?.success ?? false;
      const responseData = apiResponse?.Data ?? apiResponse?.data;
      const message = apiResponse?.Message ?? apiResponse?.message ?? 'Invalid response from server';

      if (!isSuccess || !responseData) {
        console.error('❌ [AuthContext] Login failed:', {
          isSuccess,
          hasResponseData: !!responseData,
          message,
          fullResponse: apiResponse
        });
        throw new Error(message);
      }

      // Backend LoginResponseDto has AccessToken (capital A) and User (capital U)
      // Handle both capital and lowercase for compatibility
      const loginData = responseData;
      const accessToken = loginData?.AccessToken ?? loginData?.accessToken;
      const user = loginData?.User ?? loginData?.user;

      if (!accessToken || !user) {
        console.error('❌ [AuthContext] Missing token or user in response:', {
          hasAccessToken: !!accessToken,
          hasUser: !!user,
          loginDataKeys: loginData ? Object.keys(loginData) : [],
          loginData
        });
        throw new Error('Invalid response from server: missing token or user data');
      }

      sessionStore.setToken(accessToken);
      setUser(user);
      sessionStore.setUser(user);
      setError(null);
      
      if (import.meta.env.DEV) {
        console.log('✅ [AuthContext] Login successful:', {
          username: user.username,
          userId: user.id,
          role: user.role
        });
      }
      
      return user;
    } catch (err: unknown) {
      // If error is already an Error with a message, use it
      if (err instanceof Error && err.message && !err.message.includes('Invalid response from server')) {
        const errorMessage = err.message;
        setError(errorMessage);
        console.error('❌ [AuthContext] Login error:', err);
        throw err;
      }
      
      // Otherwise, try to extract error message from response
      const axiosError = isAxiosError(err) ? err : null;
      const errorData = axiosError?.response?.data as BackendApiResponse<unknown> | undefined;
      const errorMessage = getApiErrors(errorData)[0]
        ?? getApiMessage(errorData)
        ?? (err instanceof Error ? err.message : undefined)
        ?? 'An error occurred during login';
      
      setError(errorMessage);
      
      // Log detailed error information
      console.error('❌ [AuthContext] Login error:', {
        message: errorMessage,
        error: err,
        response: err?.response?.data,
        status: err?.response?.status,
        statusText: err?.response?.statusText
      });
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStore.clearAll();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 