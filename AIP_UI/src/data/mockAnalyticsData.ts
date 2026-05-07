/**
 * Mock Analytics Data Generator
 * 
 * Generates realistic dummy data for all analytics modules.
 * This will be replaced with real API calls when the backend is ready.
 */

import type {
	AnalyticsHubData,
	CrimeTrendData,
	HotProductsData,
	RepeatOffenderData,
	DeploymentRecommendation,
	CrimeLinkingData,
	AnalyticsQueryParams,
} from '@/types/analytics'
import type { StoreOption, RegionOption } from '@/services/analyticsService'

// Fallback stores if none provided
const DEFAULT_STORES = [
	{ id: 1, name: 'Oxford Street Flagship' },
	{ id: 2, name: 'Manchester Central' },
	{ id: 3, name: 'Birmingham Mall' },
	{ id: 4, name: 'Leeds High Street' },
	{ id: 5, name: 'Liverpool One' },
	{ id: 6, name: 'Bristol City Centre' },
	{ id: 7, name: 'Edinburgh Princes Street' },
	{ id: 8, name: 'Glasgow Buchanan Street' },
]

// Helper to get stores to use
const getStoresToUse = (params?: AnalyticsQueryParams): StoreOption[] => {
	if (params?.stores && params.stores.length > 0) {
		return params.stores
	}
	return DEFAULT_STORES
}

const INCIDENT_TYPES = [
	'Theft',
	'Shoplifting',
	'Anti-social Behavior',
	'Suspicious Activity',
	'Assault',
	'Vandalism',
	'Fraud',
	'Disturbance',
]

const PRODUCTS = [
	{ barcode: '1234567890123', name: 'Premium Electronics - Laptop' },
	{ barcode: '2345678901234', name: 'Designer Clothing - Jacket' },
	{ barcode: '3456789012345', name: 'Cosmetics - Perfume Set' },
	{ barcode: '4567890123456', name: 'Mobile Phone - Latest Model' },
	{ barcode: '5678901234567', name: 'Alcohol - Premium Whiskey' },
	{ barcode: '6789012345678', name: 'Jewelry - Gold Watch' },
	{ barcode: '7890123456789', name: 'Sports Equipment - Bike' },
	{ barcode: '8901234567890', name: 'Gaming Console' },
	{ barcode: '9012345678901', name: 'Tablet Device' },
	{ barcode: '0123456789012', name: 'Headphones - Wireless' },
]

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
	const hour = i
	if (hour === 0) return '12 AM'
	if (hour < 12) return `${hour} AM`
	if (hour === 12) return '12 PM'
	return `${hour - 12} PM`
})

/**
 * Generate random number between min and max (inclusive)
 */
const randomInt = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate random float between min and max
 */
const randomFloat = (min: number, max: number): number => {
	return Math.random() * (max - min) + min
}

/**
 * Pick random item from array
 */
const randomItem = <T>(items: T[]): T => {
	return items[Math.floor(Math.random() * items.length)]
}

/**
 * Generate multiple random items
 */
const randomItems = <T>(items: T[], count: number): T[] => {
	const shuffled = [...items].sort(() => 0.5 - Math.random())
	return shuffled.slice(0, count)
}

/**
 * Generate date string for N days ago
 */
const daysAgo = (days: number): string => {
	const date = new Date()
	date.setDate(date.getDate() - days)
	return date.toISOString().split('T')[0]
}

/**
 * Generate crime trend data
 */
