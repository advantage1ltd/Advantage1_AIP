import {
  getSurveysByCustomer,
  getSatisfactionStatsByCustomer,
  getSatisfactionTrendData,
  type CustomerSatisfactionSurvey
} from '@/data/mockCustomerSatisfaction';

import {
  getDailyActivityByCustomer,
  getBeSafeBeSecureData,
  getDailyActivityStatsByCustomer,
  type DailyActivityReport
} from '@/data/mockDailyActivity';

import { DUMMY_CUSTOMERS } from '@/data/customers';
import { incidentService } from './incidentService'
import { Incident } from '@/types/incidents'

export interface CustomerData {
	customerId: string
	customerName: string
	totalIncidents: number
	totalValue: number
	topIncidentTypes: Array<{ type: string; count: number }>
	monthlyTrend: Array<{ month: string; incidents: number; value: number }>
}

export const getCustomerData = async (customerId: string): Promise<CustomerData> => {
	try {
		// Get incidents for this customer
		const incidents = await incidentService.getIncidentsByCustomer(customerId)
		
		// Find customer info
		const customer = DUMMY_CUSTOMERS.find(c => c.id === customerId)
		const customerName = customer?.companyName || 'Unknown Customer'
		
		// Calculate statistics
		const totalIncidents = incidents.length
		const totalValue = incidents.reduce((sum, inc) => sum + inc.value, 0)
		
		// Calculate top incident types
		const incidentTypeCount: Record<string, number> = {}
		incidents.forEach(inc => {
			incidentTypeCount[inc.incidentType] = (incidentTypeCount[inc.incidentType] || 0) + 1
		})
		
		const topIncidentTypes = Object.entries(incidentTypeCount)
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5)
		
		// Calculate monthly trend (last 6 months)
		const monthlyData: Record<string, { incidents: number; value: number }> = {}
		incidents.forEach(inc => {
			const month = inc.date.substring(0, 7) // YYYY-MM
			if (!monthlyData[month]) {
				monthlyData[month] = { incidents: 0, value: 0 }
			}
			monthlyData[month].incidents++
			monthlyData[month].value += inc.value
		})
		
		const monthlyTrend = Object.entries(monthlyData)
			.map(([month, data]) => ({ month, ...data }))
			.sort((a, b) => a.month.localeCompare(b.month))
		
		return {
			customerId,
			customerName,
			totalIncidents,
			totalValue,
			topIncidentTypes,
			monthlyTrend
		}
	} catch (error) {
		console.error('Error getting customer data:', error)
		throw error
	}
}

export const getAllCustomersData = async (): Promise<CustomerData[]> => {
	try {
		const customerIds = DUMMY_CUSTOMERS.map(c => c.id)
		const customerDataPromises = customerIds.map(id => getCustomerData(id))
		return await Promise.all(customerDataPromises)
	} catch (error) {
		console.error('Error getting all customers data:', error)
		throw error
	}
}

export class CustomerDataService {
  
  // Customer basic info
  static getCustomerInfo(customerId: string) {
    return DUMMY_CUSTOMERS.find(c => c.id === customerId);
  }

  // Incident-related data (now using incident service)
  static async getCustomerIncidents(customerId: string): Promise<Incident[]> {
    return await incidentService.getIncidentsByCustomer(customerId);
  }

  static async getCustomerIncidentStats(customerId: string) {
    const incidents = await incidentService.getIncidentsByCustomer(customerId);
    return {
      totalIncidents: incidents.length,
      totalValueRecovered: incidents.reduce((sum, inc) => sum + inc.value, 0),
      openIncidents: 0, // Would need status field
      uniqueStores: [...new Set(incidents.map(inc => inc.siteId))].length,
      incidentTypes: incidents.reduce((acc: Record<string, number>, inc) => {
        acc[inc.incidentType] = (acc[inc.incidentType] || 0) + 1;
        return acc;
      }, {})
    };
  }

