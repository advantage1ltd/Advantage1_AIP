/**
 * Analytics Service
 * 
 * Provides analytics data for the Data Analytics Hub.
 * Currently uses mock data, ready to transition to real API calls.
 */

import type {
	AnalyticsHubData,
	CrimeTrendData,
	HotProductsData,
	RepeatOffenderData,
	DeploymentRecommendation,
	CrimeLinkingData,
} from '@/types/analytics'
import { generateMockAnalyticsData } from '@/data/mockAnalyticsData'

export interface StoreOption {
	id: number | string
	name: string
}

export interface RegionOption {
	id: number | string
	name: string
}

export interface AnalyticsQueryParams {
	customerId?: number
	startDate?: string
	endDate?: string
	storeIds?: number[]
	regionIds?: number[]
	stores?: StoreOption[]
	regions?: RegionOption[]
}

class AnalyticsService {
	private readonly baseUrl = '/analytics'

	/**
	 * Get complete analytics hub data
	 */
	async getAnalyticsHub(params?: AnalyticsQueryParams): Promise<AnalyticsHubData> {
		// TODO: Replace with real API call when backend is ready
		// const response = await api.get(this.baseUrl, { params })
		// return response.data

		// For now, return mock data with simulated delay
		await new Promise((resolve) => setTimeout(resolve, 500))
		return generateMockAnalyticsData(params)
	}

	/**
	 * Get crime trend analytics
	 */
	async getCrimeTrends(params?: AnalyticsQueryParams): Promise<CrimeTrendData> {
		const data = await this.getAnalyticsHub(params)
		return data.crimeTrends
	}

	/**
	 * Get hot products analytics
	 */
	async getHotProducts(params?: AnalyticsQueryParams): Promise<HotProductsData> {
		const data = await this.getAnalyticsHub(params)
		return data.hotProducts
	}

	/**
	 * Get repeat offender analytics
	 */
	async getRepeatOffenders(params?: AnalyticsQueryParams): Promise<RepeatOffenderData> {
		const data = await this.getAnalyticsHub(params)
		return data.repeatOffenders
	}

	/**
	 * Get deployment recommendations
	 */
	async getDeploymentRecommendations(
		params?: AnalyticsQueryParams
	): Promise<DeploymentRecommendation> {
		const data = await this.getAnalyticsHub(params)
		return data.deploymentRecommendations
	}

	/**
	 * Get crime linking data
	 */
	async getCrimeLinking(params?: AnalyticsQueryParams): Promise<CrimeLinkingData> {
		const data = await this.getAnalyticsHub(params)
		return data.crimeLinking
	}
}

export const analyticsService = new AnalyticsService()

