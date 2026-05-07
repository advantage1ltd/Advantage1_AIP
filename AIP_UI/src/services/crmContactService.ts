import { api } from '@/config/api'
import { CRMContact, CommunicationLog } from '@/types/crmContact'

export interface RecentActivity {
	id: string
	type: 'contact' | 'communication'
	title: string
	description: string
	timestamp: Date
	contactId?: string
	contactName?: string
	businessName?: string
}

export interface CRMContactCreateRequest {
	fullName: string
	influence?: string
	contact1Mobile?: string
	contact2Landline?: string
	linkedIn?: string
	bdmContactOwner?: string
	leadStatus: string
	jobTitle: string
	email: string
	connectedOnLinkedIn: string
	createDate?: string
	businessName: string
	addressFirstLine: string
	addressSecondLine?: string
	postCode: string
	town: string
	region: string
	website?: string
	sizeOfBusinessEmployees: number
	sizeOfBusinessTurnover: number
	industrySector: string
	services: string[]
	multipleOpportunities?: string
	currentRisksConcerns?: string
	contractStatus: string
	nextSteps?: string
	includedOnNewsletter: string
	notes?: string
	scopeOfWorks?: string
	incumbentSupplier?: string
	lengthOfContract?: number
	dateOfNextReview?: string
	managerReview?: string
	lastActivityDate?: string
	nextAppointmentDate?: string
	communicationLogs?: CommunicationLog[]
}

export interface CRMContactUpdateRequest {
	fullName?: string
	influence?: string
	contact1Mobile?: string
	contact2Landline?: string
	linkedIn?: string
	bdmContactOwner?: string
	leadStatus?: string
	jobTitle?: string
	email?: string
	connectedOnLinkedIn?: string
	businessName?: string
	addressFirstLine?: string
	addressSecondLine?: string
	postCode?: string
	town?: string
	region?: string
	website?: string
	sizeOfBusinessEmployees?: number
	sizeOfBusinessTurnover?: number
	industrySector?: string
	services?: string[]
	multipleOpportunities?: string
	currentRisksConcerns?: string
	contractStatus?: string
	nextSteps?: string
	includedOnNewsletter?: string
	notes?: string
	scopeOfWorks?: string
	incumbentSupplier?: string
	lengthOfContract?: number
	dateOfNextReview?: string
	managerReview?: string
	lastActivityDate?: string
	nextAppointmentDate?: string
}

class CRMContactService {
	private readonly baseUrl = '/CRMContact'

	/**
	 * Get all CRM contacts
	 */
	async getAll(): Promise<CRMContact[]> {
		try {
			const response = await api.get(`${this.baseUrl}`)
			return this.mapToFrontendContacts(response.data.data || [])
		} catch (error) {
			console.error('[CRM Contact Service] Error fetching contacts:', error)
			throw new Error('Failed to fetch CRM contacts')
		}
	}

	/**
	 * Get CRM contact by ID
	 */
	async getById(id: string): Promise<CRMContact | null> {
		try {
			const response = await api.get(`${this.baseUrl}/${id}`)
			if (!response.data.data) return null
			return this.mapToFrontendContact(response.data.data)
		} catch (error) {
			console.error('[CRM Contact Service] Error fetching contact:', error)
			throw new Error('Failed to fetch CRM contact')
		}
	}

	/**
	 * Search CRM contacts
	 */
	async search(searchQuery?: string, statusFilter?: string): Promise<CRMContact[]> {
		try {
			const params = new URLSearchParams()
			if (searchQuery) params.append('searchQuery', searchQuery)
			if (statusFilter) params.append('statusFilter', statusFilter)

			const response = await api.get(`${this.baseUrl}/search?${params.toString()}`)
			return this.mapToFrontendContacts(response.data.data || [])
		} catch (error) {
			console.error('[CRM Contact Service] Error searching contacts:', error)
			throw new Error('Failed to search CRM contacts')
		}
	}

	/**
	 * Create a new CRM contact
	 */
	async create(contact: CRMContactCreateRequest): Promise<CRMContact> {
		try {
			const response = await api.post(`${this.baseUrl}`, this.mapToBackendRequest(contact))
			return this.mapToFrontendContact(response.data.data)
		} catch (error) {
			console.error('[CRM Contact Service] Error creating contact:', error)
			throw new Error('Failed to create CRM contact')
		}
	}

	/**
	 * Update an existing CRM contact
	 */
	async update(id: string, contact: CRMContactUpdateRequest): Promise<CRMContact> {
		try {
			const response = await api.put(`${this.baseUrl}/${id}`, contact)
			return this.mapToFrontendContact(response.data.data)
		} catch (error) {
			console.error('[CRM Contact Service] Error updating contact:', error)
			throw new Error('Failed to update CRM contact')
		}
	}