  static async getCustomerIncidentTrends(customerId: string) {
    const incidents = await incidentService.getIncidentsByCustomer(customerId);
    const monthlyData = incidents.reduce((acc: Record<string, any>, incident) => {
      const month = incident.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          incidents: 0,
          valueRecovered: 0
        };
      }
      acc[month].incidents++;
      acc[month].valueRecovered += incident.value || 0;
      return acc;
    }, {});
    
    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }

  // Satisfaction survey data
  static getCustomerSatisfactionSurveys(customerId: string): CustomerSatisfactionSurvey[] {
    return getSurveysByCustomer(customerId);
  }

  static getCustomerSatisfactionStats(customerId: string) {
    return getSatisfactionStatsByCustomer(customerId);
  }

  static getCustomerSatisfactionTrends(customerId: string) {
    return getSatisfactionTrendData(customerId);
  }

  // Daily activity reports
  static getCustomerDailyActivity(customerId: string): DailyActivityReport[] {
    return getDailyActivityByCustomer(customerId);
  }

  static getCustomerDailyActivityStats(customerId: string) {
    return getDailyActivityStatsByCustomer(customerId);
  }

  // Be Safe Be Secure data (derived from daily activity)
  static getCustomerBeSafeBeSecureData(customerId: string) {
    return getBeSafeBeSecureData(customerId);
  }

  // Comprehensive customer dashboard data
  static async getCustomerDashboardData(customerId: string) {
    const customer = this.getCustomerInfo(customerId);
    const incidentStats = await this.getCustomerIncidentStats(customerId);
    const satisfactionStats = this.getCustomerSatisfactionStats(customerId);
    const dailyActivityStats = this.getCustomerDailyActivityStats(customerId);
    const beSafeData = this.getCustomerBeSafeBeSecureData(customerId);

    return {
      customer,
      incidents: {
        total: incidentStats.totalIncidents,
        valueRecovered: incidentStats.totalValueRecovered,
        openIncidents: incidentStats.openIncidents,
        uniqueStores: incidentStats.uniqueStores,
        incidentTypes: incidentStats.incidentTypes
      },
      satisfaction: {
        averageRating: satisfactionStats.averageOverallRating,
        npsScore: satisfactionStats.npsScore,
        totalSurveys: satisfactionStats.totalSurveys,
        recommendationRate: satisfactionStats.recommendationRate
      },
      dailyActivity: {
        totalReports: dailyActivityStats.totalReports,
        totalHours: dailyActivityStats.totalHours,
        averageQuality: dailyActivityStats.averageReportQuality,
        approvalRate: dailyActivityStats.supervisorApprovalRate
      },
      beSafe: {
        totalChecks: beSafeData.checksBySite.reduce((sum: number, site: any) => 
          sum + site.insecureAreas + site.compliance + site.systems, 0),
        complianceIssues: beSafeData.complianceBreakdown.reduce((sum: number, item: any) => 
          sum + item.value, 0),
        averageQuality: beSafeData.averageReportQuality
      }
    };
  }

  // Regional data filtering
  static async getCustomerDataByRegion(customerId: string, regionId: string) {
    const incidents = (await this.getCustomerIncidents(customerId)).filter(i => i.regionId === regionId);
    const surveys = this.getCustomerSatisfactionSurveys(customerId).filter(s => s.regionId === regionId);
    const dailyReports = this.getCustomerDailyActivity(customerId).filter(r => r.regionId === regionId);

    return {
      incidents,
      surveys,
      dailyReports,
      stats: {
        incidentCount: incidents.length,
        averageSatisfaction: surveys.length > 0 ? 
          surveys.reduce((sum, s) => sum + s.overallRating, 0) / surveys.length : 0,
        reportCount: dailyReports.length
      }
    };
  }

  // Site-specific data filtering
  static async getCustomerDataBySite(customerId: string, siteId: string) {
    const incidents = (await this.getCustomerIncidents(customerId)).filter(i => i.siteId === siteId);
    const surveys = this.getCustomerSatisfactionSurveys(customerId).filter(s => s.siteId === siteId);
    const dailyReports = this.getCustomerDailyActivity(customerId).filter(r => r.siteId === siteId);

    return {
      incidents,
      surveys,
      dailyReports,
      stats: {
        incidentCount: incidents.length,
        averageSatisfaction: surveys.length > 0 ? 
          surveys.reduce((sum, s) => sum + s.overallRating, 0) / surveys.length : 0,
        reportCount: dailyReports.length
      }
    };
  }

  // Date range filtering utility
  static filterDataByDateRange<T extends { dateReported?: string; surveyDate?: string; reportDate?: string }>(
    data: T[], 
    startDate?: Date, 
    endDate?: Date
  ): T[] {
    if (!startDate && !endDate) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.dateReported || item.surveyDate || item.reportDate || '');
      if (isNaN(itemDate.getTime())) return false;
      
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }
}

export default CustomerDataService; 