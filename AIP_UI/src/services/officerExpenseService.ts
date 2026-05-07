import { api } from '@/config/api'
import type {
  OfficerExpenseClaim,
  OfficerExpenseClaimList,
  OfficerExpenseStats,
  OfficerExpenseQueryDto,
  CreateOfficerExpenseClaimDto,
  UpdateOfficerExpenseClaimDto,
  ReviewOfficerExpenseClaimDto
} from '@/types/officerExpense'

const BASE_URL = '/OfficerExpense'

export const officerExpenseService = {
  // ========== Claims ==========

  /** Get all expense claims (admin only) */
  getAllClaims: async (query: OfficerExpenseQueryDto = {}): Promise<OfficerExpenseClaimList> => {
    const params = new URLSearchParams()
    if (query.search) params.append('search', query.search)
    if (query.status) params.append('status', query.status)
    if (query.weekStartDate) params.append('weekStartDate', query.weekStartDate)
    if (query.officerId) params.append('officerId', query.officerId)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 10))

    const response = await api.get<OfficerExpenseClaimList>(`${BASE_URL}?${params.toString()}`)
    return response.data
  },

  /** Get my expense claims (officer) */
  getMyClaims: async (query: OfficerExpenseQueryDto = {}): Promise<OfficerExpenseClaimList> => {
    const params = new URLSearchParams()
    if (query.status) params.append('status', query.status)
    if (query.weekStartDate) params.append('weekStartDate', query.weekStartDate)
    params.append('page', String(query.page || 1))
    params.append('pageSize', String(query.pageSize || 10))

    const response = await api.get<OfficerExpenseClaimList>(`${BASE_URL}/my?${params.toString()}`)
    return response.data
  },

  /** Get expense claim by ID */
  getClaimById: async (id: number): Promise<OfficerExpenseClaim> => {
    const response = await api.get<OfficerExpenseClaim>(`${BASE_URL}/${id}`)
    return response.data
  },

  /** Get expense claim by week start date */
  getClaimByWeek: async (weekStartDate: string): Promise<OfficerExpenseClaim | null> => {
    try {
      const response = await api.get<OfficerExpenseClaim>(`${BASE_URL}/week/${weekStartDate}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /** Create a new expense claim */
  createClaim: async (dto: CreateOfficerExpenseClaimDto): Promise<OfficerExpenseClaim> => {
    const response = await api.post<OfficerExpenseClaim>(BASE_URL, dto)
    return response.data
  },

  /** Update an expense claim */
  updateClaim: async (id: number, dto: UpdateOfficerExpenseClaimDto): Promise<OfficerExpenseClaim> => {
    const response = await api.put<OfficerExpenseClaim>(`${BASE_URL}/${id}`, dto)
    return response.data
  },

  /** Delete an expense claim */
  deleteClaim: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`)
  },

  /** Submit an expense claim for approval */
  submitClaim: async (id: number): Promise<OfficerExpenseClaim> => {
    const response = await api.post<OfficerExpenseClaim>(`${BASE_URL}/${id}/submit`)
    return response.data
  },

  /** Review/approve/reject an expense claim (admin only) */
  reviewClaim: async (id: number, dto: ReviewOfficerExpenseClaimDto): Promise<OfficerExpenseClaim> => {
    const response = await api.post<OfficerExpenseClaim>(`${BASE_URL}/${id}/review`, dto)
    return response.data
  },

  /** Get expense statistics */
  getStats: async (): Promise<OfficerExpenseStats> => {
    const response = await api.get<OfficerExpenseStats>(`${BASE_URL}/stats`)
    return response.data
  }
}

