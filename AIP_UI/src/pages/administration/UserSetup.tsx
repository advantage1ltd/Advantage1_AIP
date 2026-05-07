import React, { useState, useMemo, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { RootState } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Users, 
  UserCheck, 
  Shield, 
  UserX,
  Search,
  UserPlus,
  Building2,
  Eye,
  Settings,
  Lock,
  KeyRound,
  UserCog,
  Clock,
  FileText
} from 'lucide-react'
import { UserDialog } from '@/components/administration/UserDialog'
import { fetchUsers, createUser, updateUserAsync, deleteUserAsync } from '@/store/features/users/usersSlice'
import { CreateUserInput, UpdateUserInput, User, UserRole } from '@/types/user'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { userService } from '@/services/userService'
import { useAvailableCustomers, findCustomerById } from '@/hooks/useAvailableCustomers'

const UserSetup = () => {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'name' | 'email' | 'customer'>('all')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [viewUser, setViewUser] = useState<User | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const { availableCustomers } = useAvailableCustomers()
  
  // Create a mapping of customerId to customer name for quick lookup
  const customerNameMap = useMemo(() => {
    const map = new Map<number, string>()
    availableCustomers.forEach(customer => {
      map.set(customer.id, customer.name)
    })
    return map
  }, [availableCustomers])

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    
    console.log('🔍 [UserSetup] Authentication check:', { 
      hasToken: !!token,
      currentPath: window.location.pathname 
    })
    
    if (!token) {
      console.warn('⚠️ [UserSetup] No authentication found, redirecting to login')
      window.location.href = '/login'
      return
    }
    
    console.log('✅ [UserSetup] Authentication verified')
  }, [])

  // Get users and loading state from Redux store
  const { users, loading, error } = useAppSelector((state: RootState) => state.users)

  // Fetch users on mount and when pagination/search changes
  useEffect(() => {
    dispatch(fetchUsers({
      page: currentPage,
      pageSize,
      searchTerm: searchQuery || undefined
    }))
  }, [dispatch, currentPage, pageSize, searchQuery])

  // Use users directly since backend handles filtering and pagination
  const displayUsers = users

  // Pagination calculations (these will be updated when we get the full response)
  const totalUsers = users.length // This will be updated when we get pagination info
  const totalPages = Math.ceil(totalUsers / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleCreateUser = async (data: CreateUserInput) => {
    console.log('🔄 [UserSetup] Creating user started', { data })
    
    try {
      const result = await dispatch(createUser(data)).unwrap()
      console.log('✅ [UserSetup] User created successfully', { result })
      
      setShowUserDialog(false)
      toast({
        title: 'Success',
        description: 'New user has been created successfully.',
      })
    } catch (error) {
      console.error('❌ [UserSetup] User creation failed:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateUser = async (data: UpdateUserInput) => {
    console.log('🔄 [UserSetup] handleUpdateUser called with:', {
      id: data.id,
      customerId: (data as any).customerId,
      customerIdType: typeof (data as any).customerId,
      role: (data as any).role,
      fullData: data
    })
    
    try {
      console.log('🔄 [UserSetup] Dispatching updateUserAsync...')
      const result = await dispatch(updateUserAsync(data)).unwrap()
      console.log('✅ [UserSetup] updateUserAsync completed:', {
        id: result.id,
        customerId: result.customerId,
        customerName: (result as any).customerName,
        role: result.role,
        fullResult: result
      })
      
      // Refetch users to ensure we have the latest data including customerName
      console.log('🔄 [UserSetup] Refetching users list...')
      const refetchResult = await dispatch(fetchUsers({
        page: currentPage,
        pageSize,
        searchTerm: searchQuery || undefined
      })).unwrap()
      console.log('✅ [UserSetup] Users list refetched:', {
        count: refetchResult.length,
        updatedUser: refetchResult.find((u: any) => u.id === data.id)
      })
      
      setShowUserDialog(false)
      setSelectedUser(undefined)
      toast({
        title: 'Success',
        description: 'User has been updated successfully.',
      })
    } catch (error) {
      console.error('❌ [UserSetup] User update failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        dataThatFailed: data
      })
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        await dispatch(deleteUserAsync(selectedUser.id)).unwrap()
        setShowDeleteDialog(false)
        setSelectedUser(undefined)
        toast({
          title: 'Success',
          description: 'User has been deleted successfully.',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete user',
          variant: 'destructive',
        })
      }
    }
  }

  // Show error toast if API request fails
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    }
  }, [error, toast])

  const openEditDialog = async (user: User) => {
    try {
      const detail = await userService.getUserById(user.id)

      const role = ((detail as any).role ?? (detail as any).Role) as UserRole
      
      const base = {
        id: (detail as any).id ?? (detail as any).Id,
        username: (detail as any).username ?? (detail as any).Username,
        firstName: (detail as any).firstName ?? (detail as any).FirstName ?? '',
        lastName: (detail as any).lastName ?? (detail as any).LastName ?? '',
        email: (detail as any).email ?? (detail as any).Email,
        role,
        pageAccessRole: ((detail as any).pageAccessRole ?? (detail as any).PageAccessRole ?? role) as UserRole,
        signature: (detail as any).signature ?? (detail as any).Signature,
        signatureCode: (detail as any).signatureCode ?? (detail as any).SignatureCode,
        jobTitle: (detail as any).jobTitle ?? (detail as any).JobTitle,
        customerId: (detail as any).customerId ?? (detail as any).CustomerId,
        recordIsDeleted: (detail as any).recordIsDeleted ?? (detail as any).RecordIsDeleted ?? false,
        createdAt: (detail as any).createdAt ?? (detail as any).CreatedAt ?? new Date().toISOString(),
        updatedAt: (detail as any).updatedAt ?? (detail as any).UpdatedAt ?? new Date().toISOString(),
        employeeId: (detail as any).employeeId ?? (detail as any).EmployeeId,
        employeeName: (detail as any).employeeName ?? (detail as any).EmployeeName,
      }

      let normalized: User
      const normalizedRole = role?.toLowerCase() as UserRole
      if (normalizedRole === 'customersitemanager' || normalizedRole === 'customerhomanager') {
        // Properly handle customerId - preserve the value from backend
        const rawCustomerId = (detail as any).customerId ?? (detail as any).CustomerId ?? base.customerId
        const customerId = rawCustomerId != null && rawCustomerId !== undefined && rawCustomerId !== '' 
          ? Number(rawCustomerId) 
          : undefined
        // Only set customerId if it's a valid positive number
        normalized = { 
          ...(base as any), 
          role: normalizedRole, 
          customerId: customerId != null && !isNaN(customerId) && customerId > 0 ? customerId : undefined
        } as User
      } else {
        const assignedCustomerIds = ((detail as any).assignedCustomerIds ?? (detail as any).AssignedCustomerIds ?? []).map((id: any) => Number(id))
        normalized = { ...(base as any), role: normalizedRole, assignedCustomerIds } as User
      }

      setSelectedUser(normalized)
      setShowUserDialog(true)
    } catch (err) {
      console.error('Failed to load user details for edit', err)
    setSelectedUser(user)
    setShowUserDialog(true)
      toast({
        title: 'Warning',
        description: 'Could not load full user details. Some fields may be missing.',
      })
    }
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleViewUser = (user: User) => {
    setViewUser(user)
  }

  const handleCloseView = () => setViewUser(undefined)

  // Helper to format role for display (PascalCase)
  const formatRoleForDisplay = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      'administrator': 'Administrator',
      'advantageoneofficer': 'AdvantageOneOfficer',
      'advantageonehoofficer': 'AdvantageOneHOOfficer',
      'customersitemanager': 'CustomerSiteManager',
      'customerhomanager': 'CustomerHOManager'
    };
    return roleMap[role] || role;
  };

  const getStatusColor = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return 'bg-red-100 text-red-800'
      case 'advantageonehoofficer':
        return 'bg-purple-100 text-purple-800'
      case 'advantageoneofficer':
        return 'bg-green-100 text-green-800'
      case 'customersitemanager':
        return 'bg-orange-100 text-orange-800'
      case 'customerhomanager':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'advantageonehoofficer':
        return <UserCheck className="h-4 w-4 text-purple-600" />
      case 'advantageoneofficer':
        return <Users className="h-4 w-4 text-green-600" />
      case 'customersitemanager':
      case 'customerhomanager':
        return <Building2 className="h-4 w-4 text-orange-600" />
      default:
        return <UserX className="h-4 w-4 text-gray-600" />
    }
  }

  // Stats (using all filtered users, not paginated)
  const totalFilteredUsers = displayUsers.length
  const activeStatusList: UserRole[] = [
    'advantageoneofficer',
    'advantageonehoofficer',
    'administrator',
    'customersitemanager',
    'customerhomanager'
  ]
  const activeUsers = displayUsers.filter(u => activeStatusList.includes(u.role)).length
  const adminUsers = displayUsers.filter(u => u.role === 'administrator').length
  const adminPercent = totalFilteredUsers > 0 ? ((adminUsers / totalFilteredUsers) * 100).toFixed(1) : '0.0'
  const officerUsers = displayUsers.filter(u => u.role === 'advantageoneofficer').length

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#EFF4FF]">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 lg:py-8 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              User Management
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500">
              Manage your team members and their account permissions here
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex flex-none w-auto">
                <div className="relative flex-none w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-[200px] sm:w-[250px] h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-[100px] sm:w-[120px] ml-2 h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
            <Button onClick={() => setShowUserDialog(true)} className="w-[auto] sm:w-auto h-9 sm:h-10 text-sm sm:text-base">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-6 w-full">
            {/* Total Users */}
            <div className="rounded-xl width-[350px] overflow-hidden shadow bg-gradient-to-br from-blue-500 to-blue-700 flex items-stretch min-h-[80px] sm:min-h-[100px]">
              <div className="flex-1 flex flex-col justify-center px-3  sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
                <span className="text-white text-xs sm:text-sm md:text-base font-medium mb-1 leading-tight">Total Users</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-none">{totalFilteredUsers}</span>
                <span className="text-white/80 text-xs mt-1 leading-tight">{activeUsers} active</span>
              </div>
              <div className="flex items-center  pr-2 sm:pr-3 md:pr-6">
                <span className="bg-white/20 rounded-full p-1.5 sm:p-2 md:p-3 flex items-center justify-center">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 text-white/80" />
                </span>
              </div>
            </div>
            {/* Admin Users */}
            <div className="rounded-xl overflow-hidden shadow bg-gradient-to-br from-purple-500 to-purple-700 flex items-stretch min-h-[80px] sm:min-h-[100px]">
              <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
                <span className="text-white text-xs sm:text-sm md:text-base font-medium mb-1 leading-tight">Admin Users</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-none">{adminUsers}</span>
                <span className="text-white/80 text-xs mt-1 leading-tight">{adminPercent}% of total</span>
              </div>
              <div className="flex items-center pr-2 sm:pr-3 md:pr-6">
                <span className="bg-white/20 rounded-full p-1.5 sm:p-2 md:p-3 flex items-center justify-center">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 text-white/80" />
                </span>
              </div>
            </div>
            {/* Advantage One Officer Users */}
            <div className="rounded-xl overflow-hidden shadow bg-gradient-to-br from-green-500 to-green-700 flex items-stretch min-h-[80px] sm:min-h-[100px] sm:col-span-2 lg:col-span-1">
              <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
                <span className="text-white text-xs sm:text-sm md:text-base font-medium mb-1 leading-tight">Advantage One Officer Users</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-none">{officerUsers}</span>
                <span className="text-white/80 text-xs mt-1 leading-tight">Advantage One Officer</span>
              </div>
              <div className="flex items-center pr-2 sm:pr-3 md:pr-6">
                <span className="bg-white/20 rounded-full p-1.5 sm:p-2 md:p-3 flex items-center justify-center">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 text-white/80" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
          <div className="min-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Email</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Job Title</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Customer</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Officer Type</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Assigned Customers</TableHead>
                  <TableHead className="w-[120px] sm:w-[160px] text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((user) => (
                <TableRow key={user.id}>
                    <TableCell className="py-2 sm:py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                        {(user.firstName?.[0] || 'U')}{(user.lastName?.[0] || '')}
                      </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-xs sm:text-sm truncate">{user.firstName || 'Unknown'} {user.lastName || ''}</div>
                          <div className="text-xs text-gray-500 truncate">{user.username}</div>
                        </div>
                    </div>
                  </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-600">
                      {user.jobTitle || 'N/A'}
                    </div>
                  </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-600">
                      {user.customerId 
                        ? ((user as any).customerName || customerNameMap.get(user.customerId) || `Customer ID: ${user.customerId}`)
                        : 'N/A'}
                    </div>
                  </TableCell>
                    <TableCell className="py-2 sm:py-3">
                      <Badge className={`${getStatusColor(user.role)} flex items-center gap-1 sm:gap-1.5 text-xs`}>
                        <span className="hidden sm:inline">{getStatusIcon(user.role)}</span>
                        <span className="truncate">{formatRoleForDisplay(user.role)}</span>
                    </Badge>
                  </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{formatRoleForDisplay(user.role)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                        <span className="font-medium text-xs sm:text-sm">
                        {'assignedCustomerIds' in user ? user.assignedCustomerIds?.length || 0 : 0}
                      </span>
                      {('assignedCustomerNames' in user && user.assignedCustomerNames && user.assignedCustomerNames.length > 0) && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]" title={user.assignedCustomerNames.join(', ')}>
                          {user.assignedCustomerNames.join(', ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                    <TableCell className="py-2 sm:py-3">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-50">
                          <Pencil className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                      </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)} className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-50">
                          <Trash2 className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
                      </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleViewUser(user)} className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-green-50">
                          <Eye className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {totalFilteredUsers === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <UserX className="h-6 w-6 sm:h-8 sm:w-8" />
                        <div className="text-sm sm:text-base">No users found</div>
                        <div className="text-xs sm:text-sm">Try adjusting your search or filter</div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredUsers)} of {totalFilteredUsers} results
            </div>
            <Pagination>
              <PaginationContent className="flex-wrap">
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1)
                      }
                    }}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const shouldShow = 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  
                  if (!shouldShow && page !== 2 && page !== totalPages - 1) {
                    if (page === 2 && currentPage > 4) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 3) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                        }}
                        isActive={page === currentPage}
                        className="text-xs sm:text-sm"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1)
                      }
                    }}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* User Dialog */}
        <UserDialog
          open={showUserDialog}
          onOpenChange={(open) => {
            setShowUserDialog(open)
            if (!open) {
              setSelectedUser(null)
            }
          }}
          user={selectedUser}
          onSubmit={(data) => {
            if ('id' in data) {
              handleUpdateUser(data as UpdateUserInput)
            } else {
              handleCreateUser(data as CreateUserInput)
            }
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                and remove their data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteUser}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View User Dialog */}
        <Dialog open={!!viewUser} onOpenChange={handleCloseView}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>View User</DialogTitle>
              <DialogDescription>All user details (read-only)</DialogDescription>
            </DialogHeader>
            {viewUser && (
              <div className="space-y-6 mt-2">
                {/* Personal Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">First Name</div>
                      <div className="font-medium text-base">{viewUser.firstName || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Last Name</div>
                      <div className="font-medium text-base">{viewUser.lastName || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Username</div>
                      <div className="font-medium text-base">{viewUser.username}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Email</div>
                      <div className="font-medium text-base">{viewUser.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Job Title</div>
                      <div className="font-medium text-base">{viewUser.jobTitle || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Customer</div>
                      <div className="font-medium text-base">
                        {viewUser.customerId 
                          ? ((viewUser as any).customerName || customerNameMap.get(viewUser.customerId) || `Customer ID: ${viewUser.customerId}`)
                          : 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Role and Customer Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <UserCog className="h-5 w-5 text-primary" />
                      Role Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Role</div>
                      <div className="font-medium text-base">{formatRoleForDisplay(viewUser.role)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Page Access Role</div>
                      <div className="font-medium text-base">{formatRoleForDisplay(viewUser.pageAccessRole)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Created At</div>
                      <div className="font-medium text-base">{new Date(viewUser.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                      <div className="font-medium text-base">{new Date(viewUser.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Signature and Additional Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Signature & Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Signature</div>
                      <div className="font-medium text-base">{viewUser.signature || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Signature Code</div>
                      <div className="font-medium text-base">{viewUser.signatureCode || 'N/A'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Record Status</div>
                      <div className={`font-medium text-base flex items-center gap-2 ${viewUser.recordIsDeleted ? 'text-red-600' : 'text-green-600'}`}>
                        {viewUser.recordIsDeleted ? (
                          <>
                            <UserX className="h-4 w-4" />
                            Record is Deleted
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Record is Active
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default UserSetup
