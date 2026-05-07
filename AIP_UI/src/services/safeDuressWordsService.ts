import { api } from '@/config/api';
import { 
  CodeWord, 
  WordHistory, 
  UpdateCodeWordRequest, 
  ApiResponse, 
  PaginatedResponse,
  WordHistoryFilters 
} from '@/types/safeDuressWords';

// Remove /api prefix since it's already in the API config
const BASE_URL = '/safe-duress-words';

export const safeDuressWordsService = {
  // Get current code words
  getCurrentWords: async (): Promise<ApiResponse<{ safe: CodeWord; duress: CodeWord }>> => {
    const response = await api.get(`${BASE_URL}/current`);
    // Backend returns { data: { safe: ..., duress: ... } }
    return { data: response.data.data };
  },

  // Get word change history with pagination and filters
  getWordHistory: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: WordHistoryFilters
  ): Promise<PaginatedResponse<WordHistory[]>> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.search && { search: filters.search })
    });

    const response = await api.get(`${BASE_URL}/history?${queryParams}`);
    // Backend returns { data: [...], pagination: {...} }
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  },

  // Update a code word
  updateCodeWord: async (data: UpdateCodeWordRequest): Promise<ApiResponse<CodeWord>> => {
    const response = await api.put(`${BASE_URL}`, data);
    // Backend returns { data: CodeWord }
    return { data: response.data.data };
  },

  // Get single history entry
  getHistoryEntry: async (id: string): Promise<ApiResponse<WordHistory>> => {
    const response = await api.get(`${BASE_URL}/history/${id}`);
    // Backend returns { data: WordHistory }
    return { data: response.data.data };
  }
}; 