const generateCrimeTrendData = (params?: AnalyticsQueryParams): CrimeTrendData => {
	const storesToUse = getStoresToUse(params)
	const endDate = params?.endDate || new Date().toISOString().split('T')[0]
	const startDate = params?.startDate || daysAgo(90)

	// Day of week data (Friday and Saturday typically highest)
	const dayOfWeekData = DAYS_OF_WEEK.map((day, index) => {
		const baseIncidents = day === 'Friday' || day === 'Saturday' ? randomInt(45, 65) : randomInt(20, 40)
		return {
			day,
			incidents: baseIncidents,
			stores: randomInt(3, 7),
			percentage: 0, // Will calculate after
		}
	})

	const totalDayIncidents = dayOfWeekData.reduce((sum, d) => sum + d.incidents, 0)
	dayOfWeekData.forEach((d) => {
		d.percentage = (d.incidents / totalDayIncidents) * 100
	})

	// Time of day data (store hours: 7am to 10pm)
	// Only generate data for hours 7-22 (7 AM to 10 PM)
	const timeOfDayData = Array.from({ length: 24 }, (_, hour) => {
		// Store hours: 7 AM (hour 7) to 10 PM (hour 22)
		if (hour < 7 || hour > 22) {
			// Outside store hours - return zero incidents
			return {
				hour,
				label: HOUR_LABELS[hour],
				incidents: 0,
				percentage: 0,
			}
		}

		let baseIncidents = randomInt(5, 15)
		
		// Peak hours during store operation: 14-17 (2-5 PM) and 19-22 (7-10 PM)
		if (hour >= 14 && hour <= 17) {
			baseIncidents = randomInt(25, 40)
		} else if (hour >= 19 && hour <= 22) {
			baseIncidents = randomInt(30, 45)
		} else if (hour >= 7 && hour <= 10) {
			// Early morning hours after opening (7-10 AM)
			baseIncidents = randomInt(8, 18)
		} else if (hour >= 11 && hour <= 13) {
			// Midday hours (11 AM - 1 PM)
			baseIncidents = randomInt(12, 25)
		}

		return {
			hour,
			label: HOUR_LABELS[hour],
			incidents: baseIncidents,
			percentage: 0, // Will calculate after
		}
	})

	// Filter to only store hours and calculate percentages based on operational hours
	const operationalHoursData = timeOfDayData.filter((d) => d.hour >= 7 && d.hour <= 22)
	const totalHourIncidents = operationalHoursData.reduce((sum, d) => sum + d.incidents, 0)
	operationalHoursData.forEach((d) => {
		d.percentage = totalHourIncidents > 0 ? (d.incidents / totalHourIncidents) * 100 : 0
	})
	
	// Return only operational hours data
	const timeOfDayDataFiltered = operationalHoursData

	// Incident type breakdown
	const incidentTypeData = INCIDENT_TYPES.map((type) => {
		const count = randomInt(15, 85)
		return {
			type,
			count,
			percentage: 0, // Will calculate after
			totalValue: randomFloat(500, 5000),
		}
	})

	const totalTypeCount = incidentTypeData.reduce((sum, d) => sum + d.count, 0)
	incidentTypeData.forEach((d) => {
		d.percentage = (d.count / totalTypeCount) * 100
	})

	// Store drilldown data
	const storeDrilldown: Record<string, CrimeTrendData['storeDrilldown'][string]> = {}
	
	storesToUse.forEach((store) => {
		const incidentTypes = INCIDENT_TYPES.slice(0, randomInt(3, 6)).map((type) => ({
			type,
			count: randomInt(2, 15),
			percentage: 0,
			totalValue: randomFloat(100, 800),
		}))

		const typeTotal = incidentTypes.reduce((sum, t) => sum + t.count, 0)
		incidentTypes.forEach((t) => {
			t.percentage = (t.count / typeTotal) * 100
		})

		storeDrilldown[store.name] = {
			storeId: typeof store.id === 'number' ? store.id : Number(store.id) || 0,
			storeName: store.name,
			incidents: randomInt(10, 50),
			incidentTypes,
			peakDay: randomItem(['Friday', 'Saturday', 'Sunday']),
			peakHour: randomInt(7, 22), // Within store operating hours
		}
	})

	return {
		dayOfWeek: dayOfWeekData,
		timeOfDay: timeOfDayDataFiltered,
		incidentTypes: incidentTypeData,
		storeDrilldown,
		totalIncidents: totalDayIncidents,
		dateRange: {
			start: startDate,
			end: endDate,
		},
	}
}

/**
 * Generate hot products data
 */
const generateHotProductsData = (params?: AnalyticsQueryParams): HotProductsData => {
	const storesToUse = getStoresToUse(params)
	const endDate = params?.endDate || new Date().toISOString().split('T')[0]
	const startDate = params?.startDate || daysAgo(90)

	// Top products by frequency
	const topProducts = PRODUCTS.slice(0, 10).map((product, index) => ({
		barcode: product.barcode,
		productName: product.name,
		frequency: randomInt(15 - index * 2, 25 - index * 2),
		totalValue: randomFloat(1000, 5000),
		storesAffected: randomInt(2, 7),
	}))

	// Store heatmap
	const storeHeatmap = storesToUse.map((store) => {
		const productCount = randomInt(4, 8)
		const storeProducts = randomItems(PRODUCTS, productCount).map((product) => ({
			barcode: product.barcode,
			productName: product.name,
			frequency: randomInt(2, 12),
			value: randomFloat(200, 1500),
		}))

		const totalIncidents = storeProducts.reduce((sum, p) => sum + p.frequency, 0)
		
		let riskLevel: 'low' | 'medium' | 'high' | 'critical'
		if (totalIncidents >= 30) riskLevel = 'critical'
		else if (totalIncidents >= 20) riskLevel = 'high'
		else if (totalIncidents >= 10) riskLevel = 'medium'
		else riskLevel = 'low'

		return {
			storeId: typeof store.id === 'number' ? store.id : Number(store.id) || 0,
			storeName: store.name,
			products: storeProducts,
			totalIncidents,
			riskLevel,
		}
	})

	const totalValueLost = topProducts.reduce((sum, p) => sum + p.totalValue, 0)

	return {
		topProducts,
		storeHeatmap,
		totalValueLost,
		period: {
			start: startDate,
			end: endDate,
		},
	}
}

