import { api } from '@/config/api';

export interface OfficerSupportUpdate {
	id: string;
	name: string;
	description?: string;
	effectiveDate: string;
	fileName: string;
	fileUrl: string;
	createdAt: string;
	totalDeclarations: number;
	status: 'active' | 'archived';
}

export interface OfficerSupportDeclaration {
	id: string;
	updateId: string;
	officerName: string;
	signatureDate: string;
	acknowledged: boolean;
}

export interface CreateUpdateRequest {
	name: string;
	description?: string;
	effectiveDate: string;
	fileName: string;
	fileUrl: string;
	status?: 'active' | 'archived';
}

export interface UpdateUpdateRequest {
	name?: string;
	description?: string;
	effectiveDate?: string;
	fileName?: string;
	fileUrl?: string;
	status?: 'active' | 'archived';
}

export interface CreateDeclarationRequest {
	updateId: string;
	officerName: string;
	signature?: string;
	acknowledged: boolean;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		currentPage: number;
		totalPages: number;
		pageSize: number;
		totalCount: number;
		hasPrevious: boolean;
		hasNext: boolean;
	};
}

export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message: string;
}

class OfficerSupportService {
	private readonly baseUrl = '/officer-support';

	async getUpdates(
		page: number = 1,
		pageSize: number = 10,
		search?: string,
		status?: string,
		fromDate?: string,
		toDate?: string
	): Promise<PaginatedResponse<OfficerSupportUpdate>> {
		const params = new URLSearchParams({
			page: page.toString(),
			pageSize: pageSize.toString(),
			...(search && { search }),
			...(status && { status }),
			...(fromDate && { fromDate }),
			...(toDate && { toDate })
		});

		const response = await api.get(`${this.baseUrl}/updates?${params}`);
		// Backend returns { data: [...], pagination: {...} } or { Data: [...], Pagination: {...} }
		const result = response.data;
		return {
			data: result.data || result.Data || [],
			pagination: result.pagination || result.Pagination || {
				currentPage: page,
				totalPages: 1,
				pageSize,
				totalCount: 0,
				hasPrevious: false,
				hasNext: false
			}
		};
	}

	async getUpdateById(id: string): Promise<ApiResponse<OfficerSupportUpdate>> {
		const response = await api.get(`${this.baseUrl}/updates/${id}`);
		// Backend returns { data: {...}, success: true, message: "..." } or { Data: {...}, Success: true, Message: "..." }
		const result = response.data;
		return {
			data: result.data || result.Data || result,
			success: result.success ?? result.Success ?? true,
			message: result.message || result.Message || ''
		};
	}

	async uploadFile(file: File): Promise<{ filePath: string; fileUrl: string; fileName: string }> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await api.post(`${this.baseUrl}/updates/upload`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});

		// Backend returns { data: {...}, success: true, message: "..." } or { Data: {...}, Success: true, Message: "..." }
		const result = response.data;
		const uploadData = result.data || result.Data || result;
		return {
			filePath: uploadData.filePath || uploadData.FilePath || '',
			fileUrl: uploadData.fileUrl || uploadData.FileUrl || '',
			fileName: uploadData.fileName || uploadData.FileName || file.name
		};
	}

	async createUpdate(data: CreateUpdateRequest): Promise<ApiResponse<OfficerSupportUpdate>> {
		const response = await api.post(`${this.baseUrl}/updates`, data);
		// Backend returns { data: {...}, success: true, message: "..." } or { Data: {...}, Success: true, Message: "..." }
		const result = response.data;
		return {
			data: result.data || result.Data || result,
			success: result.success ?? result.Success ?? true,
			message: result.message || result.Message || ''
		};
	}

	async updateUpdate(id: string, data: UpdateUpdateRequest): Promise<ApiResponse<OfficerSupportUpdate>> {
		const response = await api.put(`${this.baseUrl}/updates/${id}`, data);
		// Backend returns { data: {...}, success: true, message: "..." } or { Data: {...}, Success: true, Message: "..." }
		const result = response.data;
		return {
			data: result.data || result.Data || result,
			success: result.success ?? result.Success ?? true,
			message: result.message || result.Message || ''
		};
	}

	async deleteUpdate(id: string): Promise<void> {
		await api.delete(`${this.baseUrl}/updates/${id}`);
	}

	async getDeclarations(
		page: number = 1,
		pageSize: number = 10,
		updateId?: string,
		officerName?: string,
		acknowledged?: boolean
	): Promise<PaginatedResponse<OfficerSupportDeclaration>> {
		const params = new URLSearchParams({
			page: page.toString(),
			pageSize: pageSize.toString(),
			...(updateId && { updateId }),
			...(officerName && { officerName }),
			...(acknowledged !== undefined && { acknowledged: acknowledged.toString() })
		});

		const response = await api.get(`${this.baseUrl}/declarations?${params}`);
		// Backend returns { data: [...], pagination: {...} } or { Data: [...], Pagination: {...} }
		const result = response.data;
		return {
			data: result.data || result.Data || [],
			pagination: result.pagination || result.Pagination || {
				currentPage: page,
				totalPages: 1,
				pageSize,
				totalCount: 0,
				hasPrevious: false,
				hasNext: false
			}
		};
	}

	async createDeclaration(data: CreateDeclarationRequest): Promise<OfficerSupportDeclaration> {
		const response = await api.post(`${this.baseUrl}/declarations`, data);
		// Backend returns the declaration directly or wrapped in { data: {...} }
		const result = response.data;
		return result.data || result.Data || result;
	}
}

export const officerSupportService = new OfficerSupportService();

