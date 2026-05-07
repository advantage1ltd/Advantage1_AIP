import { api } from '@/config/api'
import { Deal, PipelineStage } from '@/data/pipeline'

export interface DealDto {
	dealId: number
	title: string
	value: number
	company: string
	contact: string
	email: string
	stage: string
	priority: string
	notes?: string
	crmContactId?: number
	crmContactName?: string
	dateCreated: string
	dateModified?: string
}

export interface DealCreateRequest {
	title: string
	value: number
	company: string
	contact: string
	email: string
	stage: string
	priority: string
	notes?: string
	crmContactId?: number
}

export interface DealUpdateRequest {
	title?: string
	value?: number
	company?: string
	contact?: string
	email?: string
	stage?: string
	priority?: string
	notes?: string
	crmContactId?: number
}

export interface DealListResponse {
	data: DealDto[]
	pagination: {
		currentPage: number
		pageSize: number
		totalCount: number
		totalPages: number
		hasPrevious: boolean
		hasNext: boolean
	}
}

export interface DealStats {
	totalPipelineValue: number
	averageDealValue: number
	totalDeals: number
	closedDeals: number
	conversionRate: number
	dealsByStage: Record<string, number>
	valueByStage: Record<string, number>
}

class DealService {
	private readonly baseUrl = '/Deal'

	/**
	 * Map backend DealDto to frontend Deal
	 */
	private mapToFrontendDeal(dto: DealDto): Deal {
		return {
			id: dto.dealId.toString(),
			title: dto.title,
			value: dto.value,
			company: dto.company,
			contact: dto.contact,
			email: dto.email,
			stage: dto.stage as PipelineStage,
			priority: dto.priority as 'low' | 'medium' | 'high',
			createdAt: dto.dateCreated,
			updatedAt: dto.dateModified || dto.dateCreated
		}
	}

	/**
	 * Map frontend Deal to backend DealCreateRequest
	 */
	private mapToCreateRequest(deal: Partial<Deal>): DealCreateRequest {
		return {
			title: deal.title!,
			value: deal.value!,
			company: deal.company!,
			contact: deal.contact!,
			email: deal.email!,
			stage: deal.stage!,
			priority: deal.priority!,
			notes: undefined,
			crmContactId: undefined
		}
	}

	/**
	 * Map frontend Deal to backend DealUpdateRequest
	 */
	private mapToUpdateRequest(deal: Partial<Deal>): DealUpdateRequest {
		return {
			title: deal.title,
			value: deal.value,
			company: deal.company,
			contact: deal.contact,
			email: deal.email,
			stage: deal.stage,
			priority: deal.priority,
			notes: undefined
		}
	}

	/**
	 * Get all deals with optional filtering and pagination
	 */
	async getAll(
		page: number = 1,
		pageSize: number = 1000,
		search?: string,
		stage?: string,
		priority?: string
	): Promise<Deal[]> {
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString()
			})
			if (search) params.append('search', search)
			if (stage) params.append('stage', stage)
			if (priority) params.append('priority', priority)

			const response = await api.get<{ success: boolean; data: DealListResponse }>(
				`${this.baseUrl}?${params.toString()}`
			)

			console.log('Get all deals response:', response.data)

			if (response.data.success && response.data.data) {
				const deals = response.data.data.data.map(dto => this.mapToFrontendDeal(dto))
				console.log(`Loaded ${deals.length} deals from API`)
				return deals
			}
			console.warn('Get all deals returned no data or failed')
			return []
		} catch (error: any) {
			console.error('Error fetching deals:', error)
			console.error('Error response:', error.response?.data)
			return []
		}
	}

	/**
	 * Get deal by ID
	 */
	async getById(id: string): Promise<Deal | null> {
		try {
			const response = await api.get<{ success: boolean; data: DealDto }>(
				`${this.baseUrl}/${id}`
			)

			if (response.data.success && response.data.data) {
				return this.mapToFrontendDeal(response.data.data)
			}
			return null
		} catch (error) {
			console.error('Error fetching deal:', error)
			return null
		}
	}

	/**
	 * Get deals by stage
	 */
	async getByStage(stage: string): Promise<Deal[]> {
		try {
			const response = await api.get<{ success: boolean; data: DealDto[] }>(
				`${this.baseUrl}/stage/${stage}`
			)

			if (response.data.success && response.data.data) {
				return response.data.data.map(dto => this.mapToFrontendDeal(dto))
			}
			return []
		} catch (error) {
			console.error('Error fetching deals by stage:', error)
			return []
		}
	}

	/**
	 * Get deal statistics
	 */
	async getStats(): Promise<DealStats | null> {
		try {
			const response = await api.get<{ success: boolean; data: DealStats }>(
				`${this.baseUrl}/stats`
			)

			if (response.data.success && response.data.data) {
				return response.data.data
			}
			return null
		} catch (error) {
			console.error('Error fetching deal stats:', error)
			return null
		}
	}

	/**
	 * Create a new deal
	 */
	async create(deal: Partial<Deal>): Promise<Deal | null> {
		try {
			const request = this.mapToCreateRequest(deal)
			console.log('Creating deal with request:', request)
			const response = await api.post<{ success: boolean; data: DealDto; message?: string }>(
				`${this.baseUrl}`,
				request
			)

			console.log('Create deal response:', response.data)

			if (response.data.success && response.data.data) {
				return this.mapToFrontendDeal(response.data.data)
			}
			console.error('Create deal failed:', response.data.message)
			return null
		} catch (error: any) {
			console.error('Error creating deal:', error)
			console.error('Error response:', error.response?.data)
			throw error
		}
	}

	/**
	 * Update an existing deal
	 */
	async update(id: string, deal: Partial<Deal>): Promise<Deal | null> {
		try {
			const request = this.mapToUpdateRequest(deal)
			const response = await api.put<{ success: boolean; data: DealDto }>(
				`${this.baseUrl}/${id}`,
				request
			)

			if (response.data.success && response.data.data) {
				return this.mapToFrontendDeal(response.data.data)
			}
			return null
		} catch (error) {
			console.error('Error updating deal:', error)
			throw error
		}
	}

	/**
	 * Delete a deal
	 */
	async delete(id: string): Promise<boolean> {
		try {
			const response = await api.delete<{ success: boolean }>(`${this.baseUrl}/${id}`)
			return response.data.success
		} catch (error) {
			console.error('Error deleting deal:', error)
			throw error
		}
	}
}

export const dealService = new DealService()
