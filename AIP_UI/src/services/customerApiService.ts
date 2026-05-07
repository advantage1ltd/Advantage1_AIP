import { api, CUSTOMER_ENDPOINTS, ApiResponse, handleApiError } from '@/config/api'
import { CustomerWithRelations as Customer } from '@/types/customer'

export interface CustomerCreateRequest {
  companyName: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  address?: {
    street: string
    city: string
    county: string
    postCode: string
    region: string
  }
  pageAssignments?: Record<string, any>
  regions?: string[]
  sites?: string[]
  status?: 'active' | 'inactive'
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  id: number
}

export interface CustomerDetailResponse extends Customer {
  id: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface CustomerStatistics {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  newCustomersThisMonth: number
  customersByRegion: Record<string, number>
  customersByStatus: Record<string, number>
}

export interface CustomerListResponse {
  customers: CustomerDetailResponse[]
  total: number
  page: number
  pageSize: number
}

class CustomerApiService {
  /**
   * Get all customers with optional filtering and pagination
   */
  async getCustomers(params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: 'active' | 'inactive'
    region?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<CustomerListResponse> {
    try {
      const response = await api.get<ApiResponse<CustomerListResponse>>(
        CUSTOMER_ENDPOINTS.LIST,
        { params }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: number): Promise<CustomerDetailResponse> {
    try {
      const response = await api.get<ApiResponse<CustomerDetailResponse>>(
        CUSTOMER_ENDPOINTS.DETAIL(id.toString())
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(data: CustomerCreateRequest): Promise<CustomerDetailResponse> {
    try {
      const response = await api.post<ApiResponse<CustomerDetailResponse>>(
        CUSTOMER_ENDPOINTS.CREATE,
        data
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(id: number, data: Partial<CustomerCreateRequest>): Promise<CustomerDetailResponse> {
    try {
      const response = await api.put<ApiResponse<CustomerDetailResponse>>(
        CUSTOMER_ENDPOINTS.UPDATE(id.toString()),
        data
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: number): Promise<void> {
    try {
      await api.delete(CUSTOMER_ENDPOINTS.DELETE(id.toString()))
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStatistics(): Promise<CustomerStatistics> {
    try {
      const response = await api.get<ApiResponse<CustomerStatistics>>(
        CUSTOMER_ENDPOINTS.STATISTICS
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Update customer page assignments
   */
  async updateCustomerPageAssignments(
    id: number,
    pageAssignments: Record<string, any>
  ): Promise<CustomerDetailResponse> {
    try {
      const response = await api.put<ApiResponse<CustomerDetailResponse>>(
        CUSTOMER_ENDPOINTS.PAGE_ASSIGNMENTS(id.toString()),
        { pageAssignments }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Search customers by name or other criteria
   */
  async searchCustomers(query: string): Promise<CustomerDetailResponse[]> {
    try {
      const response = await api.get<ApiResponse<CustomerDetailResponse[]>>(
        `${CUSTOMER_ENDPOINTS.LIST}/search`,
        { params: { q: query } }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get customers by region
   */
  async getCustomersByRegion(region: string): Promise<CustomerDetailResponse[]> {
    try {
      const response = await api.get<ApiResponse<CustomerDetailResponse[]>>(
        `${CUSTOMER_ENDPOINTS.LIST}/by-region/${region}`
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get customers by status
   */
  async getCustomersByStatus(status: 'active' | 'inactive'): Promise<CustomerDetailResponse[]> {
    try {
      const response = await api.get<ApiResponse<CustomerDetailResponse[]>>(
        `${CUSTOMER_ENDPOINTS.LIST}/by-status/${status}`
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Bulk update customers
   */
  async bulkUpdateCustomers(updates: Array<{ id: number; updates: Partial<CustomerCreateRequest> }>): Promise<CustomerDetailResponse[]> {
    try {
      const response = await api.put<ApiResponse<CustomerDetailResponse[]>>(
        `${CUSTOMER_ENDPOINTS.LIST}/bulk-update`,
        { updates }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Export customers to CSV/Excel
   */
  async exportCustomers(format: 'csv' | 'excel', filters?: {
    status?: 'active' | 'inactive'
    region?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<Blob> {
    try {
      const response = await api.get(
        `${CUSTOMER_ENDPOINTS.LIST}/export/${format}`,
        {
          params: filters,
          responseType: 'blob'
        }
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Import customers from CSV/Excel
   */
  async importCustomers(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<ApiResponse<{ success: number; failed: number; errors: string[] }>>(
        `${CUSTOMER_ENDPOINTS.LIST}/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const customerApiService = new CustomerApiService()
