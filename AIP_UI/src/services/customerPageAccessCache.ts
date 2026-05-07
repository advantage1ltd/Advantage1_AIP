import { customerPageAccessApi, type CustomerPageAccessResponse } from '@/api/customerPageAccess'

const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
	data: CustomerPageAccessResponse
	timestamp: number
}

const cache = new Map<number, CacheEntry>()

const isFresh = (entry?: CacheEntry) => {
	if (!entry) return false
	return Date.now() - entry.timestamp < CACHE_TTL_MS
}

export const customerPageAccessCache = {
	async get(customerId: number, options?: { force?: boolean }): Promise<CustomerPageAccessResponse> {
		if (!options?.force) {
			const cached = cache.get(customerId)
			if (isFresh(cached)) {
				console.log('💾 [CustomerPageAccessCache] Cache hit for customer', customerId)
				return cached!.data
			}
		}

		console.log('🔄 [CustomerPageAccessCache] Fetching page access for customer', customerId)
		const data = await customerPageAccessApi.getCustomerPageAccess(customerId)
		cache.set(customerId, { data, timestamp: Date.now() })
		return data
	},
	set(customerId: number, data: CustomerPageAccessResponse) {
		cache.set(customerId, { data, timestamp: Date.now() })
	},
	clear(customerId?: number) {
		if (typeof customerId === 'number') {
			cache.delete(customerId)
			return
		}
		cache.clear()
	}
}

