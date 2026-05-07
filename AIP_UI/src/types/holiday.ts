export type HolidayStatus = 'pending' | 'approved' | 'rejected'

export interface HolidayRequest {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  type: 'annual' | 'sick' | 'unpaid' | 'other'
  status: HolidayStatus
  notes?: string
  totalDays: number
  createdAt: string
  updatedAt: string
  approvedBy?: string
  rejectionReason?: string
}

export interface HolidayFormData extends Omit<HolidayRequest, 
  'id' | 'status' | 'totalDays' | 'createdAt' | 'updatedAt' | 'approvedBy' | 'rejectionReason'> {} 