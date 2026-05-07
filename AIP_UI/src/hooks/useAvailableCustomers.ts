import { useState, useEffect } from 'react';
import { api, CUSTOMER_ENDPOINTS, ApiResponse } from '@/config/api';

interface AvailableCustomer {
  id: number;
  name: string;
}

// Custom hook to manage available customers dynamically (real backend)
export const useAvailableCustomers = () => {
  const [availableCustomers, setAvailableCustomers] = useState<AvailableCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCustomers = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [useAvailableCustomers] Fetching customers from backend');
      
      const response = await api.get<ApiResponse<{ customers: any[] }>>(CUSTOMER_ENDPOINTS.LIST);
      
      if (response.data.success && response.data.data?.customers) {
        const customers = response.data.data.customers.map((c: any) => ({
          id: Number(c.customerId || c.id || c.Id),
          name: c.companyName || c.CompanyName || 'Unnamed Company'
        }));
        
        console.log('✅ [useAvailableCustomers] Successfully fetched customers:', customers.length);
        setAvailableCustomers(customers);
      } else {
        console.error('❌ [useAvailableCustomers] Failed to fetch customers:', response.data.message);
        setAvailableCustomers([]);
      }
    } catch (error) {
      console.error('❌ [useAvailableCustomers] Error fetching customers:', error);
      setAvailableCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomers();

    const handleCustomerEvent = () => {
      console.log('🔄 [useAvailableCustomers] Customer event detected, refreshing list');
      refreshCustomers();
    };

    window.addEventListener('customer-created', handleCustomerEvent);
    window.addEventListener('customer-updated', handleCustomerEvent);
    window.addEventListener('customer-deleted', handleCustomerEvent);
    
    return () => {
      window.removeEventListener('customer-created', handleCustomerEvent);
      window.removeEventListener('customer-updated', handleCustomerEvent);
      window.removeEventListener('customer-deleted', handleCustomerEvent);
    };
  }, []);

  return {
    availableCustomers,
    isLoading,
    refreshCustomers
  };
};

export const getAvailableCustomers = async (): Promise<AvailableCustomer[]> => {
  try {
    console.log('🔄 [getAvailableCustomers] Fetching customers from backend');
    
    const response = await api.get<ApiResponse<{ customers: any[] }>>(CUSTOMER_ENDPOINTS.LIST);
    
    if (response.data.success && response.data.data?.customers) {
      const customers = response.data.data.customers.map((c: any) => ({
        id: Number(c.customerId || c.id || c.Id),
        name: c.companyName || c.CompanyName || 'Unnamed Company'
      }));
      
      console.log('✅ [getAvailableCustomers] Successfully fetched customers:', customers.length);
      return customers;
    } else {
      console.error('❌ [getAvailableCustomers] Failed to fetch customers:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ [getAvailableCustomers] Error fetching customers:', error);
    return [];
  }
};

export const findCustomerById = async (id: number | string): Promise<AvailableCustomer | undefined> => {
  try {
    console.log('🔄 [findCustomerById] Looking for customer with ID:', id);
    
    const customers = await getAvailableCustomers();
    const searchId = typeof id === 'string' ? parseInt(id, 10) : id;
    const customer = customers.find(c => c.id === searchId);
    
    if (customer) {
      console.log('✅ [findCustomerById] Found customer:', customer.name);
    } else {
      console.log('⚠️ [findCustomerById] Customer not found for ID:', searchId);
    }
    
    return customer;
  } catch (error) {
    console.error('❌ [findCustomerById] Error finding customer:', error);
    return undefined;
  }
}; 