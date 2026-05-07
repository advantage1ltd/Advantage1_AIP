import { 
	IncidentGraphData, 
	IncidentGraphResponse, 
	IncidentTypeData, 
	IncidentTypesResponse, 
	IncidentGraphFilters 
} from '@/services/incidentService'
import { api, BASE_API_URL } from '@/config/api'
import { regionService } from '@/services/regionService'
import { getCurrentCustomerId } from '@/lib/utils'

export interface RegionOption {
	id: string
	name: string
}

/**
 * Service for fetching incident graph data and analytics
 */
export const incidentGraphService = {
	/**
	 * Fetch incident graph data with filtering
	 * Note: This endpoint may need to be created in the backend
	 * For now, we'll fetch incidents and aggregate them client-side
	 */
	async fetchGraphData(filters: IncidentGraphFilters): Promise<IncidentGraphResponse> {
		// Build search params outside try block so it's available in catch
		const searchParams = new URLSearchParams()
		searchParams.append('page', '1')
		searchParams.append('pageSize', '1000') // Get all incidents for aggregation
		searchParams.append('customerId', filters.customerId.toString())
		if (filters.startDate) searchParams.append('fromDate', filters.startDate)
		if (filters.endDate) searchParams.append('toDate', filters.endDate)
		
		const requestUrl = `/incidents?${searchParams.toString()}`
		
		try {
			// For now, fetch incidents and aggregate on client-side
			// TODO: Create backend endpoint /api/incidents/graph-data
			const headers: Record<string, string> = {}
			const customerId = getCurrentCustomerId()
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}

			const response = await api.get(requestUrl, { headers })

			// Aggregate incidents into graph data
			const incidents = response.data.data || []
			
			// Debug: Log incident data
			console.log('🔍 [IncidentGraphService] Total incidents received:', incidents.length)
			if (incidents.length > 0) {
				console.log('🔍 [IncidentGraphService] First incident sample:', {
					id: incidents[0].id,
					officerName: incidents[0].officerName,
					officerRole: incidents[0].officerRole,
					officerType: incidents[0].officerType,
					siteName: incidents[0].siteName,
					hasOfficerRole: 'officerRole' in incidents[0],
					allKeys: Object.keys(incidents[0])
				})
				
				// Count incidents by officerRole
				const roleCounts = incidents.reduce((acc: Record<string, number>, inc: any) => {
					const role = inc.officerRole || inc.OfficerRole || 'Missing'
					acc[role] = (acc[role] || 0) + 1
					return acc
				}, {})
				console.log('🔍 [IncidentGraphService] Incidents by officerRole:', roleCounts)
			}
			
			const graphData: IncidentGraphData[] = []

			// Group by location (siteName) for location-based charts
			const groupedByLocation = new Map<string, { 
				value: number
				count: number
				quantity: number
				valueRecovered: number
				totalValueRecovered: number
				siteName: string
			}>()

			let filteredCount = 0
			let skippedNoRole = 0
			let skippedByFilter = 0
			
			incidents.forEach((incident: any) => {
				// Get location/site name - use siteName, siteId, or location field
				const location = incident.siteName || incident.location || incident.siteId || 'Unknown Location'
				if (!location || location === '') return

				// Apply region filter if specified
				if (filters.regionId) {
					const incidentRegionId = extractRegionId(incident)
					if (!incidentRegionId || incidentRegionId !== filters.regionId) {
						skippedByFilter++
						return
					}
				}

				// Apply officer role filter if specified (only when not 'all')
				if (filters.officerType && filters.officerType !== 'all') {
					// Filter by officerRole field (values: 'Uniform Officer' or 'Store Detective')
					// Handle both camelCase and PascalCase (in case backend returns PascalCase)
					const officerRole = incident.officerRole || incident.OfficerRole || ''
					if (!officerRole) {
						skippedNoRole++
						return // Skip incidents without officerRole when filtering
					}
					if (filters.officerType === 'uniform' && officerRole !== 'Uniform Officer') {
						skippedByFilter++
						return
					}
					if (filters.officerType === 'detective' && officerRole !== 'Store Detective') {
						skippedByFilter++
						return
					}
				}
				
				filteredCount++

				const existing = groupedByLocation.get(location) || { 
					value: 0, 
					count: 0,
					quantity: 0,
					valueRecovered: 0,
					totalValueRecovered: 0,
					siteName: location
				}
				
				existing.count += 1
				
				// Aggregate values based on graph type
				if (filters.graphType === 'value') {
					// For value-based graphs, sum up the value
					const incidentValue = incident.value || incident.totalValueRecovered || incident.valueRecovered || incident.amount || 0
					existing.value += incidentValue
					existing.valueRecovered += incident.valueRecovered || 0
					existing.totalValueRecovered += incident.totalValueRecovered || 0
				} else if (filters.graphType === 'quantity') {
					// For quantity-based graphs, sum up the quantity
					existing.quantity += incident.quantityRecovered || incident.quantity || 1
					existing.value += incident.quantityRecovered || incident.quantity || 1
				} else {
					// For count-based graphs
					existing.value += 1
				}
				
				groupedByLocation.set(location, existing)
			})
			
			// Debug: Log filtering results
			console.log('🔍 [IncidentGraphService] Filtering results:', {
				totalIncidents: incidents.length,
				filteredCount,
				skippedNoRole,
				skippedByFilter,
				locationsFound: groupedByLocation.size,
				officerTypeFilter: filters.officerType
			})

			// Calculate totals
			let totalValue = 0
			let totalQuantity = 0
			let totalIncidents = 0

			// Convert to array format
			groupedByLocation.forEach((data, location) => {
				const date = new Date().toISOString().split('T')[0] // Use current date as placeholder
				// Find a sample incident from this location to get additional metadata
				const sampleIncident = incidents.find((inc: any) => 
					(inc.siteName || inc.location || inc.siteId) === location
				)
				
				graphData.push({
					id: `location-${location}`,
					customerId: filters.customerId,
					customerName: sampleIncident?.customerName || '',
					siteName: location,
					siteId: sampleIncident?.siteId || location,
					regionId: sampleIncident?.regionId || '',
					regionName: sampleIncident?.regionName || '',
					location: location, // Use siteName as location for display
					officerName: '',
					officerRole: '',
					officerType: '',
					dutyManagerName: '',
					dateOfIncident: date,
					timeOfIncident: '',
					date,
					incidentType: '',
					type: '',
					actionCode: '',
					description: '',
					incidentInvolved: [],
					stolenItems: [],
					totalValueRecovered: data.totalValueRecovered,
					value: data.value,
					valueRecovered: data.valueRecovered,
					quantityRecovered: data.quantity,
					quantity: data.quantity,
					amount: data.value,
					total: data.value,
					policeInvolvement: false,
					urnNumber: '',
					crimeRefNumber: '',
					policeID: '',
					status: 'resolved' as const,
					priority: 'medium' as const,
					actionTaken: '',
					evidenceAttached: false,
					witnessStatements: [],
					involvedParties: [],
					reportNumber: '',
					offenderName: '',
					offenderSex: '',
					gender: 'N/A or N/K' as const,
					offenderDOB: '',
					offenderPlaceOfBirth: '',
					offenderAddress: {},
					arrestSaveComment: '',
					dateInputted: date,
					assignedTo: '',
					count: data.count
				})
				totalValue += data.value
				totalQuantity += data.quantity || data.count
				totalIncidents += data.count
			})

			// Sort by value descending (highest first)
			graphData.sort((a, b) => b.value - a.value)

			return {
				success: true,
				data: {
					incidents: graphData,
					totals: {
						totalValue,
						totalQuantity,
						totalIncidents
					},
					filters: {
						customerId: filters.customerId,
						regionId: filters.regionId,
						officerType: filters.officerType || 'all',
						graphType: filters.graphType || 'value',
						startDate: filters.startDate,
						endDate: filters.endDate
					}
				}
			}
		} catch (error: any) {
			console.error('❌ [IncidentGraphService] Error fetching incident graph data:', error)
			
			// Provide more detailed error information
			if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
				console.error('❌ [IncidentGraphService] Network Error - Backend may not be running or unreachable')
				console.error('   API URL:', BASE_API_URL)
				console.error('   Request URL:', requestUrl)
				console.error('   Full URL:', `${BASE_API_URL}${requestUrl}`)
			}
			
			return {
				success: false,
				data: {
					incidents: [],
					totals: {
						totalValue: 0,
						totalQuantity: 0,
						totalIncidents: 0
					},
					filters: {
						customerId: filters.customerId,
						regionId: filters.regionId,
						officerType: filters.officerType || 'all',
						graphType: filters.graphType || 'value',
						startDate: filters.startDate,
						endDate: filters.endDate
					}
				}
			}
		}
	},

	/**
	 * Fetch incident types summary with filtering
	 * Note: This endpoint may need to be created in the backend
	 * For now, we'll fetch incidents and aggregate them client-side
	 */
	async fetchTypesData(filters: Omit<IncidentGraphFilters, 'graphType'>): Promise<IncidentTypesResponse> {
		try {
			// Fetch incidents and aggregate by type
			// TODO: Create backend endpoint /api/incidents/types-summary
			const searchParams = new URLSearchParams()
			searchParams.append('page', '1')
			searchParams.append('pageSize', '1000') // Get all incidents for aggregation
			searchParams.append('customerId', filters.customerId.toString())
			if (filters.startDate) searchParams.append('fromDate', filters.startDate)
			if (filters.endDate) searchParams.append('toDate', filters.endDate)

			const headers: Record<string, string> = {}
			const customerId = getCurrentCustomerId()
			if (customerId) {
				headers['X-Customer-Id'] = customerId.toString()
			}

			const response = await api.get(`/incidents?${searchParams.toString()}`, { headers })

			// Aggregate incidents by type
			const incidents = response.data.data || []
			const typeMap = new Map<string, number>()

			incidents.forEach((incident: any) => {
				// Apply region filter if specified
				if (filters.regionId) {
					const incidentRegionId = extractRegionId(incident)
					if (!incidentRegionId || incidentRegionId !== filters.regionId) {
						return
					}
				}

				// Apply officer role filter if specified
				if (filters.officerType && filters.officerType !== 'all') {
					// Filter by officerRole field (values: 'Uniform Officer' or 'Store Detective')
					// Handle both camelCase and PascalCase (in case backend returns PascalCase)
					const officerRole = incident.officerRole || incident.OfficerRole || ''
					if (!officerRole) {
						return // Skip incidents without officerRole
					}
					if (filters.officerType === 'uniform' && officerRole !== 'Uniform Officer') return
					if (filters.officerType === 'detective' && officerRole !== 'Store Detective') return
				}

				const type = incident.incidentType || 'Unknown'
				typeMap.set(type, (typeMap.get(type) || 0) + 1)
			})

			// Convert to array format
			const typeData: IncidentTypeData[] = Array.from(typeMap.entries()).map(([type, count]) => ({
				type,
				count
			}))

			// Sort by count descending
			typeData.sort((a, b) => b.count - a.count)

			return {
				success: true,
				data: typeData
			}
		} catch (error: any) {
			console.error('❌ [IncidentGraphService] Error fetching incident types data:', error)
			
			// Provide more detailed error information
			if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
				console.error('❌ [IncidentGraphService] Network Error - Backend may not be running or unreachable')
				console.error('   API URL:', BASE_API_URL)
			}
			
			return {
				success: false,
				data: [],
				message: error instanceof Error ? error.message : 'Failed to fetch types data'
			}
		}
	},

	/**
	 * Fetch available regions for a customer
	 */
	async fetchRegions(customerId: number): Promise<{ success: boolean; data: RegionOption[] }> {
		try {
			// Use the existing regionService to get regions for the customer
			const result = await regionService.getRegionsByCustomer(customerId)
			
			if (result.success) {
				const regionOptions = result.data
					.filter(region => (region.regionID ?? region.RegionID ?? (region as any).id) !== undefined)
					.map(region => ({
						id: (region.regionID ?? region.RegionID ?? (region as any).id).toString(),
						name: region.regionName || region.RegionName || 'Unnamed Region'
					}))
				return {
					success: true,
					data: regionOptions
				}
			}
			
			return {
				success: false,
				data: []
			}
		} catch (error) {
			console.error('Error fetching regions:', error)
			return {
				success: false,
				data: []
			}
		}
	}
}

// Re-export types for convenience
const extractRegionId = (incident: any): string | undefined => {
	return incident.regionId?.toString()
		|| incident.RegionId?.toString()
		|| incident.regionID?.toString()
		|| incident.RegionID?.toString()
}

// Re-export types for convenience
export type { 
	IncidentGraphData, 
	IncidentGraphResponse, 
	IncidentTypeData, 
	IncidentTypesResponse, 
	IncidentGraphFilters, 
	RegionOption 
} 