/**
 * Generate repeat offender data
 */
const generateRepeatOffenderData = (params?: AnalyticsQueryParams): RepeatOffenderData => {
	const storesToUse = getStoresToUse(params)
	const endDate = params?.endDate || new Date().toISOString().split('T')[0]
	const startDate = params?.startDate || daysAgo(90)

	// Most active offenders
	const offenderCount = randomInt(8, 15)
	const offenders: RepeatOffenderData['mostActive'] = []

	for (let i = 0; i < offenderCount; i++) {
		const incidentCount = randomInt(3, 12)
		const storesTargeted = randomItems(storesToUse, randomInt(2, 5)).map((s) => s.name)

		let riskLevel: 'low' | 'medium' | 'high' | 'critical'
		if (incidentCount >= 10) riskLevel = 'critical'
		else if (incidentCount >= 7) riskLevel = 'high'
		else if (incidentCount >= 5) riskLevel = 'medium'
		else riskLevel = 'low'

		const modusOperandi = randomItems(
			['Late evening entry', 'Distraction technique', 'Group operation', 'Solo quick grab', 'Return policy abuse'],
			randomInt(1, 3)
		)

		offenders.push({
			offenderId: `OFF-${String(i + 1).padStart(3, '0')}`,
			name: `Offender ${String(i + 1).padStart(3, '0')}`,
			incidentCount,
			firstIncident: daysAgo(randomInt(60, 85)),
			lastIncident: daysAgo(randomInt(1, 10)),
			storesTargeted,
			totalValue: randomFloat(500, 3000),
			riskLevel,
			modusOperandi,
		})
	}

	// Sort by incident count descending
	offenders.sort((a, b) => b.incidentCount - a.incidentCount)

	// Cross-store movements
	const crossStoreMovements: RepeatOffenderData['crossStoreMovements'] = offenders
		.slice(0, 5)
		.map((offender) => {
			const movementCount = randomInt(3, 8)
			const movements = []

			for (let i = 0; i < movementCount; i++) {
				const stores = randomItems(storesToUse, 2)
				movements.push({
					fromStore: stores[0].name,
					toStore: stores[1].name,
					date: daysAgo(randomInt(1, 60)),
					incidentType: randomItem(INCIDENT_TYPES),
				})
			}

			return {
				offenderId: offender.offenderId,
				offenderName: offender.name,
				movements,
				totalStores: new Set(movements.flatMap((m) => [m.fromStore, m.toStore])).size,
			}
		})

	// Network map (simplified)
	const networkNodes: RepeatOffenderData['networkMap']['nodes'] = []
	const networkLinks: RepeatOffenderData['networkMap']['links'] = []

	// Add offender nodes
	offenders.slice(0, 8).forEach((offender, index) => {
		networkNodes.push({
			id: offender.offenderId,
			name: offender.name,
			type: 'offender',
			x: Math.cos((index / 8) * 2 * Math.PI) * 100,
			y: Math.sin((index / 8) * 2 * Math.PI) * 100,
		})
	})

	// Add store nodes
	storesToUse.slice(0, Math.min(5, storesToUse.length)).forEach((store, index) => {
		networkNodes.push({
			id: `store-${store.id}`,
			name: store.name,
			type: 'store',
			x: Math.cos((index / 5) * 2 * Math.PI) * 150,
			y: Math.sin((index / 5) * 2 * Math.PI) * 150,
		})
	})

	// Add links between offenders and stores
		offenders.slice(0, 8).forEach((offender) => {
			const connectedStores = randomItems(storesToUse.slice(0, Math.min(5, storesToUse.length)), randomInt(2, 4))
		connectedStores.forEach((store) => {
			networkLinks.push({
				source: offender.offenderId,
				target: `store-${store.id}`,
				strength: randomFloat(0.3, 1.0),
				incidentCount: randomInt(1, 5),
			})
		})
	})

	return {
		mostActive: offenders,
		crossStoreMovements,
		networkMap: {
			nodes: networkNodes,
			links: networkLinks,
		},
		totalOffenders: offenderCount,
	}
}

