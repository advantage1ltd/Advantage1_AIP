import { customerService } from './customerService'

/**
 * Dynamic customer mapping service
 * Fetches customer IDs from the API instead of using static mappings
 */

interface CustomerMapping {
	id: number
	name: string
}

// Cache for customer mappings to avoid repeated API calls
let customerMappingCache: CustomerMapping[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches all customers from the API and caches the result
 */
const fetchCustomerMappings = async (): Promise<CustomerMapping[]> => {
	const now = Date.now()
	
	// Return cached data if still valid
	if (customerMappingCache && (now - cacheTimestamp) < CACHE_DURATION) {
		return customerMappingCache
	}

	try {
		const customers = await customerService.getAllCustomers()
		const mappings: CustomerMapping[] = customers.map(c => {
			// Handle both string and number IDs (backend returns customerId as number, frontend Customer type uses string)
			const customerId = typeof c.id === 'string' ? parseInt(c.id, 10) : (c.id as any)
			return {
				id: customerId,
				name: c.companyName
			}
		}).filter(c => !isNaN(c.id) && c.id > 0) // Filter out invalid IDs
		
		// Update cache
		customerMappingCache = mappings
		cacheTimestamp = now
		
		return mappings
	} catch (error) {
		console.error('Error fetching customer mappings:', error)
		// Return cached data if available, even if expired
		if (customerMappingCache) {
			return customerMappingCache
		}
		return []
	}
}

/**
 * Maps UserCompany name to customerId by querying the API
 * This ensures we use the actual customer IDs from the database
 */
export const mapUserCompanyToCustomerId = async (userCompany?: string | null): Promise<number | null> => {
	if (!userCompany) return null

	try {
		const mappings = await fetchCustomerMappings()
		const customer = mappings.find(c => c.name.trim().toLowerCase() === userCompany.trim().toLowerCase())
		
		if (customer) {
			return customer.id
		}
		
		return null
	} catch (error) {
		console.error('Error mapping UserCompany to customerId:', error)
		return null
	}
}

/**
 * Gets customer name by ID from the API
 */
export const getCustomerNameById = async (customerId: number): Promise<string | null> => {
	try {
		const mappings = await fetchCustomerMappings()
		const customer = mappings.find(c => c.id === customerId)
		return customer?.name || null
	} catch (error) {
		console.error('Error getting customer name by ID:', error)
		return null
	}
}

/**
 * Gets all customer mappings (cached)
 */
export const getCustomerMappings = async (): Promise<CustomerMapping[]> => {
	return await fetchCustomerMappings()
}

/**
 * Clears the customer mapping cache
 * Useful when customers are added/updated/deleted
 */
export const clearCustomerMappingCache = (): void => {
	customerMappingCache = null
	cacheTimestamp = 0
}

