export interface BackendApiResponse<T> {
	Success?: boolean
	Message?: string
	Data?: T
	Errors?: string[]
	Timestamp?: string

	// Some endpoints/environments may camelCase response properties
	success?: boolean
	message?: string
	data?: T
	errors?: string[]
	timestamp?: string
}

export const getApiSuccess = (response: BackendApiResponse<unknown> | undefined): boolean =>
	Boolean(response?.Success ?? response?.success ?? false)

export const getApiMessage = (response: BackendApiResponse<unknown> | undefined): string =>
	String(response?.Message ?? response?.message ?? '')

export const getApiData = <T>(response: BackendApiResponse<T> | undefined): T | null => {
	const data = response?.Data ?? response?.data
	return data ?? null
}

export const getApiErrors = (response: BackendApiResponse<unknown> | undefined): string[] =>
	(response?.Errors ?? response?.errors ?? []).filter(Boolean)

