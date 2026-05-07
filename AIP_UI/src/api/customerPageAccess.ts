import { ApiResponse, api } from '@/config/api'

export interface CustomerPageAccessPage {
	id: number
	pageId: string
	title: string
	path: string
	category?: string
	description?: string
	sortOrder: number
}

export interface CustomerPageAccessResponse {
	customerId: number
	customerName: string
	availablePages: CustomerPageAccessPage[]
	assignedPageIds: string[]
}

export interface UpdateCustomerPageAccessRequest {
	customerId: number
	pageIds: string[]
}

export const customerPageAccessApi = {
	getCustomerPageAccess: async (customerId: number): Promise<CustomerPageAccessResponse> => {
		const response = await api.get<ApiResponse<CustomerPageAccessResponse>>(
			`/customer-page-access/${customerId}`,
			{
				headers: {
					'X-Customer-Id': customerId.toString()
				}
			}
		)
		if (!response.data?.data) {
			throw new Error('Failed to fetch customer page access')
		}
		return response.data.data
	},

	updateCustomerPageAccess: async (
		customerId: number,
		pageIds: string[]
	): Promise<CustomerPageAccessResponse> => {
		const response = await api.put<ApiResponse<CustomerPageAccessResponse>>(
			`/customer-page-access/${customerId}`,
			{ customerId, pageIds }
		)
		if (!response.data?.data) {
			throw new Error('Failed to update customer page access')
		}
		return response.data.data
	}
}

