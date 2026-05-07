import axios from 'axios'
import { sessionStore } from '@/state/sessionStore'

// Base API URL for the .NET backend
// Configure via VITE_API_BASE_URL environment variable or defaults to http://localhost:5128/api
export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5128/api'

export const api = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 second timeout to prevent hanging requests
})

// Recruitment/CBT uses the same secure backend API by design.
export const recruitmentApi = api

const requestInterceptor = (config: any) => {
  const token = sessionStore.getToken()
  if (import.meta.env.DEV) {
    console.log('🔄 [API Interceptor] Making request', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      baseURL: config.baseURL
    })
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    if (import.meta.env.DEV) {
      console.log('🔑 [API Interceptor] Added Authorization header:', `Bearer ${token.substring(0, 20)}...`)
    }
  } else if (import.meta.env.DEV) {
    console.info('ℹ️ [API Interceptor] Skipping Authorization header; no auth token for request:', config.url)
  }
  return config
}
const requestErrorInterceptor = (error: any) => {
  console.error('❌ [API Interceptor] Request error:', error)
  return Promise.reject(error)
}

// Add request interceptor to include auth token
api.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
// recruitmentApi is an alias of api (single backend), so no extra interceptor needed.

const responseSuccessInterceptor = (response: any) => {
  if (import.meta.env.DEV) {
    console.log('✅ [API Interceptor] Response received', {
      url: response.config.url,
      status: response.status
    })
  }
  return response
}