	/**
	 * Delete a CRM contact
	 */
	async delete(id: string): Promise<void> {
		try {
			await api.delete(`${this.baseUrl}/${id}`)
		} catch (error) {
			console.error('[CRM Contact Service] Error deleting contact:', error)
			throw new Error('Failed to delete CRM contact')
		}
	}

	/**
	 * Get communication logs for a contact
	 */
	async getCommunicationLogs(contactId: string): Promise<CommunicationLog[]> {
		try {
			const response = await api.get(`${this.baseUrl}/${contactId}/communication-logs`)
			return (response.data.data || []).map((log: any) => ({
				id: log.communicationLogId.toString(),
				callDate: log.callDate,
				commsType: log.commsType as CommunicationLog['commsType'],
				personSpokenTo: log.personSpokenTo,
				notes: log.notes,
				createdAt: log.dateCreated
			}))
		} catch (error) {
			console.error('[CRM Contact Service] Error fetching communication logs:', error)
			throw new Error('Failed to fetch communication logs')
		}
	}

	/**
	 * Add a communication log
	 */
	async addCommunicationLog(
		contactId: string,
		log: Omit<CommunicationLog, 'id' | 'createdAt'>
	): Promise<CommunicationLog> {
		try {
			const response = await api.post(`${this.baseUrl}/${contactId}/communication-logs`, {
				callDate: log.callDate,
				commsType: log.commsType,
				personSpokenTo: log.personSpokenTo,
				notes: log.notes
			})
			const data = response.data.data
			return {
				id: data.communicationLogId.toString(),
				callDate: data.callDate,
				commsType: data.commsType,
				personSpokenTo: data.personSpokenTo,
				notes: data.notes,
				createdAt: data.dateCreated
			}
		} catch (error) {
			console.error('[CRM Contact Service] Error adding communication log:', error)
			throw new Error('Failed to add communication log')
		}
	}

	/**
	 * Update a communication log
	 */
	async updateCommunicationLog(
		contactId: string,
		logId: string,
		log: Partial<Omit<CommunicationLog, 'id' | 'createdAt'>>
	): Promise<CommunicationLog> {
		try {
			const response = await api.put(`${this.baseUrl}/${contactId}/communication-logs/${logId}`, {
				callDate: log.callDate,
				commsType: log.commsType,
				personSpokenTo: log.personSpokenTo,
				notes: log.notes
			})
			const data = response.data.data
			return {
				id: data.communicationLogId.toString(),
				callDate: data.callDate,
				commsType: data.commsType,
				personSpokenTo: data.personSpokenTo,
				notes: data.notes,
				createdAt: data.dateCreated
			}
		} catch (error) {
			console.error('[CRM Contact Service] Error updating communication log:', error)
			throw new Error('Failed to update communication log')
		}
	}

	/**
	 * Delete a communication log
	 */
	async deleteCommunicationLog(contactId: string, logId: string): Promise<void> {
		try {
			await api.delete(`${this.baseUrl}/${contactId}/communication-logs/${logId}`)
		} catch (error) {
			console.error('[CRM Contact Service] Error deleting communication log:', error)
			throw new Error('Failed to delete communication log')
		}
	}

