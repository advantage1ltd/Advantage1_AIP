import { PaginationInfo } from './api'

export type OfficerPerformanceCategory = 'top-performers' | 'needs-improvement' | 'non-reporters'
export type OfficerPerformanceRecordLimit = 10 | 20 | 100

export interface OfficerPerformanceParams {
  customerId: number
  startDate?: string
  endDate?: string
  category?: OfficerPerformanceCategory
  page?: number
  pageSize?: number
  maxRecords?: OfficerPerformanceRecordLimit
}

export interface OfficerPerformanceStats {
  totalOfficers: number
  activeOfficers: number
  totalIncidents: number
  totalValueSaved: number
  averageResponseRate: number
}

export interface OfficerPerformanceItem {
  officerName: string
  incidentCount: number
  totalValueSaved: number
  responseRate: number
  status: string
}

export interface OfficerPerformanceList {
  category: OfficerPerformanceCategory
  recordLimit: number
  items: OfficerPerformanceItem[]
  pagination: PaginationInfo
}

export interface OfficerPerformanceResponse {
  success: boolean
  message?: string
  stats: OfficerPerformanceStats
  results: OfficerPerformanceList
}

