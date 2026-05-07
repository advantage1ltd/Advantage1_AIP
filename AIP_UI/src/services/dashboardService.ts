import { StoreData, RegionalData, Period, UserRole, OfficerDashboardData, RecentIncident, CustomerStoreData, Region, SatisfactionDataPoint, BeSafeDataPoint, DailyActivity, Site, IncidentDataPoint } from '@/types/dashboard';
import axios from 'axios';
import { BASE_API_URL, api, type ApiResponse } from '@/config/api';
import { extractApiResponseData } from '@/utils/apiResponseHelper';
import { extractCustomerId } from '@/utils/customerId';
import { sessionStore } from '@/state/sessionStore';

const API_BASE_URL = BASE_API_URL;

const getActiveUser = () => {
  const activeUser = sessionStore.getUser()
  if (!activeUser) {
    throw new Error('User session is not available')
  }
  return activeUser
}
const FALLBACK_OFFICER_DASHBOARD: OfficerDashboardData = {
  name: 'Advantage Officer',
  badgeNumber: 'AIP-2045',
  role: 'AdvantageOneOfficer',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AO',
  shiftStatus: 'On Duty',
  shiftStart: new Date().toISOString(),
  shiftEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  location: 'Central England COOP',
  stats: {
    incidentsThisMonth: 18,
    incidentsLastMonth: 14,
    totalValueSaved: 42000,
    expensesYTD: 3850,
    completionRate: 92,
    holidayBooked: 12,
    hoursWorked: 1420,
    sitesVisited: 8
  },
  monthlyTarget: {
    incidents: 20,
    valueSaved: 50000,
    current: {
      incidents: 18,
      valueSaved: 42000
    }
  },
  recentActivities: [
    {
      id: 'activity-1',
      type: 'incident',
      title: 'High-value recovery',
      location: 'Central England COOP',
      time: '08:30',
      value: 1800,
      status: 'resolved'
    },
    {
      id: 'activity-2',
      type: 'patrol',
      title: 'Early morning patrol',
      location: 'Midcounties COOP',
      time: '06:10',
      status: 'completed'
    },
    {
      id: 'activity-3',
      type: 'report',
      title: 'Incident report submitted',
      location: 'Heart of England',
      time: '07:55',
      value: 0,
      status: 'submitted'
    }
  ],
  upcomingTasks: [
    {
      id: 'task-1',
      type: 'Training',
      title: 'Customer service refresher',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium'
    },
    {
      id: 'task-2',
      type: 'Patrol',
      title: 'Late shift perimeter patrol',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high'
    }
  ]
};

const FALLBACK_RECENT_INCIDENTS: RecentIncident[] = Array.from({ length: 6 }).map((_, index) => ({
  id: `incident-${index + 1}`,
  customerId: 21,
  date: new Date(Date.now() - index * 6 * 60 * 60 * 1000).toISOString(),
  regionId: '1',
  regionName: 'Central Region',
  siteId: `site-${(index % 3) + 1}`,
  siteName: ['Central England COOP', 'Heart of England', 'Midcounties COOP'][index % 3],
  type: index % 2 === 0 ? 'Theft Prevention' : 'Patrol',
  value: index % 2 === 0 ? 120 + index * 30 : 0,
  assignedTo: 'AdvantageOneOfficer',
  customerName: ['Central England COOP', 'Heart of England', 'Midcounties COOP'][index % 3],
  store: ['Central England COOP', 'Heart of England', 'Midcounties COOP'][index % 3],
  officerName: ['David Brown', 'Karen Walsh', 'Lee Richards'][index % 3],
  amount: index % 2 === 0 ? 120 + index * 30 : 0,
  incidentType: index % 2 === 0 ? 'Recovery' : 'Patrol'
}));

class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class DashboardService {
  async getOfficerDashboard(): Promise<OfficerDashboardData> {
    try {
      // TODO: Implement officer dashboard endpoint in backend at /dashboard/officer
      // For now, return mock data since endpoint doesn't exist
      console.info('ℹ️ [DashboardService] Officer dashboard endpoint not implemented, using mock data');
      return FALLBACK_OFFICER_DASHBOARD;
    } catch (error: any) {
      console.warn('⚠️ [DashboardService] Error with officer dashboard, using fallback');
      return FALLBACK_OFFICER_DASHBOARD;
    }
  }