/**
 * Generate deployment recommendations
 */
const generateDeploymentRecommendations = (
	params?: AnalyticsQueryParams
): DeploymentRecommendation => {
	const storesToUse = getStoresToUse(params)
	const bestTimes: DeploymentRecommendation['bestTimes'] = []

	// Generate recommendations for peak days/hours (within store operating hours: 7 AM - 10 PM)
	const peakDays = ['Friday', 'Saturday', 'Sunday']
	const peakHours = [14, 15, 16, 17, 19, 20, 21, 22] // All within 7 AM - 10 PM range
	const allOperationalHours = Array.from({ length: 16 }, (_, i) => i + 7) // Hours 7 to 22

	peakDays.forEach((day) => {
		peakHours.forEach((hour) => {
			const officerType = randomItem<DeploymentRecommendation['bestTimes'][0]['officerType']>([
				'uniform',
				'store detectives',
			])

			let priority: DeploymentRecommendation['bestTimes'][0]['priority']
			if (day === 'Saturday' && hour >= 19 && hour <= 21) {
				priority = 'critical'
			} else if (peakHours.includes(hour)) {
				priority = 'high'
			} else {
				priority = 'medium'
			}

			const recommendedLPM = priority === 'critical' || (priority === 'high' && randomInt(1, 3) === 1)

			const reasons = [
				'High incident frequency',
				'Peak customer traffic',
				'Historical pattern',
				'Multiple store alerts',
			]

			bestTimes.push({
				day,
				hour,
				hourLabel: HOUR_LABELS[hour],
				recommendedOfficers: randomInt(2, 4),
				officerType,
				recommendedLPM,
				priority,
				reason: randomItem(reasons),
				expectedIncidents: randomInt(5, 15),
			})
		})
	})

	// Store risk rankings
	const storeRankings: DeploymentRecommendation['storeRankings'] = storesToUse.map((store, index) => {
		const incidentCount = randomInt(15, 55)
		
		let riskLevel: 'low' | 'medium' | 'high' | 'critical'
		let riskScore: number
		if (incidentCount >= 45) {
			riskLevel = 'critical'
			riskScore = randomFloat(85, 100)
		} else if (incidentCount >= 35) {
			riskLevel = 'high'
			riskScore = randomFloat(70, 85)
		} else if (incidentCount >= 25) {
			riskLevel = 'medium'
			riskScore = randomFloat(50, 70)
		} else {
			riskLevel = 'low'
			riskScore = randomFloat(20, 50)
		}

		const trend = randomItem<DeploymentRecommendation['storeRankings'][0]['trend']>([
			'increasing',
			'stable',
			'decreasing',
		])

	const officerType: DeploymentRecommendation['storeRankings'][0]['recommendedOfficerType'] = 
		riskLevel === 'critical' || riskLevel === 'high' 
			? 'uniform'
			: 'store detectives'
	
	// Recommend LPM for critical/high risk stores
	const recommendedLPM = riskLevel === 'critical' || riskLevel === 'high'

		// Only recommend hours within store operating hours (7 AM - 10 PM)
		const recommendedHours = randomItems(allOperationalHours.map(String), randomInt(3, 6))

		return {
			storeId: typeof store.id === 'number' ? store.id : Number(store.id) || 0,
			storeName: store.name,
			riskScore,
			riskLevel,
			incidentCount,
			trend,
			recommendedOfficerType: officerType,
			recommendedLPM,
			recommendedHours,
			priority: incidentCount,
		}
	})

	// Sort by priority (descending)
	storeRankings.sort((a, b) => b.priority - a.priority)

	const overallStrategies = [
		'Focus uniform officers on high-risk stores during peak hours (Fri-Sun, 2-5 PM and 7-10 PM).',
		'Deploy store detectives to identify repeat offenders in medium-risk locations.',
		'Implement LPM presence at critical locations during peak shopping periods.',
	]

	return {
		bestTimes,
		storeRankings,
		overallStrategy: randomItem(overallStrategies),
		lastUpdated: new Date().toISOString(),
	}
}

/**
 * Generate crime linking data
 */
