import type { Customer } from "@/types/customer"
import { api, CUSTOMER_ENDPOINTS, ApiResponse } from "@/config/api"

// Helper function to map backend customer data to frontend Customer type
const mapBackendCustomerToFrontend = (backendCustomer: any): Customer => {
  return {
    id: backendCustomer.customerId,
    companyName: backendCustomer.companyName,
    companyNumber: backendCustomer.companyNumber,
    vatNumber: backendCustomer.vatNumber || '',
    status: backendCustomer.status as 'active' | 'inactive',
    customerType: (backendCustomer.customerType || 'retail') as any,
    address: {
      building: backendCustomer.building || '',
      street: backendCustomer.street || '',
      village: backendCustomer.village || '',
      town: backendCustomer.town || '',
      county: backendCustomer.county || '',
      postcode: backendCustomer.postcode || ''
    },
    contact: {
      title: backendCustomer.contactTitle || '',
      forename: backendCustomer.contactForename || '',
      surname: backendCustomer.contactSurname || '',
      position: backendCustomer.contactPosition || '',
      email: backendCustomer.contactEmail || '',
      phone: backendCustomer.contactPhone || ''
    },
    viewConfig: {
      id: `vc${backendCustomer.customerId}`,
      customerId: backendCustomer.customerId,
      customerType: (backendCustomer.customerType || 'retail') as any,
      enabledPages: [], // Will be populated from pageAssignments if needed
      createdAt: backendCustomer.createdAt,
      updatedAt: backendCustomer.updatedAt || backendCustomer.createdAt
    },
    pageAssignments: backendCustomer.pageAssignments ? JSON.parse(backendCustomer.pageAssignments) : {},
    createdAt: backendCustomer.createdAt,
    updatedAt: backendCustomer.updatedAt || backendCustomer.createdAt
  }
}

// Helper function to map frontend Customer type to backend format
const mapFrontendCustomerToBackend = (frontendCustomer: Customer): any => {
  return {
    companyName: frontendCustomer.companyName,
    companyNumber: frontendCustomer.companyNumber,
    vatNumber: frontendCustomer.vatNumber,
    status: frontendCustomer.status,
    customerType: frontendCustomer.customerType,
    region: frontendCustomer.address?.county || null,
    
    // Address fields
    building: frontendCustomer.address?.building || null,
    street: frontendCustomer.address?.street || null,
    village: frontendCustomer.address?.village || null,
    town: frontendCustomer.address?.town || null,
    county: frontendCustomer.address?.county || null,
    postcode: frontendCustomer.address?.postcode || null,
    
    // Contact fields
    contactTitle: frontendCustomer.contact?.title || null,
    contactForename: frontendCustomer.contact?.forename || null,
    contactSurname: frontendCustomer.contact?.surname || null,
    contactPosition: frontendCustomer.contact?.position || null,
    contactEmail: frontendCustomer.contact?.email || null,
    contactPhone: frontendCustomer.contact?.phone || null,
    
    // Page assignments as JSON string
    pageAssignments: frontendCustomer.pageAssignments ? JSON.stringify(frontendCustomer.pageAssignments) : null
  }
}

