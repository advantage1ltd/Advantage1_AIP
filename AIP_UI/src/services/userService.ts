import { api } from '@/config/api'
import { User, CreateUserInput, UpdateUserInput, UsersResponse, CustomerUser, AdvantageOneUser, UserRole } from '@/types/user'

export interface CreateUserRequest {
  username: string
  email: string
  password?: string
  role: string
  firstName: string
  lastName: string
  pageAccessRole?: string
  employeeId?: number
  phoneNumber?: string
  customerId?: number // For Customer users - direct foreign key to Customer table
  jobTitle?: string
  signature?: string
  signatureCode?: string
  recordIsDeleted?: boolean
  assignedCustomerIds?: number[]
}

// Backend response interfaces
export interface BackendUserResponse {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  role: string
  pageAccessRole: string
  signature?: string
  signatureCode?: string
  jobTitle?: string
  customerId?: number
  customerName?: string // Company name for customer users
  recordIsDeleted: boolean
  isActive: boolean
  createdAt: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  lastLoginAt?: string
  phoneNumber?: string
  emailConfirmed: boolean
  employeeId?: number
  employeeName?: string
  assignedCustomerIds?: number[] | string // Can be array or JSON string
  assignedCustomerNames?: string[]
}

export interface BackendUserListResponse {
  users?: BackendUserResponse[]
  totalCount?: number
  page?: number
  pageSize?: number
}

export interface UsersQueryParams {
  page?: number
  pageSize?: number
  searchTerm?: string
  role?: string
  isActive?: boolean
  includeDeleted?: boolean
  assignedCustomerId?: number
  employeeId?: number
}

class UserService {
  private baseUrl = '/User'

