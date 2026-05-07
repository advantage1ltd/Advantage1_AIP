export interface SiteVisit {
  id: string
  actionId: string
  siteVisitId: string
  customerId?: number
  customer: string
  customerName: string
  region: string
  regionName: string
  siteId?: string
  location: string
  locationName: string
  visitType: 'retail' | 'warehouse' | 'office'
  officerName: string
  idBadgeExpiry: string
  siaLicenceNumber: string
  siaLicenceExpiry: string
  recordOfIncidentsCompletion: string
  dailyOccurrenceBookCompletion: string
  pocketBookCompletion: string
  ecrCompletion: string
  top20Lines: string
  assignmentInstructions: string
  assignmentInstructionsUnderstood: 'Yes' | 'No'
  healthAndSafetyUnderstood: 'Yes' | 'No'
  healthAndSafetyInPlace: 'Yes' | 'No'
  dateHSRiskAssessment: string
  trainingInstructionsGivenDate: string
  jumper: string
  shirt: string
  tie: string
  hiVisJacket: string
  jacket: string
  trousers: string
  epaulettes: string
  shoes: string
  trainingInstructions: string
  securityOfficerSign: string
  managerName: string
  followUpAction?: string
  followUpActionDate?: string
  date: string
  assignmentInstructionsInPlace: 'Yes' | 'No'
  assignmentInstructionsDate: string
  createdAt: string
  updatedAt?: string
  status: 'Completed' | 'Follow-up Required'
  recommendations?: string
}

export interface GetSiteVisitsParams {
  page?: number
  pageSize?: number
  search?: string
  customerId?: string
  siteId?: string
  fromDate?: string
  toDate?: string
  visitType?: string
  location?: string
  status?: string
}

export type SiteVisitResponse = SiteVisit

export interface SiteVisitsResponse {
  data: SiteVisit[]
  total: number
  page: number
  pageSize: number
  totalPages: number
} 