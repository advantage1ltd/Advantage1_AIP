import { api } from '@/config/api';
import type { 
  HolidayRequest, 
  HolidayRequestsResponse, 
  CreateHolidayRequestDTO, 
  UpdateHolidayRequestDTO,
  HolidayRequestFilters 
} from '@/types/holidayRequest';

const BASE_URL = '/holiday-requests';

export const holidayRequestService = {
  // Get all holiday requests with pagination and filters
  getHolidayRequests: async (filters: HolidayRequestFilters): Promise<HolidayRequestsResponse> => {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.status) queryParams.append('status', filters.status);
    if (typeof filters.archived === 'boolean') queryParams.append('archived', filters.archived.toString());

    try {
      const response = await api.get(`${BASE_URL}?${queryParams.toString()}`);
      const responseData = response.data;
      
      // Log the response for debugging
      console.log('📦 [HolidayRequestService] Response data:', responseData);
      
      // Map backend response to frontend DTOs
      return {
        data: (responseData.data || []).map((item: any) => {
          // Helper function to safely parse dates
          const parseDate = (dateStr: string | null | undefined): Date => {
            if (!dateStr) return new Date();
            const parsed = new Date(dateStr);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          };
          
          return {
            id: (item.id || item.Id || '').toString(),
            officerId: (item.employeeId || item.officerId || item.EmployeeId || item.OfficerId || '').toString(),
            officerName: item.officerName || item.OfficerName || '',
            startDate: parseDate(item.startDate || item.StartDate),
            endDate: parseDate(item.endDate || item.EndDate),
            returnToWorkDate: parseDate(item.returnToWorkDate || item.ReturnToWorkDate),
            dateOfRequest: parseDate(item.dateOfRequest || item.DateOfRequest),
            authorisedBy: item.authorisedBy || item.AuthorisedBy || '',
            dateAuthorised: item.dateAuthorised || item.DateAuthorised ? parseDate(item.dateAuthorised || item.DateAuthorised) : null,
            status: (item.status || item.Status || 'pending') as 'pending' | 'approved' | 'denied',
            comment: item.comment || item.Comment || '',
            reason: item.reason || item.Reason || '',
            totalDays: item.totalDays || item.TotalDays || 0,
            daysLeftYTD: item.daysLeftYTD ?? item.DaysLeftYTD ?? undefined,
            archived: item.archived || item.Archived || false
          };
        }),
        total: responseData.total || responseData.Total || 0,
        page: responseData.page || responseData.Page || 1,
        limit: responseData.limit || responseData.Limit || 10
      };
    } catch (error: any) {
      console.error('❌ [HolidayRequestService] Error fetching holiday requests:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Get a single holiday request by ID
  getHolidayRequest: async (id: string): Promise<HolidayRequest> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    const responseData = response.data;
    // Map backend response to frontend DTO
    return {
      id: responseData.id.toString(),
      officerId: responseData.employeeId?.toString() || responseData.officerId?.toString() || '',
      officerName: responseData.officerName || '',
      startDate: new Date(responseData.startDate),
      endDate: new Date(responseData.endDate),
      returnToWorkDate: new Date(responseData.returnToWorkDate),
      dateOfRequest: new Date(responseData.dateOfRequest),
      authorisedBy: responseData.authorisedBy || '',
      dateAuthorised: responseData.dateAuthorised ? new Date(responseData.dateAuthorised) : null,
      status: responseData.status as 'pending' | 'approved' | 'denied',
      comment: responseData.comment || '',
      reason: responseData.reason || '',
      totalDays: responseData.totalDays || 0,
      daysLeftYTD: responseData.daysLeftYTD ?? responseData.DaysLeftYTD ?? undefined,
      archived: responseData.archived || false
    };
  },

  // Create a new holiday request
  createHolidayRequest: async (data: CreateHolidayRequestDTO): Promise<HolidayRequest> => {
    // Map frontend DTO to backend DTO
    const backendData: any = {
      officerId: parseInt(data.officerId, 10), // Convert string to int
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      returnToWorkDate: data.returnToWorkDate.toISOString(),
      comment: data.comment || ''
    };
    
    // Only include authorisedBy if provided (optional for creation)
    if (data.authorisedBy) {
      backendData.authorisedBy = data.authorisedBy;
    }
    const response = await api.post(BASE_URL, backendData);
    // Map backend response to frontend DTO
    const responseData = response.data;
    return {
      id: responseData.id.toString(),
      officerId: responseData.employeeId?.toString() || responseData.officerId?.toString() || '',
      officerName: responseData.officerName || '',
      startDate: new Date(responseData.startDate),
      endDate: new Date(responseData.endDate),
      returnToWorkDate: new Date(responseData.returnToWorkDate),
      dateOfRequest: new Date(responseData.dateOfRequest),
      authorisedBy: responseData.authorisedBy || '',
      dateAuthorised: responseData.dateAuthorised ? new Date(responseData.dateAuthorised) : null,
      status: responseData.status as 'pending' | 'approved' | 'denied',
      comment: responseData.comment || '',
      totalDays: responseData.totalDays || 0,
      archived: responseData.archived || false
    };
  },

  // Update an existing holiday request
  updateHolidayRequest: async (id: string, data: UpdateHolidayRequestDTO): Promise<HolidayRequest> => {
    try {
      // Map frontend DTO to backend DTO
      const backendData: any = {};
      if (data.officerId) backendData.officerId = parseInt(data.officerId, 10);
      if (data.startDate) backendData.startDate = data.startDate.toISOString();
      if (data.endDate) backendData.endDate = data.endDate.toISOString();
      if (data.returnToWorkDate) backendData.returnToWorkDate = data.returnToWorkDate.toISOString();
      if (data.authorisedBy) backendData.authorisedBy = data.authorisedBy;
      if (data.status) backendData.status = data.status;
      // Handle dateAuthorised - only send if it's not null
      if (data.dateAuthorised !== null && data.dateAuthorised !== undefined) {
        backendData.dateAuthorised = data.dateAuthorised.toISOString();
      }
      if (data.comment !== undefined) backendData.comment = data.comment;
      if (data.reason !== undefined) backendData.reason = data.reason;
      if (data.daysLeftYTD !== undefined && data.daysLeftYTD !== null) backendData.daysLeftYTD = data.daysLeftYTD;

      console.log('📤 [HolidayRequestService] Updating holiday request:', { id, backendData });

      const response = await api.put(`${BASE_URL}/${id}`, backendData);
      // Map backend response to frontend DTO
      const responseData = response.data;
      return {
      id: responseData.id.toString(),
      officerId: responseData.employeeId?.toString() || responseData.officerId?.toString() || '',
      officerName: responseData.officerName || '',
      startDate: new Date(responseData.startDate),
      endDate: new Date(responseData.endDate),
      returnToWorkDate: new Date(responseData.returnToWorkDate),
      dateOfRequest: new Date(responseData.dateOfRequest),
      authorisedBy: responseData.authorisedBy || '',
      dateAuthorised: responseData.dateAuthorised ? new Date(responseData.dateAuthorised) : null,
      status: responseData.status as 'pending' | 'approved' | 'denied',
      comment: responseData.comment || '',
      reason: responseData.reason || '',
      totalDays: responseData.totalDays || 0,
      daysLeftYTD: responseData.daysLeftYTD ?? responseData.DaysLeftYTD ?? undefined,
      archived: responseData.archived || false
    };
    } catch (error: any) {
      const errorDetails = {
        id,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        requestData: error.config?.data,
        responseData: error.response?.data,
      }
      
      console.error('❌ [HolidayRequestService] Error updating holiday request:', errorDetails)
      console.error('❌ [HolidayRequestService] Full error:', error)
      
      // Log response data separately for better visibility
      if (error.response?.data) {
        console.error('❌ [HolidayRequestService] Error response data:', JSON.stringify(error.response.data, null, 2))
      }
      
      throw error;
    }
  },

  // Delete a holiday request
  deleteHolidayRequest: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Archive a holiday request
  archiveHolidayRequest: async (id: string): Promise<HolidayRequest> => {
    const response = await api.put(`${BASE_URL}/${id}/archive`);
    const responseData = response.data;
    // Map backend response to frontend DTO
    return {
      id: responseData.id.toString(),
      officerId: responseData.employeeId?.toString() || responseData.officerId?.toString() || '',
      officerName: responseData.officerName || '',
      startDate: new Date(responseData.startDate),
      endDate: new Date(responseData.endDate),
      returnToWorkDate: new Date(responseData.returnToWorkDate),
      dateOfRequest: new Date(responseData.dateOfRequest),
      authorisedBy: responseData.authorisedBy || '',
      dateAuthorised: responseData.dateAuthorised ? new Date(responseData.dateAuthorised) : null,
      status: responseData.status as 'pending' | 'approved' | 'denied',
      comment: responseData.comment || '',
      reason: responseData.reason || '',
      totalDays: responseData.totalDays || 0,
      daysLeftYTD: responseData.daysLeftYTD ?? responseData.DaysLeftYTD ?? undefined,
      archived: responseData.archived || false
    };
  },

  // Unarchive a holiday request
  unarchiveHolidayRequest: async (id: string): Promise<HolidayRequest> => {
    const response = await api.put(`${BASE_URL}/${id}/unarchive`);
    const responseData = response.data;
    // Map backend response to frontend DTO
    return {
      id: responseData.id.toString(),
      officerId: responseData.employeeId?.toString() || responseData.officerId?.toString() || '',
      officerName: responseData.officerName || '',
      startDate: new Date(responseData.startDate),
      endDate: new Date(responseData.endDate),
      returnToWorkDate: new Date(responseData.returnToWorkDate),
      dateOfRequest: new Date(responseData.dateOfRequest),
      authorisedBy: responseData.authorisedBy || '',
      dateAuthorised: responseData.dateAuthorised ? new Date(responseData.dateAuthorised) : null,
      status: responseData.status as 'pending' | 'approved' | 'denied',
      comment: responseData.comment || '',
      reason: responseData.reason || '',
      totalDays: responseData.totalDays || 0,
      daysLeftYTD: responseData.daysLeftYTD ?? responseData.DaysLeftYTD ?? undefined,
      archived: responseData.archived || false
    };
  }
}; 