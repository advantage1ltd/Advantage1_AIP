// TypeScript types for Disciplinary Records

export interface DisciplinaryRecord {
  id: number
  employeeId: number
  officerName: string
  supervisorId?: string
  supervisorName: string
  incidentDate: string
  violationType: string
  severity: string
  description: string
  actionTaken: string
  followUpDate?: string
  status: string
  witnessStatements?: string
  evidenceRefs?: string
  notes?: string
  appealReason?: string
  appealDate?: string
  appealOutcome?: string
  createdAt: string
  updatedAt?: string
  createdByName?: string
}

export interface CreateDisciplinaryRecordDto {
  employeeId: number
  officerName: string
  supervisorId?: string
  supervisorName: string
  incidentDate: string
  violationType: string
  severity: string
  description: string
  actionTaken: string
  followUpDate?: string
  status: string
  witnessStatements?: string
  evidenceRefs?: string
  notes?: string
}

export interface UpdateDisciplinaryRecordDto {
  id: number
  employeeId: number
  officerName: string
  supervisorId?: string
  supervisorName: string
  incidentDate: string
  violationType: string
  severity: string
  description: string
  actionTaken: string
  followUpDate?: string
  status: string
  witnessStatements?: string
  evidenceRefs?: string
  notes?: string
  appealReason?: string
  appealDate?: string
  appealOutcome?: string
}

export interface DisciplinaryRecordQueryDto {
  search?: string
  employeeId?: number
  violationType?: string
  severity?: string
  status?: string
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}

export interface DisciplinaryRecordList {
  items: DisciplinaryRecord[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DisciplinaryRecordStats {
  totalRecords: number
  openCases: number
  underReviewCases: number
  closedCases: number
  appealedCases: number
  minorViolations: number
  moderateViolations: number
  majorViolations: number
  criticalViolations: number
  violationsByType: Record<string, number>
  recordsByMonth: Record<string, number>
}

export interface EmployeeDropdown {
  id: number
  name: string
  employeeNumber: string
}

export interface SupervisorDropdown {
  id: string
  name: string
}

// Constants
export const VIOLATION_TYPES = [
  { id: 'attendance', label: 'Attendance/Tardiness' },
  { id: 'procedure', label: 'Security Procedure Violation' },
  { id: 'conduct', label: 'Unprofessional Conduct' },
  { id: 'uniform', label: 'Uniform/Appearance' },
  { id: 'report', label: 'Report Writing/Documentation' },
  { id: 'post', label: 'Post Abandonment' },
  { id: 'sleeping', label: 'Sleeping on Duty' },
  { id: 'communication', label: 'Communication Protocol Breach' },
  { id: 'equipment', label: 'Equipment Misuse' },
  { id: 'other', label: 'Other Violation' },
] as const

export const SEVERITY_LEVELS = ['Minor', 'Moderate', 'Major', 'Critical'] as const

export const ACTION_TYPES = [
  'Verbal Warning',
  'Written Warning',
  'Final Warning',
  'Suspension',
  'Termination',
  'Remedial Training'
] as const

export const STATUS_OPTIONS = [
  'Open',
  'Under Review',
  'Pending Action',
  'Closed',
  'Appealed'
] as const

export const SEVERITY_COLORS: Record<string, string> = {
  'Minor': 'bg-blue-100 text-blue-800 border-blue-200',
  'Moderate': 'bg-amber-100 text-amber-800 border-amber-200',
  'Major': 'bg-orange-100 text-orange-800 border-orange-200',
  'Critical': 'bg-red-100 text-red-800 border-red-200',
}

export const STATUS_COLORS: Record<string, string> = {
  'Open': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Under Review': 'bg-amber-100 text-amber-800 border-amber-200',
  'Pending Action': 'bg-orange-100 text-orange-800 border-orange-200',
  'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
  'Appealed': 'bg-purple-100 text-purple-800 border-purple-200',
}

