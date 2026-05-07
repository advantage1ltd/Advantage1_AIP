import { Incident } from '@/types/incidents'
import { GetIncidentsParams, IncidentResponse, IncidentsResponse, UpsertIncidentRequest } from '@/types/api'
import { getCurrentCustomerId } from '@/lib/utils'
import { BASE_API_URL } from '@/config/api'

const API_URL = BASE_API_URL

// Helper function to get headers with customer ID and auth token
const getHeaders = (additionalHeaders?: Record<string, string>): HeadersInit => {
  const customerId = getCurrentCustomerId()
  const token = localStorage.getItem('authToken')
  
  const baseHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...additionalHeaders,
  }
  
  // Add authentication token
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`
  }
  
  // Add customer ID header if available
  if (customerId) {
    baseHeaders['X-Customer-Id'] = customerId.toString()
  }
  
  return baseHeaders
}

export const incidentsApi = {
  // Get paginated incidents
  getIncidents: async (params?: GetIncidentsParams): Promise<IncidentsResponse> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString())
      })
    }
    
    const response = await fetch(`${API_URL}/incidents?${searchParams.toString()}`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Failed to fetch incidents'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  },

  // Get single incident
  getIncident: async (id: string): Promise<IncidentResponse> => {
    const response = await fetch(`${API_URL}/incidents/${id}`, {
      headers: getHeaders()
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Incident with ID ${id} not found`)
      }
      const errorText = await response.text()
      let errorMessage = 'Failed to fetch incident'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  },

  // Create new incident
  createIncident: async (incident: Omit<Incident, 'id' | 'dateInputted'>): Promise<IncidentResponse> => {
    const response = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ incident } as UpsertIncidentRequest),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Failed to create incident'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  },

  // Update incident
  updateIncident: async (id: string, incident: Omit<Incident, 'id' | 'dateInputted'>): Promise<IncidentResponse> => {
    const response = await fetch(`${API_URL}/incidents/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ incident } as UpsertIncidentRequest),
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Incident with ID ${id} not found`)
      }
      const errorText = await response.text()
      let errorMessage = 'Failed to update incident'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
        console.error('Backend error response:', errorData)
      } catch {
        errorMessage = errorText || errorMessage
        console.error('Backend error text:', errorText)
      }
      console.error('Update incident failed:', { status: response.status, statusText: response.statusText, errorMessage })
      throw new Error(errorMessage)
    }
    
    return response.json()
  },

  // Delete incident
  deleteIncident: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/incidents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Incident with ID ${id} not found`)
      }
      const errorText = await response.text()
      let errorMessage = 'Failed to delete incident'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }
  },
} 