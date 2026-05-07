export interface CommunicationLog {
	id: string
	callDate: string
	commsType: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Other'
	personSpokenTo: string
	notes: string
	createdAt?: string
}

export interface CRMContact {
	id: string
	// Contact Details
	fullName: string
	influence: string
	contact1Mobile: string
	contact2Landline: string
	linkedIn?: string
	bdmContactOwner: string
	leadStatus: 'New Lead' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost' | 'Closed'
	jobTitle: string
	email: string
	connectedOnLinkedIn: 'Yes' | 'No'
	createDate: string

	// Company Details
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

	// Services
	services: string[]

	// Other Details
	multipleOpportunities?: string
	currentRisksConcerns?: string
	contractStatus: 'Pending' | 'Active' | 'Expired' | 'Cancelled'
	nextSteps?: string
	includedOnNewsletter: 'Yes' | 'No'
	notes?: string
	scopeOfWorks?: string
	incumbentSupplier?: string
	lengthOfContract?: number
	dateOfNextReview?: string
	managerReview?: string
	lastActivityDate?: string
	nextAppointmentDate?: string

	// Communication Log
	communicationLogs: CommunicationLog[]
}
