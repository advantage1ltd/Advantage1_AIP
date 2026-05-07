export interface CodeWord {
  id: string;
  word: string;
  type: 'safe' | 'duress';
  updatedAt: string;
  updatedBy: string;
}

export interface WordHistory {
  id: string;
  type: 'safe' | 'duress';
  oldWord: string;
  newWord: string;
  changedAt: string;
  changedBy: string;
  reason: string;
}

export interface UpdateCodeWordRequest {
  word: string;
  type: 'safe' | 'duress';
  reason: string;
  authorizedCode: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface WordHistoryFilters {
  type?: 'safe' | 'duress';
  startDate?: string;
  endDate?: string;
  search?: string;
} 