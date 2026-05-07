import { api } from '@/config/api';
import { getCurrentCustomerId } from '@/lib/utils';
import type {
  DailyActivityReport,
  DailyActivityFilters,
  DailyActivityResponse,
  DailyActivityRequest,
  DailyActivityUpdateRequest
} from '@/types/dailyActivity';

// Type for backend DTO response (single report)
interface DailyActivityReportDto {
  data: DailyActivityReport;
}

const BASE_URL = '/daily-activity-reports';

// Helper to get headers with customer ID
const getHeaders = () => {
  const customerId = getCurrentCustomerId();
  // Only include customer ID header if we have one (non-admin users)
  return customerId ? { 'X-Customer-Id': customerId.toString() } : {};
};

export const dailyActivityService = {
  // Get paginated list of reports with optional filters
  async getReports(
    page: number = 1,
    pageSize: number = 10,
    filters?: DailyActivityFilters
  ): Promise<DailyActivityResponse> {
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString()
    };

    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.customerId) {
      params.customerId = filters.customerId;
    }
    if (filters?.siteId) {
      params.siteId = filters.siteId;
    }
    if (filters?.reportDate) {
      params.reportDate = filters.reportDate;
    }
    if (filters?.officerName) {
      params.officerName = filters.officerName;
    }
    if (filters?.dateRange?.from) {
      params.from = filters.dateRange.from.toISOString();
    }
    if (filters?.dateRange?.to) {
      params.to = filters.dateRange.to.toISOString();
    }

    const searchParams = new URLSearchParams(params);
    // Backend returns { data: DailyActivityReportDto[], pagination: PaginationInfoDto }
    // where PaginationInfoDto has { currentPage, totalPages, pageSize, totalCount, hasPrevious, hasNext }
    const backendResponse = await api.get<{
      data: DailyActivityReport[];
      pagination: {
        currentPage: number;
        totalPages: number;
        pageSize: number;
        totalCount: number;
        hasPrevious: boolean;
        hasNext: boolean;
      };
    }>(`${BASE_URL}?${searchParams.toString()}`, {
      headers: getHeaders()
    });
    
    // Map backend response to frontend format
    return {
      data: backendResponse.data.data,
      pagination: {
        currentPage: backendResponse.data.pagination.currentPage,
        pageSize: backendResponse.data.pagination.pageSize,
        total: backendResponse.data.pagination.totalCount
      }
    };
  },

  // Get a single report by ID
  async getReport(id: string): Promise<DailyActivityReport> {
    const response = await api.get<DailyActivityReportDto>(`${BASE_URL}/${id}`, {
      headers: getHeaders()
    });
    // Backend returns DailyActivityReportDto with data property
    return response.data.data;
  },

  // Create a new report
  async createReport(data: DailyActivityRequest): Promise<DailyActivityReport> {
    const response = await api.post<DailyActivityReportDto>(BASE_URL, data, {
      headers: getHeaders()
    });
    return response.data.data;
  },

  // Update an existing report
  async updateReport(id: string, data: DailyActivityUpdateRequest): Promise<DailyActivityReport> {
    const response = await api.put<DailyActivityReportDto>(`${BASE_URL}/${id}`, data, {
      headers: getHeaders()
    });
    return response.data.data;
  },

  // Delete a report
  async deleteReport(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`, {
      headers: getHeaders()
    });
  }
}; 