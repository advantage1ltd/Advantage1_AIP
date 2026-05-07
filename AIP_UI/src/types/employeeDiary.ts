export interface EmployeeDiaryEmployee {
	employeeId: number
	employeeNumber: string
	fullName: string
	position: string
	employeeStatus: string
	employmentType: string
	region?: string | null
	email?: string | null
	contactNumber?: string | null
	userId?: string | null
}

export interface EmployeeDiaryLicense {
	siaLicenceType?: string | null
	siaLicenceExpiry?: string | null
	isSiaLicenceExpired: boolean
	isSiaLicenceExpiringSoon: boolean
	drivingLicenceType?: string | null
	dateDLChecked?: string | null
	drivingLicenceCopyTaken: boolean
}

export interface EmployeeDiaryHoliday {
	id: number
	startDate: string
	endDate: string
	returnToWorkDate: string
	dateOfRequest: string
	totalDays: number
	status: string
	comment?: string | null
	reason?: string | null
	authorisedBy?: string | null
	dateAuthorised?: string | null
}

export interface EmployeeDiaryIncident {
	incidentId: number
	dateOfIncident: string
	siteName: string
	customerId: number
	customerName: string
	incidentType: string
	totalValueRecovered?: number | null
	valueRecovered?: number | null
	officerName: string
	createdAt: string
}

export interface EmployeeDiaryExpenseClaim {
	id: number
	weekStartDate: string
	weekEndDate: string
	status: string
	weekTotal: number
	approvedByName?: string | null
	approvedAt?: string | null
	createdAt: string
}

export interface EmployeeDiaryEquipmentRequest {
	id: number
	equipmentType: string
	size?: string | null
	quantity: number
	priority: string
	status: string
	createdAt: string
}

export interface EmployeeDiaryEquipmentIssued {
	id: number
	equipmentType: string
	size?: string | null
	quantity: number
	condition: string
	dateIssued: string
	dateReturned?: string | null
	issuedByName: string
	notes?: string | null
}

export interface EmployeeDiaryEquipment {
	requests: EmployeeDiaryEquipmentRequest[]
	issued: EmployeeDiaryEquipmentIssued[]
}

export interface EmployeeDiaryTestAttempt {
	id: number
	testId: string
	testTitle: string
	score: number
	totalPoints: number
	percentageScore: number
	status: string
	startedAt: string
	completedAt: string
}

export interface EmployeeDiaryTraining {
	inductionAndTrainingBooked?: string | null
	fullRotasIssued?: string | null
	trainer?: string | null
	location?: string | null
	tests: EmployeeDiaryTestAttempt[]
}

export interface EmployeeDiaryStats {
	holidayCount: number
	incidentCount: number
	expenseCount: number
	equipmentRequestCount: number
	equipmentIssuedCount: number
	trainingTestCount: number
}

export interface EmployeeDiary {
	employee: EmployeeDiaryEmployee
	license: EmployeeDiaryLicense
	holidays: EmployeeDiaryHoliday[]
	incidents: EmployeeDiaryIncident[]
	expenses: EmployeeDiaryExpenseClaim[]
	equipment: EmployeeDiaryEquipment
	training: EmployeeDiaryTraining
	stats: EmployeeDiaryStats
}

