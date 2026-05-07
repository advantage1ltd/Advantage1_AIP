import { api } from '@/config/api'

export interface ScheduledEvent {
	id: string
	title: string
	type: 'meeting' | 'call' | 'task' | 'reminder'
	date: Date
	time: string
	duration: string
	description: string
	notificationSent: boolean
	sendEmailNotification?: boolean
	recipientEmail?: string
}

export interface DashboardStats {
	totalContacts: number
	pipelineValue: number
	avgDealValue: number
	conversionRate: number
	contactGrowth: number
	recentActivities: any[]
	upcomingEvents: ScheduledEvent[]
}

export interface ScheduledEventCreateRequest {
	title: string
	type: 'meeting' | 'call' | 'task' | 'reminder'
	eventDate: string // ISO date string
	eventTime: string
	duration: string
	description?: string
	sendEmailNotification: boolean
	recipientEmail?: string
}

export interface ScheduledEventUpdateRequest {
	title?: string
	type?: 'meeting' | 'call' | 'task' | 'reminder'
	eventDate?: string
	eventTime?: string
	duration?: string
	description?: string
	sendEmailNotification?: boolean
	recipientEmail?: string
}

class CRMDashboardService {
	private readonly baseUrl = '/CRMDashboard'

	/**
	 * Get dashboard statistics
	 */
	async getDashboardStats(): Promise<DashboardStats> {
		try {
			const response = await api.get(`${this.baseUrl}/stats`)
			const data = response.data.data
			return {
				totalContacts: data.totalContacts || 0,
				pipelineValue: data.pipelineValue || 0,
				avgDealValue: data.avgDealValue || 0,
				conversionRate: data.conversionRate || 0,
				contactGrowth: data.contactGrowth || 0,
				recentActivities: data.recentActivities || [],
				upcomingEvents: (data.upcomingEvents || []).map(this.mapToScheduledEvent)
			}
		} catch (error) {
			console.error('[CRM Dashboard Service] Error fetching dashboard stats:', error)
			throw new Error('Failed to fetch dashboard statistics')
		}
	}

	/**
	 * Get scheduled events
	 */
	async getScheduledEvents(startDate?: Date, endDate?: Date): Promise<ScheduledEvent[]> {
		try {
			const params = new URLSearchParams()
			if (startDate) params.append('startDate', startDate.toISOString())
			if (endDate) params.append('endDate', endDate.toISOString())

			const response = await api.get(`${this.baseUrl}/scheduled-events?${params.toString()}`)
			return (response.data.data || []).map(this.mapToScheduledEvent)
		} catch (error) {
			console.error('[CRM Dashboard Service] Error fetching scheduled events:', error)
			throw new Error('Failed to fetch scheduled events')
		}
	}

	/**
	 * Get upcoming events (next N days)
	 */
	async getUpcomingEvents(days: number = 7): Promise<ScheduledEvent[]> {
		try {
			const response = await api.get(`${this.baseUrl}/upcoming-events?days=${days}`)
			return (response.data.data || []).map(this.mapToScheduledEvent)
		} catch (error) {
			console.error('[CRM Dashboard Service] Error fetching upcoming events:', error)
			throw new Error('Failed to fetch upcoming events')
		}
	}

	/**
	 * Create a scheduled event
	 */
	async createScheduledEvent(event: ScheduledEventCreateRequest): Promise<ScheduledEvent> {
		try {
			const response = await api.post(`${this.baseUrl}/scheduled-events`, {
				title: event.title,
				eventType: event.type,
				eventDate: event.eventDate,
				eventTime: event.eventTime,
				duration: event.duration,
				description: event.description,
				sendEmailNotification: event.sendEmailNotification,
				recipientEmail: event.recipientEmail
			})
			return this.mapToScheduledEvent(response.data.data)
		} catch (error) {
			console.error('[CRM Dashboard Service] Error creating scheduled event:', error)
			throw new Error('Failed to create scheduled event')
		}
	}

	/**
	 * Update a scheduled event
	 */
	async updateScheduledEvent(id: string, event: ScheduledEventUpdateRequest): Promise<ScheduledEvent> {
		try {
			const response = await api.put(`${this.baseUrl}/scheduled-events/${id}`, {
				title: event.title,
				eventType: event.type,
				eventDate: event.eventDate,
				eventTime: event.eventTime,
				duration: event.duration,
				description: event.description,
				sendEmailNotification: event.sendEmailNotification,
				recipientEmail: event.recipientEmail
			})
			return this.mapToScheduledEvent(response.data.data)
		} catch (error) {
			console.error('[CRM Dashboard Service] Error updating scheduled event:', error)
			throw new Error('Failed to update scheduled event')
		}
	}

	/**
	 * Delete a scheduled event
	 */
	async deleteScheduledEvent(id: string): Promise<void> {
		try {
			await api.delete(`${this.baseUrl}/scheduled-events/${id}`)
		} catch (error) {
			console.error('[CRM Dashboard Service] Error deleting scheduled event:', error)
			throw new Error('Failed to delete scheduled event')
		}
	}

	/**
	 * Map backend DTO to frontend ScheduledEvent
	 */
	private mapToScheduledEvent(backendEvent: any): ScheduledEvent {
		return {
			id: backendEvent.scheduledEventId.toString(),
			title: backendEvent.title,
			type: backendEvent.eventType as ScheduledEvent['type'],
			date: new Date(backendEvent.eventDate),
			time: backendEvent.eventTime,
			duration: backendEvent.duration,
			description: backendEvent.description || '',
			notificationSent: backendEvent.notificationSent || false,
			sendEmailNotification: backendEvent.sendEmailNotification || false,
			recipientEmail: backendEvent.recipientEmail
		}
	}
}

export const crmDashboardService = new CRMDashboardService()
