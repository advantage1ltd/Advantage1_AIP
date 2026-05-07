import { api } from '@/config/api'
import type {
  UniformEquipmentRequest,
  UniformEquipmentRequestList,
  UniformEquipmentIssued,
  UniformEquipmentIssuedList,
  UniformEquipmentStats,
  UniformEquipmentQueryDto,
  CreateEquipmentRequestDto,
  ReviewEquipmentRequestDto,
  CreateIssuedEquipmentDto,
  UpdateIssuedEquipmentDto,
  OfficerDropdown
} from '@/types/uniformEquipment'

const BASE_URL = '/UniformEquipment'

export const uniformEquipmentService = {
  // ========== Equipment Requests ==========

  /** Get all equipment requests (admin only) */
  getAllRequests: async (query: UniformEquipmentQueryDto = {}): Promise<UniformEquipmentRequestList> => {
    const params = new URLSearchParams()
    if (query.search) params.append('search', query.search)
    if (query.equipmentType) params.append('equipmentType', query.equipmentType)
    if (query.status) params.append('status', query.status)
    if (query.priority) params.append('priority', query.priority)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 10))

    const response = await api.get<UniformEquipmentRequestList>(`${BASE_URL}/requests?${params.toString()}`)
    return response.data
  },

  /** Get my equipment requests (officer) */
  getMyRequests: async (query: UniformEquipmentQueryDto = {}): Promise<UniformEquipmentRequestList> => {
    const params = new URLSearchParams()
    if (query.search) params.append('search', query.search)
    if (query.equipmentType) params.append('equipmentType', query.equipmentType)
    if (query.status) params.append('status', query.status)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 10))

    const response = await api.get<UniformEquipmentRequestList>(`${BASE_URL}/requests/my?${params.toString()}`)
    return response.data
  },

  /** Get a single request by ID */
  getRequestById: async (id: number): Promise<UniformEquipmentRequest> => {
    const response = await api.get<UniformEquipmentRequest>(`${BASE_URL}/requests/${id}`)
    return response.data
  },

  /** Create a new equipment request (officer) */
  createRequest: async (data: CreateEquipmentRequestDto): Promise<UniformEquipmentRequest> => {
    const response = await api.post<UniformEquipmentRequest>(`${BASE_URL}/requests`, data)
    return response.data
  },

  /** Review (approve/reject) an equipment request (admin) */
  reviewRequest: async (data: ReviewEquipmentRequestDto): Promise<UniformEquipmentRequest> => {
    const response = await api.put<UniformEquipmentRequest>(`${BASE_URL}/requests/review`, data)
    return response.data
  },

  /** Cancel a pending request (officer can cancel their own) */
  cancelRequest: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/requests/${id}/cancel`)
  },

  // ========== Issued Equipment ==========

  /** Get all issued equipment (admin only) */
  getAllIssued: async (query: UniformEquipmentQueryDto = {}): Promise<UniformEquipmentIssuedList> => {
    const params = new URLSearchParams()
    if (query.search) params.append('search', query.search)
    if (query.equipmentType) params.append('equipmentType', query.equipmentType)
    if (query.officerId) params.append('officerId', query.officerId)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 10))

    const response = await api.get<UniformEquipmentIssuedList>(`${BASE_URL}/issued?${params.toString()}`)
    return response.data
  },

  /** Get my issued equipment (officer) */
  getMyIssuedEquipment: async (query: UniformEquipmentQueryDto = {}): Promise<UniformEquipmentIssuedList> => {
    const params = new URLSearchParams()
    if (query.search) params.append('search', query.search)
    if (query.equipmentType) params.append('equipmentType', query.equipmentType)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 10))

    const response = await api.get<UniformEquipmentIssuedList>(`${BASE_URL}/issued/my?${params.toString()}`)
    return response.data
  },

  /** Get a single issued equipment record by ID */
  getIssuedById: async (id: number): Promise<UniformEquipmentIssued> => {
    const response = await api.get<UniformEquipmentIssued>(`${BASE_URL}/issued/${id}`)
    return response.data
  },

  /** Create a new issued equipment record (admin) */
  createIssued: async (data: CreateIssuedEquipmentDto): Promise<UniformEquipmentIssued> => {
    const response = await api.post<UniformEquipmentIssued>(`${BASE_URL}/issued`, data)
    return response.data
  },

  /** Update an issued equipment record (admin) */
  updateIssued: async (data: UpdateIssuedEquipmentDto): Promise<UniformEquipmentIssued> => {
    const response = await api.put<UniformEquipmentIssued>(`${BASE_URL}/issued`, data)
    return response.data
  },

  /** Delete an issued equipment record (admin) */
  deleteIssued: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/issued/${id}`)
  },

  // ========== Statistics ==========

  /** Get overall statistics (admin) */
  getStats: async (): Promise<UniformEquipmentStats> => {
    const response = await api.get<UniformEquipmentStats>(`${BASE_URL}/stats`)
    return response.data
  },

  /** Get my statistics (officer) */
  getMyStats: async (): Promise<UniformEquipmentStats> => {
    const response = await api.get<UniformEquipmentStats>(`${BASE_URL}/stats/my`)
    return response.data
  },

  // ========== Helpers ==========

  /** Get list of officers for dropdown (admin) */
  getOfficers: async (): Promise<OfficerDropdown[]> => {
    const response = await api.get<OfficerDropdown[]>(`${BASE_URL}/officers`)
    return response.data
  }
}

