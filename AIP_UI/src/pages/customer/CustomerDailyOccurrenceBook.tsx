import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
// NOTE: We intentionally use inline action buttons in tables
// because dropdown menus can be clipped inside overflow containers.
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, BookOpen, Plus, Search, Calendar, Clock, User, MapPin, Eye, Edit, Trash2, SlidersHorizontal, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { findCustomerById } from "@/hooks/useAvailableCustomers"
import { useToast } from "@/hooks/use-toast"
import { siteService } from "@/services/siteService"
import { getAuthHeaders } from "@/services/auth"
import { BASE_API_URL } from "@/config/api"
import type { 
  DailyOccurrenceEntry,
  DailyOccurrenceBookFilters,
  DailyOccurrenceBookStats,
  CreateOccurrenceRequest,
  UpdateOccurrenceRequest,
  DailyOccurrenceCode
} from "@/types/dailyOccurrenceBook"

const DOB_CODES: { value: DailyOccurrenceCode; label: string; description: string }[] = [
  { value: 'A', label: 'Arrest', description: 'Arrest' },
  { value: 'B', label: 'Deter', description: 'Deter' },
  { value: 'C', label: 'Theft', description: 'Theft' },
  { value: 'D', label: 'Violent Behaviour', description: 'Violent Behaviour' },
  { value: 'E', label: 'Abusive Behaviour', description: 'Abusive Behaviour' },
  { value: 'F', label: 'Ban from Store', description: 'Ban from Store' },
  { value: 'G', label: 'Criminal Damage', description: 'Criminal Damage' },
  { value: 'H', label: 'Underage Purchase', description: 'Underage Purchase' },
  { value: 'J', label: 'Credit Card Fraud', description: 'Credit Card Fraud' },
  { value: 'K', label: 'Anti-Social Behaviour', description: 'Anti-Social Behaviour' },
  { value: 'L', label: 'Suspicious Behaviour', description: 'Suspicious Behaviour' },
  { value: 'M', label: 'Other', description: 'Other' }
]

type OccurrenceFormState = Partial<CreateOccurrenceRequest> & { id?: string }

const getCodeMeta = (code?: string) => DOB_CODES.find((c) => c.value === code)?.label ?? code ?? 'Unknown'

const ALL_SITES_OPTION = 'all-sites'

const getDefaultFormState = (): OccurrenceFormState => ({
	date: new Date().toISOString().split('T')[0],
	time: new Date().toTimeString().slice(0, 5),
	code: 'A' as DailyOccurrenceCode,
	storeName: '',
	storeNumber: '',
	officerName: '',
	details: '',
	signature: ''
})

