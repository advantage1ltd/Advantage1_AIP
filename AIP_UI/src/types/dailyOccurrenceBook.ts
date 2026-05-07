export type DailyOccurrenceCode =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'J'
  | 'K'
  | 'L'
  | 'M'

export interface DailyOccurrenceEntry {
  id: string
  customerId: number
  siteId: string
  siteName?: string
  storeName?: string
  storeNumber?: string
  dateCommenced?: string
  date: string
  time: string
  officerName: string
  code: DailyOccurrenceCode
  codeDescription: string
  crimeReportCompletedDate?: string
  crimeReportCompletedTime?: string
  details: string
  signature: string
  reportedBy: {
    id: string
    name: string
    role: string
    badgeNumber?: string
  }
  createdAt: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface DailyOccurrenceBookFilters {
  dateFrom?: string
  dateTo?: string
  storeName?: string
  storeNumber?: string
  officerName?: string
  code?: DailyOccurrenceCode[]
  siteId?: string
  reportedBy?: string
  searchTerm?: string
}

export interface DailyOccurrenceBookStats {
  totalEntries: number
  entriesThisWeek: number
  entriesThisMonth: number
  byCode: Record<string, number>
  byStore: Record<string, number>
}

export interface CreateOccurrenceRequest {
  customerId: number
  siteId: string
  storeName: string
  storeNumber: string
  dateCommenced?: string
  date: string
  time: string
  officerName: string
  code: DailyOccurrenceCode
  crimeReportCompletedDate?: string
  crimeReportCompletedTime?: string
  details: string
  signature: string
}

export interface UpdateOccurrenceRequest extends Partial<CreateOccurrenceRequest> {
  id: string
}

export interface DailyOccurrenceBookResponse {
  success: boolean
  data: DailyOccurrenceEntry[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats?: DailyOccurrenceBookStats
  message?: string
}

export interface SingleOccurrenceResponse {
  success: boolean
  data: DailyOccurrenceEntry
  message?: string
}

export interface OccurrenceStatsResponse {
  success: boolean
  data: DailyOccurrenceBookStats
  message?: string
}