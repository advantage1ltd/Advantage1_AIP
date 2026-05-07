import { api, type ApiResponse } from '@/config/api'
import type { 
	BankHoliday, 
	BankHolidayResponse, 
	CreateBankHolidayDTO, 
	UpdateBankHolidayDTO,
	BankHolidayFilters 
} from '@/types/bankHoliday'

const BASE_URL = '/bank-holidays'

const mapBankHoliday = (holiday: BankHoliday): BankHoliday => ({
	...holiday,
})

const mapResponse = (response: ApiResponse<BankHolidayResponse> | BankHolidayResponse): BankHolidayResponse => {
	const payload = 'data' in response && Array.isArray((response as ApiResponse<BankHolidayResponse>).data?.data)
		? (response as ApiResponse<BankHolidayResponse>).data
		: response as BankHolidayResponse

	return {
		...payload,
		data: payload.data.map(mapBankHoliday)
	}
}

const mapSingle = (response: ApiResponse<BankHoliday> | BankHoliday): BankHoliday => {
	const payload = 'data' in response ? response.data : response
	return mapBankHoliday(payload)
}

export const bankHolidayService = {
	// Get bank holidays with pagination and filters
	getBankHolidays: async (filters: BankHolidayFilters = {}): Promise<BankHolidayResponse> => {
		const { data } = await api.get<ApiResponse<BankHolidayResponse> | BankHolidayResponse>(BASE_URL, { params: filters })
		return mapResponse(data)
	},

	// Get single bank holiday by ID
	getBankHoliday: async (id: string): Promise<BankHoliday> => {
		const { data } = await api.get<ApiResponse<BankHoliday> | BankHoliday>(`${BASE_URL}/${id}`)
		return mapSingle(data)
	},

	// Create new bank holiday
	createBankHoliday: async (bankHoliday: CreateBankHolidayDTO): Promise<BankHoliday> => {
		const { data } = await api.post<ApiResponse<BankHoliday> | BankHoliday>(BASE_URL, bankHoliday)
		return mapSingle(data)
	},

	// Update existing bank holiday
	updateBankHoliday: async (id: string, bankHoliday: UpdateBankHolidayDTO): Promise<BankHoliday> => {
		const { data } = await api.put<ApiResponse<BankHoliday> | BankHoliday>(`${BASE_URL}/${id}`, bankHoliday)
		return mapSingle(data)
	},

	// Delete bank holiday
	deleteBankHoliday: async (id: string): Promise<void> => {
		await api.delete(`${BASE_URL}/${id}`)
	},

	// Archive bank holiday
	archiveBankHoliday: async (id: string): Promise<BankHoliday> => {
		const { data } = await api.put<ApiResponse<BankHoliday> | BankHoliday>(`${BASE_URL}/${id}/archive`)
		return mapSingle(data)
	},

	// Unarchive bank holiday
	unarchiveBankHoliday: async (id: string): Promise<BankHoliday> => {
		const { data } = await api.put<ApiResponse<BankHoliday> | BankHoliday>(`${BASE_URL}/${id}/unarchive`)
		return mapSingle(data)
	}
}