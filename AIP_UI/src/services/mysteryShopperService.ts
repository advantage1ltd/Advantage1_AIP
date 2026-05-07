import { api } from '@/config/api';
import { getCurrentCustomerId } from '@/lib/utils';
import type { MysteryShopperEvaluation } from '@/types/mysteryShopper';

const BASE_URL = '/mystery-shopper';

// Helper to get headers with customer ID
const getHeaders = () => {
  const customerId = getCurrentCustomerId();
  return customerId ? { 'X-Customer-Id': customerId.toString() } : {};
};

export interface MysteryShopperFilters {
  search?: string;
  customerId?: string;
  siteId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface MysteryShopperResponse {
  data: MysteryShopperEvaluation[];
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
}

export const mysteryShopperService = {
  // Get paginated list of evaluations with optional filters
  async getEvaluations(
    page: number = 1,
    pageSize: number = 10,
    filters?: MysteryShopperFilters
  ): Promise<MysteryShopperResponse> {
    const params = {
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.customerId && { customerId: filters.customerId }),
      ...(filters?.siteId && { siteId: filters.siteId }),
      ...(filters?.dateRange?.from && { from: filters.dateRange.from.toISOString() }),
      ...(filters?.dateRange?.to && { to: filters.dateRange.to.toISOString() })
    };

    const searchParams = new URLSearchParams(params);
    const response = await api.get(`${BASE_URL}/evaluations?${searchParams.toString()}`, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Get a single evaluation by ID
  async getEvaluation(id: string): Promise<MysteryShopperEvaluation> {
    const response = await api.get(`${BASE_URL}/evaluations/${id}`, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Create a new evaluation
  async createEvaluation(data: Omit<MysteryShopperEvaluation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MysteryShopperEvaluation> {
    const response = await api.post(`${BASE_URL}/evaluations`, data, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Update an existing evaluation
  async updateEvaluation(id: string, data: Partial<MysteryShopperEvaluation>): Promise<MysteryShopperEvaluation> {
    const response = await api.put(`${BASE_URL}/evaluations/${id}`, data, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Delete an evaluation
  async deleteEvaluation(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/evaluations/${id}`, {
      headers: getHeaders()
    });
  },

  // Get officers
  async getOfficers(): Promise<any[]> {
    const response = await api.get(`${BASE_URL}/officers`, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Get customers  
  async getCustomers(): Promise<any[]> {
    const response = await api.get(`${BASE_URL}/customers`, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Get locations/sites
  async getLocations(): Promise<any[]> {
    const response = await api.get(`${BASE_URL}/locations`, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Get evaluation criteria
  async getEvaluationCriteria(): Promise<any[]> {
    const response = await api.get(`${BASE_URL}/evaluation-criteria`, {
      headers: getHeaders()
    });
    return response.data;
  }
}; 