export default function CustomerDailyOccurrenceBook() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  // State management
  const [occurrences, setOccurrences] = useState<DailyOccurrenceEntry[]>([])
  const [stats, setStats] = useState<DailyOccurrenceBookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL_SITES_OPTION)
  const [selectedSiteName, setSelectedSiteName] = useState<string | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const selectedSite = useMemo(() => {
    if (!selectedSiteId || selectedSiteId === ALL_SITES_OPTION) return null
    return sites.find((site) => String(site.siteID ?? site.id ?? '') === selectedSiteId) ?? null
  }, [sites, selectedSiteId])
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedOccurrence, setSelectedOccurrence] = useState<DailyOccurrenceEntry | null>(null)
  
  // Filter states
  const [filters, setFilters] = useState<DailyOccurrenceBookFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const hasActiveFilters = Boolean(
    searchTerm ||
    filters.dateFrom ||
    filters.dateTo
  )
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm) count += 1
    if (filters.dateFrom) count += 1
    if (filters.dateTo) count += 1
    return count
  }, [filters, searchTerm])
  
  // Form state for creating/editing occurrences
  const [formData, setFormData] = useState<OccurrenceFormState>(getDefaultFormState())

  const siteOptions = useMemo(() => {
    const baseOptions = sites
      .map((site) => {
        const derivedId = String(site.siteID ?? site.id ?? '')
        const storeNumberRaw = site.sinNumber ?? site.storeNumber ?? site.siteID ?? derivedId
        return {
          id: derivedId,
          name: site.locationName ?? `Site ${derivedId}`,
          storeNumber: storeNumberRaw ? String(storeNumberRaw) : ''
        }
      })
      .filter((option) => option.id.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    if (formData.siteId && !baseOptions.some((option) => option.id === formData.siteId)) {
      baseOptions.unshift({
        id: formData.siteId,
        name: formData.storeName ? `${formData.storeName} (legacy)` : `Site ${formData.siteId}`,
        storeNumber: formData.storeNumber ?? ''
      })
    }

    return baseOptions
  }, [sites, formData.siteId, formData.storeName, formData.storeNumber])

  useEffect(() => {
    if (!selectedSite || editDialogOpen) return
    const derivedId = String(selectedSite.siteID ?? selectedSite.id ?? '')
    setSelectedSiteName(selectedSite.locationName ?? null)
    setFormData((prev) => ({
      ...prev,
      siteId: prev?.siteId ?? derivedId,
      storeName: prev?.storeName && prev.storeName.length > 0 ? prev.storeName : selectedSite.locationName ?? '',
      storeNumber: prev?.storeNumber && prev.storeNumber.length > 0
        ? prev.storeNumber
        : String(selectedSite.sinNumber ?? selectedSite.storeNumber ?? selectedSite.siteID ?? '')
    }))
  }, [selectedSite, editDialogOpen])

  const handleSiteSelection = (siteId: string) => {
    const site = sites.find((s) => String(s.siteID ?? s.id ?? '') === siteId)
    setFormData((prev) => ({
      ...prev,
      siteId,
      storeName: site?.locationName ?? prev.storeName ?? '',
      storeNumber: site
        ? String(site.sinNumber ?? site.storeNumber ?? site.siteID ?? '')
        : prev.storeNumber ?? ''
    }))
  }

  // Fetch site name
  const fetchSiteName = async (customerId: number, siteId: string) => {
    try {
      const response = await siteService.getSitesByCustomer(customerId)
      if (response.success && response.data) {
        const site = response.data.find((s) => String(s.siteID) === siteId)
        if (site) {
          setSelectedSiteName(site.locationName)
          console.log('CustomerDailyOccurrenceBook: Found site name:', site.locationName)
        }
      }
    } catch (error) {
      console.error('Failed to fetch site name:', error)
    }
  }

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        if (authLoading || !user) return

        const urlCustomerId = searchParams.get('customerId')
        const urlSiteId = searchParams.get('siteId')
        const userCustomerId = user && ('customerId' in user) ? (user as any).customerId : undefined

        // Determine target customer ID
        const targetCustomerId = urlCustomerId ? parseInt(urlCustomerId) : userCustomerId

        console.log('CustomerDailyOccurrenceBook: URL customerId:', urlCustomerId)
        console.log('CustomerDailyOccurrenceBook: URL siteId:', urlSiteId)
        console.log('CustomerDailyOccurrenceBook: User customerId:', userCustomerId)
        console.log('CustomerDailyOccurrenceBook: Target customerId:', targetCustomerId)

        if (!targetCustomerId) {
          setError('No customer ID provided')
          setLoading(false)
          return
        }

        // Find customer in available customers
        const customerData = await findCustomerById(targetCustomerId)
        if (!customerData) {
          setError('Customer not found or access denied')
          setLoading(false)
          return
        }

        console.log('CustomerDailyOccurrenceBook: Found customer:', customerData)

        // Verify access
        if (user && user.role === 'advantageoneofficer' && 'assignedCustomerIds' in user && (user as any).assignedCustomerIds && !(user as any).assignedCustomerIds.includes(targetCustomerId)) {
          setError('Access denied: You are not assigned to this customer')
          setLoading(false)
          return
        }

        console.log('CustomerDailyOccurrenceBook: Access granted - setting customer')
        setCustomer({ id: targetCustomerId, name: customerData.name })
        
        if (urlSiteId) {
          setSelectedSiteId(urlSiteId)
          await fetchSiteName(targetCustomerId, urlSiteId)
        } else {
          setSelectedSiteId(ALL_SITES_OPTION)
        }

      } catch (err) {
        console.error('CustomerDailyOccurrenceBook: Error loading customer:', err)
        setError('Failed to load customer data')
      } finally {
        setLoading(false)
      }
    }

    loadCustomer()
  }, [user, authLoading, searchParams])

  // Fetch sites for the customer
  useEffect(() => {
    const fetchSites = async () => {
      if (!customer) return

      try {
        const response = await siteService.getSitesByCustomer(customer.id)
        if (response.success && response.data) {
          setSites(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch sites:', error)
      }
    }

    fetchSites()
  }, [customer])

  useEffect(() => {
    if (selectedSiteId === ALL_SITES_OPTION) {
      setSelectedSiteName(null)
    }
  }, [selectedSiteId])

  // Fetch occurrences data
  const fetchOccurrences = async () => {
    if (!customer) return

    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        customerId: customer.id.toString(),
        ...(selectedSiteId && selectedSiteId !== ALL_SITES_OPTION && { siteId: selectedSiteId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(searchTerm && { search: searchTerm })
      })

      const url = `${BASE_API_URL}/customers/${customer.id}/daily-occurrence-book?${queryParams}`
      const headers = getAuthHeaders()
      const authHeaders = headers as Record<string, string>
      
      console.log('Fetching occurrences:', { url, hasAuth: !!authHeaders.Authorization })
      
      const response = await fetch(url, {
        headers: headers
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          body: errorText.substring(0, 500)
        })
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Expected JSON but got:', {
          contentType: contentType,
          url: url,
          preview: text.substring(0, 500)
        })
        throw new Error('Server returned non-JSON response. Check if the API endpoint exists.')
      }
      
      const result = await response.json()

      if (result.success) {
        setOccurrences(result.data)
        setStats(result.stats)
      } else {
        throw new Error(result.message || 'Failed to fetch occurrence data')
      }
    } catch (error) {
      console.error('Error fetching occurrences:', error)
      setError('Failed to load occurrence data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOccurrences()
  }, [customer, selectedSiteId, filters, searchTerm])

  // Handle form submission for creating/updating occurrences
  const handleSubmit = async (isEdit = false) => {
    if (!customer) {
      toast({
        title: 'Error',
        description: 'Customer must be selected',
        variant: 'destructive'
      })
      return
    }

    const resolvedSiteId = formData.siteId ?? selectedSiteId

    if (!resolvedSiteId) {
      toast({
        title: 'Missing site',
        description: 'Please select a site for this occurrence',
        variant: 'destructive'
      })
      return
    }

    if (!formData.storeName || !formData.storeNumber || !formData.officerName || !formData.code || !formData.details || !formData.signature) {
      toast({
        title: 'Missing information',
        description: 'Store details, officer name, code, details, and signature are required.',
        variant: 'destructive'
      })
      return
    }

    try {
      const { dateCommenced, ...restFormData } = formData as OccurrenceFormState & { dateCommenced?: string }

      const requestData = {
        ...restFormData,
        customerId: customer.id,
        siteId: resolvedSiteId,
        ...(isEdit && selectedOccurrence && { id: selectedOccurrence.id })
      }

      const url = isEdit 
        ? `${BASE_API_URL}/customers/${customer.id}/daily-occurrence-book/${selectedOccurrence?.id}`
        : `${BASE_API_URL}/customers/${customer.id}/daily-occurrence-book`
      
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: isEdit ? "Occurrence Updated" : "Occurrence Created",
          description: result.message || `Occurrence has been ${isEdit ? 'updated' : 'created'} successfully`,
          variant: "default"
        })
        
        setCreateDialogOpen(false)
        setEditDialogOpen(false)
        setFormData(getDefaultFormState())
        setSelectedOccurrence(null)
        
        await fetchOccurrences()
      } else {
        throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'create'} occurrence`)
      }
    } catch (error) {
      console.error('Error submitting occurrence:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} occurrence`,
        variant: "destructive"
      })
    }
  }

  // Handle occurrence deletion
  const handleDelete = async (occurrence: DailyOccurrenceEntry) => {
    if (!customer) return

    try {
      const response = await fetch(`${BASE_API_URL}/customers/${customer.id}/daily-occurrence-book/${occurrence.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Occurrence Deleted",
          description: "Occurrence has been deleted successfully",
          variant: "default"
        })
        
        await fetchOccurrences()
      } else {
        throw new Error(result.message || 'Failed to delete occurrence')
      }
    } catch (error) {
      console.error('Error deleting occurrence:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete occurrence",
        variant: "destructive"
      })
    }
  }

  const renderOccurrenceForm = (prefix: string) => (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-store-name`}>Store</Label>
          <Select
            value={formData.siteId ?? ''}
            onValueChange={handleSiteSelection}
            disabled={siteOptions.length === 0}
          >
            <SelectTrigger id={`${prefix}-store-name`}>
              <SelectValue placeholder={siteOptions.length ? 'Select a site' : 'No sites available'} />
            </SelectTrigger>
            <SelectContent>
              {siteOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.storeName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Selected: {formData.storeName}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`${prefix}-store-number`}>Store Number</Label>
          <Input
            id={`${prefix}-store-number`}
            value={formData.storeNumber ?? ''}
            onChange={(event) => setFormData({ ...formData, storeNumber: event.target.value })}
            placeholder="Store number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-date`}>Date</Label>
          <Input
            id={`${prefix}-date`}
            type="date"
            value={formData.date}
            onChange={(event) => setFormData({ ...formData, date: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-time`}>Time</Label>
          <Input
            id={`${prefix}-time`}
            type="time"
            value={formData.time}
            onChange={(event) => setFormData({ ...formData, time: event.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${prefix}-officer`}>Officer Name</Label>
        <Input
          id={`${prefix}-officer`}
          value={formData.officerName ?? ''}
          onChange={(event) => setFormData({ ...formData, officerName: event.target.value })}
          placeholder="Officer full name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-code`}>Incident Code</Label>
          <Select
            value={formData.code ?? 'A'}
            onValueChange={(value) => setFormData({ ...formData, code: value as DailyOccurrenceCode })}
          >
            <SelectTrigger id={`${prefix}-code`}>
              <SelectValue placeholder="Select code" />
            </SelectTrigger>
            <SelectContent>
              {DOB_CODES.map((code) => (
                <SelectItem key={code.value} value={code.value}>
                  {code.value} — {code.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${prefix}-signature`}>Signature</Label>
          <Input
            id={`${prefix}-signature`}
            value={formData.signature ?? ''}
            onChange={(event) => setFormData({ ...formData, signature: event.target.value })}
            placeholder="Officer signature"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-crime-date`}>Crime Report Sent to HO (Date)</Label>
          <Input
            id={`${prefix}-crime-date`}
            type="date"
            value={formData.crimeReportCompletedDate ?? ''}
            onChange={(event) =>
              setFormData({ ...formData, crimeReportCompletedDate: event.target.value || undefined })
            }
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-crime-time`}>Crime Report Sent to HO (Time)</Label>
          <Input
            id={`${prefix}-crime-time`}
            type="time"
            value={formData.crimeReportCompletedTime ?? ''}
            onChange={(event) =>
              setFormData({ ...formData, crimeReportCompletedTime: event.target.value || undefined })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${prefix}-details`}>Details</Label>
        <Textarea
          id={`${prefix}-details`}
          value={formData.details ?? ''}
          onChange={(event) => setFormData({ ...formData, details: event.target.value })}
          placeholder="Detailed description of the occurrence"
          rows={5}
        />
      </div>
    </div>
  )

  const renderFiltersPanel = (options?: { includeSearch?: boolean }) => {
    const includeSearch = options?.includeSearch ?? true

    return (
      <div className="space-y-4">
        {includeSearch && (
          <>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search occurrences..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator />
          </>
        )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date-from" className="text-xs uppercase tracking-wide text-muted-foreground">Date from</Label>
          <Input
            id="date-from"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value || undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-to" className="text-xs uppercase tracking-wide text-muted-foreground">Date to</Label>
          <Input
            id="date-to"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => setFilters({ ...filters, dateTo: event.target.value || undefined })}
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Active filters: <span className="font-medium text-foreground">{activeFilterCount}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFilters({})
              setSearchTerm('')
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      </div>
    )
  }

  if (loading && !customer) {
    return (
      <div className="min-h-screen bg-[#EFF4FF] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border border-border/40 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Loading Daily Occurrence Book…</p>
                <p className="text-sm text-muted-foreground">Fetching customer and entries.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-[#EFF4FF] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border border-border/40 shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="space-y-1">
              <p className="font-semibold text-destructive">Unable to load Daily Occurrence Book</p>
              <p className="text-sm text-muted-foreground">{error || 'Customer not found'}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/management/customer-reporting')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customer Reporting
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-3 bg-[#EFF4FF]/80 backdrop-blur supports-[backdrop-filter]:bg-[#EFF4FF]/60 border-b border-border/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/management/customer-reporting')}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate">
                      Daily Occurrence Book
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {customer.name}
                      {selectedSiteId === ALL_SITES_OPTION
                        ? ' • All Sites'
                        : selectedSiteName
                          ? ` • ${selectedSiteName}`
                          : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {/* Mobile filters */}
              <div className="sm:hidden">
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                      </span>
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="bg-muted text-foreground">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      {renderFiltersPanel()}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <Button
                onClick={() => setCreateDialogOpen(true)}
                disabled={!selectedSiteId || selectedSiteId === ALL_SITES_OPTION}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add occurrence
              </Button>
            </div>
          </div>
        </div>

      {/* Site Selection */}
      {sites.length > 0 && (
        <Card className="border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Site
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Desktop: site + search side-by-side */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Site</Label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a site to view occurrences" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SITES_OPTION}>
                      All Sites
                    </SelectItem>
                    {sites.map((site, index) => (
                      <SelectItem key={site.siteID || site.id || `site-${index}`} value={String(site.siteID || site.id || '')}>
                        {site.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search occurrences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Mobile: keep site dropdown simple (filters live in drawer) */}
            <div className="sm:hidden">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a site to view occurrences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SITES_OPTION}>
                    All Sites
                  </SelectItem>
                  {sites.map((site, index) => (
                    <SelectItem key={site.siteID || site.id || `site-${index}`} value={String(site.siteID || site.id || '')}>
                      {site.locationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSiteId === ALL_SITES_OPTION ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Select a specific site to add a new occurrence.
              </p>
            ) : null}

            {/* Filters (desktop) - moved here to free space for records */}
            <div className="hidden sm:block mt-5">
              {renderFiltersPanel({ includeSearch: false })}
            </div>
          </CardContent>
        </Card>
      )}

      <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-600 to-blue-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-100">Total entries</p>
                      <p className="text-2xl font-bold text-white">{stats.totalEntries}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-emerald-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-100">This week</p>
                      <p className="text-2xl font-bold text-white">{stats.entriesThisWeek}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-600 to-amber-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-100">This month</p>
                      <p className="text-2xl font-bold text-white">{stats.entriesThisMonth}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-slate-700 to-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-200">Active stores</p>
                      <p className="text-2xl font-bold text-white">{Object.keys(stats.byStore ?? {}).length}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Occurrences */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-base">Occurrence Records</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {loading ? 'Loading…' : `${occurrences.length} record${occurrences.length === 1 ? '' : 's'}`}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : occurrences.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Occurrences Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || hasActiveFilters 
                      ? 'Try adjusting your search criteria or filters.'
                      : 'No occurrences have been recorded for this site yet.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Officer</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Crime Report Sent to HO</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead className="text-right w-[168px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {occurrences.map((occurrence) => (
                          <TableRow key={occurrence.id} className="hover:bg-muted/40">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {new Date(occurrence.date).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {occurrence.time}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium truncate">{occurrence.storeName ?? '—'}</span>
                                <span className="text-xs text-muted-foreground">#{occurrence.storeNumber ?? 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{occurrence.officerName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-background font-semibold">
                                  {occurrence.code}
                                </Badge>
                                <span className="text-sm">{getCodeMeta(occurrence.code)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {occurrence.crimeReportCompletedDate ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                    Sent
                                  </Badge>
                                  <div className="text-sm">
                                    <div className="font-medium">{new Date(occurrence.crimeReportCompletedDate).toLocaleDateString()}</div>
                                    <div className="text-muted-foreground">{occurrence.crimeReportCompletedTime}</div>
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <p className="text-sm text-muted-foreground line-clamp-2">{occurrence.details}</p>
                            </TableCell>
                            <TableCell className="text-right w-[168px]">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="View occurrence"
                                  className="h-11 w-11"
                                  onClick={() => {
                                    setSelectedOccurrence(occurrence)
                                    setViewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Edit occurrence"
                                  className="h-11 w-11"
                                  onClick={() => {
                                    setSelectedOccurrence(occurrence)
                                    setFormData({
                                      id: occurrence.id,
                                      customerId: occurrence.customerId,
                                      siteId: occurrence.siteId,
                                      storeName: occurrence.storeName ?? '',
                                      storeNumber: occurrence.storeNumber ?? '',
                                      date: occurrence.date,
                                      time: occurrence.time,
                                      officerName: occurrence.officerName,
                                      code: occurrence.code,
                                      crimeReportCompletedDate: occurrence.crimeReportCompletedDate,
                                      crimeReportCompletedTime: occurrence.crimeReportCompletedTime,
                                      details: occurrence.details,
                                      signature: occurrence.signature
                                    })
                                    setEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete occurrence"
                                  className="h-11 w-11 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(occurrence)}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {occurrences.map((occurrence) => (
                      <Card key={occurrence.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base truncate">{occurrence.storeName ?? 'Unnamed store'}</h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(occurrence.date).toLocaleDateString()} {occurrence.time}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className="bg-background font-semibold">
                                {occurrence.code}
                              </Badge>
                              {occurrence.crimeReportCompletedDate ? (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                  Sent
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Pending
                                </Badge>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="View occurrence"
                                  className="h-11 w-11"
                                  onClick={() => {
                                    setSelectedOccurrence(occurrence)
                                    setViewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Edit occurrence"
                                  className="h-11 w-11"
                                  onClick={() => {
                                    setSelectedOccurrence(occurrence)
                                    setFormData({
                                      id: occurrence.id,
                                      customerId: occurrence.customerId,
                                      siteId: occurrence.siteId,
                                      storeName: occurrence.storeName ?? '',
                                      storeNumber: occurrence.storeNumber ?? '',
                                      date: occurrence.date,
                                      time: occurrence.time,
                                      officerName: occurrence.officerName,
                                      code: occurrence.code,
                                      crimeReportCompletedDate: occurrence.crimeReportCompletedDate,
                                      crimeReportCompletedTime: occurrence.crimeReportCompletedTime,
                                      details: occurrence.details,
                                      signature: occurrence.signature
                                    })
                                    setEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete occurrence"
                                  className="h-11 w-11 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(occurrence)}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{occurrence.officerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>Store #{occurrence.storeNumber ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-semibold">{getCodeMeta(occurrence.code)}</span>
                            </div>
                            <p className="text-muted-foreground">{occurrence.details}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>

      {/* Create Occurrence Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Add New Occurrence</DialogTitle>
            <DialogDescription>
              Enter the occurrence details below. All required fields must be completed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            {renderOccurrenceForm('create')}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false)
                  setFormData(getDefaultFormState())
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => handleSubmit(false)}>
                Create Occurrence
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Occurrence Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          setSelectedOccurrence(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Occurrence</DialogTitle>
            <DialogDescription>
              Update the occurrence details below. All required fields must be completed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            {renderOccurrenceForm('edit')}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setSelectedOccurrence(null)
                  setFormData(getDefaultFormState())
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={() => handleSubmit(true)} className="w-full sm:w-auto">
                Update Occurrence
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Occurrence Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Occurrence Details</DialogTitle>
            <DialogDescription>
              View the complete details of this occurrence below.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOccurrence && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedOccurrence.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Time</Label>
                  <p className="font-medium">{selectedOccurrence.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Store</Label>
                  <p className="font-medium">{selectedOccurrence.storeName ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">#{selectedOccurrence.storeNumber ?? 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Officer Name</Label>
                  <p className="font-medium">{selectedOccurrence.officerName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Code</Label>
                  <p className="font-medium">
                    {selectedOccurrence.code} — {getCodeMeta(selectedOccurrence.code)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Crime Report Sent to HO</Label>
                  {selectedOccurrence.crimeReportCompletedDate ? (
                    <p className="font-medium">
                      {new Date(selectedOccurrence.crimeReportCompletedDate).toLocaleDateString()}{' '}
                      {selectedOccurrence.crimeReportCompletedTime}
                    </p>
                  ) : (
                    <p className="font-medium">Pending</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Signature</Label>
                  <p className="font-medium">{selectedOccurrence.signature}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Details</Label>
                <p className="mt-1 whitespace-pre-line">{selectedOccurrence.details}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Reported By</Label>
                <p className="font-medium">{selectedOccurrence.reportedBy.name}</p>
                <p className="text-sm text-muted-foreground">{selectedOccurrence.reportedBy.role}</p>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p><span className="font-medium">Created:</span> {new Date(selectedOccurrence.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Updated:</span> {selectedOccurrence.updatedAt
                      ? new Date(selectedOccurrence.updatedAt).toLocaleString()
                      : 'Not updated'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}