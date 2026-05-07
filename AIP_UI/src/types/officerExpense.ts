// ============ Main Types ============

export interface OfficerExpenseClaim {
  id: number
  officerId: string
  officerName: string
  weekStartDate: string
  weekEndDate: string
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'AutoApproved'
  weekTotal: number
  approvedByName?: string
  approvedAt?: string
  approvalNotes?: string
  createdAt: string
  days: OfficerExpenseDay[]
}

export interface OfficerExpenseDay {
  id: number
  dayName: string
  date: string
  totalTravel: number
  totalMileage: number
  totalOther: number
  totalExpense: number
  accommodation?: number
  incidentals?: number
  toolsEquipment?: number
  sundries?: number
  sundriesDescription?: string
  mileageEntries: OfficerExpenseMileage[]
  travelEntries: OfficerExpenseTravel[]
}

export interface OfficerExpenseMileage {
  id: number
  vehicleType: 'car' | 'car_passenger' | 'bicycle' | 'motorbike'
  startLocation: string
  startPostcode: string
  endLocation: string
  endPostcode: string
  returnTrip: boolean
  mileage: number
  calculatedExpense: number
}

export interface OfficerExpenseTravel {
  id: number
  transportType: 'train' | 'bus' | 'taxi'
  description?: string
  amount: number
}

// ============ DTOs ============

export interface CreateOfficerExpenseClaimDto {
  weekStartDate: string
  weekEndDate: string
  days: CreateOfficerExpenseDayDto[]
}

export interface CreateOfficerExpenseDayDto {
  dayName: string
  date: string
  accommodation?: number
  incidentals?: number
  toolsEquipment?: number
  sundries?: number
  sundriesDescription?: string
  mileageEntries: CreateOfficerExpenseMileageDto[]
  travelEntries: CreateOfficerExpenseTravelDto[]
}

export interface CreateOfficerExpenseMileageDto {
  vehicleType: 'car' | 'car_passenger' | 'bicycle' | 'motorbike'
  startLocation: string
  startPostcode: string
  endLocation: string
  endPostcode: string
  returnTrip: boolean
  mileage: number
  calculatedExpense: number
}

export interface CreateOfficerExpenseTravelDto {
  transportType: 'train' | 'bus' | 'taxi'
  description?: string
  amount: number
}

export interface UpdateOfficerExpenseClaimDto {
  days: CreateOfficerExpenseDayDto[]
}

export interface ReviewOfficerExpenseClaimDto {
  status: 'Approved' | 'Rejected'
  approvalNotes?: string
}

export interface OfficerExpenseQueryDto {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  weekStartDate?: string
  officerId?: string
}

export interface OfficerExpenseClaimList {
  items: OfficerExpenseClaim[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OfficerExpenseStats {
  totalClaims: number
  totalExpenses: number
  pendingClaims: number
  approvedClaims: number
}

