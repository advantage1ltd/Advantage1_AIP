import { api } from '@/config/api'

export interface SavedLocation {
	id: number
	userId: string
	name: string
	postcode: string
	createdAt: string
}

export interface CreateSavedLocationDto {
	name: string
	postcode: string
}

export interface UpdateSavedLocationDto {
	name: string
	postcode: string
}

const BASE_URL = '/SavedLocation'

export const savedLocationService = {
	/** Get all saved locations for the current user */
	getUserLocations: async (): Promise<SavedLocation[]> => {
		const response = await api.get<SavedLocation[]>(BASE_URL)
		return response.data
	},

	/** Create a new saved location */
	createLocation: async (dto: CreateSavedLocationDto): Promise<SavedLocation> => {
		const response = await api.post<SavedLocation>(BASE_URL, dto)
		return response.data
	},

	/** Update an existing saved location */
	updateLocation: async (id: number, dto: UpdateSavedLocationDto): Promise<SavedLocation> => {
		const response = await api.put<SavedLocation>(`${BASE_URL}/${id}`, dto)
		return response.data
	},

	/** Delete a saved location */
	deleteLocation: async (id: number): Promise<void> => {
		await api.delete(`${BASE_URL}/${id}`)
	}
}

