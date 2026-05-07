import { api } from '@/config/api'

export interface ScheduleEventEmailRequest {
	eventTitle: string
	eventType: 'meeting' | 'call' | 'task' | 'reminder'
	eventDate: string
	eventTime: string
	duration: string
	description?: string
	recipientEmail: string
	recipientName?: string
	contactName?: string
}

class CRMEmailService {
	private readonly baseUrl = '/CRM'

	/**
	 * Sends an email notification for a scheduled event
	 * Email is sent from sales@advantage1.co.uk
	 */
	async sendScheduleEventNotification(
		request: ScheduleEventEmailRequest
	): Promise<{ success: boolean; message: string }> {
		try {
			// In production, this would call the backend API
			// For now, we'll simulate the API call
			console.log('[CRM Email Service] Sending schedule event notification:', {
				from: 'sales@advantage1.co.uk',
				to: request.recipientEmail,
				subject: `Scheduled ${request.eventType}: ${request.eventTitle}`,
				event: request
			})

			// TODO: Replace with actual API call when backend is ready
			// const response = await api.post(`${this.baseUrl}/send-event-notification`, {
			//   from: 'sales@advantage1.co.uk',
			//   ...request
			// })
			// return response.data

			// Simulate API call for now
			await new Promise(resolve => setTimeout(resolve, 500))

			return {
				success: true,
				message: `Email notification sent to ${request.recipientEmail}`
			}
		} catch (error) {
			console.error('[CRM Email Service] Error sending email:', error)
			throw new Error('Failed to send email notification')
		}
	}

	/**
	 * Builds the email body for a scheduled event
	 */
	buildEventEmailBody(request: ScheduleEventEmailRequest): string {
		const eventTypeLabels = {
			meeting: 'Meeting',
			call: 'Call',
			task: 'Task',
			reminder: 'Reminder'
		}

		return `
			<html>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
					<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
						<h2 style="color: #2563eb;">Scheduled ${eventTypeLabels[request.eventType]}</h2>
						<p>Hello${request.recipientName ? ` ${request.recipientName}` : ''},</p>
						<p>This is a notification about your scheduled ${request.eventType}:</p>
						<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
							<p><strong>Event:</strong> ${request.eventTitle}</p>
							<p><strong>Type:</strong> ${eventTypeLabels[request.eventType]}</p>
							<p><strong>Date:</strong> ${request.eventDate}</p>
							<p><strong>Time:</strong> ${request.eventTime}</p>
							<p><strong>Duration:</strong> ${request.duration} minutes</p>
							${request.description ? `<p><strong>Description:</strong> ${request.description}</p>` : ''}
							${request.contactName ? `<p><strong>Contact:</strong> ${request.contactName}</p>` : ''}
						</div>
						<p>Best regards,<br>Advantage One Security</p>
						<p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
							This email was sent from sales@advantage1.co.uk
						</p>
					</div>
				</body>
			</html>
		`
	}
}

export const crmEmailService = new CRMEmailService()
