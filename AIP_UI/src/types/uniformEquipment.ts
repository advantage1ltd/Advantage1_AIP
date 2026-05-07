// ========== Equipment Request Types ==========

export interface UniformEquipmentRequest {
  id: number
  equipmentType: string
  size?: string
  quantity: number
  reason?: string
  priority: 'Normal' | 'Urgent'
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled' | 'Cancelled'
  requesterId: string
  requesterName: string
  reviewedBy?: string
  reviewedByName?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateEquipmentRequestDto {
  equipmentType: string
  size?: string
  quantity: number
  reason?: string
  priority: 'Normal' | 'Urgent'
}

export interface ReviewEquipmentRequestDto {
  id: number
  status: 'Approved' | 'Rejected'
  reviewNotes?: string
}

// ========== Issued Equipment Types ==========

export interface UniformEquipmentIssued {
  id: number
  equipmentType: string
  size?: string
  quantity: number
  condition: 'New' | 'Good' | 'Fair' | 'Poor'
  dateIssued: string
  dateReturned?: string
  notes?: string
  officerId: string
  officerName: string
  issuedById: string
  issuedByName: string
  requestId?: number
  createdAt: string
  updatedAt?: string
}

export interface CreateIssuedEquipmentDto {
  equipmentType: string
  size?: string
  quantity: number
  condition: 'New' | 'Good' | 'Fair' | 'Poor'
  dateIssued: string
  notes?: string
  officerId: string
  officerName: string
  requestId?: number
}

export interface UpdateIssuedEquipmentDto {
  id: number
  equipmentType: string
  size?: string
  quantity: number
  condition: 'New' | 'Good' | 'Fair' | 'Poor'
  dateIssued: string
  dateReturned?: string
  notes?: string
  officerId: string
  officerName: string
}

// ========== Query Types ==========

export interface UniformEquipmentQueryDto {
  search?: string
  equipmentType?: string
  status?: string
  officerId?: string
  priority?: string
  page?: number
  pageSize?: number
}

// ========== Stats Types ==========

export interface UniformEquipmentStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalIssued: number
  issuedByType: Record<string, number>
  requestsByType: Record<string, number>
}

// ========== List Types ==========

export interface UniformEquipmentRequestList {
  items: UniformEquipmentRequest[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UniformEquipmentIssuedList {
  items: UniformEquipmentIssued[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ========== Helper Types ==========

export interface OfficerDropdown {
  id: string
  name: string
  employeeNumber?: string
}

// ========== Constants ==========

export const EQUIPMENT_TYPES = [
  'Uniform Shirt',
  'Uniform Trousers',
  'Uniform Jacket',
  'Hi-Vis Vest',
  'Boots',
  'Belt',
  'Badge',
  'ID Card',
  'Radio',
  'Torch',
  'Body Camera',
  'Handcuffs',
  'Baton',
  'Hat/Cap',
  'Tie',
  'Gloves',
  'Raincoat',
  'Other'
] as const

export const UNIFORM_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL'
] as const

export const BOOT_SIZES = [
  '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'
] as const

// Equipment types that require size selection
export const SIZE_REQUIRED_EQUIPMENT = [
  'Uniform Shirt',
  'Uniform Trousers',
  'Uniform Jacket',
  'Hi-Vis Vest',
  'Boots',
  'Hat/Cap',
  'Gloves',
  'Raincoat'
] as const

// Equipment types that do NOT require size
export const NO_SIZE_EQUIPMENT = [
  'Belt',
  'Badge',
  'ID Card',
  'Radio',
  'Torch',
  'Body Camera',
  'Handcuffs',
  'Baton',
  'Tie',
  'Other'
] as const

// Helper function to check if equipment requires size
export const requiresSize = (equipmentType: string): boolean => {
  return SIZE_REQUIRED_EQUIPMENT.includes(equipmentType as typeof SIZE_REQUIRED_EQUIPMENT[number])
}

export const CONDITION_TYPES = ['New', 'Good', 'Fair', 'Poor'] as const

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Fulfilled: 'bg-blue-100 text-blue-800 border-blue-200',
  Cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
}

export const CONDITION_COLORS: Record<string, string> = {
  New: 'bg-emerald-100 text-emerald-800',
  Good: 'bg-blue-100 text-blue-800',
  Fair: 'bg-amber-100 text-amber-800',
  Poor: 'bg-red-100 text-red-800'
}

export const PRIORITY_COLORS: Record<string, string> = {
  Normal: 'bg-gray-100 text-gray-700',
  Urgent: 'bg-red-100 text-red-700'
}

