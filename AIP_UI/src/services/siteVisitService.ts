import { api, BASE_API_URL } from '@/config/api';
import { getCurrentCustomerId } from '@/lib/utils';
import type { 
  SiteVisit, 
  SiteVisitResponse, 
  SiteVisitsResponse, 
  GetSiteVisitsParams 
} from '../types/siteVisit';

// Helper to get customer ID - required for customer-scoped endpoints
const getCustomerId = (customerId?: string | number | null): number => {
  if (customerId) {
    const id = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId;
    if (!isNaN(id)) return id;
  }
  
  // Fallback to current customer ID from context
  const currentId = getCurrentCustomerId();
  if (currentId !== null) return currentId;
  
  throw new Error('Customer ID is required for site visit operations');
};

const SITE_VISIT_ENDPOINTS = {
  LIST: (customerId: number) => `/customers/${customerId}/site-visits`,
  DETAIL: (customerId: number, id: string) => `/customers/${customerId}/site-visits/${id}`,
  CREATE: (customerId: number) => `/customers/${customerId}/site-visits`,
  UPDATE: (customerId: number, id: string) => `/customers/${customerId}/site-visits/${id}`,
  DELETE: (customerId: number, id: string) => `/customers/${customerId}/site-visits/${id}`,
};

export const siteVisitService = {
  /**
   * Get paginated list of site visits
   */
  getSiteVisits: async (params: GetSiteVisitsParams & { customerId?: string | number }): Promise<SiteVisitsResponse> => {
    const customerId = getCustomerId(params.customerId);
    const { customerId: _, ...queryParams } = params;
    
    const { data } = await api.get<SiteVisitsResponse>(SITE_VISIT_ENDPOINTS.LIST(customerId), { 
      params: queryParams
    });
    return data;
  },

  /**
   * Get a single site visit by ID
   */
  getSiteVisit: async (id: string, customerId?: string | number): Promise<SiteVisitResponse> => {
    const customerIdNum = getCustomerId(customerId);
    const response = await api.get<{ success: boolean; data: SiteVisit; message?: string }>(SITE_VISIT_ENDPOINTS.DETAIL(customerIdNum, id));
    return response.data.data;
  },

  /**
   * Create a new site visit
   */
  createSiteVisit: async (siteVisit: Omit<SiteVisit, 'id' | 'createdAt'>, customerId?: string | number): Promise<SiteVisit> => {
    const customerIdNum = getCustomerId(customerId ?? siteVisit.customerId);
    const response = await api.post<{ success: boolean; data: SiteVisit; message?: string }>(SITE_VISIT_ENDPOINTS.CREATE(customerIdNum), {
      ...siteVisit,
      customerId: customerIdNum
    });
    return response.data.data;
  },

  /**
   * Update an existing site visit
   */
  updateSiteVisit: async (id: string, siteVisit: Partial<SiteVisit>, customerId?: string | number): Promise<SiteVisit> => {
    const customerIdNum = getCustomerId(customerId ?? siteVisit.customerId);
    const response = await api.put<{ success: boolean; data: SiteVisit; message?: string }>(SITE_VISIT_ENDPOINTS.UPDATE(customerIdNum, id), {
      ...siteVisit,
      id,
      customerId: customerIdNum
    });
    return response.data.data;
  },

  /**
   * Delete a site visit
   */
  deleteSiteVisit: async (id: string, customerId?: string | number): Promise<void> => {
    const customerIdNum = getCustomerId(customerId);
    await api.delete(SITE_VISIT_ENDPOINTS.DELETE(customerIdNum, id));
  },
}; 