export const customerService = {
  // Get all customers from backend
  getAllCustomers: async (): Promise<Customer[]> => {
    try {
      console.log('🔄 [CustomerService] Fetching customers from backend')
      const response = await api.get<ApiResponse<{ customers: any[] }>>(CUSTOMER_ENDPOINTS.LIST)
      
      if (response.data.success && response.data.data?.customers) {
        const customers = response.data.data.customers.map(mapBackendCustomerToFrontend)
        console.log('✅ [CustomerService] Successfully fetched customers:', customers.length)
        return customers
      } else {
        console.error('❌ [CustomerService] Failed to fetch customers:', response.data.message)
        return []
      }
    } catch (error) {
      console.error('❌ [CustomerService] Error fetching customers:', error)
      return []
    }
  },

  // Get a customer by ID from backend.
  // Tries GET /customer/:id; on 404 falls back to list and find by id (avoids 404 when backend does not expose GET by id).
  getCustomer: async (id: string): Promise<Customer | undefined> => {
    const fallbackFromList = async (): Promise<Customer | undefined> => {
      const customers = await customerService.getAllCustomers()
      const found = customers.find(c => String(c.id) === String(id))
      if (found) {
        console.log('✅ [CustomerService] Found customer via list fallback:', found.companyName)
        return found
      }
      return undefined
    }

    try {
      console.log('🔄 [CustomerService] Fetching customer by ID:', id)
      const response = await api.get<ApiResponse<any>>(CUSTOMER_ENDPOINTS.DETAIL(id))
      if (response.data?.success && response.data?.data) {
        const customer = mapBackendCustomerToFrontend(response.data.data)
        console.log('✅ [CustomerService] Successfully fetched customer:', customer.companyName)
        return customer
      }
      return undefined
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        try {
          return await fallbackFromList()
        } catch (fallbackError) {
          console.error('❌ [CustomerService] Fallback fetch failed:', fallbackError)
        }
      }
      console.error('❌ [CustomerService] Error fetching customer:', error)
      return undefined
    }
  },

  // Create a new customer via backend
  createCustomer: async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'viewConfig' | 'pageAssignments'>): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    try {
      console.log('🔄 [CustomerService] Creating new customer:', customerData.companyName)
      
      const backendData = mapFrontendCustomerToBackend({
        ...customerData,
        id: '', // Will be set by backend
        createdAt: '',
        updatedAt: '',
        viewConfig: {} as any,
        pageAssignments: []
      })
      
      const response = await api.post<ApiResponse<any>>(CUSTOMER_ENDPOINTS.LIST, backendData)
      
      if (response.data.success && response.data.data) {
        const customer = mapBackendCustomerToFrontend(response.data.data)
        console.log('✅ [CustomerService] Successfully created customer:', customer.companyName)
        return { success: true, customer }
      } else {
        console.error('❌ [CustomerService] Failed to create customer:', response.data.message)
        return { success: false, error: response.data.message || 'Failed to create customer' }
      }
    } catch (error) {
      console.error('❌ [CustomerService] Error creating customer:', error)
      return { success: false, error: 'Failed to create customer' }
    }
  },

  // Update a customer via backend
  updateCustomer: async (customerData: Customer): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    try {
      console.log('🔄 [CustomerService] Updating customer:', customerData.companyName)
      
      const backendData = mapFrontendCustomerToBackend(customerData)
      
      const response = await api.put<ApiResponse<any>>(`${CUSTOMER_ENDPOINTS.LIST}/${customerData.id}`, backendData)
      
      if (response.data.success && response.data.data) {
        const customer = mapBackendCustomerToFrontend(response.data.data)
        console.log('✅ [CustomerService] Successfully updated customer:', customer.companyName)
        return { success: true, customer }
      } else {
        console.error('❌ [CustomerService] Failed to update customer:', response.data.message)
        return { success: false, error: response.data.message || 'Failed to update customer' }
      }
    } catch (error) {
      console.error('❌ [CustomerService] Error updating customer:', error)
      return { success: false, error: 'Failed to update customer' }
    }
  },

  // Delete a customer via backend
  deleteCustomer: async (customerId: string): Promise<{ success: boolean; customerName?: string; error?: string }> => {
    try {
      console.log('🔄 [CustomerService] Deleting customer:', customerId)
      
      const response = await api.delete<ApiResponse<any>>(`${CUSTOMER_ENDPOINTS.LIST}/${customerId}`)
      
      if (response.data.success) {
        console.log('✅ [CustomerService] Successfully deleted customer')
        return { success: true }
      } else {
        console.error('❌ [CustomerService] Failed to delete customer:', response.data.message)
        return { success: false, error: response.data.message || 'Failed to delete customer' }
      }
    } catch (error) {
      console.error('❌ [CustomerService] Error deleting customer:', error)
      return { success: false, error: 'Failed to delete customer' }
    }
  },

  // Update customer page assignments via backend
  updateCustomerPageAssignments: async (customerId: string, pageAssignments: Record<string, any>): Promise<Customer | null> => {
    try {
      console.log('🔄 [CustomerService] Updating page assignments for customer:', customerId)
      
      const response = await api.put<ApiResponse<any>>(`${CUSTOMER_ENDPOINTS.LIST}/${customerId}/page-assignments`, {
        pageAssignments: JSON.stringify(pageAssignments)
      })
      
      if (response.data.success && response.data.data) {
        const customer = mapBackendCustomerToFrontend(response.data.data)
        console.log('✅ [CustomerService] Successfully updated page assignments')
        return customer
      } else {
        console.error('❌ [CustomerService] Failed to update page assignments:', response.data.message)
        return null
      }
    } catch (error) {
      console.error('❌ [CustomerService] Error updating page assignments:', error)
      return null
    }
  },

  // Get available customers for dropdowns (simplified version)
  getAvailableCustomers: async (): Promise<Array<{ id: string; name: string }>> => {
    try {
      const customers = await customerService.getAllCustomers()
      return customers.map(customer => ({
        id: customer.id,
        name: customer.companyName
      }))
    } catch (error) {
      console.error('❌ [CustomerService] Error getting available customers:', error)
      return []
    }
  },

  // Generate next available customer ID (not needed with backend, but kept for compatibility)
  generateNextCustomerId: (): string => {
    return Date.now().toString()
  },

  // Create a new customer with auto-generated ID and proper page assignments
  createNewCustomer: async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'viewConfig' | 'pageAssignments'>): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    try {
      console.log('🔄 [CustomerService] Creating new customer with page assignments')
      
      // Get pages for customer type
      const { getPagesByCustomerType } = require('@/config/customerPages')
      const availablePages = getPagesByCustomerType(customerData.customerType)
      
      // Create page assignments
      const pageAssignments: Record<string, any> = {}
      const now = new Date().toISOString()
      
      availablePages.forEach(page => {
        const pageKey = Object.keys(require('@/config/customerPages').CUSTOMER_PAGES).find(
          key => require('@/config/customerPages').CUSTOMER_PAGES[key].id === page.id
        )
        if (pageKey) {
          pageAssignments[pageKey] = {
            enabled: true,
            customized: false,
            lastModified: now,
            modifiedBy: "system"
          }
        }
      })

      const customerWithAssignments = {
        ...customerData,
        pageAssignments
      }
      
      return await customerService.createCustomer(customerWithAssignments)
    } catch (error) {
      console.error('❌ [CustomerService] Error creating new customer:', error)
      return { success: false, error: 'Failed to create new customer' }
    }
  }
} 