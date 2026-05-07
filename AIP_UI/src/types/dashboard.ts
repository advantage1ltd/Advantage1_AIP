import { UserRole } from './user';

export type { UserRole };

export type CustomerRole = 'administrator' | 'customersitemanager' | 'customerhomanager';

export interface Metric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: 'Activity' | 'AlertCircle' | 'Star' | 'Users' | 'Building2';
  color: 'green' | 'amber' | 'blue' | 'purple';
}

export interface IncidentDataPoint {
  date?: string;
  week?: string;
  month?: string;
  year?: string;
  uniformOfficers: number;
  storeDetectives: number;
}

export interface RecentIncident {
  id: string;
  customerId: number;
  date: string;
  regionId: string;
  regionName: string;
  siteId: string;
  siteName: string;
  type: string;
  value: number;
  assignedTo: string;
  customerName: string;
  store: string;
  officerName: string;
  amount: number;
  incidentType: string;
}

export interface CustomerStoreData {
  id: string;
  name: string;
  customerId: number;
  metrics: {
    customerhomanager: Metric[];
    customersitemanager: Metric[];
  };
  recentIncidents: RecentIncident[];
  incidentData: {
    daily: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  };
}

export interface StoreData {
  id: string;
  name: string;
  customerId: number;
  metrics: {
    'customer-site': Metric[];
    'customer-ho': Metric[];
  };
  incidentData: {
    daily: IncidentDataPoint[];
    weekly: IncidentDataPoint[];
    monthly: IncidentDataPoint[];
    yearly: IncidentDataPoint[];
  };
  recentIncidents: Incident[];
}

export interface Region {
  id: string;
  name: string;
  customerId: number;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyActivity {
  id: string;
  customerId: number;
  type: string;
  location: string;
  time: string;
  officer: string;
  status: 'completed' | 'in_progress';
}

export interface SatisfactionDataPoint {
  id: string;
  customerId: number;
  month: string;
  score: number;
  siteName?: string;
  siteId?: string;
}

export interface SatisfactionBySite {
  siteName: string;
  siteId?: string;
  score: number;
  month: string;
}

export interface BeSafeDataPoint {
  id: string;
  customerId: number;
  month: string;
  insecureAreas: number;
  compliance: number;
  systems: number;
}

export interface Incident {
  id: string;
  customerName: string;
  store: string;
  officerName: string;
  date: string;
  amount: number;
}

export interface RegionalData {
  name: string;
}

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface OfficerDashboardData {
  name: string
  badgeNumber: string
  role: string
  avatar: string
  shiftStatus: 'On Duty' | 'Off Duty'
  shiftStart: string
  shiftEnd: string
  location: string
  stats: {
    incidentsThisMonth: number
    incidentsLastMonth: number
    totalValueSaved: number
    expensesYTD: number
    completionRate: number
    holidayBooked: number
    hoursWorked: number
    sitesVisited: number
  }
  monthlyTarget: {
    incidents: number
    valueSaved: number
    current: {
      incidents: number
      valueSaved: number
    }
  }
  recentActivities: Activity[]
  upcomingTasks: Task[]
}

export interface Activity {
  id: string
  type: 'incident' | 'patrol' | 'report'
  title: string
  location: string
  time: string
  value?: number
  status: 'resolved' | 'submitted' | 'in-progress'
}

export interface Task {
  id: string
  type: string
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
}

export interface Site {
  id: string;
  locationName: string;
  regionId: string;
  customerId: number;
  buildingName: string;
  street: string;
  town: string;
  county: string;
  postcode: string;
  isCoreSite: boolean;
  sinNumber: string;
  telephone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
} 