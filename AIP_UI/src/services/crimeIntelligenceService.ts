import { CrimeIntelligenceQuery, CrimeIntelligenceResponse } from '@/types/crimeIntelligence'
import { BASE_API_URL } from '@/config/api'

const buildQueryString = (params: CrimeIntelligenceQuery) => {
	const search = new URLSearchParams()
	search.append('customerId', params.customerId.toString())
	if (params.siteId) search.append('siteId', params.siteId)
	if (params.regionId) search.append('regionId', params.regionId)
	if (params.startDate) search.append('startDate', params.startDate)
	if (params.endDate) search.append('endDate', params.endDate)
	return search.toString()
}

export const crimeIntelligenceService = {
	async getInsights(query: CrimeIntelligenceQuery): Promise<CrimeIntelligenceResponse> {
		const qs = buildQueryString(query)
		const response = await fetch(`${BASE_API_URL}/incidents/insights?${qs}`, {
			headers: {
				'Content-Type': 'application/json',
				'X-Customer-Id': query.customerId.toString()
			}
		})

		if (!response.ok) {
			throw new Error('Failed to fetch crime intelligence data')
		}

		return response.json()
	}
}

export type CrimeIntelligenceService = typeof crimeIntelligenceService