// Add response interceptor for error handling
api.interceptors.response.use(
  responseSuccessInterceptor,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isRecruitment = url.includes('/recruitment/');

    // For expected errors (404, etc.), log less verbosely
    const isExpectedError = status === 404 || status === 403;
    // Recruitment admin get-by-id often returns 500 when backend is unavailable; avoid noisy logs
    const isRecruitmentServerError = isRecruitment && status === 500;

    const shouldLogVerbose = import.meta.env.DEV && !isRecruitmentServerError;
    const shouldLogWarningOnly = !shouldLogVerbose && (isExpectedError || isRecruitmentServerError);

    if (shouldLogWarningOnly) {
      console.warn(`⚠️ [API Interceptor] ${status} ${error.config?.method?.toUpperCase()} ${url}`);
    } else if (shouldLogVerbose) {
      const errorDetails = {
        url,
        method: error.config?.method,
        status,
        statusText: error.response?.statusText,
        message: error.message,
        responseData: error.response?.data,
        requestData: error.config?.data,
        headers: error.config?.headers,
        authHeader: error.config?.headers?.Authorization ? 'Present' : 'Missing',
      }
      console.error('❌ [API Interceptor] Response error:', errorDetails)
      if (error.response?.data) {
        console.error('❌ [API Interceptor] Error response data:', JSON.stringify(error.response.data, null, 2))
      }
    }
    
    if (error.response?.status === 401) {
      // Don't redirect for settings endpoint - it's allowed to be anonymous
      // Don't redirect if already on login page
      const isSettingsEndpoint = url.includes('/PageAccess/settings') || url.includes('/pageaccess/settings')
      const isLoginPage = window.location.pathname.includes('/login')

      // Only auto-logout for auth endpoints (e.g. /Auth/me, /Auth/refresh)
      const isAuthEndpoint = url.toLowerCase().includes('/auth/')
      
      if (import.meta.env.DEV) {
        console.warn('⚠️ [API Interceptor] Unauthorized access detected', {
          url,
          isSettingsEndpoint,
          isLoginPage,
          isAuthEndpoint
        })
      }
      
      // Only redirect to login if:
      // 1. Auth-related endpoint (token really invalid)
      // 2. Not the settings endpoint (which allows anonymous access)
      // 3. Not already on the login page
      // 4. Has an auth token (meaning user was authenticated but token expired)
      const hasToken = sessionStore.getToken()
      if (isAuthEndpoint && !isSettingsEndpoint && !isLoginPage && hasToken) {
        console.warn('⚠️ [API Interceptor] Redirecting to login due to expired/invalid token on auth endpoint')
        sessionStore.clearAll()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Employee endpoints
export const EMPLOYEE_ENDPOINTS = {
  LIST: '/employee',
  DETAIL: (id: string) => `/employee/${id}`,
  CREATE: '/employee',
  UPDATE: (id: string) => `/employee/${id}`,
  DELETE: (id: string) => `/employee/${id}`,
  REGISTER: '/employee',
  STATISTICS: '/employee/statistics',
  ACTIVE: '/employee/active',
} as const

// Customer endpoints
export const CUSTOMER_ENDPOINTS = {
  LIST: '/customer',
  DETAIL: (id: string) => `/customer/${id}`,
  CREATE: '/customer',
  UPDATE: (id: string) => `/customer/${id}`,
  DELETE: (id: string) => `/customer/${id}`,
  STATISTICS: '/customer/statistics',
  PAGE_ASSIGNMENTS: (id: string) => `/customer/${id}/page-assignments`,
} as const

// Region endpoints
export const REGION_ENDPOINTS = {
  LIST: '/region',
  DETAIL: (id: string) => `/region/${id}`,
  CREATE: '/region',
  UPDATE: (id: string) => `/region/${id}`,
  DELETE: (id: string) => `/region/${id}`,
  BY_CUSTOMER: (customerId: string) => `/region/customer/${customerId}`,
} as const

// Site endpoints
export const SITE_ENDPOINTS = {
  LIST: '/site',
  DETAIL: (id: string) => `/site/${id}`,
  CREATE: '/site',
  UPDATE: (id: string) => `/site/${id}`,
  DELETE: (id: string) => `/site/${id}`,
  BY_CUSTOMER: (customerId: string) => `/site/customer/${customerId}`,
  BY_REGION: (regionId: string) => `/site/region/${regionId}`,
} as const

// User endpoints
export const USER_ENDPOINTS = {
  LIST: '/user',
  DETAIL: (id: string) => `/user/${id}`,
  CREATE: '/user',
  UPDATE: (id: string) => `/user/${id}`,
  DELETE: (id: string) => `/user/${id}`,
  ASSIGN_CUSTOMERS: (id: string) => `/user/${id}/assign-customers`,
} as const

// Site Visit endpoints
export const SITE_VISIT_ENDPOINTS = {
  LIST: '/site-visits',
  DETAIL: (id: string) => `/site-visits/${id}`,
  CREATE: '/site-visits',
  UPDATE: (id: string) => `/site-visits/${id}`,
  DELETE: (id: string) => `/site-visits/${id}`,
} as const

// Stock endpoints
export const STOCK_ENDPOINTS = {
  LIST: '/Stock',
  DETAIL: (id: string) => `/Stock/${id}`,
  CREATE: '/Stock',
  UPDATE: (id: string) => `/Stock/${id}`,
  DELETE: (id: string) => `/Stock/${id}`,
  ISSUE: (id: string) => `/Stock/${id}/issue`,
  ADD: (id: string) => `/Stock/${id}/add`,
  LOW_STOCK: '/Stock/low-stock',
  CHECK_LOW_STOCK: '/Stock/check-low-stock',
  TEST_EMAIL: '/Stock/test-email',
} as const

// Action Calendar endpoints
export const ACTION_CALENDAR_ENDPOINTS = {
  LIST: '/ActionCalendar',
  DETAIL: (id: string) => `/ActionCalendar/${id}`,
  CREATE: '/ActionCalendar',
  UPDATE: (id: string) => `/ActionCalendar/${id}`,
  DELETE: (id: string) => `/ActionCalendar/${id}`,
  STATISTICS: '/ActionCalendar/statistics',
} as const

// Mystery Shopper endpoints
export const MYSTERY_SHOPPER_ENDPOINTS = {
  OFFICERS: '/mystery-shopper/officers',
  CUSTOMERS: '/mystery-shopper/customers',
  LOCATIONS: '/mystery-shopper/locations',
  EVALUATION_CRITERIA: '/mystery-shopper/evaluation-criteria',
  EVALUATIONS: '/mystery-shopper/evaluations'
} as const

// Contract Renewal endpoints
export const CONTRACT_RENEWAL_ENDPOINTS = {
  LIST: '/contract-renewal',
  DETAIL: (id: number) => `/contract-renewal/${id}`,
  CREATE: '/contract-renewal',
  UPDATE: (id: number) => `/contract-renewal/${id}`,
  DELETE: (id: number) => `/contract-renewal/${id}`,
} as const

// Asset Register endpoints
export const ASSET_REGISTER_ENDPOINTS = {
  LIST: '/asset-register',
  DETAIL: (id: number) => `/asset-register/${id}`,
  CREATE: '/asset-register',
  UPDATE: (id: number) => `/asset-register/${id}`,
  DELETE: (id: number) => `/asset-register/${id}`,
  CHECK_TAG: '/asset-register/check-tag',
} as const

// API Headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
} as const

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: string[]
}

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.errors) {
    return error.response.data.errors.join(', ')
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
} 