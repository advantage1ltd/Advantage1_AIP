import { api, SITE_ENDPOINTS, handleApiError } from '@/config/api'
import type { Site } from '@/types/customer'

export interface CreateSiteData {
  fkCustomerID: number
  fkRegionID: number
  coreSiteYN?: boolean
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
  recordIsDeletedYN?: boolean
  createdBy: string
}

export interface UpdateSiteData {
  coreSiteYN?: boolean
  locationName?: string
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
  recordIsDeletedYN?: boolean
  modifiedBy: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: string[]
}

export const siteService = {
  // Get all sites
  async getSites(customerId?: number, regionId?: number): Promise<{ success: boolean; data: Site[] }> {
    try {
      console.log('🔄 [SiteService] Fetching sites from backend')
      
      const params = new URLSearchParams()
      if (customerId) {
        params.append('customerId', customerId.toString())
      }
      if (regionId) {
        params.append('regionId', regionId.toString())
      }
      
      const response = await api.get<ApiResponse<Site[]>>(`${SITE_ENDPOINTS.LIST}?${params}`)
      
      if (response.data.success) {
        console.log('✅ [SiteService] Successfully fetched sites:', response.data.data.length)
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ [SiteService] Failed to fetch sites:', response.data.message)
        return {
          success: false,
          data: []
        }
      }
    } catch (error) {
      console.error('❌ [SiteService] Error fetching sites:', error)
      return {
        success: false,
        data: []
      }
    }
  },

  // Get sites by customer
  async getSitesByCustomer(customerId: number): Promise<{ success: boolean; data: Site[] }> {
    try {
      console.log('🔄 [SiteService] Fetching sites for customer:', customerId)
      
      const response = await api.get<ApiResponse<any[]>>(SITE_ENDPOINTS.BY_CUSTOMER(customerId.toString()))
      
      if (response.data.success) {
        // Map backend response to frontend Site type
        // Backend returns SiteID and LocationName (PascalCase), frontend expects siteID and locationName (camelCase)
        const mappedSites: Site[] = response.data.data.map((site: any) => ({
          siteID: site.SiteID || site.siteID || site.SiteId || site.siteId,
          fkCustomerID: site.fkCustomerID || site.fkCustomerId,
          fkRegionID: site.fkRegionID || site.fkRegionId,
          coreSiteYN: site.CoreSiteYN ?? site.coreSiteYN ?? false,
          locationName: site.LocationName || site.locationName || '',
          locationType: site.LocationType || site.locationType,
          sinNumber: site.SINNumber || site.sinNumber || site.SinNumber,
          buildingName: site.BuildingName || site.buildingName,
          numberandStreet: site.NumberandStreet || site.numberandStreet,
          villageOrSuburb: site.VillageOrSuburb || site.villageOrSuburb,
          town: site.Town || site.town,
          county: site.County || site.county,
          postcode: site.Postcode || site.postcode,
          telephoneNumber: site.TelephoneNumber || site.telephoneNumber,
          contractStartDate: site.ContractStartDate || site.contractStartDate,
          contractEndDate: site.ContractEndDate || site.contractEndDate,
          details: site.Details || site.details,
          siteSurveyComplete: site.SiteSurveyComplete || site.siteSurveyComplete,
          assignmentInstructionsIssued: site.AssignmentInstructionsIssued || site.assignmentInstructionsIssued,
          riskAssessmentIssued: site.RiskAssessmentIssued || site.riskAssessmentIssued,
          recordIsDeletedYN: site.RecordIsDeletedYN ?? site.recordIsDeletedYN ?? false,
          dateCreated: site.DateCreated || site.dateCreated || new Date().toISOString(),
          createdBy: site.CreatedBy || site.createdBy || '',
          dateModified: site.DateModified || site.dateModified,
          modifiedBy: site.ModifiedBy || site.modifiedBy
        }))
        
        console.log('✅ [SiteService] Successfully fetched sites for customer:', mappedSites.length)
        return {
          success: true,
          data: mappedSites
        }
      } else {
        console.error('❌ [SiteService] Failed to fetch sites for customer:', response.data.message)
        return {
          success: false,
          data: []
        }
      }
    } catch (error) {
      console.error('❌ [SiteService] Error fetching sites for customer:', error)
      return {
        success: false,
        data: []
      }
    }
  },

  // Get sites by region
  async getSitesByRegion(regionId: number): Promise<{ success: boolean; data: Site[] }> {
    try {
      console.log('🔄 [SiteService] Fetching sites for region:', regionId)
      
      const response = await api.get<ApiResponse<Site[]>>(SITE_ENDPOINTS.BY_REGION(regionId.toString()))
      
      if (response.data.success) {
        console.log('✅ [SiteService] Successfully fetched sites for region:', response.data.data.length)
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ [SiteService] Failed to fetch sites for region:', response.data.message)
        return {
          success: false,
          data: []
        }
      }
    } catch (error) {
      console.error('❌ [SiteService] Error fetching sites for region:', error)
      return {
        success: false,
        data: []
      }
    }
  },

  // Get site by ID
  async getSiteById(id: number): Promise<{ success: boolean; data?: Site }> {
    try {
      console.log('🔄 [SiteService] Fetching site by ID:', id)
      
      const response = await api.get<ApiResponse<Site>>(SITE_ENDPOINTS.DETAIL(id.toString()))
      
      if (response.data.success) {
        console.log('✅ [SiteService] Successfully fetched site:', response.data.data)
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ [SiteService] Failed to fetch site:', response.data.message)
        return {
          success: false
        }
      }
    } catch (error) {
      console.error('❌ [SiteService] Error fetching site:', error)
      return {
        success: false
      }
    }
  },

  // Create new site
  async createSite(data: CreateSiteData): Promise<{ success: boolean; data?: Site; message?: string }> {
    try {
      console.log('🔄 [SiteService] Creating site:', data)
      
      const response = await api.post<ApiResponse<Site>>(SITE_ENDPOINTS.CREATE, data)
      
      if (response.data.success) {
        console.log('✅ [SiteService] Successfully created site:', response.data.data)
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ [SiteService] Failed to create site:', response.data.message)
        return {
          success: false,
          message: response.data.message
        }
      }
    } catch (error) {
      console.error('❌ [SiteService] Error creating site:', error)
      return {
        success: false,
        message: handleApiError(error)
      }
    }
  },

  // Update site
  async updateSite(id: number, data: UpdateSiteData): Promise<{ success: boolean; data?: Site; message?: string }> {
    try {
      console.log('🔄 [SiteService] Updating site:', id, data)
      
      const response = await api.put<ApiResponse<Site>>(SITE_ENDPOINTS.UPDATE(id.toString()), data)
      
      if (response.data.success) {
        console.log('✅ [SiteService] Successfully updated site:', response.data.data)
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ [SiteService] Failed to update site:', response.data.message)
        return {
          success: false,
          message: response.data.message
        }
      }
    } catch (error) {
      console.error('❌ [SiteService] Error updating site:', error)
      return {
        success: false,
        message: handleApiError(error)
      }
    }
  },

  // Delete site
  async deleteSite(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔄 [SiteService] Deleting site:', id)
      
      const response = await api.delete<ApiResponse<object>>(SITE_ENDPOINTS.DELETE(id.toString()))
      
      if (response.data.success) {
        console.log('✅ [SiteService] Successfully deleted site')
        return {
          success: true
        }
      } else {
        console.error('❌ [SiteService] Failed to delete site:', response.data.message)
        return {
          success: false,
          message: response.data.message
        }
      }
    } catch (error) {
      console.error('❌ [SiteService] Error deleting site:', error)
      return {
        success: false,
        message: handleApiError(error)
      }
    }
  }
}
