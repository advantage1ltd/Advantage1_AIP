export type BankHolidayStatus = 'authorized' | 'declined' | 'pending';

export interface BankHoliday {
	id: string;
	officerId: number;
	officerName: string;
	officerNumber: string;
	holidayDate: string;
	dateOfRequest: string;
	authorisedByEmployeeId?: number;
	authorisedByName?: string;
	dateAuthorised?: string;
	status: BankHolidayStatus;
	archived: boolean;
	reason?: string;
	createdAt: string;
	updatedAt?: string;
}

export interface CreateBankHolidayDTO {
	officerId: number;
	holidayDate: string;
	reason?: string;
}

export interface UpdateBankHolidayDTO {
	officerId?: number;
	holidayDate?: string;
	authorisedByEmployeeId?: number;
	dateAuthorised?: string;
	status?: BankHolidayStatus;
	archived?: boolean;
	reason?: string;
}

export interface BankHolidayFilters {
	search?: string;
	page?: number;
	limit?: number;
	archived?: boolean;
	status?: BankHolidayStatus;
}

export interface BankHolidayResponse {
	data: BankHoliday[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}