  // Helper function to parse assignedCustomerIds
  private parseAssignedCustomerIds(customerIds: any): number[] {
    if (!customerIds) return [];
    if (Array.isArray(customerIds)) return customerIds;
    if (typeof customerIds === 'string') {
      try {
        const parsed = JSON.parse(customerIds);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing assignedCustomerIds:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Creates a new user account with optional employee linking
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      console.log('🔄 [UserService] Creating user:', userData)
      console.log('🔄 [UserService] CustomerId in request:', userData.customerId)
      const response = await api.post(`${this.baseUrl}/create`, userData)
      console.log('✅ [UserService] User created successfully:', response.data)
      
      // Transform backend response to frontend format
      const backendUser = response.data as BackendUserResponse
      return {
        id: backendUser.id,
        username: backendUser.username,
        firstName: backendUser.firstName,
        lastName: backendUser.lastName,
        email: backendUser.email,
        role: backendUser.role as UserRole,
        pageAccessRole: backendUser.pageAccessRole as UserRole,
        signature: backendUser.signature,
        signatureCode: backendUser.signatureCode,
        jobTitle: backendUser.jobTitle,
        customerId: backendUser.customerId,
        customerName: backendUser.customerName,
        recordIsDeleted: backendUser.recordIsDeleted,
        createdAt: backendUser.createdAt,
        updatedAt: backendUser.updatedAt || backendUser.createdAt,
        employeeId: backendUser.employeeId,
        employeeName: backendUser.employeeName,
        assignedCustomerIds: this.parseAssignedCustomerIds(backendUser.assignedCustomerIds),
        assignedCustomerNames: backendUser.assignedCustomerNames || [],
        phoneNumber: backendUser.phoneNumber,
        emailConfirmed: backendUser.emailConfirmed,
        lastLoginAt: backendUser.lastLoginAt
      } as User
    } catch (error) {
      console.error('❌ [UserService] Error creating user:', error)
      throw new Error('Failed to create user account')
    }
  }

  /**
   * Gets all users with pagination and optional filtering
   */
  async getUsers(params: UsersQueryParams = {}): Promise<UsersResponse> {
    try {
      console.log('🔄 [UserService] Fetching users with params:', params)
      const queryParams = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        ...(params.searchTerm ? { searchTerm: params.searchTerm } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(typeof params.isActive === 'boolean' ? { isActive: params.isActive } : {}),
        ...(typeof params.includeDeleted === 'boolean' ? { includeDeleted: params.includeDeleted } : {}),
        ...(typeof params.assignedCustomerId === 'number' ? { assignedCustomerId: params.assignedCustomerId } : {}),
        ...(typeof params.employeeId === 'number' ? { employeeId: params.employeeId } : {})
      }

      const response = await api.get(`${this.baseUrl}/list`, { params: queryParams })
      console.log('✅ [UserService] Raw backend response:', response.data)
      
      // Transform backend response to frontend format
      const backendResponse = response.data as BackendUserListResponse
      const backendUsers = Array.isArray(backendResponse.users) ? backendResponse.users : []
      console.log('✅ [UserService] Backend response users:', backendUsers)
      
      const transformedUsers = backendUsers.map(user => {
        // Backend returns roles in lowercase, use directly
        const normalizedRole = (user.role?.toLowerCase() || '') as UserRole;
        const isCustomerRole = normalizedRole === 'customersitemanager' || normalizedRole === 'customerhomanager';
        const normalizedPageAccessRole = (user.pageAccessRole?.toLowerCase() || normalizedRole) as UserRole;
        
        console.log('🔄 [UserService] getUsers - Transforming user:', {
          username: user.username,
          backendRole: user.role,
          normalizedRole,
          isCustomerRole,
          customerId: user.customerId,
          customerName: user.customerName
        });
        
        const baseUser = {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: normalizedRole,
          pageAccessRole: normalizedPageAccessRole,
          signature: user.signature,
          signatureCode: user.signatureCode,
          jobTitle: user.jobTitle,
          customerId: user.customerId,
          recordIsDeleted: user.recordIsDeleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt || user.createdAt,
          employeeId: user.employeeId,
          employeeName: user.employeeName,
          phoneNumber: user.phoneNumber,
          emailConfirmed: user.emailConfirmed,
          lastLoginAt: user.lastLoginAt
        };

        // Handle union type based on role
        if (isCustomerRole) {
          const customerUser = {
            ...baseUser,
            role: normalizedRole as 'customersitemanager' | 'customerhomanager',
            customerId: user.customerId ?? undefined, // Use actual customerId from backend
            customerName: user.customerName
          } as CustomerUser;
          console.log('✅ [UserService] Created CustomerUser:', {
            id: customerUser.id,
            customerId: customerUser.customerId,
            customerName: customerUser.customerName
          });
          return customerUser;
        } else {
          return {
            ...baseUser,
            role: normalizedRole as 'advantageoneofficer' | 'advantageonehoofficer' | 'administrator',
            assignedCustomerIds: this.parseAssignedCustomerIds(user.assignedCustomerIds),
            assignedCustomerNames: user.assignedCustomerNames || []
          } as AdvantageOneUser;
        }
      })
      
      console.log('✅ [UserService] Transformed users:', transformedUsers)
      const resolvedPageSize = backendResponse.pageSize ?? queryParams.pageSize ?? 10
      const resolvedTotalCount = backendResponse.totalCount ?? transformedUsers.length

      return {
        success: true,
        data: transformedUsers,
        pagination: {
          currentPage: backendResponse.page ?? queryParams.page ?? 1,
          totalPages: Math.ceil(resolvedTotalCount / Math.max(resolvedPageSize, 1)),
          pageSize: resolvedPageSize,
          totalCount: resolvedTotalCount
        }
      }
    } catch (error) {
      console.error('❌ [UserService] Error getting users:', error)
      throw new Error('Failed to get users')
    }
  }

  /**
   * Gets a specific user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      console.log('🔄 [UserService] Fetching user by ID:', userId)
      const response = await api.get(`${this.baseUrl}/${userId}`)
      console.log('✅ [UserService] User fetched successfully:', response.data)
      
      // Transform backend response to frontend format
      const backendUser = response.data as BackendUserResponse
      
      // Backend returns roles in lowercase, use directly
      const normalizedRole = (backendUser.role?.toLowerCase() || '') as UserRole;
      const normalizedPageAccessRole = (backendUser.pageAccessRole?.toLowerCase() || normalizedRole) as UserRole;
      
      console.log('🔄 [UserService] getUserById - Role normalization:', {
        backendRole: backendUser.role,
        normalizedRole,
        customerId: backendUser.customerId,
        customerName: backendUser.customerName
      });
      
      return {
        id: backendUser.id,
        username: backendUser.username,
        firstName: backendUser.firstName,
        lastName: backendUser.lastName,
        email: backendUser.email,
        role: normalizedRole,
        pageAccessRole: normalizedPageAccessRole,
        signature: backendUser.signature,
        signatureCode: backendUser.signatureCode,
        jobTitle: backendUser.jobTitle,
        customerId: backendUser.customerId,
        customerName: backendUser.customerName,
        recordIsDeleted: backendUser.recordIsDeleted,
        createdAt: backendUser.createdAt,
        updatedAt: backendUser.updatedAt || backendUser.createdAt,
        employeeId: backendUser.employeeId,
        employeeName: backendUser.employeeName,
        assignedCustomerIds: this.parseAssignedCustomerIds(backendUser.assignedCustomerIds),
        assignedCustomerNames: backendUser.assignedCustomerNames || [],
        phoneNumber: backendUser.phoneNumber,
        emailConfirmed: backendUser.emailConfirmed,
        lastLoginAt: backendUser.lastLoginAt
      } as User
    } catch (error) {
      console.error('❌ [UserService] Error getting user:', error)
      throw new Error('Failed to get user')
    }
  }

  /**
   * Updates a user account
   */
  async updateUser(userData: { id: string } & Partial<CreateUserRequest>): Promise<User> {
    try {
      console.log('🔄 [UserService] updateUser called with:', {
        id: userData.id,
        hasCustomerId: 'customerId' in userData,
        customerId: userData.customerId,
        customerIdType: typeof userData.customerId,
        role: userData.role,
        hasAssignedCustomerIds: 'assignedCustomerIds' in userData
      })
      
      const { id, ...updateData } = userData
      
      // Ensure assignedCustomerIds is included in the update data
      if ('assignedCustomerIds' in userData) {
        (updateData as any).assignedCustomerIds = userData.assignedCustomerIds
        console.log('🔄 [UserService] Added assignedCustomerIds:', (updateData as any).assignedCustomerIds)
      }
      
      // Always include customerId in update data (even if null/undefined)
      // This ensures the backend can properly handle customerId updates
      if ('customerId' in userData) {
        // Send null explicitly if customerId is undefined, to allow backend to process it
        (updateData as any).customerId = userData.customerId ?? null
        console.log('🔄 [UserService] Processed customerId:', {
          original: userData.customerId,
          processed: (updateData as any).customerId,
          type: typeof (updateData as any).customerId,
          isNull: (updateData as any).customerId === null,
          isUndefined: (updateData as any).customerId === undefined
        })
      } else {
        console.log('⚠️ [UserService] customerId not in userData, not including in update')
      }
      
      console.log('🔄 [UserService] Final updateData being sent:', JSON.stringify(updateData, null, 2))
      console.log('🔄 [UserService] Making PUT request to:', `${this.baseUrl}/${id}`)
      
      const response = await api.put(`${this.baseUrl}/${id}`, updateData)
      
      console.log('✅ [UserService] API response received:', {
        status: response.status,
        hasData: !!response.data,
        customerId: response.data?.customerId,
        customerName: response.data?.customerName,
        role: response.data?.role,
        fullResponse: response.data
      })
      
      // Transform backend response to frontend format
      const backendUser = response.data as BackendUserResponse
      
      // Backend returns roles in lowercase, use directly
      const normalizedRole = (backendUser.role?.toLowerCase() || '') as UserRole;
      const normalizedPageAccessRole = (backendUser.pageAccessRole?.toLowerCase() || normalizedRole) as UserRole;
      
      console.log('🔄 [UserService] updateUser - Role normalization:', {
        backendRole: backendUser.role,
        normalizedRole,
        customerId: backendUser.customerId,
        customerName: backendUser.customerName
      });
      
      return {
        id: backendUser.id,
        username: backendUser.username,
        firstName: backendUser.firstName,
        lastName: backendUser.lastName,
        email: backendUser.email,
        role: normalizedRole,
        pageAccessRole: normalizedPageAccessRole,
        signature: backendUser.signature,
        signatureCode: backendUser.signatureCode,
        jobTitle: backendUser.jobTitle,
        customerId: backendUser.customerId,
        customerName: backendUser.customerName,
        recordIsDeleted: backendUser.recordIsDeleted,
        createdAt: backendUser.createdAt,
        updatedAt: backendUser.updatedAt || backendUser.createdAt,
        employeeId: backendUser.employeeId,
        employeeName: backendUser.employeeName,
        assignedCustomerIds: this.parseAssignedCustomerIds(backendUser.assignedCustomerIds),
        assignedCustomerNames: backendUser.assignedCustomerNames || [],
        phoneNumber: backendUser.phoneNumber,
        emailConfirmed: backendUser.emailConfirmed,
        lastLoginAt: backendUser.lastLoginAt
      } as User
    } catch (error) {
      console.error('❌ [UserService] Error updating user:', error)
      throw new Error('Failed to update user')
    }
  }

  /**
   * Deletes a user account
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🔄 [UserService] Deleting user:', userId)
      await api.delete(`${this.baseUrl}/${userId}`)
      console.log('✅ [UserService] User deleted successfully')
    } catch (error) {
      console.error('❌ [UserService] Error deleting user:', error)
      throw new Error('Failed to delete user')
    }
  }

  /**
   * Resets a user's password
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/${userId}/reset-password`, {
        newPassword
      })
    } catch (error) {
      console.error('Error resetting password:', error)
      throw new Error('Failed to reset password')
    }
  }

  /**
   * Links an existing user to an employee
   */
  async linkToEmployee(userId: string, employeeId: number): Promise<User> {
    try {
      const response = await api.post(`${this.baseUrl}/${userId}/link-employee`, {
        employeeId
      })
      return response.data
    } catch (error) {
      console.error('Error linking user to employee:', error)
      throw new Error('Failed to link user to employee')
    }
  }

  /**
   * Unlinks a user from an employee
   */
  async unlinkFromEmployee(userId: string): Promise<User> {
    try {
      const response = await api.post(`${this.baseUrl}/${userId}/unlink-employee`)
      return response.data
    } catch (error) {
      console.error('Error unlinking user from employee:', error)
      throw new Error('Failed to unlink user from employee')
    }
  }

  /**
   * Gets users by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const response = await api.get(`${this.baseUrl}/by-role/${role}`)
      return response.data
    } catch (error) {
      console.error('Error getting users by role:', error)
      throw new Error('Failed to get users by role')
    }
  }

  /**
   * Gets unlinked employees (employees without user accounts)
   */
  async getUnlinkedEmployees(): Promise<any[]> {
    try {
      const response = await api.get(`${this.baseUrl}/unlinked-employees`)
      // Transform backend response to frontend format
      return response.data.map((employee: any) => ({
        id: employee.employeeId,
        firstName: employee.firstName,
        surname: employee.surname,
        employeeNumber: employee.employeeNumber,
        position: employee.position,
        email: employee.email,
        employeeStatus: employee.employeeStatus,
        userId: employee.userId
      }))
    } catch (error) {
      console.error('Error getting unlinked employees:', error)
      throw new Error('Failed to get unlinked employees')
    }
  }

  /**
   * Gets linked employees (employees with user accounts)
   */
  async getLinkedEmployees(): Promise<any[]> {
    try {
      const response = await api.get(`${this.baseUrl}/linked-employees`)
      return response.data
    } catch (error) {
      console.error('Error getting linked employees:', error)
      throw new Error('Failed to get linked employees')
    }
  }

  /**
   * Validates if a username is available
   */
  async validateUsername(username: string): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await api.get(`${this.baseUrl}/validate-username`, {
        params: { username }
      })
      return response.data
    } catch (error) {
      console.error('Error validating username:', error)
      throw new Error('Failed to validate username')
    }
  }

  /**
   * Validates if an email is available
   */
  async validateEmail(email: string): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await api.get(`${this.baseUrl}/validate-email`, {
        params: { email }
      })
      return response.data
    } catch (error) {
      console.error('Error validating email:', error)
      throw new Error('Failed to validate email')
    }
  }
}

export const userService = new UserService() 