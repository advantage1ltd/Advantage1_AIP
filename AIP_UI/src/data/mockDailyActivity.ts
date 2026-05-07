export interface DailyActivityReport {
  id: string;
  customerId: string;
  customerName: string;
  regionId: string;
  regionName: string;
  siteId: string;
  siteName: string;
  reportDate: string;
  reportMonth: string; // YYYY-MM format
  officerName: string;
  officerRole: string;
  shiftStart: string;
  shiftEnd: string;
  totalHours: number;
  
  // Security checks and compliance data
  securityChecks: {
    tillChecksCompleted: number;
    tillsOverLimit: number; // Number of tills with over £150
    cashOfficeChecks: number;
    cashOfficeOpened: number;
    cashLevelChecks: number;
    cashOverLimit: number;
    keyDisplayChecks: number;
    visibleKeysFound: number;
    fireRouteChecks: number;
    fireRoutesBlocked: number;
    atmChecks: number;
    atmAbused: number;
    posterChecks: number;
    beSafePostersMissing: number;
  };
  
  // System checks
  systemChecks: {
    watchMeNowChecks: number;
    intruderAlarmChecks: number;
    keyholdingChecks: number;
    cctvChecks: number;
    bodyWornCctvChecks: number;
    crimeReportingChecks: number;
    cigaretteTrackerChecks: number;
  };
  
  // Insecure area checks
  insecureAreaChecks: {
    kioskChecks: number;
    highValueRoomChecks: number;
    managersOfficeChecks: number;
    warehouseToSalesFloorChecks: number;
    serviceYardChecks: number;
    carParkAndGroundsChecks: number;
    fireDoorsBackOfHouseChecks: number;
    fireDoorsShopFloorChecks: number;
  };
  
  // Activities performed
  activities: {
    customerInteractions: number;
    suspiciousActivityReports: number;
    incidentsReported: number;
    maintenanceIssuesLogged: number;
    deliverySupervisions: number;
    emergencyResponsesHandled: number;
  };
  
  // Performance metrics
  metrics: {
    responseTimeMinutes: number;
    customerComplaintsCaused: number;
    customerComplimentsReceived: number;
    trainingCompletedHours: number;
    equipmentIssues: number;
  };
  
  // Report status and quality
  reportQuality: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement';
  completionTime: number; // minutes to complete report
  supervisorApproved: boolean;
  supervisorName?: string;
  supervisorComments?: string;
  
  createdAt: string;
  updatedAt: string;
}

