// Contract renewal types matching backend DTOs

export type ContractType = 'Antivirus' | 'Cyber Essentials' | 'Software Subscription' | 'Hardware Maintenance' | 'Other'
export type ContractStatus = 'Active' | 'Expiring Soon' | 'Critical'

export interface ContractRenewal {
	id: number
	contractName: string
	contractType: ContractType
	provider: string
	startDate: string
	expiryDate: string
	cost: number
	notes?: string
	status: ContractStatus
	monthsRemaining: number
	alertSent30Days: boolean
}

export interface CreateContractRenewalRequest {
	contractName: string
	contractType: string
	provider: string
	startDate: string
	expiryDate: string
	cost: number
	notes?: string
}

export interface UpdateContractRenewalRequest {
	contractName: string
	contractType: string
	provider: string
	startDate: string
	expiryDate: string
	cost: number
	notes?: string
}

export interface ContractRenewalQueryParams {
	searchTerm?: string
	contractType?: string
	page?: number
	pageSize?: number
}

export interface ContractRenewalStats {
	totalContracts: number
	criticalExpiry: number
	expiringSoon: number
	totalValue: number
}

export interface PaginationInfo {
	currentPage: number
	pageSize: number
	totalCount: number
	totalPages: number
	hasPrevious: boolean
	hasNext: boolean
}

export interface ContractRenewalListResponse {
	items: ContractRenewal[]
	pagination: PaginationInfo
	stats: ContractRenewalStats
}

export interface ContractRenewalResponse {
	success: boolean
	message?: string
	data?: ContractRenewal
	results?: ContractRenewalListResponse
}

