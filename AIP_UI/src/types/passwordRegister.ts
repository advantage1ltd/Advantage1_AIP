// Password Register types matching backend DTOs

export interface PasswordRegister {
	id: number
	title: string
	userName: string
	password: string
	url?: string
	notes?: string
	category?: string
	passwordLastChanged?: string
	createdAt: string
}

export interface CreatePasswordRegisterRequest {
	title: string
	userName: string
	password: string
	url?: string
	notes?: string
	category?: string
}

export interface UpdatePasswordRegisterRequest {
	title: string
	userName: string
	password: string
	url?: string
	notes?: string
	category?: string
}

export interface PasswordRegisterQueryParams {
	searchTerm?: string
	category?: string
	page?: number
	pageSize?: number
}

export interface PasswordRegisterStats {
	totalPasswords: number
	passwordsWithUrl: number
	passwordsWithNotes: number
}

export interface PaginationInfo {
	currentPage: number
	pageSize: number
	totalCount: number
	totalPages: number
	hasPrevious: boolean
	hasNext: boolean
}

export interface PasswordRegisterListResponse {
	items: PasswordRegister[]
	pagination: PaginationInfo
	stats: PasswordRegisterStats
}

export interface PasswordRegisterResponse {
	success: boolean
	message?: string
	data?: PasswordRegister
	results?: PasswordRegisterListResponse
}