export const MOCK_DAILY_ACTIVITY_REPORTS: DailyActivityReport[] = [
  // Central England COOP reports
  {
    id: "DAR-001",
    customerId: "1",
    customerName: "Central England COOP",
    regionId: "R001",
    regionName: "Leicester Central",
    siteId: "S001",
    siteName: "Anson Road Store",
    reportDate: "2024-01-15",
    reportMonth: "2024-01",
    officerName: "John Smith",
    officerRole: "Security Officer",
    shiftStart: "08:00",
    shiftEnd: "16:00",
    totalHours: 8,
    
    securityChecks: {
      tillChecksCompleted: 12,
      tillsOverLimit: 3,
      cashOfficeChecks: 4,
      cashOfficeOpened: 1,
      cashLevelChecks: 8,
      cashOverLimit: 0,
      keyDisplayChecks: 6,
      visibleKeysFound: 2,
      fireRouteChecks: 8,
      fireRoutesBlocked: 0,
      atmChecks: 4,
      atmAbused: 0,
      posterChecks: 3,
      beSafePostersMissing: 1
    },
    
    systemChecks: {
      watchMeNowChecks: 8,
      intruderAlarmChecks: 3,
      keyholdingChecks: 2,
      cctvChecks: 6,
      bodyWornCctvChecks: 8,
      crimeReportingChecks: 1,
      cigaretteTrackerChecks: 4
    },
    
    insecureAreaChecks: {
      kioskChecks: 6,
      highValueRoomChecks: 4,
      managersOfficeChecks: 3,
      warehouseToSalesFloorChecks: 8,
      serviceYardChecks: 4,
      carParkAndGroundsChecks: 6,
      fireDoorsBackOfHouseChecks: 4,
      fireDoorsShopFloorChecks: 6
    },
    
    activities: {
      customerInteractions: 15,
      suspiciousActivityReports: 2,
      incidentsReported: 1,
      maintenanceIssuesLogged: 1,
      deliverySupervisions: 3,
      emergencyResponsesHandled: 0
    },
    
    metrics: {
      responseTimeMinutes: 3,
      customerComplaintsCaused: 0,
      customerComplimentsReceived: 1,
      trainingCompletedHours: 0,
      equipmentIssues: 0
    },
    
    reportQuality: "Good",
    completionTime: 25,
    supervisorApproved: true,
    supervisorName: "Sarah Johnson",
    supervisorComments: "Thorough report, good incident handling",
    
    createdAt: "2024-01-15T16:30:00Z",
    updatedAt: "2024-01-15T17:00:00Z"
  },
  
  {
    id: "DAR-002",
    customerId: "1",
    customerName: "Central England COOP",
    regionId: "R001",
    regionName: "Leicester Central",
    siteId: "S002",
    siteName: "Cropston Drive Store",
    reportDate: "2024-01-18",
    reportMonth: "2024-01",
    officerName: "Mike Davies",
    officerRole: "Security Officer",
    shiftStart: "16:00",
    shiftEnd: "00:00",
    totalHours: 8,
    
    securityChecks: {
      tillChecksCompleted: 10,
      tillsOverLimit: 2,
      cashOfficeChecks: 3,
      cashOfficeOpened: 0,
      cashLevelChecks: 6,
      cashOverLimit: 0,
      keyDisplayChecks: 4,
      visibleKeysFound: 1,
      fireRouteChecks: 6,
      fireRoutesBlocked: 1,
      atmChecks: 3,
      atmAbused: 0,
      posterChecks: 2,
      beSafePostersMissing: 0
    },
    
    systemChecks: {
      watchMeNowChecks: 6,
      intruderAlarmChecks: 2,
      keyholdingChecks: 1,
      cctvChecks: 4,
      bodyWornCctvChecks: 6,
      crimeReportingChecks: 0,
      cigaretteTrackerChecks: 3
    },
    
    insecureAreaChecks: {
      kioskChecks: 4,
      highValueRoomChecks: 3,
      managersOfficeChecks: 2,
      warehouseToSalesFloorChecks: 6,
      serviceYardChecks: 3,
      carParkAndGroundsChecks: 8,
      fireDoorsBackOfHouseChecks: 3,
      fireDoorsShopFloorChecks: 4
    },
    
    activities: {
      customerInteractions: 8,
      suspiciousActivityReports: 1,
      incidentsReported: 1,
      maintenanceIssuesLogged: 0,
      deliverySupervisions: 1,
      emergencyResponsesHandled: 0
    },
    
    metrics: {
      responseTimeMinutes: 5,
      customerComplaintsCaused: 0,
      customerComplimentsReceived: 0,
      trainingCompletedHours: 1,
      equipmentIssues: 0
    },
    
    reportQuality: "Satisfactory",
    completionTime: 18,
    supervisorApproved: true,
    supervisorName: "James Wilson",
    
    createdAt: "2024-01-19T08:30:00Z",
    updatedAt: "2024-01-19T09:00:00Z"
  },

  // Midcounties COOP reports
  {
    id: "DAR-003",
    customerId: "2",
    customerName: "Midcounties COOP",
    regionId: "R003",
    regionName: "Warwick Central",
    siteId: "S004",
    siteName: "Warwick Main Store",
    reportDate: "2024-01-16",
    reportMonth: "2024-01",
    officerName: "Tom Wilson",
    officerRole: "Security Officer",
    shiftStart: "09:00",
    shiftEnd: "17:00",
    totalHours: 8,
    
    securityChecks: {
      tillChecksCompleted: 15,
      tillsOverLimit: 4,
      cashOfficeChecks: 5,
      cashOfficeOpened: 2,
      cashLevelChecks: 10,
      cashOverLimit: 1,
      keyDisplayChecks: 8,
      visibleKeysFound: 3,
      fireRouteChecks: 10,
      fireRoutesBlocked: 0,
      atmChecks: 5,
      atmAbused: 1,
      posterChecks: 4,
      beSafePostersMissing: 2
    },
    
    systemChecks: {
      watchMeNowChecks: 10,
      intruderAlarmChecks: 4,
      keyholdingChecks: 3,
      cctvChecks: 8,
      bodyWornCctvChecks: 10,
      crimeReportingChecks: 2,
      cigaretteTrackerChecks: 6
    },
    
    insecureAreaChecks: {
      kioskChecks: 8,
      highValueRoomChecks: 6,
      managersOfficeChecks: 4,
      warehouseToSalesFloorChecks: 10,
      serviceYardChecks: 5,
      carParkAndGroundsChecks: 8,
      fireDoorsBackOfHouseChecks: 5,
      fireDoorsShopFloorChecks: 8
    },
    
    activities: {
      customerInteractions: 22,
      suspiciousActivityReports: 3,
      incidentsReported: 1,
      maintenanceIssuesLogged: 2,
      deliverySupervisions: 4,
      emergencyResponsesHandled: 0
    },
    
    metrics: {
      responseTimeMinutes: 2,
      customerComplaintsCaused: 0,
      customerComplimentsReceived: 2,
      trainingCompletedHours: 0,
      equipmentIssues: 1
    },
    
    reportQuality: "Excellent",
    completionTime: 30,
    supervisorApproved: true,
    supervisorName: "Emma Thompson",
    supervisorComments: "Excellent work on theft prevention",
    
    createdAt: "2024-01-16T18:00:00Z",
    updatedAt: "2024-01-16T18:30:00Z"
  },

  // Heart of England COOP reports
  {
    id: "DAR-004",
    customerId: "3",
    customerName: "Heart of England COOP",
    regionId: "R005",
    regionName: "Nuneaton Central",
    siteId: "S007",
    siteName: "Nuneaton High Street",
    reportDate: "2024-01-17",
    reportMonth: "2024-01",
    officerName: "Chris Evans",
    officerRole: "Security Officer",
    shiftStart: "10:00",
    shiftEnd: "18:00",
    totalHours: 8,
    
    securityChecks: {
      tillChecksCompleted: 14,
      tillsOverLimit: 5,
      cashOfficeChecks: 4,
      cashOfficeOpened: 1,
      cashLevelChecks: 9,
      cashOverLimit: 0,
      keyDisplayChecks: 7,
      visibleKeysFound: 2,
      fireRouteChecks: 9,
      fireRoutesBlocked: 1,
      atmChecks: 4,
      atmAbused: 0,
      posterChecks: 3,
      beSafePostersMissing: 0
    },
    
    systemChecks: {
      watchMeNowChecks: 9,
      intruderAlarmChecks: 3,
      keyholdingChecks: 2,
      cctvChecks: 7,
      bodyWornCctvChecks: 9,
      crimeReportingChecks: 1,
      cigaretteTrackerChecks: 5
    },
    
    insecureAreaChecks: {
      kioskChecks: 7,
      highValueRoomChecks: 5,
      managersOfficeChecks: 3,
      warehouseToSalesFloorChecks: 9,
      serviceYardChecks: 4,
      carParkAndGroundsChecks: 7,
      fireDoorsBackOfHouseChecks: 4,
      fireDoorsShopFloorChecks: 7
    },
    
    activities: {
      customerInteractions: 18,
      suspiciousActivityReports: 4,
      incidentsReported: 1,
      maintenanceIssuesLogged: 1,
      deliverySupervisions: 3,
      emergencyResponsesHandled: 1
    },
    
    metrics: {
      responseTimeMinutes: 4,
      customerComplaintsCaused: 0,
      customerComplimentsReceived: 1,
      trainingCompletedHours: 0,
      equipmentIssues: 0
    },
    
    reportQuality: "Good",
    completionTime: 35,
    supervisorApproved: true,
    supervisorName: "Lisa Anderson",
    supervisorComments: "Good response to organized theft incident",
    
    createdAt: "2024-01-17T19:00:00Z",
    updatedAt: "2024-01-17T19:30:00Z"
  }
];

