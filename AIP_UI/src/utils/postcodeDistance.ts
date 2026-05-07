/**
 * UK Postcode Distance Calculator
 * Uses postcodes.io API to get coordinates and calculates distance using Haversine formula
 */

interface PostcodeResult {
  postcode: string
  latitude: number
  longitude: number
  admin_district: string
  parish: string
}

interface PostcodeApiResponse {
  status: number
  result: PostcodeResult | null
}

interface BulkPostcodeResult {
  query: string
  result: PostcodeResult | null
}

interface BulkPostcodeApiResponse {
  status: number
  result: BulkPostcodeResult[]
}

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959 // Earth's radius in miles

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Validate UK postcode format
 */
export const isValidUKPostcode = (postcode: string): boolean => {
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
  return postcodeRegex.test(postcode.trim())
}

/**
 * Clean and format postcode
 */
export const formatPostcode = (postcode: string): string => {
  return postcode.trim().toUpperCase().replace(/\s+/g, ' ')
}

/**
 * Fetch postcode coordinates from postcodes.io
 */
export const getPostcodeCoordinates = async (
  postcode: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const cleanPostcode = encodeURIComponent(formatPostcode(postcode))
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`)
    
    if (!response.ok) {
      return null
    }

    const data: PostcodeApiResponse = await response.json()
    
    if (data.status === 200 && data.result) {
      return {
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching postcode coordinates:', error)
    return null
  }
}

/**
 * Fetch multiple postcode coordinates in bulk
 */
export const getBulkPostcodeCoordinates = async (
  postcodes: string[]
): Promise<Map<string, { latitude: number; longitude: number }>> => {
  const results = new Map<string, { latitude: number; longitude: number }>()
  
  try {
    const cleanPostcodes = postcodes.map(p => formatPostcode(p))
    
    const response = await fetch('https://api.postcodes.io/postcodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postcodes: cleanPostcodes }),
    })

    if (!response.ok) {
      return results
    }

    const data: BulkPostcodeApiResponse = await response.json()

    if (data.status === 200 && data.result) {
      data.result.forEach((item) => {
        if (item.result) {
          results.set(formatPostcode(item.query), {
            latitude: item.result.latitude,
            longitude: item.result.longitude,
          })
        }
      })
    }
  } catch (error) {
    console.error('Error fetching bulk postcode coordinates:', error)
  }

  return results
}

/**
 * Calculate driving distance between two UK postcodes using OpenRouteService
 * This provides actual road distance (routing), not straight-line distance
 * Returns distance in miles, rounded to 1 decimal place
 */
const getDrivingDistanceFromOpenRouteService = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number | null> => {
  try {
    // OpenRouteService API - optional API key for higher limits
    // Without API key: 50 requests/day (IP-based)
    // With API key (free tier): 2000 requests/day
    const apiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY
    const headers: HeadersInit = {
      'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
    }
    
    // API key goes in Authorization header if provided
    if (apiKey) {
      headers['Authorization'] = apiKey
    }
    
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${startLon},${startLat}&end=${endLon},${endLat}`
    const response = await fetch(url, { headers })

    if (!response.ok) {
      // If API key is not available or request fails, fall back to Haversine
      console.warn('OpenRouteService API request failed, falling back to straight-line distance')
      return null
    }

    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      // Distance is in meters, convert to miles
      const distanceMeters = data.routes[0].summary.distance
      const distanceMiles = distanceMeters / 1609.34 // Convert meters to miles
      return distanceMiles
    }

    return null
  } catch (error) {
    console.warn('Error fetching driving distance from OpenRouteService:', error)
    return null
  }
}

/**
 * Calculate distance between two UK postcodes
 * First tries to get driving distance (road distance), falls back to straight-line if unavailable
 * Returns distance in miles, rounded to 1 decimal place
 */
export const calculatePostcodeDistance = async (
  startPostcode: string,
  endPostcode: string
): Promise<{ distance: number; error?: string } | null> => {
  // Validate postcodes
  if (!isValidUKPostcode(startPostcode)) {
    return { distance: 0, error: 'Invalid start postcode' }
  }
  
  if (!isValidUKPostcode(endPostcode)) {
    return { distance: 0, error: 'Invalid destination postcode' }
  }

  try {
    // Fetch both postcodes in bulk for efficiency
    const coordinates = await getBulkPostcodeCoordinates([startPostcode, endPostcode])
    
    const startCoords = coordinates.get(formatPostcode(startPostcode))
    const endCoords = coordinates.get(formatPostcode(endPostcode))

    if (!startCoords) {
      return { distance: 0, error: 'Start postcode not found' }
    }

    if (!endCoords) {
      return { distance: 0, error: 'Destination postcode not found' }
    }

    // Try to get driving distance first (actual road distance)
    let distance = await getDrivingDistanceFromOpenRouteService(
      startCoords.latitude,
      startCoords.longitude,
      endCoords.latitude,
      endCoords.longitude
    )

    // Fall back to straight-line distance with multiplier if routing API fails
    // The multiplier (1.303) was calculated from real example:
    // ST5 9FP to B98 9NB: Google Maps = 66.7 miles, Haversine = 51.2 miles
    // Ratio: 66.7 / 51.2 = 1.303
    // This accounts for roads not being straight paths
    if (distance === null) {
      const straightLineDistance = calculateHaversineDistance(
        startCoords.latitude,
        startCoords.longitude,
        endCoords.latitude,
        endCoords.longitude
      )
      // Apply multiplier to approximate driving distance from straight-line
      distance = straightLineDistance * 1.303
    }

    // Round to 1 decimal place
    return { distance: Math.round(distance * 10) / 10 }
  } catch (error) {
    console.error('Error calculating postcode distance:', error)
    return { distance: 0, error: 'Failed to calculate distance' }
  }
}

/**
 * Calculate expense based on mileage
 * Rules:
 * - First 25 miles per day = FREE
 * - After 25 miles = £0.25 per mile
 */
export const calculateMileageExpense = (
  totalDailyMiles: number,
  freeMileageAllowance: number = 25,
  ratePerMile: number = 0.25
): number => {
  const billableMiles = Math.max(0, totalDailyMiles - freeMileageAllowance)
  return billableMiles * ratePerMile
}

