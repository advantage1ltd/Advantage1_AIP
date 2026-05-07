import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, CreateUserInput, UpdateUserInput, UserRole } from '@/types/user'
import { userService } from '@/services/userService'

interface UsersState {
  users: User[]
  loading: boolean
  error: string | null
  userAssignments: Record<string, number[]>
  assignmentLoading: boolean
  assignmentError: string | null
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  userAssignments: {},
  assignmentLoading: false,
  assignmentError: null
}

// Normalize backend user detail (handles camelCase/PascalCase)
const mapUserDetailToUser = (detail: any): User => {
  const role = (detail.role ?? detail.Role) as UserRole
  const pageAccessRole = (detail.pageAccessRole ?? detail.PageAccessRole ?? role) as UserRole

  const assignedCustomerIds = detail.assignedCustomerIds ?? detail.AssignedCustomerIds
  const customerId = detail.customerId ?? detail.CustomerId
  const customerName = detail.customerName ?? detail.CustomerName
  const employeeId = detail.employeeId ?? detail.EmployeeId
  const employeeName = detail.employeeName ?? detail.EmployeeName
  const assignedCustomerNames = detail.assignedCustomerNames ?? detail.AssignedCustomerNames
  const phoneNumber = detail.phoneNumber ?? detail.PhoneNumber
  const emailConfirmed = detail.emailConfirmed ?? detail.EmailConfirmed ?? false
  const lastLoginAt = detail.lastLoginAt ?? detail.LastLoginAt

  const mappedUser = {
    id: detail.id ?? detail.Id,
    username: detail.username ?? detail.Username,
    firstName: detail.firstName ?? detail.FirstName ?? '',
    lastName: detail.lastName ?? detail.LastName ?? '',
    email: detail.email ?? detail.Email,
    role,
    pageAccessRole,
    signature: detail.signature ?? detail.Signature,
    signatureCode: detail.signatureCode ?? detail.SignatureCode,
    jobTitle: detail.jobTitle ?? detail.JobTitle,
    customerId: customerId != null ? customerId : undefined,
    customerName: customerName,
    recordIsDeleted: detail.recordIsDeleted ?? detail.RecordIsDeleted ?? false,
    createdAt: detail.createdAt ?? detail.CreatedAt ?? new Date().toISOString(),
    updatedAt: detail.updatedAt ?? detail.UpdatedAt ?? new Date().toISOString(),
    employeeId: employeeId != null ? employeeId : undefined,
    employeeName: employeeName,
    phoneNumber: phoneNumber,
    emailConfirmed: emailConfirmed,
    lastLoginAt: lastLoginAt,
    ...(assignedCustomerIds ? { assignedCustomerIds } : {}),
    ...(assignedCustomerNames ? { assignedCustomerNames } : {}),
  }
  
  return mappedUser as User
}

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params?: { page?: number; pageSize?: number; searchTerm?: string }) => {
    const response = await userService.getUsers(params)
    return response.data // Return the users array from the backend response
  }
)

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserInput) => {
    const response = await userService.createUser(userData)
    return response
  }
)

export const updateUserAsync = createAsyncThunk(
  'users/updateUser',
  async (userData: UpdateUserInput) => {
    const response = await userService.updateUser(userData as any)
    return response
  }
)

export const deleteUserAsync = createAsyncThunk(
  'users/deleteUser',
  async (userId: string) => {
    await userService.deleteUser(userId)
    return userId
  }
)

// Customer assignment verification thunks
export const fetchUserCustomerAssignments = createAsyncThunk(
  'users/fetchUserCustomerAssignments',
  async (userId: string) => {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`/api/CustomerAssignment/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch user customer assignments')
    }
    
    const customerIds = await response.json()
    return { userId, customerIds }
  }
)

export const checkUserHasCustomer = createAsyncThunk(
  'users/checkUserHasCustomer',
  async ({ userId, customerId }: { userId: string; customerId: number }) => {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`/api/CustomerAssignment/user/${userId}/has/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to check user customer assignment')
    }
    
    const hasCustomer = await response.json()
    return { userId, customerId, hasCustomer }
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        // Convert UserDetailResponse[] to User[] format
        state.users = action.payload.map((userDetail: any) => mapUserDetailToUser(userDetail))
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch users'
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false
        // Convert UserDetailResponse to User format
        const user: User = mapUserDetailToUser(action.payload as any)
        state.users.push(user)
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create user'
      })
      // Update user
      .addCase(updateUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        state.loading = false
        console.log('🔄 [usersSlice] updateUserAsync.fulfilled:', {
          userId: action.payload.id,
          customerId: action.payload.customerId,
          customerName: (action.payload as any).customerName,
          role: action.payload.role,
          fullPayload: action.payload
        })
        
        const index = state.users.findIndex(user => user.id === action.payload.id)
        console.log('🔄 [usersSlice] User index in store:', index)
        
        if (index !== -1) {
          // Convert UserDetailResponse to User format
          const user: User = mapUserDetailToUser(action.payload as any)
          console.log('🔄 [usersSlice] Mapped user:', {
            id: user.id,
            customerId: user.customerId,
            customerName: (user as any).customerName,
            role: user.role
          })
          const oldUser = state.users[index]
          state.users[index] = user
          console.log('✅ [usersSlice] User updated in store:', {
            oldCustomerId: oldUser.customerId,
            newCustomerId: user.customerId,
            oldCustomerName: (oldUser as any).customerName,
            newCustomerName: (user as any).customerName
          })
        } else {
          // If user not found in list, add it (shouldn't happen but handle gracefully)
          console.log('⚠️ [usersSlice] User not found in store, adding new user')
          const user: User = mapUserDetailToUser(action.payload as any)
          state.users.push(user)
        }
      })
      .addCase(updateUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update user'
      })
      // Delete user
      .addCase(deleteUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        state.loading = false
        state.users = state.users.filter(user => user.id !== action.payload)
      })
      .addCase(deleteUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete user'
      })
  },
})

export default usersSlice.reducer