// Helper functions for daily activity data retrieval
export const getDailyActivityByCustomer = (customerId: string): DailyActivityReport[] => {
  return MOCK_DAILY_ACTIVITY_REPORTS.filter(report => report.customerId === customerId);
};

export const getDailyActivityByRegion = (regionId: string): DailyActivityReport[] => {
  return MOCK_DAILY_ACTIVITY_REPORTS.filter(report => report.regionId === regionId);
};

export const getDailyActivityBySite = (siteId: string): DailyActivityReport[] => {
  return MOCK_DAILY_ACTIVITY_REPORTS.filter(report => report.siteId === siteId);
};

// Analytics for Be Safe Be Secure graphs
export const getBeSafeBeSecureData = (customerId: string) => {
  const reports = getDailyActivityByCustomer(customerId);
  
  // Aggregate data for different chart types
  const checksBySite = reports.reduce((acc, report) => {
    const siteName = report.siteName;
    if (!acc[siteName]) {
      acc[siteName] = {
        site: siteName,
        insecureAreas: 0,
        compliance: 0,
        systems: 0
      };
    }
    
    // Sum up insecure area checks
    const insecureTotal = Object.values(report.insecureAreaChecks).reduce((sum, val) => sum + val, 0);
    acc[siteName].insecureAreas += insecureTotal;
    
    // Sum up compliance checks (security checks that show issues)
    const complianceTotal = report.securityChecks.tillsOverLimit + 
                           report.securityChecks.cashOfficeOpened +
                           report.securityChecks.cashOverLimit +
                           report.securityChecks.visibleKeysFound +
                           report.securityChecks.fireRoutesBlocked +
                           report.securityChecks.atmAbused +
                           report.securityChecks.beSafePostersMissing;
    acc[siteName].compliance += complianceTotal;
    
    // Sum up system checks
    const systemsTotal = Object.values(report.systemChecks).reduce((sum, val) => sum + val, 0);
    acc[siteName].systems += systemsTotal;
    
    return acc;
  }, {} as Record<string, any>);
  
  // Check types breakdown
  const checkTypes = {
    'Compliance': reports.reduce((sum, r) => sum + r.securityChecks.tillsOverLimit + r.securityChecks.cashOfficeOpened + r.securityChecks.visibleKeysFound, 0),
    'Insecure Areas': reports.reduce((sum, r) => sum + Object.values(r.insecureAreaChecks).reduce((s, v) => s + v, 0), 0),
    'Systems': reports.reduce((sum, r) => sum + Object.values(r.systemChecks).reduce((s, v) => s + v, 0), 0)
  };
  
  // Compliance breakdown
  const complianceBreakdown = reports.reduce((acc, report) => {
    acc['Tills over £150'] += report.securityChecks.tillsOverLimit;
    acc['Cash Office Opened'] += report.securityChecks.cashOfficeOpened;
    acc['OverLimit on Cash Levels'] += report.securityChecks.cashOverLimit;
    acc['Visible Keys on display'] += report.securityChecks.visibleKeysFound;
    acc['Fire Routes Blocked'] += report.securityChecks.fireRoutesBlocked;
    acc['ATM Abused'] += report.securityChecks.atmAbused;
    acc['Be Safe Be Secure Poster'] += report.securityChecks.beSafePostersMissing;
    return acc;
  }, {
    'Tills over £150': 0,
    'Cash Office Opened': 0,
    'OverLimit on Cash Levels': 0,
    'Visible Keys on display': 0,
    'Fire Routes Blocked': 0,
    'ATM Abused': 0,
    'Be Safe Be Secure Poster': 0
  });
  
  return {
    checksBySite: Object.values(checksBySite),
    checkTypes: Object.entries(checkTypes).map(([type, value]) => ({ type, value })),
    complianceBreakdown: Object.entries(complianceBreakdown).map(([name, value]) => ({ name, value })),
    totalReports: reports.length,
    averageReportQuality: reports.length > 0 ? 
      reports.reduce((sum, r) => sum + (r.reportQuality === 'Excellent' ? 4 : r.reportQuality === 'Good' ? 3 : r.reportQuality === 'Satisfactory' ? 2 : 1), 0) / reports.length : 0
  };
};

