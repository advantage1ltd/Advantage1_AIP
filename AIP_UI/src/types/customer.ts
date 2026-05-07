export interface Address {
  building: string
  street: string
  village?: string
  town: string
  county: string
  postcode: string
}

export interface Contact {
  title: string
  forename: string
  surname: string
  position: string
  email: string
  phone: string
}

export interface ViewConfig {
  id: string
  customerId: string // Changed from number to string to match mock data
  customerType: CustomerType
  enabledPages: string[]
  createdAt: string
  updatedAt: string
}

export type CustomerType = 'retail' | 'static' | 'gatehouse' | 'mobile-patrol' | 'keyholding-alarm-response' | 'event'

export interface CustomerPageAssignment {
  pageId?: string // Added for array structure
  enabled: boolean
  customized: boolean
  lastModified: string
  modifiedBy: string
}

export interface Customer {
  id: string // Changed from number to string to match mock data
  companyName: string
  companyNumber: string
  vatNumber: string
  status: 'active' | 'inactive'
  customerType: CustomerType
  address: Address
  contact: Contact
  viewConfig: ViewConfig
  pageAssignments?: CustomerPageAssignment[] // Changed from Record to array to match mock data
  assignedOfficers?: string[]
  createdAt: string
  updatedAt: string
}

export interface Region {
  regionID: number
  fkCustomerID: number
  regionName: string
  regionDescription?: string
  recordIsDeletedYN: boolean
  dateCreated: string
  createdBy: string
  dateModified?: string
  modifiedBy?: string
  // Navigation properties
  customer?: Customer
  sites?: Site[]
}

export interface Site {
  siteID: number
  fkCustomerID: number
  fkRegionID: number
  coreSiteYN: boolean
  locationName: string
  locationType?: string
  sinNumber?: string
  buildingName?: string
  numberandStreet?: string
  villageOrSuburb?: string
  town?: string
  county?: string
  postcode?: string
  telephoneNumber?: string
  contractStartDate?: string
  contractEndDate?: string
  details?: string
  siteSurveyComplete?: string
  assignmentInstructionsIssued?: string
  riskAssessmentIssued?: string
  recordIsDeletedYN: boolean
  dateCreated: string
  createdBy: string
  dateModified?: string
  modifiedBy?: string
  // Navigation properties
  customer?: Customer
  region?: Region
}

export interface CustomerPage {
  id: string
  title: string
  description: string
  enabled: boolean
  requiredForTypes: string[]
  path: string
  readOnly: boolean
  category: 'activity' | 'reporting' | 'security' | 'support' | 'settings' | 'incidents' | 'satisfaction' | 'safety' | 'reports'
  icon: string
}

export type CustomerPageId = 
  | 'daily-activity'
  | 'incident-graph'
  | 'incident-report'
  | 'customer-satisfaction'
  | 'be-safe-be-secure'
  | 'site-visit-reports'
  | 'keyholding-logs'
  | 'event-briefings'

export interface CustomerViewConfig {
  id: string
  customerId: number
  customerType: CustomerType
  enabledPages: string[]
  createdAt: string
  updatedAt: string
}

export interface CustomerReportingAccess {
  customerId: number
  customerName: string
  customerType: CustomerType
  assignedOfficers: string[]
  availablePages: CustomerPage[]
  lastActivity: string
  totalIncidents: number
  totalReports: number
}

export interface CustomerWithRelations extends Customer {
  regions: Region[]
  sites: Site[]
  availablePages?: CustomerPage[]
  statistics?: {
    incidents: number
    reports: number
    lastIncident?: string
    activeIssues: number
  }
}

export interface CustomerResponse {
  success: boolean
  data: Customer
  message?: string
}

export interface CustomersResponse {
  success: boolean
  data: Customer[]
  message?: string
}

export interface RegionResponse {
  success: boolean
  data: Region
  message?: string
}

export interface RegionsResponse {
  success: boolean
  data: Region[]
  message?: string
}

export interface SiteResponse {
  success: boolean
  data: Site
  message?: string
}

export interface SitesResponse {
  success: boolean
  data: Site[]
  message?: string
}

export interface CustomerReportingResponse {
  success: boolean
  data: CustomerReportingAccess[]
  message?: string
} 