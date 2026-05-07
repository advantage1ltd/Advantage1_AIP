import { BASE_API_URL } from '@/config/api'

export interface LookupTableItem {
  lookupId: number
  category: string
  value: string
  description: string
  code: string
  sortOrder: number
  isActive: boolean
}

export interface LookupTableResponse {
  success: boolean
  message: string
  data: LookupTableItem[]
}

const BASE_URL = `${BASE_API_URL}/LookupTable`

// Cache for lookup table data
const cache = new Map<string, { data: LookupTableItem[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('authToken')

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION
}

export const lookupTableService = {
  // Get all lookup tables
  getAll: async (): Promise<LookupTableItem[]> => {
    try {
      const token = getAuthToken()
      
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result: LookupTableResponse = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching lookup tables:', error)
      throw error
    }
  },

  // Get lookup tables by category with caching
  getByCategory: async (category: string): Promise<LookupTableItem[]> => {
    // Check cache first
    const cached = cache.get(category)
    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`Using cached data for category: ${category}`)
      return cached.data
    }

    try {
      const token = getAuthToken()
      
      const response = await fetch(`${BASE_URL}/category/${encodeURIComponent(category)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result: LookupTableResponse = await response.json()
      
      // Cache the result
      cache.set(category, { data: result.data, timestamp: Date.now() })
      
      return result.data
    } catch (error) {
      console.error(`Error fetching lookup tables for category ${category}:`, error)
      throw error
    }
  },

  // Batch load multiple categories in parallel
  getByCategories: async (categories: string[]): Promise<Record<string, LookupTableItem[]>> => {
    const results: Record<string, LookupTableItem[]> = {}
    const uncachedCategories: string[] = []

    // Check cache for each category
    for (const category of categories) {
      const cached = cache.get(category)
      if (cached && isCacheValid(cached.timestamp)) {
        results[category] = cached.data
        console.log(`Using cached data for category: ${category}`)
      } else {
        uncachedCategories.push(category)
      }
    }

    // Load uncached categories in parallel
    if (uncachedCategories.length > 0) {
      console.log(`Loading uncached categories in parallel: ${uncachedCategories.join(', ')}`)
      
      const promises = uncachedCategories.map(async (category) => {
        try {
          const data = await lookupTableService.getByCategory(category)
          return { category, data }
        } catch (error) {
          console.error(`Failed to load category ${category}:`, error)
          return { category, data: [] }
        }
      })

      const batchResults = await Promise.all(promises)
      
      // Merge results
      for (const { category, data } of batchResults) {
        results[category] = data
      }
    }

    return results
  },

  // Get all categories
  getCategories: async (): Promise<string[]> => {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`${BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  // Get trainers specifically
  getTrainers: async (): Promise<LookupTableItem[]> => {
    return lookupTableService.getByCategory('Trainers')
  },

  // Clear cache
  clearCache: () => {
    cache.clear()
    console.log('Lookup table cache cleared')
  },

  // Clear specific category from cache
  clearCategoryCache: (category: string) => {
    cache.delete(category)
    console.log(`Cache cleared for category: ${category}`)
  }
}