const generateCrimeLinkingData = (params?: AnalyticsQueryParams): CrimeLinkingData => {
	const storesToUse = getStoresToUse(params)
	const endDate = params?.endDate || new Date().toISOString().split('T')[0]
	const startDate = params?.startDate || daysAgo(90)

	// Incident clusters
	const clusterCount = randomInt(5, 10)
	const clusters: CrimeLinkingData['clusters'] = []

	for (let i = 0; i < clusterCount; i++) {
		const incidentCount = randomInt(3, 8)
		const incidents: CrimeLinkingData['clusters'][0]['incidents'] = []

		const commonStore = randomItem(storesToUse)
		const commonType = randomItem(INCIDENT_TYPES)
		const commonFeatures = randomItems(
			['Same time pattern', 'Similar description', 'Same product type', 'Matching MO'],
			randomInt(2, 4)
		)

		for (let j = 0; j < incidentCount; j++) {
			incidents.push({
				incidentId: `INC-${String(i * 10 + j).padStart(4, '0')}`,
				date: daysAgo(randomInt(1, 60)),
				storeName: commonStore.name,
				incidentType: commonType,
				value: randomFloat(100, 500),
				similarityScore: randomFloat(0.75, 0.95),
				matchingFeatures: commonFeatures,
			})
		}

		const dates = incidents.map((i) => i.date).sort()
		
		clusters.push({
			clusterId: `CLUSTER-${String(i + 1).padStart(3, '0')}`,
			incidents,
			commonFeatures,
			suspectedOffender: {
				id: `OFF-${String(i + 1).padStart(3, '0')}`,
				name: `Offender ${String(i + 1).padStart(3, '0')}`,
				confidence: randomFloat(0.65, 0.90),
			},
			totalValue: incidents.reduce((sum, i) => sum + i.value, 0),
			dateRange: {
				start: dates[0],
				end: dates[dates.length - 1],
			},
		})
	}

	// Offender chains
	const chainCount = randomInt(4, 8)
	const chains: CrimeLinkingData['offenderChains'] = []

	for (let i = 0; i < chainCount; i++) {
		const incidentCount = randomInt(4, 10)
		const incidents: CrimeLinkingData['offenderChains'][0]['incidents'] = []

		const offenderId = `OFF-${String(i + 1).padStart(3, '0')}`
		const offenderName = `Offender ${String(i + 1).padStart(3, '0')}`

		for (let j = 0; j < incidentCount; j++) {
			incidents.push({
				incidentId: `INC-${String(i * 10 + j).padStart(4, '0')}`,
				date: daysAgo(randomInt(1, 60)),
				storeName: randomItem(storesToUse).name,
				incidentType: randomItem(INCIDENT_TYPES),
				offenderId,
				offenderName,
				value: randomFloat(150, 600),
				similarityScore: randomFloat(0.80, 0.98),
				matchingFeatures: ['Confirmed offender', 'Similar MO', 'Cross-store pattern'],
			})
		}

		incidents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		const timeline = incidents.map((inc) => ({
			date: inc.date,
			store: inc.storeName,
			incidentType: inc.incidentType,
		}))

		const patterns = ['Geographic progression', 'Time-based escalation', 'Random targeting', 'High-value focus']
		
		chains.push({
			chainId: `CHAIN-${String(i + 1).padStart(3, '0')}`,
			offenderId,
			offenderName,
			incidents,
			timeline,
			totalValue: incidents.reduce((sum, i) => sum + i.value, 0),
			pattern: randomItem(patterns),
		})
	}

	return {
		clusters,
		offenderChains: chains,
		totalLinkedIncidents: clusters.reduce((sum, c) => sum + c.incidents.length, 0) +
			chains.reduce((sum, c) => sum + c.incidents.length, 0),
		period: {
			start: startDate,
			end: endDate,
		},
	}
}

/**
 * Generate complete analytics hub data
 */
export const generateMockAnalyticsData = (params?: AnalyticsQueryParams): AnalyticsHubData => {
	const endDate = params?.endDate || new Date().toISOString().split('T')[0]
	const startDate = params?.startDate || daysAgo(90)

	return {
		crimeTrends: generateCrimeTrendData(params),
		hotProducts: generateHotProductsData(params),
		repeatOffenders: generateRepeatOffenderData(params),
		deploymentRecommendations: generateDeploymentRecommendations(params),
		crimeLinking: generateCrimeLinkingData(params),
		metadata: {
			generatedAt: new Date().toISOString(),
			dateRange: {
				start: startDate,
				end: endDate,
			},
			customerId: params?.customerId,
		},
	}
}