  async getRecentIncidents(): Promise<RecentIncident[]> {
    try {
      // Use the existing incidents endpoint with pagination for recent incidents
      const response = await api.get<ApiResponse<any>>('/incidents?page=1&pageSize=10');
      const incidents = response.data?.data || [];

      // Transform backend incident format to frontend RecentIncident format
      const transformedIncidents: RecentIncident[] = incidents.map((inc: any) => ({
        id: inc.Id || inc.id?.toString() || '',
        customerId: inc.CustomerId || inc.customerId || 0,
        date: inc.DateOfIncident || inc.Date || inc.date || inc.incidentDate || '',
        regionId: inc.RegionId?.toString() || inc.regionId?.toString() || '',
        regionName: inc.RegionName || inc.regionName || '',
        siteId: inc.SiteId?.toString() || inc.siteId?.toString() || '',
        siteName: inc.SiteName || inc.siteName || '',
        type: inc.IncidentType || inc.incidentType || inc.type || '',
        value: inc.TotalValueRecovered || inc.Value || inc.value || 0,
        assignedTo: inc.AssignedTo || inc.assignedTo || '',
        customerName: inc.CustomerName || inc.customerName || '',
        store: inc.SiteName || inc.siteName || '',
        officerName: inc.OfficerName || inc.officerName || '',
        amount: inc.TotalValueRecovered || inc.Amount || inc.amount || inc.value || 0,
        incidentType: inc.IncidentType || inc.incidentType || inc.type || ''
      }));

      return transformedIncidents;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch recent incidents';
      console.warn('⚠️ [DashboardService] Falling back to mock incidents:', message);
      return FALLBACK_RECENT_INCIDENTS;
    }
  }
}

export const dashboardService = new DashboardService()

