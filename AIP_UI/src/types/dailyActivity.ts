export interface DailyActivityReport {
  id: string;
  customerId: number;
  customerName: string;
  siteId: string;
  siteName: string;
  reportDate: string;
  officerName: string;
  shiftStart: string;
  shiftEnd: string;
  activities: DailyActivity[];
  incidents: ActivityIncident[];
  securityChecks: SecurityCheck[];
  visitorLog: VisitorEntry[];
  compliance: ComplianceData;
  insecureAreas: InsecureAreasData;
  systemsNotWorking: SystemsNotWorkingData;
  notes: string;
  weatherConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface YesNoField {
  value: 'yes' | 'no' | '';
  description: string;
}

export interface ComplianceData {
  tillsContainedOverCash: YesNoField;
  cashOfficeDoorOpen: YesNoField;
  visibleCashOnDisplay: YesNoField;
  visibleKeysOnDisplay: YesNoField;
  fireRoutesBlocked: YesNoField;
  beSafeBSecurePoster: YesNoField;
  atmAbuse: YesNoField;
}

export interface InsecureAreasData {
  kioskSecure: YesNoField;
  highValueRoom: YesNoField;
  managersOffice: YesNoField;
  warehouseToSalesFloor: YesNoField;
  serviceYard: YesNoField;
  carParkGrounds: YesNoField;
  fireDoorsBackOfHouse: YesNoField;
  fireDoorsShopFloor: YesNoField;
}

export interface SystemsNotWorkingData {
  watchMeNow: YesNoField;
  cctv: YesNoField;
  intruderAlarm: YesNoField;
  keyholding: YesNoField;
  bodyWornCctv: YesNoField;
  cigaretteTracker: YesNoField;
  crimeReporting: YesNoField;
}

export interface DailyActivity {
  id: string;
  time: string;
  activity: string;
  location: string;
  description: string;
  status: 'completed' | 'in-progress' | 'delayed' | 'cancelled';
}

export interface ActivityIncident {
  id: string;
  time: string;
  type: 'security' | 'safety' | 'maintenance' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actionTaken: string;
  resolved: boolean;
}

export interface SecurityCheck {
  id: string;
  time: string;
  area: string;
  checkType: 'perimeter' | 'building' | 'equipment' | 'access-control' | 'fire-safety';
  status: 'all-clear' | 'issue-found' | 'requires-attention';
  notes?: string;
}

export interface VisitorEntry {
  id: string;
  time: string;
  visitorName: string;
  company?: string;
  purpose: string;
  escortedBy?: string;
  exitTime?: string;
  badgeNumber?: string;
}

export interface DailyActivityFilters {
  search: string;
  customerId: string;
  siteId: string;
  reportDate?: string;
  officerName: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface DailyActivityResponse {
  data: DailyActivityReport[];
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
}

export interface DailyActivityRequest extends Omit<DailyActivityReport, 'id' | 'createdAt' | 'updatedAt'> {}

export interface DailyActivityUpdateRequest extends Partial<DailyActivityRequest> {
  id: string;
} 