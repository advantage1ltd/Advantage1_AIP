import { isAxiosError } from 'axios'
import { api, EMPLOYEE_ENDPOINTS, ApiResponse, handleApiError } from '@/config/api'
import { Employee } from '@/types/employee'
import { mapToBackendRequest, mapFromBackendResponse, mapFromBackendResponseArray, mapFromListResponseArray, mapToBackendUpdateRequest } from '@/utils/employeeMapper'

export interface EmployeeRegistrationRequest {
  // Required fields
  EmployeeNumber: string
  Title: string
  FirstName: string
  Surname: string
  StartDate: Date
  Position: string
  EmployeeStatus: string
  EmploymentType: string
  
  // Optional fields
  AipAccessLevel?: string
  Region?: string
  Email?: string
  ContactNumber?: string
  HouseName?: string
  NumberAndStreet?: string
  Town?: string
  County?: string
  PostCode?: string
  SiaLicenceType?: string
  SiaLicenceExpiry?: Date | null
  Nationality?: string
  RightToWorkCondition?: string
  DrivingLicenceType?: string
  DateDLChecked?: Date | null
  DrivingLicenceCopyTaken?: boolean
  SixMonthlyCheck?: boolean
  GraydonCheckAuthorised?: boolean
  GraydonCheckDetails?: string
  InitialOralReferencesComplete?: boolean
  InitialOralReferencesDate?: Date | null
  WrittenRefsComplete?: boolean
  WrittenRefsCompleteDate?: Date | null
  QuickStarterFormCompleted?: boolean
  WorkingTimeDirective?: string
  WorkingTimeDirectiveComplete?: boolean
  ContractOfEmploymentSigned?: boolean
  PhotoTaken?: boolean
  PhotoFile?: string
  IdCardIssued?: boolean
  EquipmentIssued?: boolean
  UniformIssued?: boolean
  NextOfKinDetailsComplete?: boolean
  PeopleHoursPin?: string
  FullRotasIssued?: Date | null
  InductionAndTrainingBooked?: Date | null
  Location?: string
  Trainer?: string
}

export interface EmployeeRegistrationResponse {
  id: number
  employeeNumber: string
  firstName: string
  surname: string
  email?: string
  position: string
  status: string
  createdAt: string
}

export interface EmployeeDetailResponse {
  id: number
  employeeNumber: string
  title?: string
  firstName: string
  surname: string
  fullName?: string
  startDate: Date
  position: string
  employeeStatus?: string
  employmentType?: string
  aipAccessLevel?: string
  region?: string
  email?: string
  contactNumber?: string
  houseName?: string
  numberAndStreet?: string
  town?: string
  county?: string
  postCode?: string
  siaLicenceType?: string
  siaLicenceExpiry?: Date | null
  isSiaLicenceExpired?: boolean
  isSiaLicenceExpiringSoon?: boolean
  nationality?: string
  rightToWorkCondition?: string
  drivingLicenceType?: string
  dateDLChecked?: Date | null
  drivingLicenceCopyTaken?: boolean
  sixMonthlyCheck?: boolean
  graydonCheckAuthorised?: boolean
  graydonCheckDetails?: string
  initialOralReferencesComplete?: boolean
  initialOralReferencesDate?: Date | null
  writtenRefsComplete?: boolean
  writtenRefsCompleteDate?: Date | null
  quickStarterFormCompleted?: boolean
  workingTimeDirective?: string
  workingTimeDirectiveComplete?: boolean
  contractOfEmploymentSigned?: boolean
  photoTaken?: boolean
  photoFile?: string
  idCardIssued?: boolean
  equipmentIssued?: boolean
  uniformIssued?: boolean
  nextOfKinDetailsComplete?: boolean
  peopleHoursPin?: string
  fullRotasIssued?: Date | null
  inductionAndTrainingBooked?: Date | null
  location?: string
  trainer?: string
  userId?: string
  username?: string
  createdAt: Date
  createdBy?: string
  updatedAt?: Date | null
  updatedBy?: string
}

export interface EmployeeStatistics {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  newEmployeesThisMonth: number
  employeesByPosition: Record<string, number>
  employeesByRegion: Record<string, number>
}