export const dashboardApi = {
  async getStoreData(storeId: string): Promise<StoreData> {
    try {
      const response = await axios.get(`${API_BASE_URL}/stores/${storeId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.data?.message || 'Failed to fetch store data',
          error.response?.status,
          error.response?.data?.code
        );
      }
      throw error;
    }
  },

  async getRegionalData(regionId: string): Promise<RegionalData> {
    try {
      const response = await axios.get(`${API_BASE_URL}/regions/${regionId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.data?.message || 'Failed to fetch regional data',
          error.response?.status,
          error.response?.data?.code
        );
      }
      throw error;
    }
  },

  async getMetrics(storeId: string, userRole: UserRole) {
    try {
      const response = await axios.get(`${API_BASE_URL}/metrics`, {
        params: { storeId, userRole }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.data?.message || 'Failed to fetch metrics',
          error.response?.status,
          error.response?.data?.code
        );
      }
      throw error;
    }
  },

  async getIncidentData(storeId: string, period: Period) {
    try {
      const response = await axios.get(`${API_BASE_URL}/incidents`, {
        params: { storeId, period }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.data?.message || 'Failed to fetch incident data',
          error.response?.status,
          error.response?.data?.code
        );
      }
      throw error;
    }
  },

  async getRecentIncidents(storeId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/incidents/recent`, {
        params: { storeId }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.data?.message || 'Failed to fetch recent incidents',
          error.response?.status,
          error.response?.data?.code
        );
      }
      throw error;
    }
  }
};

// Helper function to get customer ID from auth context
const getCustomerIdFromAuth = () => {
  const user = getActiveUser();
  return user.customerId || 21; // Default to Central England COOP if no customerId found
};

// Helper function to add customer ID to headers
const getHeaders = () => ({
  'X-Customer-Id': getCustomerIdFromAuth()
});

// Helper function to calculate incident chart data from incidents
const calculateIncidentChartData = (incidents: Array<{ date: string; officerRole?: string; officerType?: string; value?: number; amount?: number }>): {
  daily: IncidentDataPoint[];
  weekly: IncidentDataPoint[];
  monthly: IncidentDataPoint[];
  yearly: IncidentDataPoint[];
} => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Helper to determine if incident is from Uniform Officer or Store Detective
  const getOfficerCategory = (incident: { officerRole?: string; officerType?: string }): 'uniform' | 'detective' | 'unknown' => {
    const role = (incident.officerRole || incident.officerType || '').toLowerCase();
    if (role.includes('uniform') || role.includes('officer')) {
      return 'uniform';
    }
    if (role.includes('detective') || role.includes('store detective')) {
      return 'detective';
    }
    return 'unknown';
  };

  // Helper to get incident value
  const getIncidentValue = (incident: { value?: number; amount?: number }): number => {
    return incident.value || incident.amount || 0;
  };

  // Helper to parse date string to Date object
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
      // Try ISO format first (YYYY-MM-DD)
      if (dateStr.includes('T')) {
        return new Date(dateStr);
      }
      // Try YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr);
      }
      // Try other common formats
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Helper to format date to YYYY-MM-DD string
  const formatDateStr = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Generate daily data for last 30 days
  const dailyData: IncidentDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayIncidents = incidents.filter(incident => {
      if (!incident.date) return false;
      const incidentDate = parseDate(incident.date);
      if (!incidentDate) return false;
      return formatDateStr(incidentDate) === dateStr;
    });
    
    let uniformOfficers = 0;
    let storeDetectives = 0;
    
    dayIncidents.forEach(incident => {
      const category = getOfficerCategory(incident);
      const value = getIncidentValue(incident);
      if (category === 'uniform') {
        uniformOfficers += value;
      } else if (category === 'detective') {
        storeDetectives += value;
      } else {
        // If unknown, split evenly or assign based on some logic
        // For now, we'll count them as uniform officers if no role specified
        uniformOfficers += value;
      }
    });

    dailyData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uniformOfficers,
      storeDetectives
    });
  }

  // Generate weekly data for last 12 weeks
  const weeklyData: IncidentDataPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekIncidents = incidents.filter(incident => {
      if (!incident.date) return false;
      const incidentDate = parseDate(incident.date);
      if (!incidentDate) return false;
      return incidentDate >= weekStart && incidentDate <= weekEnd;
    });
    
    let uniformOfficers = 0;
    let storeDetectives = 0;
    
    weekIncidents.forEach(incident => {
      const category = getOfficerCategory(incident);
      const value = getIncidentValue(incident);
      if (category === 'uniform') {
        uniformOfficers += value;
      } else if (category === 'detective') {
        storeDetectives += value;
      } else {
        uniformOfficers += value;
      }
    });

    weeklyData.push({
      week: `Week ${weeklyData.length + 1}`,
      uniformOfficers,
      storeDetectives
    });
  }

  // Generate monthly data for last 12 months
  const monthlyData: IncidentDataPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(currentYear, currentMonth - i, 1);
    const monthStr = monthDate.toISOString().substring(0, 7); // YYYY-MM format
    
    const monthIncidents = incidents.filter(incident => {
      if (!incident.date) return false;
      const incidentDate = parseDate(incident.date);
      if (!incidentDate) return false;
      return formatDateStr(incidentDate).startsWith(monthStr);
    });
    
    let uniformOfficers = 0;
    let storeDetectives = 0;
    
    monthIncidents.forEach(incident => {
      const category = getOfficerCategory(incident);
      const value = getIncidentValue(incident);
      if (category === 'uniform') {
        uniformOfficers += value;
      } else if (category === 'detective') {
        storeDetectives += value;
      } else {
        uniformOfficers += value;
      }
    });

    monthlyData.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      uniformOfficers,
      storeDetectives
    });
  }

  // Generate yearly data for last 5 years
  const yearlyData: IncidentDataPoint[] = [];
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i;
    const yearStr = year.toString();
    
    const yearIncidents = incidents.filter(incident => {
      if (!incident.date) return false;
      const incidentDate = parseDate(incident.date);
      if (!incidentDate) return false;
      return formatDateStr(incidentDate).startsWith(yearStr);
    });
    
    let uniformOfficers = 0;
    let storeDetectives = 0;
    
    yearIncidents.forEach(incident => {
      const category = getOfficerCategory(incident);
      const value = getIncidentValue(incident);
      if (category === 'uniform') {
        uniformOfficers += value;
      } else if (category === 'detective') {
        storeDetectives += value;
      } else {
        uniformOfficers += value;
      }
    });

    yearlyData.push({
      year: year.toString(),
      uniformOfficers,
      storeDetectives
    });
  }

  return {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
    yearly: yearlyData
  };
};

const getSites = async (signal?: AbortSignal): Promise<Site[]> => {
  const response = await fetch(`${BASE_API_URL}/dashboard/sites`, { 
    signal,
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch sites');
  }
  return response.json();
};

const getStores = async (signal?: AbortSignal): Promise<StoreData[]> => {
  const response = await fetch(`${BASE_API_URL}/dashboard/stores`, { 
    signal,
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch stores');
  }
  return response.json();
};

const getRegions = async (signal?: AbortSignal): Promise<Region[]> => {
  const response = await fetch(`${BASE_API_URL}/dashboard/regions`, { 
    signal,
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch regions');
  }
  return response.json();
};

class CustomerDashboardService {
  private baseUrl = BASE_API_URL;

  private getHeaders() {
    const token = localStorage.getItem('authToken');
    const user = getActiveUser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use extractCustomerId utility for consistent extraction
    // Ensure user object has role if missing
    if (!user.role && !user.Role) {
      const storedRole = sessionStore.getUser()?.role || null;
      if (storedRole) {
        user.role = storedRole;
      }
    }
    
    const customerId = extractCustomerId(user);
    
    if (customerId) {
      headers['X-Customer-Id'] = customerId.toString();
      console.log('🔍 [DashboardService] Setting X-Customer-Id header:', customerId);
    } else {
      console.warn('⚠️ [DashboardService] No customerId found in user object:', {
        user,
        userRole: user.role || user.Role,
        localStorageUserRole: sessionStore.getUser()?.role
      });
    }
    
    return headers;
  }

  private async fetchWithSignal<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;
      console.log(`🔍 [DashboardService] Fetching: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        signal,
        headers: this.getHeaders()
      });

      if (!response.ok) {
        console.error(`❌ [DashboardService] HTTP error ${response.status} for ${fullUrl}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle ApiResponseDto wrapper from backend
      // Backend uses { Success, Data, Message } format (PascalCase)
      if (result && typeof result === 'object') {
        if ('Data' in result) {
          console.log(`✅ [DashboardService] Response Data property found for ${fullUrl}`);
          return result.Data as T;
        }
        if ('data' in result) {
          console.log(`✅ [DashboardService] Response data property found for ${fullUrl}`);
          return result.data as T;
        }
      }
      
      console.log(`✅ [DashboardService] Returning raw result for ${fullUrl}`);
      return result as T;
    } catch (error) {
      // Don't log AbortError as it's expected during cleanup
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw AbortError without logging
      }
      // Log and wrap other errors
      const fullUrl = `${this.baseUrl}${endpoint}`;
      console.error(`❌ [DashboardService] Failed to fetch ${fullUrl}:`, error);
      throw new Error(`Failed to fetch ${fullUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getStores(signal?: AbortSignal): Promise<StoreData[]> {
    // Use sites endpoint since stores don't exist - sites serve as stores
    const sites = await this.getSites(signal);
    // Transform sites to StoreData format
    return sites.map(site => ({
      id: site.id,
      name: site.locationName,
      customerId: site.customerId,
      metrics: {
        'customer-site': [],
        'customer-ho': []
      },
      incidentData: {
        daily: [],
        weekly: [],
        monthly: [],
        yearly: []
      },
      recentIncidents: []
    }));
  }

  async getRegions(signal?: AbortSignal): Promise<Region[]> {
    // Get all regions by requesting a large page size from real backend API
    const user = getActiveUser();
    const customerId = user.customerId || user.CustomerId || user.companyId;
    const url = customerId 
      ? `/region?page=1&pageSize=1000&customerId=${customerId}`
      : '/region?page=1&pageSize=1000';
    
    // fetchWithSignal already extracts the Data property from ApiResponseDto
    const backendRegions = await this.fetchWithSignal<any[]>(url, signal);
    
    // Ensure we have an array
    const regionsArray = Array.isArray(backendRegions) ? backendRegions : [];
    
    // Map backend RegionDto to frontend Region format
    return regionsArray.map((region: any) => ({
      id: region.RegionID?.toString() || region.regionID?.toString() || region.id?.toString() || '',
      name: region.RegionName || region.regionName || region.name || '',
      customerId: region.FkCustomerID || region.fkCustomerID || region.customerId || region.CustomerId || 0,
      code: region.RegionCode || region.regionCode || region.code || '',
      status: region.RecordIsDeletedYN === false ? 'active' : 'inactive',
      createdAt: region.DateCreated || region.dateCreated || region.createdAt || '',
      updatedAt: region.DateModified || region.dateModified || region.updatedAt || ''
    }));
  }

  async getSites(signal?: AbortSignal): Promise<Site[]> {
    // Get all sites by requesting a large page size from real backend API
    const user = getActiveUser();
    const customerId = user.customerId || user.CustomerId || user.companyId;
    const url = customerId 
      ? `/site?page=1&pageSize=1000&customerId=${customerId}`
      : '/site?page=1&pageSize=1000';
    
    // fetchWithSignal already extracts the Data property from ApiResponseDto
    const backendSites = await this.fetchWithSignal<any[]>(url, signal);
    
    // Ensure we have an array
    const sitesArray = Array.isArray(backendSites) ? backendSites : [];
    
    // Map backend SiteDto to frontend Site format
    return sitesArray.map((site: any) => ({
      id: site.SiteID?.toString() || site.siteID?.toString() || site.id?.toString() || '',
      locationName: site.LocationName || site.locationName || site.name || '',
      regionId: site.FkRegionID?.toString() || site.fkRegionID?.toString() || site.regionId?.toString() || site.RegionId?.toString() || '',
      customerId: site.FkCustomerID || site.fkCustomerID || site.customerId || site.CustomerId || 0,
      buildingName: site.BuildingName || site.buildingName || '',
      street: site.NumberAndStreet || site.numberandStreet || site.street || '',
      town: site.Town || site.town || '',
      county: site.County || site.county || '',
      postcode: site.Postcode || site.postcode || '',
      isCoreSite: site.CoreSiteYN === true || site.coreSiteYN === true || site.isCoreSite === true,
      sinNumber: site.SinNumber || site.sinNumber || '',
      telephone: site.TelephoneNumber || site.telephoneNumber || site.telephone || '',
      status: site.RecordIsDeletedYN === false ? 'active' : 'inactive',
      createdAt: site.DateCreated || site.dateCreated || site.createdAt || '',
      updatedAt: site.DateModified || site.dateModified || site.updatedAt || ''
    }));
  }

  async getStoreData(storeId: string, signal?: AbortSignal): Promise<CustomerStoreData> {
    // Use site endpoint since stores are represented as sites in the backend
    return this.getSiteData(storeId, signal);
  }

  async getSiteData(siteId: string, signal?: AbortSignal): Promise<CustomerStoreData> {
    // Get site data from real backend API
    const siteResponse = await this.fetchWithSignal<{ Success: boolean; Data: any; Message?: string }>(`/site/${siteId}`, signal);
    const site = Array.isArray(siteResponse) ? siteResponse[0] : (siteResponse?.Data || siteResponse);
    
    // Map backend SiteDto fields to frontend format
    const siteIdNum = site.SiteID || site.siteID || parseInt(siteId, 10);
    const customerId = site.fkCustomerID || site.customerId || site.CustomerId;
    const siteName = site.LocationName || site.locationName || site.name || '';
    
    // Get incidents for this site - fetch more for chart data calculation
    const user = getActiveUser();
    const userCustomerId = user.customerId || user.CustomerId || user.companyId || customerId;
    
    let recentIncidents: RecentIncident[] = [];
    let allIncidentsForChart: Array<{ date: string; officerRole?: string; officerType?: string; value?: number; amount?: number }> = [];
    try {
      // Fetch more incidents for chart calculation (last 2 years should be enough)
      const incidentsResponse = await this.fetchWithSignal<{ Success: boolean; Data: { items?: any[] } | any[]; Message?: string }>(
        `/incidents?page=1&pageSize=500&siteId=${siteIdNum}${userCustomerId ? `&customerId=${userCustomerId}` : ''}`, 
        signal
      );
      const incidentsData = Array.isArray(incidentsResponse) 
        ? incidentsResponse 
        : (incidentsResponse?.Data || []);
      const incidents = Array.isArray(incidentsData) ? incidentsData : (incidentsData?.items || []);
      
      // Map incidents for recent incidents list
      recentIncidents = incidents.slice(0, 10).map((inc: any) => ({
        id: inc.Id || inc.id?.toString() || '',
        customerId: inc.CustomerId || inc.customerId || userCustomerId || 0,
        date: inc.DateOfIncident || inc.Date || inc.date || inc.incidentDate || '',
        regionId: inc.RegionId?.toString() || inc.regionId?.toString() || '',
        regionName: inc.RegionName || inc.regionName || '',
        siteId: inc.SiteId?.toString() || inc.siteId?.toString() || siteIdNum.toString(),
        siteName: inc.SiteName || inc.siteName || siteName,
        type: inc.IncidentType || inc.incidentType || inc.type || '',
        value: inc.TotalValueRecovered || inc.Value || inc.value || 0,
        assignedTo: inc.AssignedTo || inc.assignedTo || '',
        customerName: inc.CustomerName || inc.customerName || '',
        store: inc.SiteName || inc.siteName || siteName,
        officerName: inc.OfficerName || inc.officerName || '',
        amount: inc.TotalValueRecovered || inc.Amount || inc.amount || inc.value || 0,
        incidentType: inc.IncidentType || inc.incidentType || inc.type || ''
      }));

      // Map all incidents for chart calculation
      allIncidentsForChart = incidents.map((inc: any) => ({
        date: inc.DateOfIncident || inc.Date || inc.date || inc.incidentDate || '',
        officerRole: inc.OfficerRole || inc.officerRole || '',
        officerType: inc.OfficerType || inc.officerType || '',
        value: inc.TotalValueRecovered || inc.Value || inc.value || 0,
        amount: inc.TotalValueRecovered || inc.Amount || inc.amount || inc.value || 0
      }));
    } catch (error) {
      // AbortError is expected during component cleanup - don't log it
      if (error instanceof Error && error.name === 'AbortError') {
        // Return empty structure on abort
        return {
          id: siteIdNum.toString(),
          name: siteName,
          customerId: customerId || userCustomerId || 0,
          metrics: {
            customerhomanager: [],
            customersitemanager: []
          },
          recentIncidents: [],
          incidentData: {
            daily: [],
            weekly: [],
            monthly: [],
            yearly: []
          }
        };
      }
      console.warn('⚠️ [DashboardService] Could not fetch incidents:', error);
      // Continue with empty incidents on error
    }
    
    // Calculate incident chart data
    const incidentData = calculateIncidentChartData(allIncidentsForChart);
    
    // Transform to CustomerStoreData format
    // Note: Metrics would need to be calculated from incidents/activities
    // For now, return basic structure that can be enhanced
    return {
      id: siteIdNum.toString(),
      name: siteName,
      customerId: customerId || userCustomerId || 0,
      metrics: {
        customerhomanager: [],
        customersitemanager: []
      },
      recentIncidents,
      incidentData
    };
  }

  async getSatisfactionData(siteIds?: string[], signal?: AbortSignal): Promise<SatisfactionDataPoint[]> {
    // Use real backend API for customer satisfaction from customerSatisfactionSurveys table
    const user = getActiveUser();
    const customerId = user.customerId || user.CustomerId || user.companyId;
    const url = customerId 
      ? `/customer-satisfaction?page=1&pageSize=1000&customerId=${customerId}`
      : '/customer-satisfaction?page=1&pageSize=1000';
    
    try {
      const response = await this.fetchWithSignal<any>(url, signal);
      const items = extractApiResponseData(response);
      
      // Filter by site if siteIds are provided
      let filteredItems = items;
      if (siteIds && siteIds.length > 0 && items.length > 0) {
        // Get site names for filtering (since API returns SiteName, not siteId)
        // Normalize names for case-insensitive matching
        const sites = await this.getSites(signal);
        const siteNames = sites
          .filter(site => siteIds.includes(site.id))
          .map(site => site.locationName.trim().toLowerCase());
        
        if (siteNames.length > 0) {
          filteredItems = items.filter((item: any) => {
            const itemSiteName = (item.SiteName || item.siteName || '').trim().toLowerCase();
            return itemSiteName && siteNames.includes(itemSiteName);
          });
        } else {
          // If no matching sites found, return empty to avoid showing unrelated data
          return [];
        }
      }
      
      if (filteredItems.length === 0) {
        return [];
      }
      
      // Transform CustomerSatisfactionSurvey to SatisfactionDataPoint format
      // Group by both month AND site to allow showing sites on X-axis
      const siteMonthData = new Map<string, { 
        ratings: number[]; 
        nps: number[]; 
        recommendations: number[];
        month: string;
        siteName: string;
      }>();
      
      filteredItems.forEach((item: any) => {
        const surveyDate = item.Date || item.date || item.SurveyDate || item.surveyDate;
        if (!surveyDate) return;
        
        const date = new Date(surveyDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const siteName = item.SiteName || item.siteName || '';
        
        if (!siteName) return; // Skip items without site name
        
        // Create unique key for site + month combination
        const key = `${siteName}|${monthKey}`;
        
        if (!siteMonthData.has(key)) {
          siteMonthData.set(key, { 
            ratings: [], 
            nps: [], 
            recommendations: [],
            month: monthKey,
            siteName: siteName
          });
        }
        
        const siteMonth = siteMonthData.get(key)!;
        
        // Calculate overall rating from Ratings object (average of all rating fields)
        const ratingsObj = item.Ratings || item.ratings || {};
        if (ratingsObj && typeof ratingsObj === 'object') {
          const ratingValues = Object.values(ratingsObj).filter((v: any) => 
            typeof v === 'number' && v > 0
          ) as number[];
          if (ratingValues.length > 0) {
            const avgRating = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
            siteMonth.ratings.push(avgRating);
          }
        }
        
        // NPS score - if not directly available, we can calculate from ratings or use 0
        if (siteMonth.ratings.length > 0) {
          const latestRating = siteMonth.ratings[siteMonth.ratings.length - 1];
          const npsLike = latestRating >= 4 ? 50 : latestRating >= 3 ? 0 : -50;
          siteMonth.nps.push(npsLike);
        }
        
        // Recommendation - infer from high ratings
        if (siteMonth.ratings.length > 0) {
          const latestRating = siteMonth.ratings[siteMonth.ratings.length - 1];
          siteMonth.recommendations.push(latestRating >= 4 ? 100 : latestRating >= 3 ? 50 : 0);
        }
      });
      
      // Convert to SatisfactionDataPoint array - one entry per site per month
      return Array.from(siteMonthData.values())
        .map((data) => ({
          id: `${data.siteName}-${data.month}`,
          customerId: customerId || 0,
          month: data.month,
          score: data.ratings.length > 0 
            ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length 
            : 0,
          rating: data.ratings.length > 0 
            ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length 
            : 0,
          nps: data.nps.length > 0 
            ? data.nps.reduce((sum, n) => sum + n, 0) / data.nps.length 
            : 0,
          recommendation: data.recommendations.length > 0
            ? data.recommendations.reduce((sum, r) => sum + r, 0) / data.recommendations.length
            : 0,
          siteName: data.siteName
        }))
        .sort((a, b) => {
          // Sort by date (most recent first), then by site name
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          if (dateB.getTime() !== dateA.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          return a.siteName?.localeCompare(b.siteName || '') || 0;
        });
    } catch (error) {
      // AbortError is expected during component cleanup - don't log it
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      // Only log actual errors
      console.warn('⚠️ [DashboardService] Could not fetch satisfaction data:', error);
      return [];
    }
  }

  async getBeSafeData(signal?: AbortSignal, siteIds?: string[]): Promise<BeSafeDataPoint[]> {
    // Be Safe Be Secure data from DailyActivityReports table
    // This data represents compliance metrics from daily activity reports
    // Uses the same parameters as Daily Activity Reports for consistency
    const user = getActiveUser();
    const customerId = user.customerId || user.CustomerId || user.companyId;
    
    // Build URL with same parameters as getDailyActivities
    let url = customerId 
      ? `/daily-activity-reports?page=1&pageSize=1000&customerId=${customerId}`
      : '/daily-activity-reports?page=1&pageSize=1000';
    
    // Add siteId filter if provided (same as Daily Activities)
    if (siteIds && siteIds.length > 0 && siteIds[0] !== 'all') {
      // If multiple sites, we need to fetch for each site or use a different approach
      // For now, if single site selected, filter by it
      if (siteIds.length === 1) {
        url += `&siteId=${siteIds[0]}`;
      }
      // For multiple sites, we'll filter in the frontend after fetching
    }
    
    try {
      const response = await this.fetchWithSignal<any>(url, signal);
      const items = extractApiResponseData(response);
      
      // Group by month and calculate compliance metrics
      const monthlyData = new Map<string, {
        insecureAreas: number[];
        compliance: number[];
        systems: number[];
      }>();
      
      // Filter by siteIds if multiple sites selected (frontend filtering)
      let filteredItems = items;
      if (siteIds && siteIds.length > 0 && siteIds[0] !== 'all' && siteIds.length > 1) {
        filteredItems = items.filter((item: any) => {
          const itemSiteId = item.SiteId || item.siteId || '';
          return siteIds.includes(itemSiteId);
        });
      }
      
      filteredItems.forEach((item: any) => {
        const reportDate = item.ReportDate || item.reportDate || item.date;
        if (!reportDate) return;
        
        const date = new Date(reportDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { insecureAreas: [], compliance: [], systems: [] });
        }
        
        const monthData = monthlyData.get(monthKey)!;
        
        // Calculate compliance percentage from Compliance DTO (backend maps columns to DTO)
        const complianceObj = item.Compliance || item.compliance || {};
        const complianceFields: any[] = [];
        
        // Extract all YesNoFieldDto fields from Compliance object
        Object.entries(complianceObj).forEach(([key, field]: [string, any]) => {
          if (key === 'constructor' || key === '__proto__') return;
          
          if (field && typeof field === 'object' && !Array.isArray(field)) {
            if ('Value' in field || 'value' in field) {
              complianceFields.push(field);
            }
          }
        });
        
        if (complianceFields.length > 0) {
          const compliantCount = complianceFields.filter((field: any) => {
            const value = String(field.Value || field.value || '').toLowerCase().trim();
            return value === 'yes';
          }).length;
          const compliancePercentage = (compliantCount / complianceFields.length) * 100;
          monthData.compliance.push(compliancePercentage);
        }
        
        // Calculate insecure areas percentage from InsecureAreas DTO
        const insecureAreasObj = item.InsecureAreas || item.insecureAreas || {};
        const insecureFields: any[] = [];
        
        Object.entries(insecureAreasObj).forEach(([key, field]: [string, any]) => {
          if (field && typeof field === 'object') {
            if ('Value' in field || 'value' in field) {
              insecureFields.push(field);
            }
          }
        });
        
        if (insecureFields.length > 0) {
          const secureCount = insecureFields.filter((field: any) => {
            const value = (field.Value || field.value || '').toLowerCase();
            return value === 'yes'; // 'yes' means secure
          }).length;
          // Insecure areas = percentage of areas that are NOT secure
          const insecurePercentage = ((insecureFields.length - secureCount) / insecureFields.length) * 100;
          monthData.insecureAreas.push(insecurePercentage);
        }
        
        // Calculate systems working percentage from SystemsNotWorking DTO
        // SystemsNotWorking: 'yes' means system is NOT working, 'no' means system IS working
        const systemsObj = item.SystemsNotWorking || item.systemsNotWorking || item.Systems || item.systems || {};
        const systemsFields: any[] = [];
        
        Object.entries(systemsObj).forEach(([key, field]: [string, any]) => {
          if (field && typeof field === 'object') {
            if ('Value' in field || 'value' in field) {
              systemsFields.push(field);
            }
          }
        });
        
        if (systemsFields.length > 0) {
          const workingCount = systemsFields.filter((field: any) => {
            const value = (field.Value || field.value || '').toLowerCase();
            // Systems NOT working = "yes" means system is not working
            // Systems working = "no" means system is working
            return value === 'no';
          }).length;
          // Systems working = percentage of systems that are NOT not working
          const systemsWorkingPercentage = (workingCount / systemsFields.length) * 100;
          monthData.systems.push(systemsWorkingPercentage);
        }
      });
      
      // Convert to BeSafeDataPoint array
      const result = Array.from(monthlyData.entries())
        .map(([month, data]) => {
          const insecureAreas = data.insecureAreas.length > 0
            ? Math.round(data.insecureAreas.reduce((sum, v) => sum + v, 0) / data.insecureAreas.length)
            : null;
          const compliance = data.compliance.length > 0
            ? Math.round(data.compliance.reduce((sum, v) => sum + v, 0) / data.compliance.length)
            : null;
          const systems = data.systems.length > 0
            ? Math.round(data.systems.reduce((sum, v) => sum + v, 0) / data.systems.length)
            : null;
          
          return {
            id: month,
            customerId: customerId || 0,
            month,
            insecureAreas: insecureAreas ?? 0,
            compliance: compliance ?? 0,
            systems: systems ?? 0
          };
        })
        .sort((a, b) => {
          // Sort by date (most recent first)
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateB.getTime() - dateA.getTime();
        });
      
      if (import.meta.env.DEV && result.length > 0) {
        console.log('📊 [BeSafe] Processed data points:', result);
        console.log('📊 [BeSafe] Sample data point:', result[0]);
      }
      
      return result;
    } catch (error) {
      // AbortError is expected during component cleanup - don't log it
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      // Only log actual errors
      console.warn('⚠️ [DashboardService] Could not fetch Be Safe Be Secure data:', error);
      return [];
    }
  }

  async getDailyActivities(signal?: AbortSignal): Promise<DailyActivity[]> {
    // Use real backend API for daily activity reports
    const user = getActiveUser();
    const customerId = user.customerId || user.CustomerId || user.companyId;
    const url = customerId 
      ? `/daily-activity-reports?page=1&pageSize=1000&customerId=${customerId}`
      : '/daily-activity-reports?page=1&pageSize=1000';
    
    const response = await this.fetchWithSignal<{ Success: boolean; Data: { items?: any[] } | any[]; Message?: string }>(url, signal);
    
    // Transform backend response to frontend format
    const responseData = Array.isArray(response) 
      ? response 
      : (response?.Data || []);
    const items = Array.isArray(responseData) ? responseData : (responseData?.items || []);
    
    // Transform DailyActivityReport to DailyActivity format
    return items.map((item: any) => ({
      id: item.id?.toString() || '',
      customerId: item.customerId || customerId || 0,
      type: item.reportType || 'Activity',
      location: item.siteName || item.locationName || '',
      time: item.reportDate ? new Date(item.reportDate).toLocaleTimeString() : '',
      officer: item.officerName || item.createdBy || '',
      status: item.status === 'Approved' ? 'completed' : 'in_progress'
    }));
  }

  async getAggregatedSitesData(siteIds: string[], signal?: AbortSignal): Promise<CustomerStoreData> {
    // Aggregate data from multiple sites
    // Fetch all sites and their incidents, then aggregate
    const user = getActiveUser();
    const customerId = user.customerId || user.CustomerId || user.companyId;
    
    // Fetch all sites
    const sitesPromises = siteIds.map(id => 
      this.fetchWithSignal<{ Success: boolean; Data: any; Message?: string }>(`/site/${id}`, signal).catch(() => null)
    );
    const sitesResults = await Promise.all(sitesPromises);
    const sites = sitesResults
      .filter(r => r !== null)
      .map(r => Array.isArray(r) ? r[0] : (r?.Data || r?.data || r));
    
    // Aggregate incidents from all sites - fetch more for chart data calculation
    let allIncidents: RecentIncident[] = [];
    let allIncidentsForChart: Array<{ date: string; officerRole?: string; officerType?: string; value?: number; amount?: number }> = [];
    try {
      const incidentsPromises = siteIds.map(id =>
        this.fetchWithSignal<{ Success: boolean; Data: { items?: any[] } | any[]; Message?: string }>(
          `/incidents?page=1&pageSize=500&siteId=${id}${customerId ? `&customerId=${customerId}` : ''}`, 
          signal
        ).catch(() => ({ Success: false, Data: [] }))
      );
      const incidentsResults = await Promise.all(incidentsPromises);
      const incidentsArrays = incidentsResults.map(r => {
        const data = Array.isArray(r) ? r : (r?.Data || []);
        return Array.isArray(data) ? data : (data?.items || []);
      });
      const flatIncidents = incidentsArrays.flat();
      
      // Map for recent incidents list
      allIncidents = flatIncidents.map((inc: any) => ({
        id: inc.Id || inc.id?.toString() || '',
        customerId: inc.CustomerId || inc.customerId || customerId || 0,
        date: inc.DateOfIncident || inc.Date || inc.date || inc.incidentDate || '',
        regionId: inc.RegionId?.toString() || inc.regionId?.toString() || '',
        regionName: inc.RegionName || inc.regionName || '',
        siteId: inc.SiteId?.toString() || inc.siteId?.toString() || '',
        siteName: inc.SiteName || inc.siteName || '',
        type: inc.IncidentType || inc.incidentType || inc.type || '',
        value: inc.TotalValueRecovered || inc.Value || inc.value || 0,
        assignedTo: inc.AssignedTo || inc.assignedTo || '',
        customerName: inc.CustomerName || inc.customerName || '',
        store: inc.SiteName || inc.siteName || '',
        officerName: inc.OfficerName || inc.officerName || '',
        amount: inc.TotalValueRecovered || inc.Amount || inc.amount || inc.value || 0,
        incidentType: inc.IncidentType || inc.incidentType || inc.type || ''
      }));

      // Map all incidents for chart calculation
      allIncidentsForChart = flatIncidents.map((inc: any) => ({
        date: inc.DateOfIncident || inc.Date || inc.date || inc.incidentDate || '',
        officerRole: inc.OfficerRole || inc.officerRole || '',
        officerType: inc.OfficerType || inc.officerType || '',
        value: inc.TotalValueRecovered || inc.Value || inc.value || 0,
        amount: inc.TotalValueRecovered || inc.Amount || inc.amount || inc.value || 0
      }));
    } catch (error) {
      // AbortError is expected during component cleanup - don't log it
      if (error instanceof Error && error.name === 'AbortError') {
        // Return empty structure on abort
        return {
          id: 'aggregated',
          name: `Aggregated (${sites.length} sites)`,
          customerId: customerId || 0,
          metrics: {
            customerhomanager: [],
            customersitemanager: []
          },
          recentIncidents: [],
          incidentData: {
            daily: [],
            weekly: [],
            monthly: [],
            yearly: []
          }
        };
      }
      console.warn('⚠️ [DashboardService] Could not fetch aggregated incidents:', error);
      // Continue with empty incidents on error
    }
    
    // Calculate incident chart data
    const incidentData = calculateIncidentChartData(allIncidentsForChart);
    
    // Return aggregated data
    return {
      id: 'aggregated',
      name: `Aggregated (${sites.length} sites)`,
      customerId: customerId || 0,
      metrics: {
        customerhomanager: [],
        customersitemanager: []
      },
      recentIncidents: allIncidents.slice(0, 10), // Limit to 10 most recent
      incidentData
    };
  }
}

export const customerDashboardService = new CustomerDashboardService(); 