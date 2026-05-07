export interface CustomerSatisfactionSurvey {
  id: string;
  customerId: string;
  customerName: string;
  regionId: string;
  regionName: string;
  siteId: string;
  siteName: string;
  surveyDate: string;
  surveyMonth: string; // YYYY-MM format for grouping
  respondentName?: string;
  respondentEmail?: string;
  overallRating: number; // 1-5 scale
  securityServiceRating: number; // 1-5 scale
  officerProfessionalismRating: number; // 1-5 scale
  responseTimeRating: number; // 1-5 scale
  communicationRating: number; // 1-5 scale
  problemResolutionRating: number; // 1-5 scale
  recommendationLikelihood: number; // 1-10 NPS scale
  surveyType: 'Phone' | 'Email' | 'In-Person' | 'Online';
  comments?: string;
  areasForImprovement?: string;
  wouldRecommend: boolean;
  followUpRequired: boolean;
  followUpCompleted: boolean;
  surveyCompletionTime: number; // minutes
  createdAt: string;
  updatedAt: string;
}

export const MOCK_SATISFACTION_SURVEYS: CustomerSatisfactionSurvey[] = [
  // Central England COOP surveys
  {
    id: "SURVEY-001",
    customerId: "1",
    customerName: "Central England COOP",
    regionId: "R001",
    regionName: "Leicester Central",
    siteId: "S001",
    siteName: "Anson Road Store",
    surveyDate: "2024-01-15",
    surveyMonth: "2024-01",
    respondentName: "Store Manager",
    respondentEmail: "manager.anson@centralengland.coop",
    overallRating: 4,
    securityServiceRating: 5,
    officerProfessionalismRating: 5,
    responseTimeRating: 4,
    communicationRating: 4,
    problemResolutionRating: 4,
    recommendationLikelihood: 8,
    surveyType: "Email",
    comments: "Security officer John was very professional during the incident response",
    wouldRecommend: true,
    followUpRequired: false,
    followUpCompleted: true,
    surveyCompletionTime: 7,
    createdAt: "2024-01-15T16:00:00Z",
    updatedAt: "2024-01-15T16:00:00Z"
  },
  {
    id: "SURVEY-002",
    customerId: "1",
    customerName: "Central England COOP",
    regionId: "R001",
    regionName: "Leicester Central",
    siteId: "S002",
    siteName: "Cropston Drive Store",
    surveyDate: "2024-01-20",
    surveyMonth: "2024-01",
    respondentName: "Assistant Manager",
    respondentEmail: "assistant.cropston@centralengland.coop",
    overallRating: 3,
    securityServiceRating: 4,
    officerProfessionalismRating: 4,
    responseTimeRating: 3,
    communicationRating: 3,
    problemResolutionRating: 3,
    recommendationLikelihood: 6,
    surveyType: "Phone",
    comments: "Response was adequate but could have been faster",
    areasForImprovement: "Faster response times needed",
    wouldRecommend: true,
    followUpRequired: true,
    followUpCompleted: false,
    surveyCompletionTime: 12,
    createdAt: "2024-01-20T14:30:00Z",
    updatedAt: "2024-01-20T14:30:00Z"
  },
  {
    id: "SURVEY-003",
    customerId: "1",
    customerName: "Central England COOP",
    regionId: "R002",
    regionName: "Nottingham District",
    siteId: "S003",
    siteName: "Ilkeston Store",
    surveyDate: "2024-01-25",
    surveyMonth: "2024-01",
    respondentName: "Store Manager",
    overallRating: 5,
    securityServiceRating: 5,
    officerProfessionalismRating: 5,
    responseTimeRating: 5,
    communicationRating: 5,
    problemResolutionRating: 5,
    recommendationLikelihood: 10,
    surveyType: "In-Person",
    comments: "Excellent service, very professional handling of the fraud attempt",
    wouldRecommend: true,
    followUpRequired: false,
    followUpCompleted: true,
    surveyCompletionTime: 5,
    createdAt: "2024-01-25T11:00:00Z",
    updatedAt: "2024-01-25T11:00:00Z"
  },

  // Midcounties COOP surveys
  {
    id: "SURVEY-004",
    customerId: "2",
    customerName: "Midcounties COOP",
    regionId: "R003",
    regionName: "Warwick Central",
    siteId: "S004",
    siteName: "Warwick Main Store",
    surveyDate: "2024-01-18",
    surveyMonth: "2024-01",
    respondentName: "Deputy Manager",
    respondentEmail: "deputy.warwick@midcounties.coop",
    overallRating: 4,
    securityServiceRating: 5,
    officerProfessionalismRating: 4,
    responseTimeRating: 4,
    communicationRating: 4,
    problemResolutionRating: 5,
    recommendationLikelihood: 8,
    surveyType: "Online",
    comments: "Good response to theft incident, officer was thorough",
    wouldRecommend: true,
    followUpRequired: false,
    followUpCompleted: true,
    surveyCompletionTime: 8,
    createdAt: "2024-01-18T20:00:00Z",
    updatedAt: "2024-01-18T20:00:00Z"
  },
  {
    id: "SURVEY-005",
    customerId: "2",
    customerName: "Midcounties COOP",
    regionId: "R003",
    regionName: "Warwick Central",
    siteId: "S005",
    siteName: "Leamington Spa Store",
    surveyDate: "2024-01-22",
    surveyMonth: "2024-01",
    respondentName: "Store Manager",
    overallRating: 3,
    securityServiceRating: 3,
    officerProfessionalismRating: 4,
    responseTimeRating: 2,
    communicationRating: 3,
    problemResolutionRating: 3,
    recommendationLikelihood: 5,
    surveyType: "Email",
    comments: "Response to vandalism was slow, but officer was professional",
    areasForImprovement: "Faster initial response needed",
    wouldRecommend: false,
    followUpRequired: true,
    followUpCompleted: true,
    surveyCompletionTime: 15,
    createdAt: "2024-01-22T16:00:00Z",
    updatedAt: "2024-01-23T10:00:00Z"
  },
  {
    id: "SURVEY-006",
    customerId: "2",
    customerName: "Midcounties COOP",
    regionId: "R004",
    regionName: "Coventry District",
    siteId: "S006",
    siteName: "Coventry City Store",
    surveyDate: "2024-01-27",
    surveyMonth: "2024-01",
    respondentName: "Store Manager",
    respondentEmail: "manager.coventry@midcounties.coop",
    overallRating: 5,
    securityServiceRating: 5,
    officerProfessionalismRating: 5,
    responseTimeRating: 5,
    communicationRating: 5,
    problemResolutionRating: 5,
    recommendationLikelihood: 9,
    surveyType: "Phone",
    comments: "Excellent handling of aggressive customer situation, very professional",
    wouldRecommend: true,
    followUpRequired: false,
    followUpCompleted: true,
    surveyCompletionTime: 6,
    createdAt: "2024-01-27T18:30:00Z",
    updatedAt: "2024-01-27T18:30:00Z"
  },

  // Heart of England COOP surveys
  {
    id: "SURVEY-007",
    customerId: "3",
    customerName: "Heart of England COOP",
    regionId: "R005",
    regionName: "Nuneaton Central",
    siteId: "S007",
    siteName: "Nuneaton High Street",
    surveyDate: "2024-01-19",
    surveyMonth: "2024-01",
    respondentName: "Store Manager",
    respondentEmail: "manager.nuneaton@heartofengland.coop",
    overallRating: 4,
    securityServiceRating: 5,
    officerProfessionalismRating: 5,
    responseTimeRating: 4,
    communicationRating: 4,
    problemResolutionRating: 4,
    recommendationLikelihood: 7,
    surveyType: "In-Person",
    comments: "Good response to organized theft, two suspects detained successfully",
    wouldRecommend: true,
    followUpRequired: false,
    followUpCompleted: true,
    surveyCompletionTime: 9,
    createdAt: "2024-01-19T17:00:00Z",
    updatedAt: "2024-01-19T17:00:00Z"
  },
  {
    id: "SURVEY-008",
    customerId: "3",
    customerName: "Heart of England COOP",
    regionId: "R005",
    regionName: "Nuneaton Central",
    siteId: "S008",
    siteName: "Bedworth Store",
    surveyDate: "2024-01-23",
    surveyMonth: "2024-01",
    respondentName: "Assistant Manager",
    overallRating: 5,
    securityServiceRating: 5,
    officerProfessionalismRating: 5,
    responseTimeRating: 5,
    communicationRating: 5,
    problemResolutionRating: 5,
    recommendationLikelihood: 10,
    surveyType: "Email",
    comments: "Excellent first aid response to customer slip incident",
    wouldRecommend: true,
    followUpRequired: false,
    followUpCompleted: true,
    surveyCompletionTime: 4,
    createdAt: "2024-01-23T14:00:00Z",
    updatedAt: "2024-01-23T14:00:00Z"
  },
  {
    id: "SURVEY-009",
    customerId: "3",
    customerName: "Heart of England COOP",
    regionId: "R006",
    regionName: "Rugby District",
    siteId: "S009",
    siteName: "Rugby Central Store",
    surveyDate: "2024-01-26",
    surveyMonth: "2024-01",
    respondentName: "Store Manager",
    respondentEmail: "manager.rugby@heartofengland.coop",
    overallRating: 4,
    securityServiceRating: 4,
    officerProfessionalismRating: 5,
    responseTimeRating: 4,
    communicationRating: 4,
    problemResolutionRating: 3,
    recommendationLikelihood: 7,
    surveyType: "Online",
    comments: "Good handling of suspicious activity, but follow-up could be better",
    areasForImprovement: "Better follow-up communication needed",
    wouldRecommend: true,
    followUpRequired: true,
    followUpCompleted: false,
    surveyCompletionTime: 11,
    createdAt: "2024-01-26T16:45:00Z",
    updatedAt: "2024-01-26T16:45:00Z"
  },

  // Additional surveys for better data distribution
  {
    id: "SURVEY-010",
    customerId: "1",
    customerName: "Central England COOP",
    regionId: "R001",
    regionName: "Leicester Central",
    siteId: "S001",
    siteName: "Anson Road Store",
    surveyDate: "2024-01-30",
    surveyMonth: "2024-01",
    respondentName: "Store Manager",
    overallRating: 5,
    securityServiceRating: 5,
    officerProfessionalismRating: 5,
    responseTimeRating: 5,
    communicationRating: 4,
    problemResolutionRating: 5,
    recommendationLikelihood: 9,
    surveyType: "Phone",
    comments: "Great response to tobacco theft attempt",
    wouldRecommend: true,
    followUpRequired: false,
    followUpCompleted: true,
    surveyCompletionTime: 6,
    createdAt: "2024-01-30T12:00:00Z",
    updatedAt: "2024-01-30T12:00:00Z"
  }
];

