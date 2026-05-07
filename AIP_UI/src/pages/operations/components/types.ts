export interface SurveyRating {
  score: number;
  label: 'Poor' | 'Satisfactory' | 'Good' | 'Excellent';
}

export interface CustomerSurvey {
  id: string;
  officerName: string;
  date: string;
  customer: string;
  region: string;
  location: string; // Keep this for backward compatibility with existing data
  siteName?: string; // New field for forms
  ratings: {
    uniformAndAppearance: number;
    professionalism: number;
    customerServiceApproach: number;
    improvedFeelingOfSecurityWhenOfficerOnSite: number;
    relationsWithStoreColleagues: number;
    punctualityBreaks: number;
    proactivity: number;
  };
  storeManagerName: string;
  areaManagerName: string;
  followUpActions: string[];
  datesToBeCompleted: string[];
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  total: number;
}

export interface SurveyFilters {
  search: string;
  customer?: string;
  region?: string;
  location?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export const CUSTOMERS = [
  { id: '21', name: 'Central England COOP' },
  { id: '22', name: 'Heart of England' },
  { id: '23', name: 'Midcounties COOP' }
];

export const REGIONS = [
  // Central England COOP regions
  { id: 'REG001', name: 'East Midlands', customerId: '21' },
  { id: 'REG002', name: 'West Midlands', customerId: '21' },
  { id: 'REG003', name: 'Yorkshire', customerId: '21' },
  // Heart of England regions
  { id: 'REG007', name: 'Coventry', customerId: '22' },
  { id: 'REG008', name: 'Nuneaton', customerId: '22' },
  { id: 'REG009', name: 'Rugby', customerId: '22' },
  // Midcounties COOP regions
  { id: 'REG004', name: 'Oxfordshire', customerId: '23' },
  { id: 'REG005', name: 'Gloucestershire', customerId: '23' },
  { id: 'REG006', name: 'Wiltshire', customerId: '23' }
];

export const SITES = [
  // Central England COOP sites
  { id: 'SITE001', name: 'Leicester Central', customerId: '21', regionId: 'REG001' },
  { id: 'SITE002', name: 'Birmingham Store', customerId: '21', regionId: 'REG002' },
  { id: 'SITE003', name: 'Sheffield Branch', customerId: '21', regionId: 'REG003' },
  // Heart of England sites
  { id: 'SITE007', name: 'Coventry Central', customerId: '22', regionId: 'REG007' },
  { id: 'SITE008', name: 'Nuneaton Main Store', customerId: '22', regionId: 'REG008' },
  { id: 'SITE009', name: 'Rugby Store', customerId: '22', regionId: 'REG009' },
  // Midcounties COOP sites
  { id: 'SITE004', name: 'Oxford City Centre', customerId: '23', regionId: 'REG004' },
  { id: 'SITE005', name: 'Cheltenham Store', customerId: '23', regionId: 'REG005' },
  { id: 'SITE006', name: 'Swindon Branch', customerId: '23', regionId: 'REG006' }
];

export const RATING_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const getRatingLabel = (score: number): 'Poor' | 'Satisfactory' | 'Good' | 'Excellent' => {
  if (score <= 3) return 'Poor';
  if (score <= 6) return 'Satisfactory';
  if (score <= 8) return 'Good';
  return 'Excellent';
}; 