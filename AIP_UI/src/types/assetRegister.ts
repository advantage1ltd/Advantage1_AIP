// Asset Register types matching backend DTOs

export type AssetType = 'Laptop' | 'Phone' | 'Tablet' | 'Desktop' | 'Monitor' | 'Printer' | 'Other'
export type AssetStatus = 'In Use' | 'In Stock' | 'In Repair' | 'Disposed'

export interface AssetRegister {
	id: number
	assetTag: string
	assetType: AssetType
	make: string
	model: string
	serialNumber: string
	purchaseDate: string
	assignedTo?: string
	location: string
	status: AssetStatus
	notes?: string
	purchaseCost?: number
	warrantyExpiryDate?: string
}

export interface CreateAssetRegisterRequest {
	assetTag: string
	assetType: string
	make: string
	model: string
	serialNumber: string
	purchaseDate: string
	assignedTo?: string
	location: string
	status: string
	notes?: string
	purchaseCost?: number
	warrantyExpiryDate?: string
}

export interface UpdateAssetRegisterRequest {
	assetTag: string
	assetType: string
	make: string
	model: string
	serialNumber: string
	purchaseDate: string
	assignedTo?: string
	location: string
	status: string
	notes?: string
	purchaseCost?: number
	warrantyExpiryDate?: string
}

export interface AssetRegisterQueryParams {
	searchTerm?: string
	assetType?: string
	status?: string
	page?: number
	pageSize?: number
}

export interface AssetRegisterStats {
	totalAssets: number
	inUse: number
	inStock: number
	inRepair: number
	disposed: number
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

export interface AssetRegisterListResponse {
	items: AssetRegister[]
	pagination: PaginationInfo
	stats: AssetRegisterStats
}

export interface AssetRegisterResponse {
	success: boolean
	message?: string
	data?: AssetRegister
	results?: AssetRegisterListResponse
}

