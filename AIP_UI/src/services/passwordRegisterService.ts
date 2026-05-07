import { api } from '@/config/api'
import type {
	PasswordRegister,
	PasswordRegisterQueryParams,
	PasswordRegisterResponse,
	PasswordRegisterListResponse,
	CreatePasswordRegisterRequest,
	UpdatePasswordRegisterRequest,
} from '@/types/passwordRegister'

const ENDPOINT = '/password-register'

export interface PasswordRegisterService {
	getPasswords: (params?: PasswordRegisterQueryParams) => Promise<PasswordRegisterListResponse>
	getPasswordById: (id: number) => Promise<PasswordRegister>
	createPassword: (data: CreatePasswordRegisterRequest) => Promise<PasswordRegister>
	updatePassword: (id: number, data: UpdatePasswordRegisterRequest) => Promise<PasswordRegister>
	deletePassword: (id: number) => Promise<void>
}

class PasswordRegisterServiceImpl implements PasswordRegisterService {
	/**
	 * Get all passwords with optional filtering and pagination
	 */
	async getPasswords(params?: PasswordRegisterQueryParams): Promise<PasswordRegisterListResponse> {
		try {
			console.log('🔄 [PasswordRegisterService] Fetching passwords with params:', params)

			const queryParams = {
				page: params?.page ?? 1,
				pageSize: params?.pageSize ?? 10,
				...(params?.searchTerm ? { searchTerm: params.searchTerm } : {}),
				...(params?.category && params.category !== 'all' ? { category: params.category } : {}),
			}

			const response = await api.get<PasswordRegisterResponse>(ENDPOINT, { params: queryParams })

			console.log('✅ [PasswordRegisterService] Passwords fetched:', response.data)

			if (!response.data.success) {
				throw new Error(response.data.message || 'Failed to fetch passwords')
			}

			return response.data.results!
		} catch (error) {
			console.error('❌ [PasswordRegisterService] Error fetching passwords:', error)
			throw error
		}
	}

	/**
	 * Get a single password by ID
	 */
	async getPasswordById(id: number): Promise<PasswordRegister> {
		try {
			console.log('🔄 [PasswordRegisterService] Fetching password:', id)

			const response = await api.get<PasswordRegisterResponse>(`${ENDPOINT}/${id}`)

			console.log('✅ [PasswordRegisterService] Password fetched:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Password not found')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [PasswordRegisterService] Error fetching password:', error)
			throw error
		}
	}

	/**
	 * Create a new password
	 */
	async createPassword(data: CreatePasswordRegisterRequest): Promise<PasswordRegister> {
		try {
			console.log('🔄 [PasswordRegisterService] Creating password:', { ...data, password: '***' })

			const response = await api.post<PasswordRegisterResponse>(ENDPOINT, data)

			console.log('✅ [PasswordRegisterService] Password created:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Failed to create password')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [PasswordRegisterService] Error creating password:', error)
			throw error
		}
	}

	/**
	 * Update an existing password
	 */
	async updatePassword(id: number, data: UpdatePasswordRegisterRequest): Promise<PasswordRegister> {
		try {
			console.log('🔄 [PasswordRegisterService] Updating password:', id, { ...data, password: '***' })

			const response = await api.put<PasswordRegisterResponse>(`${ENDPOINT}/${id}`, data)

			console.log('✅ [PasswordRegisterService] Password updated:', response.data)

			if (!response.data.success || !response.data.data) {
				throw new Error(response.data.message || 'Failed to update password')
			}

			return response.data.data
		} catch (error) {
			console.error('❌ [PasswordRegisterService] Error updating password:', error)
			throw error
		}
	}

	/**
	 * Delete a password
	 */
	async deletePassword(id: number): Promise<void> {
		try {
			console.log('🔄 [PasswordRegisterService] Deleting password:', id)

			const response = await api.delete<PasswordRegisterResponse>(`${ENDPOINT}/${id}`)

			console.log('✅ [PasswordRegisterService] Password deleted:', response.data)

			if (!response.data.success) {
				throw new Error(response.data.message || 'Failed to delete password')
			}
		} catch (error) {
			console.error('❌ [PasswordRegisterService] Error deleting password:', error)
			throw error
		}
	}
}

export const passwordRegisterService = new PasswordRegisterServiceImpl()

