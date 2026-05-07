export enum IncidentType {
  THEFT = 'Theft',
  THEFT_PREVENTION = 'Theft Prevention',
  SUSPICIOUS_ACTIVITY = 'Suspicious Activity',
  ANTI_SOCIAL = 'Anti-Social Behaviour',
  ARREST = 'Arrest',
  DETER = 'Deter',
  UNDERAGE_PURCHASE = 'Underage Purchase',
  CRIMINAL_DAMAGE = 'Criminal Damage',
  CREDIT_CARD_FRAUD = 'Credit Card Fraud',
  VIOLENT_BEHAVIOUR = 'Violent Behaviour',
  ABUSIVE_BEHAVIOUR = 'Abusive Behaviour',
  COLLEAGUE_ASSAULT = 'Colleague Assault',
  COLLEAGUE_ABUSE = 'Colleague Abuse',
  SHOPLIFTING = 'Shoplifting',
  CUSTOMER_COMPLAINT = 'Customer Complaint',
  SUSPICIOUS_BEHAVIOUR = 'Suspicious Behaviour',
  SELF_SCAN_TILLS = 'Self Scan Tills',
  SCAN_AND_GO = 'Scan and Go',
  THREATS_AND_INTIMIDATION = 'Threats and Intimidation',
  BAN_FROM_STORE = 'Ban from Store',
  POLICE_INVOLVEMENT = 'Police Involvement',
  SPITTING = 'Spitting',
  POLICE_FAILED_TO_ATTEND = 'Police Failed to Attend',
  OTHERS = 'Others'
}

export enum IncidentInvolved {
  SELF_SCAN_TILLS = 'Self Scan Tills',
  SCAN_AND_GO = 'Scan and Go',
  BAN_FROM_STORE = 'Ban from Store',
  ABUSIVE_BEHAVIOUR = 'Abusive Behaviour',
  THREATS_AND_INTIMIDATION = 'Threats and Intimidation',
  SPITTING = 'Spitting',
  VIOLENT_BEHAVIOR = 'Violent Behavior',
  POLICE_FAILED_TO_ATTEND = 'Police Failed to Attend'
}

export type OffenderSex = 'Male' | 'Female' | 'N/A or N/K'

export interface OffenderAddress {
  houseName?: string;
  numberAndStreet?: string;
  villageOrSuburb?: string;
  town?: string;
  county?: string;
  postCode?: string;
}

export interface StolenItem {
  id: string;
  category?: string;
  description?: string;
  productName?: string;
  cost: number;
  quantity: number;
  totalAmount: number;
}

export interface Incident {
  // Core identification
  id: string;
  customerId: number;
  customerName: string;

  // Location information
  siteName: string;
  siteId?: string;
  regionId?: string;
  regionName?: string;
  location?: string; // For graph display compatibility
  store?: string; // Legacy field for backward compatibility

  // Personnel information
  officerName: string;
  officerRole?: string;
  officerType?: string; // 'uniform', 'detective', etc.
  dutyManagerName?: string;
  assignedTo?: string;

  // Time information
  dateOfIncident: string; // Primary date field
  date?: string; // Legacy field for backward compatibility
  timeOfIncident?: string;
  dateInputted?: string;

  // Incident classification
  incidentType: string;
  type?: string; // For graph compatibility
  actionCode?: string;
  incidentInvolved?: string[];

  // Description and details
  description?: string;
  incidentDetails?: string;
  storeComments?: string;

  // Financial information
  totalValueRecovered?: number;
  value?: number; // Legacy field for graph compatibility
  valueRecovered?: number; // Legacy field for graph compatibility
  quantityRecovered?: number;
  amount?: number; // Legacy field
  total?: number; // Legacy field

  // Stolen items
  stolenItems?: StolenItem[];

  // Police involvement
  policeInvolvement?: boolean;
  urnNumber?: string;
  crimeRefNumber?: string;
  policeID?: string;

  // Status tracking
  status?: 'pending' | 'resolved' | 'in-progress';
  priority?: 'low' | 'medium' | 'high';
  actionTaken?: string;
  evidenceAttached?: boolean;
  witnessStatements?: string[];
  involvedParties?: string[];
  reportNumber?: string;

  // Offender information
  offenderName?: string;
  offenderSex?: string;
  gender?: 'Male' | 'Female' | 'N/A or N/K';
  offenderDOB?: string | Date;
  offenderPlaceOfBirth?: string;
  offenderMarks?: string;
  offenderAddress?: OffenderAddress;
  offenderDetailsVerified?: boolean;
  verificationMethod?: string;
  verificationEvidenceImage?: string;

  // Special fields
  arrestSaveComment?: string;

  // View configuration (for role-based access)
  viewConfig?: {
    enabledPages: string[];
  };
}

export interface RepeatOffenderIncidentSummary {
  incidentId: string;
  dateOfIncident: string;
  siteName: string;
  incidentType: string;
  description?: string;
  offenderMarks?: string;
  offenderDetailsVerified?: boolean;
  verificationMethod?: string;
  verificationEvidenceImage?: string;
}

export interface RepeatOffenderMatch {
  offenderName: string;
  offenderDOB?: string;
  gender?: string;
  offenderMarks?: string;
  offenderPlaceOfBirth?: string;
  offenderAddress?: OffenderAddress;
  incidentCount: number;
  recentIncidents: RepeatOffenderIncidentSummary[];
}

export interface RepeatOffenderSearchResponse {
  success: boolean;
  message?: string;
  data: RepeatOffenderMatch[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export interface RepeatOffenderSearchPayload {
  name?: string;
  dateOfBirth?: string;
  marks?: string;
  page?: number;
  pageSize?: number;
}

export interface IncidentStats {
  totalIncidents: number;
  totalValue: number;
  openIncidents: number;
  resolvedIncidents: number;
  incidentTypes: Record<string, number>;
}

export interface IncidentTrendData {
  month: string;
  incidents: number;
  valueRecovered: number;
}
