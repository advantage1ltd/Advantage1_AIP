import { api } from '@/config/api';

export interface ActionCalendarTask {
  actionCalendarId: number;
  taskTitle: string;
  taskDescription: string;
  taskStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priorityLevel: 'low' | 'medium' | 'high';
  assignTo: string;
  assignedUserName: string;
  dueDate: string;
  completedDate?: string;
  email?: string;
  isRecurring: boolean;
  reminderDate?: string;
  dateCreated: string;
  createdBy: string;
  createdByUserName: string;
  dateModified?: string;
  modifiedBy?: string;
  modifiedByUserName?: string;
}

export interface ActionCalendarStatusUpdate {
  actionCalendarStatusUpdateId: number;
  actionCalendarId: number;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  comment?: string;
  updateDate: string;
  updatedBy?: string;
  updatedByUserName: string;
}

export interface CreateActionCalendarTask {
  taskTitle: string;
  taskDescription?: string;
  taskStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priorityLevel: 'low' | 'medium' | 'high';
  assignTo: string;
  dueDate: string;
  email?: string;
  isRecurring: boolean;
  reminderDate?: string;
}

export interface UpdateActionCalendarTask {
  taskTitle: string;
  taskDescription?: string;
  taskStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priorityLevel: 'low' | 'medium' | 'high';
  assignTo: string;
  dueDate: string;
  completedDate?: string;
  email?: string;
  isRecurring: boolean;
  reminderDate?: string;
}

export interface ActionCalendarResponse {
  success: boolean;
  message: string;
  data: ActionCalendarTask;
  errors?: string[];
}

export interface ActionCalendarsResponse {
  success: boolean;
  message: string;
  data: ActionCalendarTask[];
  errors?: string[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface ActionCalendarStatusUpdatesResponse {
  success: boolean;
  message: string;
  data: ActionCalendarStatusUpdate[];
  errors?: string[];
}

export interface ActionCalendarStatusUpdateResponse {
  success: boolean;
  message: string;
  data: ActionCalendarStatusUpdate;
  errors?: string[];
}

export interface CreateActionCalendarStatusUpdateRequest {
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  comment?: string;
}

export interface ActionCalendarStatistics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  highPriority: number;
  dueToday: number;
  overdue: number;
}

class ActionCalendarService {
  private baseUrl = '/ActionCalendar';

  async getTasks(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    assignee?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<ActionCalendarsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.assignee) searchParams.append('assignee', params.assignee);
    if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params?.toDate) searchParams.append('toDate', params.toDate);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await api.get<ActionCalendarsResponse>(endpoint);
    return response.data;
  }

  async getTask(id: number): Promise<ActionCalendarResponse> {
    const response = await api.get<ActionCalendarResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createTask(task: CreateActionCalendarTask): Promise<ActionCalendarResponse> {
    const response = await api.post<ActionCalendarResponse>(this.baseUrl, task);
    return response.data;
  }

  async updateTask(id: number, task: UpdateActionCalendarTask): Promise<ActionCalendarResponse> {
    const response = await api.put<ActionCalendarResponse>(`${this.baseUrl}/${id}`, task);
    return response.data;
  }

  async deleteTask(id: number): Promise<ActionCalendarResponse> {
    const response = await api.delete<ActionCalendarResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getStatistics(): Promise<ActionCalendarStatistics> {
    const response = await api.get<ActionCalendarStatistics>(`${this.baseUrl}/statistics`);
    return response.data;
  }

  async getStatusUpdates(taskId: number): Promise<ActionCalendarStatusUpdatesResponse> {
    const response = await api.get<ActionCalendarStatusUpdatesResponse>(`${this.baseUrl}/${taskId}/status-updates`);
    return response.data;
  }

  async createStatusUpdate(taskId: number, payload: CreateActionCalendarStatusUpdateRequest): Promise<ActionCalendarStatusUpdateResponse> {
    const response = await api.post<ActionCalendarStatusUpdateResponse>(`${this.baseUrl}/${taskId}/status-updates`, payload);
    return response.data;
  }

  // Helper method to convert frontend Task type to backend format
  convertToBackendFormat(task: any): CreateActionCalendarTask {
    return {
      taskTitle: task.title,
      taskDescription: task.description || '',
      taskStatus: task.status,
      priorityLevel: task.priority,
      assignTo: task.assignee,
      dueDate: task.date instanceof Date ? task.date.toISOString() : task.date,
      email: task.email || '',
      isRecurring: task.isRecurring || false,
      reminderDate: task.reminderDate ? (task.reminderDate instanceof Date ? task.reminderDate.toISOString() : task.reminderDate) : undefined,
    };
  }

  // Helper method to convert backend format to frontend Task type
  convertToFrontendFormat(task: ActionCalendarTask): any {
    return {
      id: task.actionCalendarId.toString(),
      title: task.taskTitle,
      description: task.taskDescription,
      date: new Date(task.dueDate),
      priority: task.priorityLevel,
      assignee: task.assignTo,
      assigneeName: task.assignedUserName || task.assignTo,
      status: task.taskStatus,
      statusNotes: task.taskDescription,
      email: task.email,
      isRecurring: task.isRecurring,
      reminderDate: task.reminderDate ? new Date(task.reminderDate) : undefined,
      completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
      createdById: task.createdBy,
      createdByName: task.createdByUserName,
      modifiedById: task.modifiedBy,
      modifiedByName: task.modifiedByUserName,
      dateCreated: new Date(task.dateCreated),
      dateModified: task.dateModified ? new Date(task.dateModified) : undefined,
    };
  }
}

export const actionCalendarService = new ActionCalendarService();
