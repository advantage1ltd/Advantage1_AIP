import { api } from '@/config/api';

export interface ManagerSupportUpdate {
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

export interface ManagerSupportDeclaration {
	id: string;
	updateId: string;
	managerName: string;
	signatureDate: string;
	acknowledged: boolean;
}

export interface CreateManagerSupportUpdateRequest {
	name: string;
	description?: string;
	effectiveDate: string;
	fileName: string;
	fileUrl: string;
	status?: 'active' | 'archived';
}

export interface UpdateManagerSupportUpdateRequest {
	name?: string;
	description?: string;
	effectiveDate?: string;
	fileName?: string;
	fileUrl?: string;
	status?: 'active' | 'archived';
}

export interface CreateManagerSupportDeclarationRequest {
	updateId: string;
	managerName: string;
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

class ManagerSupportService {
	private readonly baseUrl = '/manager-support';

	async getUpdates(
		page: number = 1,
		pageSize: number = 10,
		search?: string,
		status?: string,
		fromDate?: string,
		toDate?: string
	): Promise<PaginatedResponse<ManagerSupportUpdate>> {
		const params = new URLSearchParams({
			page: page.toString(),
			pageSize: pageSize.toString(),
			...(search && { search }),
			...(status && { status }),
			...(fromDate && { fromDate }),
			...(toDate && { toDate })
		});

		const response = await api.get(`${this.baseUrl}/updates?${params.toString()}`);
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

	async getUpdateById(id: string): Promise<ApiResponse<ManagerSupportUpdate>> {
		const response = await api.get(`${this.baseUrl}/updates/${id}`);
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
			headers: { 'Content-Type': 'multipart/form-data' }
		});

		const result = response.data;
		const uploadData = result.data || result.Data || result;
		return {
			filePath: uploadData.filePath || uploadData.FilePath || '',
			fileUrl: uploadData.fileUrl || uploadData.FileUrl || '',
			fileName: uploadData.fileName || uploadData.FileName || file.name
		};
	}

	async createUpdate(data: CreateManagerSupportUpdateRequest): Promise<ApiResponse<ManagerSupportUpdate>> {
		const response = await api.post(`${this.baseUrl}/updates`, data);
		const result = response.data;
		return {
			data: result.data || result.Data || result,
			success: result.success ?? result.Success ?? true,
			message: result.message || result.Message || ''
		};
	}

	async updateUpdate(id: string, data: UpdateManagerSupportUpdateRequest): Promise<ApiResponse<ManagerSupportUpdate>> {
		const response = await api.put(`${this.baseUrl}/updates/${id}`, data);
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
		managerName?: string,
		acknowledged?: boolean
	): Promise<PaginatedResponse<ManagerSupportDeclaration>> {
		const params = new URLSearchParams({
			page: page.toString(),
			pageSize: pageSize.toString(),
			...(updateId && { updateId }),
			...(managerName && { managerName }),
			...(acknowledged !== undefined && { acknowledged: acknowledged.toString() })
		});

		const response = await api.get(`${this.baseUrl}/declarations?${params.toString()}`);
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

	async createDeclaration(data: CreateManagerSupportDeclarationRequest): Promise<ManagerSupportDeclaration> {
		const response = await api.post(`${this.baseUrl}/declarations`, data);
		const result = response.data;
		return result.data || result.Data || result;
	}
}

export const managerSupportService = new ManagerSupportService();


