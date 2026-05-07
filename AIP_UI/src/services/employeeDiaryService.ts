import { api } from '@/config/api'
import type { BackendApiResponse } from '@/types/backend-api'
import type { EmployeeDiary } from '@/types/employeeDiary'

export const employeeDiaryService = {
	getEmployeeDiary: async (employeeId: number): Promise<EmployeeDiary> => {
		const response = await api.get<BackendApiResponse<EmployeeDiary>>(`/employee/${employeeId}/diary`)
		const apiResponse = response.data

		const success = Boolean(apiResponse?.Success ?? apiResponse?.success ?? false)
		if (!success) {
			const message = String(apiResponse?.Message ?? apiResponse?.message ?? 'Failed to load employee diary')
			const errors = (apiResponse?.Errors ?? apiResponse?.errors ?? []).filter(Boolean)
			throw new Error(errors[0] || message)
		}

		const data = (apiResponse?.Data ?? apiResponse?.data) ?? null
		if (!data) throw new Error('Employee diary loaded but no data returned')

		return data
	},
}