// Helper functions for satisfaction survey data retrieval
export const getSurveysByCustomer = (customerId: string): CustomerSatisfactionSurvey[] => {
  return MOCK_SATISFACTION_SURVEYS.filter(survey => survey.customerId === customerId);
};

export const getSurveysByRegion = (regionId: string): CustomerSatisfactionSurvey[] => {
  return MOCK_SATISFACTION_SURVEYS.filter(survey => survey.regionId === regionId);
};

export const getSurveysBySite = (siteId: string): CustomerSatisfactionSurvey[] => {
  return MOCK_SATISFACTION_SURVEYS.filter(survey => survey.siteId === siteId);
};

export const getSurveysByCustomerAndRegion = (customerId: string, regionId: string): CustomerSatisfactionSurvey[] => {
  return MOCK_SATISFACTION_SURVEYS.filter(survey => 
    survey.customerId === customerId && survey.regionId === regionId
  );
};

// Analytics helper functions for satisfaction surveys
export const getSatisfactionStatsByCustomer = (customerId: string) => {
  const surveys = getSurveysByCustomer(customerId);
  
  if (surveys.length === 0) {
    return {
      totalSurveys: 0,
      averageOverallRating: 0,
      averageSecurityRating: 0,
      averageResponseTime: 0,
      averageCommunication: 0,
      averageProfessionalism: 0,
      averageProblemResolution: 0,
      npsScore: 0,
      recommendationRate: 0,
      followUpRate: 0,
      surveysByMonth: [],
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const totalSurveys = surveys.length;
  const averageOverallRating = surveys.reduce((sum, s) => sum + s.overallRating, 0) / totalSurveys;
  const averageSecurityRating = surveys.reduce((sum, s) => sum + s.securityServiceRating, 0) / totalSurveys;
  const averageResponseTime = surveys.reduce((sum, s) => sum + s.responseTimeRating, 0) / totalSurveys;
  const averageCommunication = surveys.reduce((sum, s) => sum + s.communicationRating, 0) / totalSurveys;
  const averageProfessionalism = surveys.reduce((sum, s) => sum + s.officerProfessionalismRating, 0) / totalSurveys;
  const averageProblemResolution = surveys.reduce((sum, s) => sum + s.problemResolutionRating, 0) / totalSurveys;
  
  // NPS calculation (9-10: Promoters, 7-8: Passives, 0-6: Detractors)
  const promoters = surveys.filter(s => s.recommendationLikelihood >= 9).length;
  const detractors = surveys.filter(s => s.recommendationLikelihood <= 6).length;
  const npsScore = ((promoters - detractors) / totalSurveys) * 100;
  
  const recommendationRate = (surveys.filter(s => s.wouldRecommend).length / totalSurveys) * 100;
  const followUpRate = (surveys.filter(s => s.followUpCompleted).length / surveys.filter(s => s.followUpRequired).length || 0) * 100;
  
  // Group by month
  const surveysByMonth = surveys.reduce((acc, survey) => {
    const month = survey.surveyMonth;
    if (!acc[month]) {
      acc[month] = {
        month,
        totalSurveys: 0,
        averageRating: 0,
        nps: 0
      };
    }
    acc[month].totalSurveys++;
    return acc;
  }, {} as Record<string, any>);
  
  // Calculate averages for each month
  Object.values(surveysByMonth).forEach((monthData: any) => {
    const monthSurveys = surveys.filter(s => s.surveyMonth === monthData.month);
    monthData.averageRating = monthSurveys.reduce((sum, s) => sum + s.overallRating, 0) / monthSurveys.length;
    
    const monthPromoters = monthSurveys.filter(s => s.recommendationLikelihood >= 9).length;
    const monthDetractors = monthSurveys.filter(s => s.recommendationLikelihood <= 6).length;
    monthData.nps = ((monthPromoters - monthDetractors) / monthSurveys.length) * 100;
  });
  
  // Rating distribution
  const ratingDistribution = surveys.reduce((acc, survey) => {
    acc[survey.overallRating as keyof typeof acc]++;
    return acc;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  
  return {
    totalSurveys,
    averageOverallRating: Math.round(averageOverallRating * 10) / 10,
    averageSecurityRating: Math.round(averageSecurityRating * 10) / 10,
    averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    averageCommunication: Math.round(averageCommunication * 10) / 10,
    averageProfessionalism: Math.round(averageProfessionalism * 10) / 10,
    averageProblemResolution: Math.round(averageProblemResolution * 10) / 10,
    npsScore: Math.round(npsScore),
    recommendationRate: Math.round(recommendationRate),
    followUpRate: Math.round(followUpRate),
    surveysByMonth: Object.values(surveysByMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)),
    ratingDistribution
  };
};

export const getSatisfactionTrendData = (customerId: string) => {
  const surveys = getSurveysByCustomer(customerId);
  
  // Group by month for trend analysis
  const monthlyData = surveys.reduce((acc, survey) => {
    const month = survey.surveyMonth;
    if (!acc[month]) {
      acc[month] = {
        month,
        surveys: 0,
        totalRating: 0,
        averageRating: 0,
        npsTotal: 0,
        npsScore: 0
      };
    }
    acc[month].surveys++;
    acc[month].totalRating += survey.overallRating;
    acc[month].npsTotal += survey.recommendationLikelihood;
    return acc;
  }, {} as Record<string, any>);
  
  // Calculate averages
  Object.values(monthlyData).forEach((monthData: any) => {
    monthData.averageRating = monthData.totalRating / monthData.surveys;
    
    const monthSurveys = surveys.filter(s => s.surveyMonth === monthData.month);
    const promoters = monthSurveys.filter(s => s.recommendationLikelihood >= 9).length;
    const detractors = monthSurveys.filter(s => s.recommendationLikelihood <= 6).length;
    monthData.npsScore = ((promoters - detractors) / monthSurveys.length) * 100;
  });
  
  return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
}; 