export interface CrimeInsightMetric {
	title: string
	value: string
	subtext?: string
	trend?: string
	trendIsPositive: boolean
}

export interface CrimeInsightListItem {
	name: string
	count: number
	value?: number
	percentage: number
	secondaryText?: string
}

export interface CrimeInsightTimeBucket {
	bucket: string
	count: number
	percentage: number
}

export interface CrimeInsightHotProduct {
	productName: string
	category?: string
	quantity: number
	totalValue: number
	mostTargetedStore?: string
	typicalTime?: string
}

export interface CrimeIntelligenceResponse {
	success: boolean
	message?: string
	heroMetrics: CrimeInsightMetric[]
	topIncidentTypes: CrimeInsightListItem[]
	topStores: CrimeInsightListItem[]
	topProducts: CrimeInsightListItem[]
	topRegions: CrimeInsightListItem[]
	timeBuckets: CrimeInsightTimeBucket[]
	hotProduct?: CrimeInsightHotProduct
	generatedAt: string
}

export interface CrimeIntelligenceQuery {
	customerId: number
	siteId?: string
	regionId?: string
	startDate?: string
	endDate?: string
}