class EmployeeService {
  /**
   * Register a new employee
   */
  async registerEmployee(data: EmployeeRegistrationRequest): Promise<EmployeeRegistrationResponse> {
    console.log('🚀 [EmployeeService] Starting employee registration...')
    console.log('📤 [EmployeeService] Request data:', JSON.stringify(data, null, 2))
    console.log('🌐 [EmployeeService] Endpoint:', EMPLOYEE_ENDPOINTS.REGISTER)
    
    try {
      console.log('📡 [EmployeeService] Making API request...')
      const response = await api.post<ApiResponse<EmployeeRegistrationResponse>>(
        EMPLOYEE_ENDPOINTS.REGISTER,
        data
      )
      console.log('✅ [EmployeeService] API response received:', response.data)
      console.log('📥 [EmployeeService] Response data:', response.data.data)
      return response.data.data
    } catch (error: unknown) {
      console.error('❌ [EmployeeService] Registration failed:', error)
      if (isAxiosError(error)) {
        console.error('❌ [EmployeeService] Axios error details:', {
          message: error.message,
          status: error.response?.status,
          responseData: error.response?.data,
        })
      }
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Register a new employee using frontend Employee interface
   */
  async registerEmployeeFromFrontend(employee: Partial<Employee>): Promise<EmployeeRegistrationResponse> {
    console.log('🚀 [EmployeeService] Starting employee registration from frontend data...')
    console.log('📤 [EmployeeService] Frontend data:', employee)
    
    // Check for required fields before mapping
    const requiredFields = ['employeeNumber', 'title', 'firstName', 'surname', 'startDate', 'position', 'employeeStatus', 'employmentType']
    const missingFields = requiredFields.filter(field => !employee[field as keyof Employee])
    
    if (missingFields.length > 0) {
      console.error('❌ [EmployeeService] Missing required fields:', missingFields)
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }
    
    const backendRequest = mapToBackendRequest(employee)
    console.log('🔄 [EmployeeService] Mapped to backend request:', backendRequest)
    
    return this.registerEmployee(backendRequest)
  }

  /**
   * Get all employees with optional filtering
   */
  async getEmployees(params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: 'active' | 'inactive'
    position?: string
    region?: string
  }): Promise<{ employees: EmployeeDetailResponse[]; total: number; page: number; pageSize: number }> {
    try {
      const response = await api.get<ApiResponse<{
        items: EmployeeDetailResponse[]
        totalCount: number
        pageNumber: number
        pageSize: number
      }>>(EMPLOYEE_ENDPOINTS.LIST, { params })
      
      // Transform backend PaginatedResponseDto to expected format
      return {
        employees: response.data.data.items,
        total: response.data.data.totalCount,
        page: response.data.data.pageNumber,
        pageSize: response.data.data.pageSize
      }
    } catch (error) {
      console.error('❌ [EmployeeService] Failed to fetch employees:', error)
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get all employees as frontend Employee interface
   */
  async getEmployeesAsFrontendInterface(params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: 'active' | 'inactive'
    position?: string
    region?: string
  }): Promise<{ employees: Employee[]; total: number; page: number; pageSize: number }> {
    const result = await this.getEmployees(params)
    return {
      employees: mapFromListResponseArray(result.employees),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /**
   * Get all active employees for assignment
   */
  async getActiveEmployees(): Promise<Employee[]> {
    try {
      const response = await api.get<ApiResponse<EmployeeDetailResponse[]>>(
        EMPLOYEE_ENDPOINTS.ACTIVE
      )
      return mapFromListResponseArray(response.data.data)
    } catch (error) {
      console.error('❌ [EmployeeService] Failed to fetch active employees:', error)
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number): Promise<EmployeeDetailResponse> {
    try {
      const response = await api.get<ApiResponse<EmployeeDetailResponse>>(
        EMPLOYEE_ENDPOINTS.DETAIL(id.toString())
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get employee by ID as frontend Employee interface
   */
  async getEmployeeByIdAsFrontendInterface(id: number): Promise<Employee> {
    const response = await this.getEmployeeById(id)
    return mapFromBackendResponse(response)
  }

  /**
   * Update employee
   */
  async updateEmployee(id: number, data: Partial<Employee>): Promise<EmployeeDetailResponse> {
    try {
      const updateRequest = mapToBackendUpdateRequest(data)
      console.log('🔄 [EmployeeService] Update request data:', updateRequest)
      
      const response = await api.put<ApiResponse<EmployeeDetailResponse>>(
        EMPLOYEE_ENDPOINTS.UPDATE(id.toString()),
        updateRequest
      )
      return response.data.data
    } catch (error) {
      console.error('❌ [EmployeeService] Update failed:', error)
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id: number): Promise<void> {
    try {
      await api.delete(EMPLOYEE_ENDPOINTS.DELETE(id.toString()))
    } catch (error) {
      console.error('❌ [EmployeeService] Delete failed:', error)
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStatistics(): Promise<EmployeeStatistics> {
    try {
      const response = await api.get<ApiResponse<EmployeeStatistics>>(
        EMPLOYEE_ENDPOINTS.STATISTICS
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Update employee photo (base64 data URL)
   */
  async updateEmployeePhoto(id: number, photoFile: string): Promise<EmployeeDetailResponse> {
    try {
      const response = await api.put<ApiResponse<EmployeeDetailResponse>>(
        `${EMPLOYEE_ENDPOINTS.DETAIL(id.toString())}/photo`,
        { photoFile }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get employees by customer assignment
   */
  async getEmployeesByCustomer(customerId: number): Promise<EmployeeDetailResponse[]> {
    try {
      const response = await api.get<ApiResponse<EmployeeDetailResponse[]>>(
        `${EMPLOYEE_ENDPOINTS.LIST}/by-customer/${customerId}`
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Assign employee to customer
   */
  async assignEmployeeToCustomer(employeeId: number, customerId: number): Promise<void> {
    try {
      await api.post(`${EMPLOYEE_ENDPOINTS.DETAIL(employeeId.toString())}/assign-customer`, {
        customerId
      })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Remove employee from customer assignment
   */
  async removeEmployeeFromCustomer(employeeId: number, customerId: number): Promise<void> {
    try {
      await api.delete(`${EMPLOYEE_ENDPOINTS.DETAIL(employeeId.toString())}/assign-customer/${customerId}`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const employeeService = new EmployeeService()
