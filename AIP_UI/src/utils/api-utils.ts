import { getAuthHeaders } from '@/services/auth';

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export async function safeFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: APIResponse<T> = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.message || data.error || 'An error occurred',
        response.status
      );
    }

    if (!data.success) {
      throw new APIError(data.message || 'Operation failed');
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new APIError(error.message);
    }

    throw new APIError('An unexpected error occurred');
  }
}

export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        break;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export const withErrorBoundary = async <T,>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.error('Operation failed:', error);
    return fallback;
  }
}; 