export const getDailyActivityStatsByCustomer = (customerId: string) => {
  const reports = getDailyActivityByCustomer(customerId);
  
  if (reports.length === 0) {
    return {
      totalReports: 0,
      totalHours: 0,
      averageReportQuality: 0,
      supervisorApprovalRate: 0,
      totalIncidents: 0,
      totalCustomerInteractions: 0,
      averageResponseTime: 0,
      equipmentIssues: 0
    };
  }
  
  return {
    totalReports: reports.length,
    totalHours: reports.reduce((sum, r) => sum + r.totalHours, 0),
    averageReportQuality: reports.reduce((sum, r) => {
      const quality = r.reportQuality === 'Excellent' ? 4 : r.reportQuality === 'Good' ? 3 : r.reportQuality === 'Satisfactory' ? 2 : 1;
      return sum + quality;
    }, 0) / reports.length,
    supervisorApprovalRate: (reports.filter(r => r.supervisorApproved).length / reports.length) * 100,
    totalIncidents: reports.reduce((sum, r) => sum + r.activities.incidentsReported, 0),
    totalCustomerInteractions: reports.reduce((sum, r) => sum + r.activities.customerInteractions, 0),
    averageResponseTime: reports.reduce((sum, r) => sum + r.metrics.responseTimeMinutes, 0) / reports.length,
    equipmentIssues: reports.reduce((sum, r) => sum + r.metrics.equipmentIssues, 0)
  };
}; 