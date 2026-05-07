import { api, STOCK_ENDPOINTS, type ApiResponse, handleApiError } from '@/config/api'
import type { StockItem } from '@/types/stock'

export interface CreateStockItemRequest {
  name: string
  quantity: number
  minimumStock: number
  category: string
  description: string
  numberAdded: number
  date: string
  numberIssued: number
  issuedBy: string
}

export interface UpdateStockItemRequest extends Partial<CreateStockItemRequest> {}

export interface IssueStockRequest {
  quantityToIssue: number
  issuedBy: string
  reason?: string
}

export interface AddStockRequest {
  quantityToAdd: number
  addedBy: string
  reason?: string
}

export const stockService = {
  async list(): Promise<StockItem[]> {
    try {
      const res = await api.get<ApiResponse<StockItem[]>>(STOCK_ENDPOINTS.LIST)
      return res.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async create(payload: CreateStockItemRequest): Promise<StockItem> {
    try {
      const res = await api.post<ApiResponse<StockItem>>(STOCK_ENDPOINTS.CREATE, payload)
      return res.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async update(id: number, payload: UpdateStockItemRequest): Promise<StockItem> {
    try {
      const res = await api.put<ApiResponse<StockItem>>(STOCK_ENDPOINTS.UPDATE(String(id)), payload)
      return res.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async remove(id: number): Promise<void> {
    try {
      await api.delete<ApiResponse<object>>(STOCK_ENDPOINTS.DELETE(String(id)))
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async issueStock(id: number, payload: IssueStockRequest): Promise<StockItem> {
    try {
      const res = await api.post<ApiResponse<StockItem>>(STOCK_ENDPOINTS.ISSUE(String(id)), payload)
      return res.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async addStock(id: number, payload: AddStockRequest): Promise<StockItem> {
    try {
      const res = await api.post<ApiResponse<StockItem>>(STOCK_ENDPOINTS.ADD(String(id)), payload)
      return res.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async getLowStockItems(): Promise<StockItem[]> {
    try {
      const res = await api.get<ApiResponse<StockItem[]>>(STOCK_ENDPOINTS.LOW_STOCK)
      return res.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async checkLowStock(): Promise<void> {
    try {
      await api.post<ApiResponse<object>>(STOCK_ENDPOINTS.CHECK_LOW_STOCK)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async testEmail(): Promise<void> {
    try {
      await api.post<ApiResponse<object>>(STOCK_ENDPOINTS.TEST_EMAIL)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}