	/**
	 * Get recent activities (contacts and communication logs)
	 */
	async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
		try {
			const response = await api.get(`${this.baseUrl}/recent-activities?limit=${limit}`)
			console.log('[CRM Contact Service] Recent activities response:', response.data)
			
			// Handle both response.data.data and response.data structures
			const activitiesData = response.data?.data || response.data || []
			
			if (!Array.isArray(activitiesData)) {
				console.warn('[CRM Contact Service] Activities data is not an array:', activitiesData)
				return []
			}
			
			const activities = activitiesData.map((activity: any) => {
				if (!activity || !activity.id) {
					console.warn('[CRM Contact Service] Invalid activity item:', activity)
					return null
				}
				return {
					id: activity.id,
					type: activity.type as 'contact' | 'communication',
					title: activity.title || 'Unknown Activity',
					description: activity.description || '',
					timestamp: new Date(activity.timestamp),
					contactId: activity.contactId?.toString(),
					contactName: activity.contactName,
					businessName: activity.businessName
				}
			}).filter((activity: RecentActivity | null): activity is RecentActivity => activity !== null)
			
			console.log('[CRM Contact Service] Processed activities:', activities)
			return activities
		} catch (error) {
			console.error('[CRM Contact Service] Error fetching recent activities:', error)
			throw new Error('Failed to fetch recent activities')
		}
	}

	/**
	 * Map backend DTO to frontend Contact type
	 */
	private mapToFrontendContact(backendContact: any): CRMContact {
		return {
			id: backendContact.crmContactId.toString(),
			fullName: backendContact.fullName,
			influence: backendContact.influence || '',
			contact1Mobile: backendContact.contact1Mobile || '',
			contact2Landline: backendContact.contact2Landline || '',
			linkedIn: backendContact.linkedIn,
			bdmContactOwner: backendContact.bdmContactOwner || '',
			leadStatus: backendContact.leadStatus as CRMContact['leadStatus'],
			jobTitle: backendContact.jobTitle,
			email: backendContact.email,
			connectedOnLinkedIn: backendContact.connectedOnLinkedIn as 'Yes' | 'No',
			createDate: backendContact.createDate,
			businessName: backendContact.businessName,
			addressFirstLine: backendContact.addressFirstLine,
			addressSecondLine: backendContact.addressSecondLine,
			postCode: backendContact.postCode,
			town: backendContact.town,
			region: backendContact.region,
			website: backendContact.website,
			sizeOfBusinessEmployees: backendContact.sizeOfBusinessEmployees || 0,
			sizeOfBusinessTurnover: backendContact.sizeOfBusinessTurnover || 0,
			industrySector: backendContact.industrySector,
			services: backendContact.services || [],
			multipleOpportunities: backendContact.multipleOpportunities,
			currentRisksConcerns: backendContact.currentRisksConcerns,
			contractStatus: backendContact.contractStatus as CRMContact['contractStatus'],
			nextSteps: backendContact.nextSteps,
			includedOnNewsletter: backendContact.includedOnNewsletter as 'Yes' | 'No',
			notes: backendContact.notes,
			scopeOfWorks: backendContact.scopeOfWorks,
			incumbentSupplier: backendContact.incumbentSupplier,
			lengthOfContract: backendContact.lengthOfContract,
			dateOfNextReview: backendContact.dateOfNextReview,
			managerReview: backendContact.managerReview,
			lastActivityDate: backendContact.lastActivityDate,
			nextAppointmentDate: backendContact.nextAppointmentDate,
			communicationLogs: (backendContact.communicationLogs || []).map((log: any) => ({
				id: log.communicationLogId.toString(),
				callDate: log.callDate,
				commsType: log.commsType as CommunicationLog['commsType'],
				personSpokenTo: log.personSpokenTo,
				notes: log.notes,
				createdAt: log.dateCreated
			}))
		}
	}

	/**
	 * Map multiple backend DTOs to frontend Contact types
	 */
	private mapToFrontendContacts(backendContacts: any[]): CRMContact[] {
		return backendContacts.map(contact => this.mapToFrontendContact(contact))
	}

	/**
	 * Map frontend Contact to backend request format
	 */
	private mapToBackendRequest(contact: CRMContactCreateRequest): any {
		return {
			fullName: contact.fullName,
			influence: contact.influence,
			contact1Mobile: contact.contact1Mobile,
			contact2Landline: contact.contact2Landline,
			linkedIn: contact.linkedIn,
			bdmContactOwner: contact.bdmContactOwner,
			leadStatus: contact.leadStatus,
			jobTitle: contact.jobTitle,
			email: contact.email,
			connectedOnLinkedIn: contact.connectedOnLinkedIn,
			createDate: contact.createDate,
			businessName: contact.businessName,
			addressFirstLine: contact.addressFirstLine,
			addressSecondLine: contact.addressSecondLine,
			postCode: contact.postCode,
			town: contact.town,
			region: contact.region,
			website: contact.website,
			sizeOfBusinessEmployees: contact.sizeOfBusinessEmployees,
			sizeOfBusinessTurnover: contact.sizeOfBusinessTurnover,
			industrySector: contact.industrySector,
			services: contact.services,
			multipleOpportunities: contact.multipleOpportunities,
			currentRisksConcerns: contact.currentRisksConcerns,
			contractStatus: contact.contractStatus,
			nextSteps: contact.nextSteps,
			includedOnNewsletter: contact.includedOnNewsletter,
			notes: contact.notes,
			scopeOfWorks: contact.scopeOfWorks,
			incumbentSupplier: contact.incumbentSupplier,
			lengthOfContract: contact.lengthOfContract,
			dateOfNextReview: contact.dateOfNextReview,
			managerReview: contact.managerReview,
			lastActivityDate: contact.lastActivityDate,
			nextAppointmentDate: contact.nextAppointmentDate,
			communicationLogs: contact.communicationLogs?.map(log => ({
				callDate: log.callDate,
				commsType: log.commsType,
				personSpokenTo: log.personSpokenTo,
				notes: log.notes
			}))
		}
	}
}

export const crmContactService = new CRMContactService()
