export interface CustomerSurveyRatings {
  uniformAndAppearance: number;
  professionalism: number;
  customerServiceApproach: number;
  improvedFeelingOfSecurityWhenOfficerOnSite: number;
  relationsWithStoreColleagues: number;
  punctualityBreaks: number;
  proactivity: number;
}

export interface CustomerSurvey {
  id: string;
  customerId: number;
  officerName: string;
  date: string;
  customer: string;
  region: string;
  siteName: string;
  ratings: CustomerSurveyRatings;
  storeManagerName: string;
  areaManagerName: string;
  followUpActions: string[];
  datesToBeCompleted: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSurveyFilters {
  search: string;
  customerId: string; // For admin users to filter by customer
  regionId: string;
  siteId: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface CustomerSurveyResponse {
  data: CustomerSurvey[];
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
}

export interface CustomerSurveyRequest extends Omit<CustomerSurvey, 'id' | 'customerId' | 'createdAt' | 'updatedAt'> {}

export interface CustomerSurveyUpdateRequest extends Partial<CustomerSurveyRequest> {
  id: string;
} 