import { api } from '@/config/api'
import type { OfficerPerformanceParams, OfficerPerformanceResponse } from '@/types/officerPerformance'

const ENDPOINT = '/officer-performance'

export const officerPerformanceApi = {
  getPerformance: async (params: OfficerPerformanceParams): Promise<OfficerPerformanceResponse> => {
    const response = await api.get<OfficerPerformanceResponse>(ENDPOINT, { params })
    return response.data
  }
}

