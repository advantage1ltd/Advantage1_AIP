import { api } from '@/config/api'
import type {
  DisciplinaryRecord,
  DisciplinaryRecordList,
  DisciplinaryRecordStats,
  DisciplinaryRecordQueryDto,
  CreateDisciplinaryRecordDto,
  UpdateDisciplinaryRecordDto,
  EmployeeDropdown,
  SupervisorDropdown
} from '@/types/disciplinaryRecord'

const BASE_URL = '/DisciplinaryRecord'

export const disciplinaryRecordService = {
  // ========== CRUD Operations ==========

  /** Get all disciplinary records with filtering and pagination */
  getAll: async (query: DisciplinaryRecordQueryDto = {}): Promise<DisciplinaryRecordList> => {
    const params = new URLSearchParams()
    if (query.search) params.append('search', query.search)
    if (query.employeeId) params.append('employeeId', String(query.employeeId))
    if (query.violationType) params.append('violationType', query.violationType)
    if (query.severity) params.append('severity', query.severity)
    if (query.status) params.append('status', query.status)
    if (query.fromDate) params.append('fromDate', query.fromDate)
    if (query.toDate) params.append('toDate', query.toDate)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 10))

    const response = await api.get<DisciplinaryRecordList>(`${BASE_URL}?${params.toString()}`)
    return response.data
  },

  /** Get a single disciplinary record by ID */
  getById: async (id: number): Promise<DisciplinaryRecord> => {
    const response = await api.get<DisciplinaryRecord>(`${BASE_URL}/${id}`)
    return response.data
  },

  /** Create a new disciplinary record */
  create: async (data: CreateDisciplinaryRecordDto): Promise<DisciplinaryRecord> => {
    const response = await api.post<DisciplinaryRecord>(BASE_URL, data)
    return response.data
  },

  /** Update an existing disciplinary record */
  update: async (data: UpdateDisciplinaryRecordDto): Promise<DisciplinaryRecord> => {
    const response = await api.put<DisciplinaryRecord>(BASE_URL, data)
    return response.data
  },

  /** Delete a disciplinary record (soft delete) */
  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`)
  },

  // ========== Statistics ==========

  /** Get disciplinary record statistics */
  getStats: async (): Promise<DisciplinaryRecordStats> => {
    const response = await api.get<DisciplinaryRecordStats>(`${BASE_URL}/stats`)
    return response.data
  },

  // ========== Dropdowns ==========

  /** Get list of employees for dropdown */
  getEmployees: async (): Promise<EmployeeDropdown[]> => {
    const response = await api.get<EmployeeDropdown[]>(`${BASE_URL}/employees`)
    return response.data
  },

  /** Get list of supervisors for dropdown */
  getSupervisors: async (): Promise<SupervisorDropdown[]> => {
    const response = await api.get<SupervisorDropdown[]>(`${BASE_URL}/supervisors`)
    return response.data
  }
}

