import { Incident, IncidentStats, RepeatOffenderSearchPayload, RepeatOffenderSearchResponse } from '@/types/incidents'
import { getCurrentCustomerId } from '@/lib/utils'
import { BASE_API_URL } from '@/config/api'

export interface IncidentGraphData {
	id: string
	customerId: number
	customerName: string
	siteName: string
	siteId: string
	regionId: string
	regionName: string
	location: string
	officerName: string
	officerRole: string
	officerType: string
	dutyManagerName: string
	dateOfIncident: string
	timeOfIncident: string
	incidentType: string
	type: string
	actionCode: string
	description: string
	incidentDetails?: string
	storeComments?: string
	incidentInvolved: string[]
	stolenItems: Array<{
		id: string
		category: string
		description: string
		productName: string
		cost: number
		quantity: number
		totalAmount: number
	}>
	totalValueRecovered: number
	value: number
	valueRecovered: number
	quantityRecovered: number
	quantity: number
	amount: number
	total: number
	policeInvolvement: boolean
	urnNumber: string
	crimeRefNumber: string
	policeID: string
	status: 'pending' | 'resolved' | 'in-progress'
	priority: 'low' | 'medium' | 'high'
	actionTaken: string
	evidenceAttached: boolean
	witnessStatements: string[]
	involvedParties: string[]
	reportNumber: string
	offenderName: string
	offenderSex: string
	gender: 'Male' | 'Female' | 'N/A or N/K'
	offenderDOB: string
	offenderPlaceOfBirth: string
	offenderAddress: {
		houseName?: string
		numberAndStreet?: string
		villageOrSuburb?: string
		town?: string
		county?: string
		postCode?: string
	}
	arrestSaveComment: string
	dateInputted: string
	assignedTo: string
	store?: string // Legacy field for backward compatibility
}

export interface IncidentGraphResponse {
	success: boolean
	data: {
		incidents: IncidentGraphData[]
		totals: {
			totalValue: number
			totalQuantity: number
			totalIncidents: number
		}
		filters: {
			customerId: number
			regionId?: string
			officerType: string
			graphType: string
			startDate?: string
			endDate?: string
		}
	}
}

export interface IncidentTypeData {
	code: string
	type: string
	count: number
	description: string
	fullName: string
}

export interface IncidentTypesResponse {
	success: boolean
	data: IncidentTypeData[]
}

export interface IncidentGraphFilters {
	customerId: number
	startDate?: string
	endDate?: string
	regionId?: string
	officerType?: string
	graphType?: string
}

/**
 * Fetch incident graph data with filtering
 */
export const fetchIncidentGraphData = async (
	filters: IncidentGraphFilters
): Promise<IncidentGraphResponse> => {
	const searchParams = new URLSearchParams()
	
	// Add filters to search params
	searchParams.append('customerId', filters.customerId.toString())
	if (filters.startDate) searchParams.append('startDate', filters.startDate)
	if (filters.endDate) searchParams.append('endDate', filters.endDate)
	if (filters.regionId) searchParams.append('regionId', filters.regionId)
	if (filters.officerType) searchParams.append('officerType', filters.officerType)
	if (filters.graphType) searchParams.append('graphType', filters.graphType)

	const response = await fetch(`${BASE_API_URL}/incidents/graph-data?${searchParams}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Customer-Id': filters.customerId.toString()
		}
	})

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}

	return response.json()
}

/**
 * Fetch incident types summary with filtering
 */
export const fetchIncidentTypesData = async (
	filters: Omit<IncidentGraphFilters, 'graphType'>
): Promise<IncidentTypesResponse> => {
	const searchParams = new URLSearchParams()
	
	// Add filters to search params
	searchParams.append('customerId', filters.customerId.toString())
	if (filters.startDate) searchParams.append('startDate', filters.startDate)
	if (filters.endDate) searchParams.append('endDate', filters.endDate)
	if (filters.regionId) searchParams.append('regionId', filters.regionId)
	if (filters.officerType) searchParams.append('officerType', filters.officerType)

	const response = await fetch(`${BASE_API_URL}/incidents/types-summary?${searchParams}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Customer-Id': filters.customerId.toString()
		}
	})

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}

	return response.json()
}

/**
 * Fetch available regions for a customer
 */
