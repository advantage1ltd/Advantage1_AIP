import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarIcon,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Eye,
  RefreshCw,
  Loader2,
  Filter,
  Scale
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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

// Services and Types
import { disciplinaryRecordService } from '@/services/disciplinaryRecordService'
import {
  type DisciplinaryRecord,
  type CreateDisciplinaryRecordDto,
  type UpdateDisciplinaryRecordDto,
  VIOLATION_TYPES,
  SEVERITY_LEVELS,
  ACTION_TYPES,
  STATUS_OPTIONS,
  SEVERITY_COLORS,
  STATUS_COLORS,
} from '@/types/disciplinaryRecord'
import { cn } from '@/lib/utils'

// Constants
const ITEMS_PER_PAGE = 10

// Form Schema
const formSchema = z.object({
  employeeId: z.number({ required_error: 'Officer is required' }),
  officerName: z.string().min(1, 'Officer name is required'),
  supervisorId: z.string().optional(),
  supervisorName: z.string().min(1, 'Supervisor name is required'),
  incidentDate: z.date({ required_error: 'Incident date is required' }),
  violationType: z.string().min(1, 'Violation type is required'),
  severity: z.string().min(1, 'Severity level is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  actionTaken: z.string().min(1, 'Action taken is required'),
  followUpDate: z.date().optional().nullable(),
  status: z.string().min(1, 'Status is required'),
  witnessStatements: z.string().optional(),
  evidenceRefs: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ========== Statistics Card Component ==========
interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  gradient: string
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient, subtitle }) => (
  <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", gradient)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
)

// ========== Main Component ==========
const DisciplinaryPage: React.FC = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DisciplinaryRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<DisciplinaryRecord | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: undefined,
      officerName: '',
      supervisorId: '',
      supervisorName: '',
      violationType: '',
      severity: '',
      description: '',
      actionTaken: '',
      status: 'Open',
      witnessStatements: '',
      evidenceRefs: '',
      notes: '',
    },
  })

  // Queries
  const { data: recordsData, isLoading: isLoadingRecords } = useQuery({
    queryKey: ['disciplinaryRecords', currentPage, searchQuery, statusFilter, severityFilter],
    queryFn: () => disciplinaryRecordService.getAll({
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
    }),
  })

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['disciplinaryRecords', 'stats'],
    queryFn: () => disciplinaryRecordService.getStats(),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['disciplinaryRecords', 'employees'],
    queryFn: () => disciplinaryRecordService.getEmployees(),
  })

  const { data: supervisors = [] } = useQuery({
    queryKey: ['disciplinaryRecords', 'supervisors'],
    queryFn: () => disciplinaryRecordService.getSupervisors(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateDisciplinaryRecordDto) => disciplinaryRecordService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryRecords'] })
      setIsFormDialogOpen(false)
      form.reset()
      toast({ title: 'Success', description: 'Disciplinary record created successfully.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create record.', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateDisciplinaryRecordDto) => disciplinaryRecordService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryRecords'] })
      setIsFormDialogOpen(false)
      setEditingRecord(null)
      form.reset()
      toast({ title: 'Success', description: 'Disciplinary record updated successfully.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update record.', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => disciplinaryRecordService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryRecords'] })
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
      toast({ title: 'Success', description: 'Disciplinary record deleted.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete record.', variant: 'destructive' })
    },
  })

  // Handlers
  const handleSubmit = useCallback((values: FormValues) => {
    const payload = {
      ...values,
      incidentDate: values.incidentDate.toISOString(),
      followUpDate: values.followUpDate?.toISOString(),
    }

    if (editingRecord) {
      updateMutation.mutate({
        ...payload,
        id: editingRecord.id,
      } as UpdateDisciplinaryRecordDto)
    } else {
      createMutation.mutate(payload as CreateDisciplinaryRecordDto)
    }
  }, [editingRecord, createMutation, updateMutation])

  const handleEdit = useCallback((record: DisciplinaryRecord) => {
    setEditingRecord(record)
    form.reset({
      employeeId: record.employeeId,
      officerName: record.officerName,
      supervisorId: record.supervisorId || '',
      supervisorName: record.supervisorName,
      incidentDate: new Date(record.incidentDate),
      violationType: record.violationType,
      severity: record.severity,
      description: record.description,
      actionTaken: record.actionTaken,
      followUpDate: record.followUpDate ? new Date(record.followUpDate) : null,
      status: record.status,
      witnessStatements: record.witnessStatements || '',
      evidenceRefs: record.evidenceRefs || '',
      notes: record.notes || '',
    })
    setIsFormDialogOpen(true)
  }, [form])

  const handleView = useCallback((record: DisciplinaryRecord) => {
    setViewingRecord(record)
    setIsViewDialogOpen(true)
  }, [])

  const handleDelete = useCallback((id: number) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }, [deletingId, deleteMutation])

  const handleCloseFormDialog = useCallback(() => {
    setIsFormDialogOpen(false)
    setEditingRecord(null)
    form.reset()
  }, [form])

  const handleEmployeeSelect = useCallback((employeeId: string) => {
    const employee = employees.find(e => e.id === parseInt(employeeId))
    if (employee) {
      form.setValue('employeeId', employee.id)
      form.setValue('officerName', employee.name)
    }
  }, [employees, form])

  const handleSupervisorSelect = useCallback((supervisorId: string) => {
    const supervisor = supervisors.find(s => s.id === supervisorId)
    if (supervisor) {
      form.setValue('supervisorId', supervisor.id)
      form.setValue('supervisorName', supervisor.name)
    }
  }, [supervisors, form])

  // Computed values
  const records = recordsData?.items || []
  const totalCount = recordsData?.totalCount || 0
  const totalPages = recordsData?.totalPages || 1
  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EFF4FF' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-screen-2xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                <Scale className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Disciplinary Records</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  Manage and track disciplinary actions for security officers
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsFormDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Record
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Records"
            value={stats?.totalRecords || 0}
            icon={<FileText className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Open Cases"
            value={stats?.openCases || 0}
            icon={<AlertTriangle className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Under Review"
            value={stats?.underReviewCases || 0}
            icon={<Clock className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <StatCard
            title="Critical Issues"
            value={stats?.criticalViolations || 0}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-red-500 to-red-600"
          />
        </div>

        {/* Main Content Card */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Search */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by officer, violation..."
                  className="pl-10 bg-gray-50 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[140px] bg-gray-50">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={severityFilter || 'all'} onValueChange={(v) => setSeverityFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[140px] bg-gray-50">
                    <AlertTriangle className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    {SEVERITY_LEVELS.map((severity) => (
                      <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['disciplinaryRecords'] })}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold">Officer</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Violation</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Date</TableHead>
                    <TableHead className="font-semibold">Severity</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Action</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingRecords ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                        <p className="mt-2 text-gray-500">Loading records...</p>
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">No disciplinary records found.</p>
                          <Button
                            onClick={() => setIsFormDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Record
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">{record.officerName}</TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                          {record.violationType}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(record.incidentDate), 'PP')}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('border', SEVERITY_COLORS[record.severity])}>
                            {record.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{record.actionTaken}</TableCell>
                        <TableCell>
                          <Badge className={cn('border', STATUS_COLORS[record.status])}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => handleView(record)}
                            >
                              <Eye className="h-6 w-6" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 hover:bg-amber-50 hover:text-amber-600"
                              onClick={() => handleEdit(record)}
                            >
                              <Pencil className="h-6 w-6" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-6 w-6" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 gap-4">
                <p className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={handleCloseFormDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                {editingRecord ? 'Edit Disciplinary Record' : 'Add New Disciplinary Record'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord
                  ? 'Update the disciplinary record details below.'
                  : 'Fill in the details to create a new disciplinary record.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Officer Select */}
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Officer *</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : undefined}
                          onValueChange={handleEmployeeSelect}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Select officer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.filter(emp => emp.id).map((emp) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name} ({emp.employeeNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Supervisor Select */}
                  <FormField
                    control={form.control}
                    name="supervisorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supervisor *</FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={handleSupervisorSelect}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Select supervisor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {supervisors.filter(sup => sup.id).map((sup) => (
                              <SelectItem key={sup.id} value={sup.id}>
                                {sup.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Incident Date */}
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Incident Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-gray-50",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PP") : "Pick a date"}
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

                  {/* Violation Type */}
                  <FormField
                    control={form.control}
                    name="violationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Violation Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Select violation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VIOLATION_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.label}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Severity */}
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEVERITY_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Action Taken */}
                  <FormField
                    control={form.control}
                    name="actionTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Taken *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACTION_TYPES.map((action) => (
                              <SelectItem key={action} value={action}>
                                {action}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Follow Up Date */}
                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Follow-up Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-gray-50",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PP") : "Pick a date"}
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
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the incident..."
                          className="bg-gray-50 min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Witness Statements */}
                <FormField
                  control={form.control}
                  name="witnessStatements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Statements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any witness statements or references..."
                          className="bg-gray-50 min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Evidence References */}
                <FormField
                  control={form.control}
                  name="evidenceRefs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evidence References</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Add reference numbers for any evidence..."
                          className="bg-gray-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseFormDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingRecord ? 'Update Record' : 'Create Record'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Disciplinary Record Details
              </DialogTitle>
            </DialogHeader>
            {viewingRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Officer</p>
                    <p className="text-base font-semibold">{viewingRecord.officerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Supervisor</p>
                    <p className="text-base font-semibold">{viewingRecord.supervisorName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Incident Date</p>
                    <p className="text-base">{format(new Date(viewingRecord.incidentDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Violation Type</p>
                    <p className="text-base">{viewingRecord.violationType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Severity</p>
                    <Badge className={cn('border', SEVERITY_COLORS[viewingRecord.severity])}>
                      {viewingRecord.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge className={cn('border', STATUS_COLORS[viewingRecord.status])}>
                      {viewingRecord.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Action Taken</p>
                    <p className="text-base">{viewingRecord.actionTaken}</p>
                  </div>
                  {viewingRecord.followUpDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Follow-up Date</p>
                      <p className="text-base">{format(new Date(viewingRecord.followUpDate), 'PPP')}</p>
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-base bg-gray-50 p-3 rounded-lg">{viewingRecord.description}</p>
                </div>
                {viewingRecord.witnessStatements && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Witness Statements</p>
                    <p className="text-base bg-gray-50 p-3 rounded-lg">{viewingRecord.witnessStatements}</p>
                  </div>
                )}
                {viewingRecord.evidenceRefs && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Evidence References</p>
                    <p className="text-base bg-gray-50 p-3 rounded-lg">{viewingRecord.evidenceRefs}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Disciplinary Record?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The record will be permanently removed from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default DisciplinaryPage
