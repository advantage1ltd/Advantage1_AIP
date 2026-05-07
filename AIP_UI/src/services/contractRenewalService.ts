import { api } from '@/config/api'
import type {
	ContractRenewal,
	ContractRenewalQueryParams,
	ContractRenewalResponse,
	ContractRenewalListResponse,
	CreateContractRenewalRequest,
	UpdateContractRenewalRequest,
} from '@/types/contractRenewal'

const ENDPOINT = '/contract-renewal'

export interface ContractRenewalService {
	getContracts: (params?: ContractRenewalQueryParams) => Promise<ContractRenewalListResponse>
	getContractById: (id: number) => Promise<ContractRenewal>
	createContract: (data: CreateContractRenewalRequest) => Promise<ContractRenewal>
	updateContract: (id: number, data: UpdateContractRenewalRequest) => Promise<ContractRenewal>
	deleteContract: (id: number) => Promise<void>
}

class ContractRenewalServiceImpl implements ContractRenewalService {
	/**
	 * Get all contracts with optional filtering and pagination
	 */
	async getContracts(params?: ContractRenewalQueryParams): Promise<ContractRenewalListResponse> {
		try {
			console.log('🔄 [ContractRenewalService] Fetching contracts with params:', params)

			const queryParams = {
				page: params?.page ?? 1,
				pageSize: params?.pageSize ?? 10,
				...(params?.searchTerm ? { searchTerm: params.searchTerm } : {}),
				...(params?.contractType && params.contractType !== 'all' ? { contractType: params.contractType } : {}),
			}

			const response = await api.get<ContractRenewalResponse>(ENDPOINT, { params: queryParams })

			console.log('✅ [ContractRenewalService] Contracts fetched:', response.data)

			if (!response.data.success) {
				throw new Error(response.data.message || 'Failed to fetch contracts')
			}

			return response.data.results!
		} catch (error) {
			console.error('❌ [ContractRenewalService] Error fetching contracts:', error)
			throw error
		}
	}

	/**
	 * Get a single contract by ID
	 */
	async getContractById(id: number): Promise<ContractRenewal> {
		try {
			console.log('🔄 [ContractRenewalService] Fetching contract:', id)

			const response = await api.get<ContractRenewalResponse>(`${ENDPOINT}/${id}`)

			console.log('✅ [ContractRenewalService] Contract fetched:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Contract not found')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [ContractRenewalService] Error fetching contract:', error)
			throw error
		}
	}

	/**
	 * Create a new contract
	 */
	async createContract(data: CreateContractRenewalRequest): Promise<ContractRenewal> {
		try {
			console.log('🔄 [ContractRenewalService] Creating contract:', data)

			const response = await api.post<ContractRenewalResponse>(ENDPOINT, data)

			console.log('✅ [ContractRenewalService] Contract created:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Failed to create contract')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [ContractRenewalService] Error creating contract:', error)
			throw error
		}
	}

	/**
	 * Update an existing contract
	 */
	async updateContract(id: number, data: UpdateContractRenewalRequest): Promise<ContractRenewal> {
		try {
			console.log('🔄 [ContractRenewalService] Updating contract:', id, data)

			const response = await api.put<ContractRenewalResponse>(`${ENDPOINT}/${id}`, data)

			console.log('✅ [ContractRenewalService] Contract updated:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Failed to update contract')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [ContractRenewalService] Error updating contract:', error)
			throw error
		}
	}

	/**
	 * Delete a contract
	 */
	async deleteContract(id: number): Promise<void> {
		try {
			console.log('🔄 [ContractRenewalService] Deleting contract:', id)

			const response = await api.delete<ContractRenewalResponse>(`${ENDPOINT}/${id}`)

			console.log('✅ [ContractRenewalService] Contract deleted:', response.data)

			if (!response.data.success) {
				throw new Error(response.data.message || 'Failed to delete contract')
			}
		} catch (error) {
			console.error('❌ [ContractRenewalService] Error deleting contract:', error)
			throw error
		}
	}
}

export const contractRenewalService = new ContractRenewalServiceImpl()

