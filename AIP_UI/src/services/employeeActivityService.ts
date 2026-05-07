import type { ActivitySource, ActivitySyncStatus, EmployeeActivity } from '@/types/employee';
import { ACTIVITY_SOURCES } from '@/config/activityConfig';

class EmployeeActivityService {
  private baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  // Get all activities or filter by employee ID
  async fetchEmployeeActivities(employeeId?: string): Promise<EmployeeActivity[]> {
    const url = new URL('/api/employee-activities', window.location.origin);
    if (employeeId) {
      url.searchParams.set('employeeId', employeeId);
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    
    const data = await response.json();
    return data.data.map((activity: any) => this.transformActivityDates(activity));
  }

  // Get sync status for all activity sources
  async fetchActivitySources(): Promise<Record<ActivitySource, ActivitySyncStatus>> {
    const response = await fetch('/api/employee-activities/sources');
    if (!response.ok) {
      throw new Error('Failed to fetch activity sources');
    }
    
    const data = await response.json();
    return data.data;
  }

  // Create a new activity
  async createActivity(activity: Partial<EmployeeActivity>): Promise<EmployeeActivity> {
    const response = await fetch('/api/employee-activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create activity');
    }
    
    const data = await response.json();
    return this.transformActivityDates(data.data);
  }

  // Update an existing activity
  async updateActivity(id: string, updates: Partial<EmployeeActivity>): Promise<EmployeeActivity> {
    const response = await fetch(`/api/employee-activities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update activity');
    }
    
    const data = await response.json();
    return this.transformActivityDates(data.data);
  }

  // Delete an activity
  async deleteActivity(id: string): Promise<void> {
    const response = await fetch(`/api/employee-activities/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete activity');
    }
  }

  // Sync with external data source
  async syncActivitiesFromSource(source: ActivitySource): Promise<void> {
    const response = await fetch(`/api/employee-activities/sync/${source}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync activities from ${source}`);
    }
  }

  // Generate activity report
  async generateActivityReport(employeeId: string, startDate: Date, endDate: Date): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/activities/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeId, 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error generating activity report:', error);
      throw error;
    }
  }
  
  // Utility method to transform activity data
  private transformActivityDates(activity: any): EmployeeActivity {
    return {
      ...activity,
      activityDate: new Date(activity.activityDate),
      nextReviewDate: activity.nextReviewDate ? new Date(activity.nextReviewDate) : undefined,
      actionDeadline: activity.actionDeadline ? new Date(activity.actionDeadline) : undefined,
      createdAt: new Date(activity.createdAt),
      updatedAt: new Date(activity.updatedAt)
    };
  }
}

// Create and export a singleton instance
export const employeeActivityService = new EmployeeActivityService(); 