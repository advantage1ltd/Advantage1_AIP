import React, { useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Icons
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarIcon,
  ShirtIcon,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react'

// Types and Services
import { uniformEquipmentService } from '@/services/uniformEquipmentService'
import {
  EQUIPMENT_TYPES,
  UNIFORM_SIZES,
  BOOT_SIZES,
  CONDITION_TYPES,
  REQUEST_STATUS_COLORS,
  CONDITION_COLORS,
  PRIORITY_COLORS,
  requiresSize,
  type UniformEquipmentRequest,
  type UniformEquipmentIssued,
  type CreateEquipmentRequestDto,
  type CreateIssuedEquipmentDto,
  type UpdateIssuedEquipmentDto,
  type ReviewEquipmentRequestDto,
  type OfficerDropdown
} from '@/types/uniformEquipment'

// Constants
const ITEMS_PER_PAGE = 10

// ========== Form Schemas ==========

const requestFormSchema = z.object({
  equipmentType: z.string().min(1, 'Equipment type is required'),
  size: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 items per request'),
  reason: z.string().optional(),
  priority: z.enum(['Normal', 'Urgent'])
}).refine((data) => {
  // Size is required only for certain equipment types
  if (requiresSize(data.equipmentType)) {
    return data.size && data.size.length > 0
  }
  return true
}, {
  message: 'Size is required for this equipment type',
  path: ['size']
})

const issuedFormSchema = z.object({
  equipmentType: z.string().min(1, 'Equipment type is required'),
  size: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  condition: z.enum(['New', 'Good', 'Fair', 'Poor']),
  dateIssued: z.date({ required_error: 'Date issued is required' }),
  dateReturned: z.date().optional().nullable(),
  notes: z.string().optional(),
  officerId: z.string().min(1, 'Officer is required'),
  officerName: z.string().min(1, 'Officer name is required')
})

const reviewFormSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  reviewNotes: z.string().optional()
})

type RequestFormValues = z.infer<typeof requestFormSchema>
type IssuedFormValues = z.infer<typeof issuedFormSchema>
type ReviewFormValues = z.infer<typeof reviewFormSchema>

// ========== Main Component ==========

const UniformEquipmentPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Determine user role
  const isAdmin = useMemo(() => {
    const role = user?.role?.toLowerCase() || ''
    return role === 'administrator' || role === 'advantageonehoofficer'
  }, [user])

  // State
  const [activeTab, setActiveTab] = useState(isAdmin ? 'issued' : 'my-requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Dialog states
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isIssuedDialogOpen, setIsIssuedDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  
  // Editing states
  const [editingIssued, setEditingIssued] = useState<UniformEquipmentIssued | null>(null)
  const [reviewingRequest, setReviewingRequest] = useState<UniformEquipmentRequest | null>(null)
  const [viewingRequest, setViewingRequest] = useState<UniformEquipmentRequest | null>(null)

  // ========== Forms ==========

  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      equipmentType: '',
      size: '',
      quantity: 1,
      reason: '',
      priority: 'Normal'
    }
  })

  // Watch equipment type to clear size when it changes to non-size equipment
  const watchedEquipmentType = requestForm.watch('equipmentType')
  React.useEffect(() => {
    if (watchedEquipmentType && !requiresSize(watchedEquipmentType)) {
      requestForm.setValue('size', 'N/A')
    } else if (watchedEquipmentType && requiresSize(watchedEquipmentType)) {
      const currentSize = requestForm.getValues('size')
      if (currentSize === 'N/A') {
        requestForm.setValue('size', '')
      }
    }
  }, [watchedEquipmentType, requestForm])

  const issuedForm = useForm<IssuedFormValues>({
    resolver: zodResolver(issuedFormSchema),
    defaultValues: {
      equipmentType: '',
      size: '',
      quantity: 1,
      condition: 'New',
      dateIssued: new Date(),
      notes: '',
      officerId: '',
      officerName: ''
    }
  })

  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      status: 'Approved',
      reviewNotes: ''
    }
  })

  // ========== Queries ==========

  // My Requests (for officers)
  const { data: myRequestsData, isLoading: isLoadingMyRequests } = useQuery({
    queryKey: ['uniformEquipment', 'myRequests', searchQuery, currentPage],
    queryFn: () => uniformEquipmentService.getMyRequests({
      search: searchQuery,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE
    }),
    enabled: !isAdmin || activeTab === 'my-requests'
  })

  // All Requests (for admin)
  const { data: allRequestsData, isLoading: isLoadingAllRequests } = useQuery({
    queryKey: ['uniformEquipment', 'allRequests', searchQuery, currentPage],
    queryFn: () => uniformEquipmentService.getAllRequests({
      search: searchQuery,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE
    }),
    enabled: isAdmin && activeTab === 'requests'
  })

  // My Issued Equipment (for officers)
  const { data: myIssuedData, isLoading: isLoadingMyIssued } = useQuery({
    queryKey: ['uniformEquipment', 'myIssued', searchQuery, currentPage],
    queryFn: () => uniformEquipmentService.getMyIssuedEquipment({
      search: searchQuery,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE
    }),
    enabled: !isAdmin || activeTab === 'my-equipment'
  })

  // All Issued Equipment (for admin)
  const { data: allIssuedData, isLoading: isLoadingAllIssued } = useQuery({
    queryKey: ['uniformEquipment', 'allIssued', searchQuery, currentPage],
    queryFn: () => uniformEquipmentService.getAllIssued({
      search: searchQuery,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE
    }),
    enabled: isAdmin && activeTab === 'issued'
  })

  // Employees list (for admin dropdown)
  const { data: employees = [] } = useQuery({
    queryKey: ['uniformEquipment', 'employees'],
    queryFn: () => uniformEquipmentService.getOfficers(),
    enabled: isAdmin
  })

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['uniformEquipment', 'stats', isAdmin],
    queryFn: () => isAdmin ? uniformEquipmentService.getStats() : uniformEquipmentService.getMyStats()
  })

  // ========== Mutations ==========

  const createRequestMutation = useMutation({
    mutationFn: (data: CreateEquipmentRequestDto) => uniformEquipmentService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniformEquipment'] })
      setIsRequestDialogOpen(false)
      requestForm.reset()
      toast({
        title: 'Request Submitted',
        description: 'Your equipment request has been submitted. You will be notified once it is reviewed.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit request',
        variant: 'destructive'
      })
    }
  })

  const cancelRequestMutation = useMutation({
    mutationFn: (id: number) => uniformEquipmentService.cancelRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniformEquipment'] })
      toast({
        title: 'Request Cancelled',
        description: 'Your equipment request has been cancelled.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel request',
        variant: 'destructive'
      })
    }
  })

  const reviewRequestMutation = useMutation({
    mutationFn: (data: ReviewEquipmentRequestDto) => uniformEquipmentService.reviewRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniformEquipment'] })
      setIsReviewDialogOpen(false)
      setReviewingRequest(null)
      reviewForm.reset()
      toast({
        title: 'Request Reviewed',
        description: 'The equipment request has been updated.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to review request',
        variant: 'destructive'
      })
    }
  })

  const createIssuedMutation = useMutation({
    mutationFn: (data: CreateIssuedEquipmentDto) => uniformEquipmentService.createIssued(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniformEquipment'] })
      setIsIssuedDialogOpen(false)
      setEditingIssued(null)
      issuedForm.reset()
      toast({
        title: 'Equipment Issued',
        description: 'Equipment record has been added successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add equipment record',
        variant: 'destructive'
      })
    }
  })

  const updateIssuedMutation = useMutation({
    mutationFn: (data: UpdateIssuedEquipmentDto) => uniformEquipmentService.updateIssued(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniformEquipment'] })
      setIsIssuedDialogOpen(false)
      setEditingIssued(null)
      issuedForm.reset()
      toast({
        title: 'Record Updated',
        description: 'Equipment record has been updated successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update record',
        variant: 'destructive'
      })
    }
  })

  const deleteIssuedMutation = useMutation({
    mutationFn: (id: number) => uniformEquipmentService.deleteIssued(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniformEquipment'] })
      toast({
        title: 'Record Deleted',
        description: 'Equipment record has been deleted.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete record',
        variant: 'destructive'
      })
    }
  })

  // ========== Handlers ==========

  const handleRequestSubmit = useCallback((values: RequestFormValues) => {
    createRequestMutation.mutate(values as CreateEquipmentRequestDto)
  }, [createRequestMutation])

  const handleIssuedSubmit = useCallback((values: IssuedFormValues) => {
    if (editingIssued) {
      updateIssuedMutation.mutate({
        id: editingIssued.id,
        ...values,
        dateIssued: values.dateIssued.toISOString(),
        dateReturned: values.dateReturned?.toISOString()
      } as UpdateIssuedEquipmentDto)
    } else {
      createIssuedMutation.mutate({
        ...values,
        dateIssued: values.dateIssued.toISOString()
      } as CreateIssuedEquipmentDto)
    }
  }, [editingIssued, createIssuedMutation, updateIssuedMutation])

  const handleReviewSubmit = useCallback((values: ReviewFormValues) => {
    if (!reviewingRequest) return
    reviewRequestMutation.mutate({
      id: reviewingRequest.id,
      status: values.status,
      reviewNotes: values.reviewNotes
    })
  }, [reviewingRequest, reviewRequestMutation])

  const handleEditIssued = useCallback((record: UniformEquipmentIssued) => {
    setEditingIssued(record)
    issuedForm.reset({
      equipmentType: record.equipmentType,
      size: record.size || '',
      quantity: record.quantity,
      condition: record.condition as 'New' | 'Good' | 'Fair' | 'Poor',
      dateIssued: new Date(record.dateIssued),
      dateReturned: record.dateReturned ? new Date(record.dateReturned) : undefined,
      notes: record.notes || '',
      officerId: record.officerId,
      officerName: record.officerName
    })
    setIsIssuedDialogOpen(true)
  }, [issuedForm])

  const handleDeleteIssued = useCallback((id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteIssuedMutation.mutate(id)
    }
  }, [deleteIssuedMutation])

  const handleReviewRequest = useCallback((request: UniformEquipmentRequest) => {
    setReviewingRequest(request)
    reviewForm.reset({ status: 'Approved', reviewNotes: '' })
    setIsReviewDialogOpen(true)
  }, [reviewForm])

  const handleViewRequest = useCallback((request: UniformEquipmentRequest) => {
    setViewingRequest(request)
    setIsViewDialogOpen(true)
  }, [])

  const handleCancelRequest = useCallback((id: number) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      cancelRequestMutation.mutate(id)
    }
  }, [cancelRequestMutation])

  const handleOfficerSelect = useCallback((employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (employee) {
      issuedForm.setValue('officerId', employee.id)
      issuedForm.setValue('officerName', employee.name)
    }
  }, [employees, issuedForm])

  const closeRequestDialog = useCallback(() => {
    setIsRequestDialogOpen(false)
    requestForm.reset()
  }, [requestForm])

  const closeIssuedDialog = useCallback(() => {
    setIsIssuedDialogOpen(false)
    setEditingIssued(null)
    issuedForm.reset()
  }, [issuedForm])

  // Get size options based on equipment type
  const getSizeOptions = (equipmentType: string) => {
    if (equipmentType.toLowerCase().includes('boot')) {
      return BOOT_SIZES
    }
    return UNIFORM_SIZES
  }

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ShirtIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Uniform & Equipment</h1>
                <p className="text-gray-500 text-sm">
                  {isAdmin ? 'Manage equipment requests and track issued items' : 'Request equipment and view your issued items'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsRequestDialogOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
            >
              <Send className="h-4 w-4" />
              Request Equipment
            </Button>
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingIssued(null)
                  issuedForm.reset()
                  setIsIssuedDialogOpen(true)
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Issue Equipment
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalIssued || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingRequests || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.approvedRequests || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.rejectedRequests || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="border-0 shadow-md bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white pb-0">
              <TabsList className="h-auto p-1 bg-gray-100 rounded-lg">
                {!isAdmin && (
                  <>
                    <TabsTrigger 
                      value="my-requests" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      My Requests
                    </TabsTrigger>
                    <TabsTrigger 
                      value="my-equipment" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      My Equipment
                    </TabsTrigger>
                  </>
                )}
                {isAdmin && (
                  <>
                    <TabsTrigger 
                      value="requests" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      All Requests
                      {(stats?.pendingRequests || 0) > 0 && (
                        <Badge className="ml-2 bg-amber-500 text-white">{stats?.pendingRequests}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="issued" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Issued Equipment
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10 bg-gray-50 border-gray-200"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['uniformEquipment'] })}
                >
                  <RefreshCw className="h-6 w-6" />
                </Button>
              </div>

              {/* My Requests Tab */}
              <TabsContent value="my-requests" className="mt-0">
                {isLoadingMyRequests ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : myRequestsData?.items.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Send className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Yet</h3>
                    <p className="text-gray-500 mb-4">You haven't submitted any equipment requests.</p>
                    <Button onClick={() => setIsRequestDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Submit Your First Request
                    </Button>
                  </div>
                ) : (
                  <RequestsTable
                    requests={myRequestsData?.items || []}
                    isAdmin={false}
                    onView={handleViewRequest}
                    onCancel={handleCancelRequest}
                  />
                )}
              </TabsContent>

              {/* My Equipment Tab */}
              <TabsContent value="my-equipment" className="mt-0">
                {isLoadingMyIssued ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : myIssuedData?.items.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Equipment Assigned</h3>
                    <p className="text-gray-500">You don't have any equipment assigned to you yet.</p>
                  </div>
                ) : (
                  <IssuedTable
                    items={myIssuedData?.items || []}
                    isAdmin={false}
                  />
                )}
              </TabsContent>

              {/* Admin: All Requests Tab */}
              <TabsContent value="requests" className="mt-0">
                {isLoadingAllRequests ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : allRequestsData?.items.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests</h3>
                    <p className="text-gray-500">There are no equipment requests at the moment.</p>
                  </div>
                ) : (
                  <RequestsTable
                    requests={allRequestsData?.items || []}
                    isAdmin={true}
                    onView={handleViewRequest}
                    onReview={handleReviewRequest}
                  />
                )}
              </TabsContent>

              {/* Admin: Issued Equipment Tab */}
              <TabsContent value="issued" className="mt-0">
                {isLoadingAllIssued ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : allIssuedData?.items.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Equipment Records</h3>
                    <p className="text-gray-500 mb-4">No equipment has been issued yet.</p>
                    <Button onClick={() => setIsIssuedDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Issue Equipment
                    </Button>
                  </div>
                ) : (
                  <IssuedTable
                    items={allIssuedData?.items || []}
                    isAdmin={true}
                    onEdit={handleEditIssued}
                    onDelete={handleDeleteIssued}
                  />
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Request Equipment Dialog */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-600" />
                Request Equipment
              </DialogTitle>
              <DialogDescription>
                Submit a request for uniform or equipment. Your request will be reviewed by the operations team.
              </DialogDescription>
            </DialogHeader>
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-4">
                <FormField
                  control={requestForm.control}
                  name="equipmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select equipment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EQUIPMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requiresSize(requestForm.watch('equipmentType')) && (
                  <FormField
                    control={requestForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getSizeOptions(requestForm.watch('equipmentType')).map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={requestForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={10} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={requestForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={requestForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Why do you need this equipment?"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeRequestDialog}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRequestMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Request
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Issue Equipment Dialog (Admin) */}
        <Dialog open={isIssuedDialogOpen} onOpenChange={setIsIssuedDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                {editingIssued ? 'Edit Equipment Record' : 'Issue Equipment'}
              </DialogTitle>
              <DialogDescription>
                {editingIssued ? 'Update the equipment record details.' : 'Record equipment issued to an officer.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...issuedForm}>
              <form onSubmit={issuedForm.handleSubmit(handleIssuedSubmit)} className="space-y-4">
                <FormField
                  control={issuedForm.control}
                  name="officerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <Select onValueChange={handleOfficerSelect} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              <span className="flex items-center gap-2">
                                <span>{employee.name}</span>
                                {employee.employeeNumber && (
                                  <span className="text-xs text-gray-500">({employee.employeeNumber})</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={issuedForm.control}
                  name="equipmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EQUIPMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requiresSize(issuedForm.watch('equipmentType')) && (
                  <FormField
                    control={issuedForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getSizeOptions(issuedForm.watch('equipmentType')).map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={issuedForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={issuedForm.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONDITION_TYPES.map((condition) => (
                              <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={issuedForm.control}
                    name="dateIssued"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date Issued</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {editingIssued && (
                    <FormField
                      control={issuedForm.control}
                      name="dateReturned"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date Returned</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : "Not returned"}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={issuedForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeIssuedDialog}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createIssuedMutation.isPending || updateIssuedMutation.isPending}
                  >
                    {(createIssuedMutation.isPending || updateIssuedMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {editingIssued ? 'Update Record' : 'Issue Equipment'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Review Request Dialog (Admin) */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Request</DialogTitle>
              <DialogDescription>
                Review and approve or reject this equipment request.
              </DialogDescription>
            </DialogHeader>
            {reviewingRequest && (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Requested by:</span>
                    <span className="text-sm font-medium">{reviewingRequest.requesterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Equipment:</span>
                    <span className="text-sm font-medium">{reviewingRequest.equipmentType}</span>
                  </div>
                  {requiresSize(reviewingRequest.equipmentType) && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Size:</span>
                      <span className="text-sm font-medium">{reviewingRequest.size}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Quantity:</span>
                    <span className="text-sm font-medium">{reviewingRequest.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Priority:</span>
                    <Badge className={PRIORITY_COLORS[reviewingRequest.priority]}>
                      {reviewingRequest.priority}
                    </Badge>
                  </div>
                  {reviewingRequest.reason && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-500">Reason:</span>
                      <p className="text-sm mt-1">{reviewingRequest.reason}</p>
                    </div>
                  )}
                </div>

                <Form {...reviewForm}>
                  <form onSubmit={reviewForm.handleSubmit(handleReviewSubmit)} className="space-y-4">
                    <FormField
                      control={reviewForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decision</FormLabel>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={field.value === 'Approved' ? 'default' : 'outline'}
                              className={field.value === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                              onClick={() => field.onChange('Approved')}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'Rejected' ? 'default' : 'outline'}
                              className={field.value === 'Rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                              onClick={() => field.onChange('Rejected')}
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reviewForm.control}
                      name="reviewNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any notes for this decision..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsReviewDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={reviewRequestMutation.isPending}
                      >
                        {reviewRequestMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                        Submit Review
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Request Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            {viewingRequest && (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge className={REQUEST_STATUS_COLORS[viewingRequest.status]}>
                      {viewingRequest.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Equipment:</span>
                    <span className="text-sm font-medium">{viewingRequest.equipmentType}</span>
                  </div>
                  {requiresSize(viewingRequest.equipmentType) && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Size:</span>
                      <span className="text-sm font-medium">{viewingRequest.size}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Quantity:</span>
                    <span className="text-sm font-medium">{viewingRequest.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Priority:</span>
                    <Badge className={PRIORITY_COLORS[viewingRequest.priority]}>
                      {viewingRequest.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Submitted:</span>
                    <span className="text-sm">{format(new Date(viewingRequest.createdAt), 'PPP')}</span>
                  </div>
                  {viewingRequest.reason && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-500">Reason:</span>
                      <p className="text-sm mt-1">{viewingRequest.reason}</p>
                    </div>
                  )}
                  {viewingRequest.reviewedByName && (
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Reviewed by:</span>
                        <span className="text-sm font-medium">{viewingRequest.reviewedByName}</span>
                      </div>
                      {viewingRequest.reviewedAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Reviewed on:</span>
                          <span className="text-sm">{format(new Date(viewingRequest.reviewedAt), 'PPP')}</span>
                        </div>
                      )}
                      {viewingRequest.reviewNotes && (
                        <div>
                          <span className="text-sm text-gray-500">Notes:</span>
                          <p className="text-sm mt-1">{viewingRequest.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// ========== Sub Components ==========

interface RequestsTableProps {
  requests: UniformEquipmentRequest[]
  isAdmin: boolean
  onView: (request: UniformEquipmentRequest) => void
  onReview?: (request: UniformEquipmentRequest) => void
  onCancel?: (id: number) => void
}

const RequestsTable: React.FC<RequestsTableProps> = ({ 
  requests, 
  isAdmin, 
  onView, 
  onReview, 
  onCancel 
}) => (
  <div className="border rounded-lg overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          {isAdmin && <TableHead>Requested By</TableHead>}
          <TableHead>Equipment</TableHead>
          <TableHead className="hidden sm:table-cell">Size</TableHead>
          <TableHead className="hidden sm:table-cell">Qty</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id} className="hover:bg-gray-50">
            {isAdmin && (
              <TableCell className="font-medium">{request.requesterName}</TableCell>
            )}
            <TableCell>{request.equipmentType}</TableCell>
            <TableCell className="hidden sm:table-cell">{request.size}</TableCell>
            <TableCell className="hidden sm:table-cell">{request.quantity}</TableCell>
            <TableCell>
              <Badge className={PRIORITY_COLORS[request.priority]}>{request.priority}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={REQUEST_STATUS_COLORS[request.status]}>{request.status}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {format(new Date(request.createdAt), 'PP')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => onView(request)}>
                  <Eye className="h-6 w-6" />
                </Button>
                {isAdmin && request.status === 'Pending' && onReview && (
                  <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => onReview(request)}>
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </Button>
                )}
                {!isAdmin && request.status === 'Pending' && onCancel && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-11 w-11 text-red-600 hover:text-red-700"
                    onClick={() => onCancel(request.id)}
                  >
                    <XCircle className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)

interface IssuedTableProps {
  items: UniformEquipmentIssued[]
  isAdmin: boolean
  onEdit?: (item: UniformEquipmentIssued) => void
  onDelete?: (id: number) => void
}

const IssuedTable: React.FC<IssuedTableProps> = ({ items, isAdmin, onEdit, onDelete }) => (
  <div className="border rounded-lg overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          {isAdmin && <TableHead>Officer</TableHead>}
          <TableHead>Equipment</TableHead>
          <TableHead className="hidden sm:table-cell">Size</TableHead>
          <TableHead className="hidden sm:table-cell">Qty</TableHead>
          <TableHead>Condition</TableHead>
          <TableHead className="hidden md:table-cell">Date Issued</TableHead>
          {isAdmin && <TableHead className="hidden lg:table-cell">Issued By</TableHead>}
          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="hover:bg-gray-50">
            {isAdmin && (
              <TableCell className="font-medium">{item.officerName}</TableCell>
            )}
            <TableCell>{item.equipmentType}</TableCell>
            <TableCell className="hidden sm:table-cell">{item.size || '-'}</TableCell>
            <TableCell className="hidden sm:table-cell">{item.quantity}</TableCell>
            <TableCell>
              <Badge className={CONDITION_COLORS[item.condition]}>{item.condition}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {format(new Date(item.dateIssued), 'PP')}
            </TableCell>
            {isAdmin && (
              <TableCell className="hidden lg:table-cell">{item.issuedByName}</TableCell>
            )}
            {isAdmin && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => onEdit(item)}>
                      <Pencil className="h-6 w-6" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-11 w-11 text-red-600 hover:text-red-700"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)

export default UniformEquipmentPage
