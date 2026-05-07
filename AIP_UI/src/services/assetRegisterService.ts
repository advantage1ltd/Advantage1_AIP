import { api } from '@/config/api'
import type {
	AssetRegister,
	AssetRegisterQueryParams,
	AssetRegisterResponse,
	AssetRegisterListResponse,
	CreateAssetRegisterRequest,
	UpdateAssetRegisterRequest,
} from '@/types/assetRegister'

const ENDPOINT = '/asset-register'

export interface AssetRegisterService {
	getAssets: (params?: AssetRegisterQueryParams) => Promise<AssetRegisterListResponse>
	getAssetById: (id: number) => Promise<AssetRegister>
	createAsset: (data: CreateAssetRegisterRequest) => Promise<AssetRegister>
	updateAsset: (id: number, data: UpdateAssetRegisterRequest) => Promise<AssetRegister>
	deleteAsset: (id: number) => Promise<void>
	checkAssetTagUnique: (assetTag: string, excludeId?: number) => Promise<boolean>
}

class AssetRegisterServiceImpl implements AssetRegisterService {
	/**
	 * Get all assets with optional filtering and pagination
	 */
	async getAssets(params?: AssetRegisterQueryParams): Promise<AssetRegisterListResponse> {
		try {
			console.log('🔄 [AssetRegisterService] Fetching assets with params:', params)

			const queryParams = {
				page: params?.page ?? 1,
				pageSize: params?.pageSize ?? 10,
				...(params?.searchTerm ? { searchTerm: params.searchTerm } : {}),
				...(params?.assetType && params.assetType !== 'all' ? { assetType: params.assetType } : {}),
				...(params?.status && params.status !== 'all' ? { status: params.status } : {}),
			}

			const response = await api.get<AssetRegisterResponse>(ENDPOINT, { params: queryParams })

			console.log('✅ [AssetRegisterService] Assets fetched:', response.data)

			if (!response.data.success) {
				throw new Error(response.data.message || 'Failed to fetch assets')
			}

			return response.data.results!
		} catch (error) {
			console.error('❌ [AssetRegisterService] Error fetching assets:', error)
			throw error
		}
	}

	/**
	 * Get a single asset by ID
	 */
	async getAssetById(id: number): Promise<AssetRegister> {
		try {
			console.log('🔄 [AssetRegisterService] Fetching asset:', id)

			const response = await api.get<AssetRegisterResponse>(`${ENDPOINT}/${id}`)

			console.log('✅ [AssetRegisterService] Asset fetched:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Asset not found')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [AssetRegisterService] Error fetching asset:', error)
			throw error
		}
	}

	/**
	 * Create a new asset
	 */
	async createAsset(data: CreateAssetRegisterRequest): Promise<AssetRegister> {
		try {
			console.log('🔄 [AssetRegisterService] Creating asset:', data)

			const response = await api.post<AssetRegisterResponse>(ENDPOINT, data)

			console.log('✅ [AssetRegisterService] Asset created:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Failed to create asset')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [AssetRegisterService] Error creating asset:', error)
			throw error
		}
	}

	/**
	 * Update an existing asset
	 */
	async updateAsset(id: number, data: UpdateAssetRegisterRequest): Promise<AssetRegister> {
		try {
			console.log('🔄 [AssetRegisterService] Updating asset:', id, data)

			const response = await api.put<AssetRegisterResponse>(`${ENDPOINT}/${id}`, data)

			console.log('✅ [AssetRegisterService] Asset updated:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Failed to update asset')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [AssetRegisterService] Error updating asset:', error)
			throw error
		}
	}

	/**
	 * Delete an asset
	 */
	async deleteAsset(id: number): Promise<void> {
		try {
			console.log('🔄 [AssetRegisterService] Deleting asset:', id)

			const response = await api.delete<AssetRegisterResponse>(`${ENDPOINT}/${id}`)

			console.log('✅ [AssetRegisterService] Asset deleted:', response.data)

			if (!response.data.success) {
				throw new Error(response.data.message || 'Failed to delete asset')
			}
		} catch (error) {
			console.error('❌ [AssetRegisterService] Error deleting asset:', error)
			throw error
		}
	}

	/**
	 * Check if an asset tag is unique
	 */
	async checkAssetTagUnique(assetTag: string, excludeId?: number): Promise<boolean> {
		try {
			const params = { assetTag, ...(excludeId ? { excludeId } : {}) }
			const response = await api.get<{ isUnique: boolean }>(`${ENDPOINT}/check-tag`, { params })
			return response.data.isUnique
		} catch (error) {
			console.error('❌ [AssetRegisterService] Error checking asset tag:', error)
			return false
		}
	}
}

export const assetRegisterService = new AssetRegisterServiceImpl()

