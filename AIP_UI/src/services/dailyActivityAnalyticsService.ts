import { dailyActivityService } from '@/services/dailyActivityService';
import type { DailyActivityReport, DailyActivityFilters } from '@/types/dailyActivity';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  siteId?: string;
  customerId?: string;
}

export interface SiteBreakdownData {
  site: string;
  siteId: string;
  insecureAreas: number;
  compliance: number;
  systems: number;
}

export interface TypeBreakdownData {
  type: string;
  value: number;
}

export interface InsecureAreaData {
  area: string;
  value: number;
}

export interface SystemsCheckData {
  area: string;
  value: number;
}

export interface ComplianceCheckData {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsResponse {
  siteBreakdown: SiteBreakdownData[];
  typeBreakdown: TypeBreakdownData[];
  insecureAreas: InsecureAreaData[];
  systemsChecks: SystemsCheckData[];
  complianceChecks: ComplianceCheckData[];
  totalReports: number;
  dateRange: {
    from: string;
    to: string;
  };
}

const DEFAULT_ANALYTICS_RANGE = () => {
  const today = new Date().toISOString().split('T')[0];
  return { from: today, to: today };
};

const toYes = (value?: string | null) => value?.toLowerCase() === 'yes';
const toNo = (value?: string | null) => value?.toLowerCase() === 'no';

const mapFilters = (filters?: AnalyticsFilters): DailyActivityFilters | undefined => {
  if (!filters) {
    return undefined;
  }

  const hasDateRange = filters.startDate || filters.endDate;

  return {
    search: '',
    customerId: filters.customerId ?? '',
    siteId: filters.siteId ?? '',
    officerName: '',
    ...(filters.startDate ? { reportDate: filters.startDate } : {}),
    ...(hasDateRange
      ? {
          dateRange: {
            from: filters.startDate ? new Date(filters.startDate) : undefined,
            to: filters.endDate ? new Date(filters.endDate) : undefined
          }
        }
      : {})
  };
};

const aggregateAnalyticsData = (reports: DailyActivityReport[], filters?: AnalyticsFilters): AnalyticsResponse => {
  const siteGroups = reports.reduce<Record<string, { site: string; siteId: string; reports: DailyActivityReport[] }>>(
    (acc, report) => {
      const key = `${report.siteId}_${report.siteName}`;
      if (!acc[key]) {
        acc[key] = {
          site: report.siteName,
          siteId: report.siteId,
          reports: []
        };
      }
      acc[key].reports.push(report);
      return acc;
    },
    {}
  );

  const siteBreakdown: SiteBreakdownData[] = Object.values(siteGroups).map((group) => {
    let insecureAreas = 0;
    let compliance = 0;
    let systems = 0;

    group.reports.forEach((report) => {
      Object.values(report.insecureAreas ?? {}).forEach((area) => {
        if (toNo(area?.value)) {
          insecureAreas += 1;
        }
      });

      Object.values(report.compliance ?? {}).forEach((item) => {
        if (toYes(item?.value)) {
          compliance += 1;
        }
      });

      Object.values(report.systemsNotWorking ?? {}).forEach((system) => {
        if (toYes(system?.value)) {
          systems += 1;
        }
      });
    });

    return {
      site: group.site,
      siteId: group.siteId,
      insecureAreas,
      compliance,
      systems
    };
  });

  const totalInsecureAreas = siteBreakdown.reduce((sum, site) => sum + site.insecureAreas, 0);
  const totalCompliance = siteBreakdown.reduce((sum, site) => sum + site.compliance, 0);
  const totalSystems = siteBreakdown.reduce((sum, site) => sum + site.systems, 0);

  const typeBreakdown: TypeBreakdownData[] = [
    { type: 'Compliance Issues', value: totalCompliance },
    { type: 'Insecure Areas', value: totalInsecureAreas },
    { type: 'Systems Not Working', value: totalSystems }
  ];

  const insecureAreasTemplate: Record<string, number> = {
    'Kiosk': 0,
    'High Value Room': 0,
    'Managers Office': 0,
    'Warehouse To Sales Floor': 0,
    'Service Yard': 0,
    'Car Park / Grounds': 0,
    'Fire Doors (Back Of House)': 0,
    'Fire Doors (Shop Floor)': 0
  };

  const systemsTemplate: Record<string, number> = {
    'Watch Me Now': 0,
    'CCTV': 0,
    'Intruder Alarm': 0,
    'Keyholding': 0,
    'Body Worn CCTV': 0,
    'Cigarette Tracker': 0,
    'Crime Reporting': 0
  };

  const complianceTemplate: Record<string, { color: string; count: number }> = {
    'Tills over £150': { color: '#ff6b6b', count: 0 },
    'Cash Office Door Open': { color: '#4ecdc4', count: 0 },
    'Visible Cash On Display': { color: '#45b7d1', count: 0 },
    'Visible Keys On Display': { color: '#96ceb4', count: 0 },
    'Fire Routes Blocked': { color: '#ffeaa7', count: 0 },
    'ATM Abuse': { color: '#dda0dd', count: 0 },
    'Be Safe Be Secure Poster Missing': { color: '#98d8c8', count: 0 }
  };

  reports.forEach((report) => {
    const insecure = report.insecureAreas;
    if (insecure) {
      if (toNo(insecure.kioskSecure?.value)) insecureAreasTemplate['Kiosk'] += 1;
      if (toNo(insecure.highValueRoom?.value)) insecureAreasTemplate['High Value Room'] += 1;
      if (toNo(insecure.managersOffice?.value)) insecureAreasTemplate['Managers Office'] += 1;
      if (toNo(insecure.warehouseToSalesFloor?.value)) insecureAreasTemplate['Warehouse To Sales Floor'] += 1;
      if (toNo(insecure.serviceYard?.value)) insecureAreasTemplate['Service Yard'] += 1;
      if (toNo(insecure.carParkGrounds?.value)) insecureAreasTemplate['Car Park / Grounds'] += 1;
      if (toNo(insecure.fireDoorsBackOfHouse?.value)) insecureAreasTemplate['Fire Doors (Back Of House)'] += 1;
      if (toNo(insecure.fireDoorsShopFloor?.value)) insecureAreasTemplate['Fire Doors (Shop Floor)'] += 1;
    }

    const systems = report.systemsNotWorking;
    if (systems) {
      if (toYes(systems.watchMeNow?.value)) systemsTemplate['Watch Me Now'] += 1;
      if (toYes(systems.cctv?.value)) systemsTemplate['CCTV'] += 1;
      if (toYes(systems.intruderAlarm?.value)) systemsTemplate['Intruder Alarm'] += 1;
      if (toYes(systems.keyholding?.value)) systemsTemplate['Keyholding'] += 1;
      if (toYes(systems.bodyWornCctv?.value)) systemsTemplate['Body Worn CCTV'] += 1;
      if (toYes(systems.cigaretteTracker?.value)) systemsTemplate['Cigarette Tracker'] += 1;
      if (toYes(systems.crimeReporting?.value)) systemsTemplate['Crime Reporting'] += 1;
    }

    const compliance = report.compliance;
    if (compliance) {
      if (toYes(compliance.tillsContainedOverCash?.value)) complianceTemplate['Tills over £150'].count += 1;
      if (toYes(compliance.cashOfficeDoorOpen?.value)) complianceTemplate['Cash Office Door Open'].count += 1;
      if (toYes(compliance.visibleCashOnDisplay?.value)) complianceTemplate['Visible Cash On Display'].count += 1;
      if (toYes(compliance.visibleKeysOnDisplay?.value)) complianceTemplate['Visible Keys On Display'].count += 1;
      if (toYes(compliance.fireRoutesBlocked?.value)) complianceTemplate['Fire Routes Blocked'].count += 1;
      if (toYes(compliance.atmAbuse?.value)) complianceTemplate['ATM Abuse'].count += 1;
      if (toNo(compliance.beSafeBSecurePoster?.value)) complianceTemplate['Be Safe Be Secure Poster Missing'].count += 1;
    }
  });

  const insecureAreas: InsecureAreaData[] = Object.entries(insecureAreasTemplate).map(([area, value]) => ({
    area,
    value
  }));

  const systemsChecks: SystemsCheckData[] = Object.entries(systemsTemplate).map(([area, value]) => ({
    area,
    value
  }));

  const complianceChecks: ComplianceCheckData[] = Object.entries(complianceTemplate).map(([name, meta]) => ({
    name,
    value: meta.count,
    color: meta.color
  }));

  const sortedDates = reports
    .map((report) => report.reportDate)
    .filter(Boolean)
    .sort();

  const dateRange = sortedDates.length
    ? { from: sortedDates[0], to: sortedDates[sortedDates.length - 1] }
    : DEFAULT_ANALYTICS_RANGE();

  if (!sortedDates.length && filters?.startDate) {
    dateRange.from = filters.startDate;
  }
  if (!sortedDates.length && filters?.endDate) {
    dateRange.to = filters.endDate;
  }

  return {
    siteBreakdown,
    typeBreakdown,
    insecureAreas,
    systemsChecks,
    complianceChecks,
    totalReports: reports.length,
    dateRange
  };
};

const fetchAllReports = async (filters?: AnalyticsFilters) => {
  const mappedFilters = mapFilters(filters);
  const pageSize = 100;
  let currentPage = 1;
  let total = 0;
  const reports: DailyActivityReport[] = [];

  do {
    const response = await dailyActivityService.getReports(currentPage, pageSize, mappedFilters);
    reports.push(...response.data);
    total = response.pagination.total;
    currentPage += 1;
    if (response.data.length === 0) {
      break;
    }
  } while (reports.length < total);

  return reports;
};

export const dailyActivityAnalyticsService = {
  // Get analytics data with optional filters
  async getAnalytics(filters?: AnalyticsFilters): Promise<AnalyticsResponse> {
    const reports = await fetchAllReports(filters);
    return aggregateAnalyticsData(reports, filters);
  },

  // Get site breakdown data
  async getSiteBreakdown(filters?: AnalyticsFilters): Promise<SiteBreakdownData[]> {
    const analytics = await this.getAnalytics(filters);
    return analytics.siteBreakdown;
  },

  // Get type breakdown data
  async getTypeBreakdown(filters?: AnalyticsFilters): Promise<TypeBreakdownData[]> {
    const analytics = await this.getAnalytics(filters);
    return analytics.typeBreakdown;
  },

  // Get insecure areas data
  async getInsecureAreas(filters?: AnalyticsFilters): Promise<InsecureAreaData[]> {
    const analytics = await this.getAnalytics(filters);
    return analytics.insecureAreas;
  },

  // Get systems checks data
  async getSystemsChecks(filters?: AnalyticsFilters): Promise<SystemsCheckData[]> {
    const analytics = await this.getAnalytics(filters);
    return analytics.systemsChecks;
  },

  // Get compliance checks data
  async getComplianceChecks(filters?: AnalyticsFilters): Promise<ComplianceCheckData[]> {
    const analytics = await this.getAnalytics(filters);
    return analytics.complianceChecks;
  }
}; 