export const fetchCustomerRegions = async (customerId: number): Promise<{ success: boolean; data: string[] }> => {
	const response = await fetch(`${BASE_API_URL}/incidents/regions?customerId=${customerId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Customer-Id': customerId.toString()
		}
	})

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}

	return response.json()
}

export const incidentService = {
	// Get all incidents (filtered by customer if customer ID available)
	async getIncidents(): Promise<Incident[]> {
		try {
			const customerId = getCurrentCustomerId()
			const headers: HeadersInit = {}
			
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}
			
			const response = await fetch(`${BASE_API_URL}/incidents`, { headers })
			const result = await response.json()
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to fetch incidents')
			}
			
			return result.data
		} catch (error) {
			console.error('Error fetching incidents:', error)
			throw error
		}
	},

	// Get incident by ID
	async getIncidentById(id: string): Promise<Incident> {
		try {
			const customerId = getCurrentCustomerId()
			const headers: HeadersInit = {}
			
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}
			
			const response = await fetch(`${BASE_API_URL}/incidents/${id}`, { headers })
			const result = await response.json()
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to fetch incident')
			}
			
			return result.data
		} catch (error) {
			console.error('Error fetching incident:', error)
			throw error
		}
	},

	// Get incidents by customer ID
	async getIncidentsByCustomer(customerId: string): Promise<Incident[]> {
		try {
			const headers: HeadersInit = {
				'X-Customer-Id': customerId
			}
			
			const response = await fetch(`${BASE_API_URL}/incidents`, { headers })
			const result = await response.json()
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to fetch incidents')
			}
			
			return result.data
		} catch (error) {
			console.error('Error fetching incidents by customer:', error)
			throw error
		}
	},

	// Get incident statistics
	async getIncidentStats(): Promise<IncidentStats> {
		try {
			const customerId = getCurrentCustomerId()
			const headers: HeadersInit = {}
			
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}
			
			const response = await fetch(`${BASE_API_URL}/incidents/stats`, { headers })
			const result = await response.json()
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to fetch incident stats')
			}
			
			return result.data
		} catch (error) {
			console.error('Error fetching incident stats:', error)
			throw error
		}
	},

	// Create new incident
	async createIncident(incident: Partial<Incident>): Promise<void> {
		try {
			const customerId = getCurrentCustomerId()
			const headers: HeadersInit = {
				'Content-Type': 'application/json'
			}
			
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}
			
			const response = await fetch(`${BASE_API_URL}/incidents`, {
				method: 'POST',
				headers,
				body: JSON.stringify(incident)
			})
			
			const result = await response.json()
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to create incident')
			}
		} catch (error) {
			console.error('Error creating incident:', error)
			throw error
		}
	},

	// Update incident
	async updateIncident(id: string, incident: Partial<Incident>): Promise<void> {
		try {
			const customerId = getCurrentCustomerId()
			const headers: HeadersInit = {
				'Content-Type': 'application/json'
			}
			
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}
			
			const response = await fetch(`${BASE_API_URL}/incidents/${id}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify(incident)
			})
			
			const result = await response.json()
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to update incident')
			}
		} catch (error) {
			console.error('Error updating incident:', error)
			throw error
		}
	},

	// Delete incident
	async deleteIncident(id: string): Promise<void> {
		try {
			const customerId = getCurrentCustomerId()
			const headers: HeadersInit = {}
			
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}
			
			const response = await fetch(`${BASE_API_URL}/incidents/${id}`, {
				method: 'DELETE',
				headers
			})
			
			const result = await response.json()
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to delete incident')
			}
		} catch (error) {
			console.error('Error deleting incident:', error)
			throw error
		}
	},

	async searchRepeatOffenders(payload: RepeatOffenderSearchPayload): Promise<RepeatOffenderSearchResponse> {
		const searchParams = new URLSearchParams()
		if (payload.name) searchParams.append('name', payload.name)
		if (payload.dateOfBirth) searchParams.append('dateOfBirth', payload.dateOfBirth)
		if (payload.marks) searchParams.append('marks', payload.marks)
		if (payload.page) searchParams.append('page', payload.page.toString())
		if (payload.pageSize) searchParams.append('pageSize', payload.pageSize.toString())

		const response = await fetch(`${BASE_API_URL}/incidents/repeat-offenders?${searchParams}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		const result: RepeatOffenderSearchResponse = await response.json()
		if (!response.ok || !result.success) {
			throw new Error(result.message || 'Failed to search repeat offenders')
		}

		return result
	}
} 