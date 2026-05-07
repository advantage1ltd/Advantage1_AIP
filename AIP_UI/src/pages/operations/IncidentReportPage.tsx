import { useState, useCallback, useEffect, useMemo } from "react"
import { Incident, IncidentType, StolenItem } from "@/types/incidents"
import { IncidentForm } from "@/components/operations/IncidentForm"
import { IncidentsTable } from "@/components/operations/IncidentsTable"
import { Button } from "@/components/ui/button"
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
// Removed mockIncidents import - now using API service
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  PlusCircle, 
  PoundSterling, 
  Store, 
  AlertCircle, 
  Edit2,
  Trash2,
  Eye,
  FileText,
  Search,
  Calendar,
  Building2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import BarcodeScanner from '@/components/BarcodeScanner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { incidentsApi } from "@/services/api/incidents"
import { productService } from "@/services/productService"
import { regionService } from "@/services/regionService"
import type { Region } from "@/types/customer"
import { Toaster } from '@/components/ui/toaster'
import { useSearchParams } from 'react-router-dom'

interface IncidentReportPageProps {
  isCustomerView?: boolean;
  customerId?: string;
  siteId?: string | null;
}

export default function IncidentReportPage({ isCustomerView = false, customerId, siteId }: IncidentReportPageProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scanningBarcode, setScanningBarcode] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month' | 'custom' | null>(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [fromDateInput, setFromDateInput] = useState("")
  const [toDateInput, setToDateInput] = useState("")
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string | null>(null)
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [regions, setRegions] = useState<Region[]>([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [searchParams] = useSearchParams()
  const itemsPerPage = 10

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getPresetRange = (preset: 'today' | 'week' | 'month') => {
    const today = new Date()
    const end = formatDateInput(today)
    const startDate = new Date(today)

    if (preset === 'week') {
      startDate.setDate(startDate.getDate() - 6)
    }

    if (preset === 'month') {
      startDate.setDate(startDate.getDate() - 29)
    }

    return {
      from: formatDateInput(startDate),
      to: end
    }
  }

  const handlePresetFilter = (preset: 'today' | 'week' | 'month') => {
    const range = getPresetRange(preset)
    setDatePreset(preset)
    setFromDate(range.from)
    setToDate(range.to)
    setFromDateInput(range.from)
    setToDateInput(range.to)
    setCurrentPage(1)
  }

  const handleApplyDateRange = () => {
    if (!fromDateInput && !toDateInput) {
      handleClearFilters()
      return
    }

    if (fromDateInput && toDateInput && new Date(fromDateInput) > new Date(toDateInput)) {
      toast({
        title: 'Invalid Date Range',
        description: 'The start date must be before the end date.',
        variant: 'destructive',
      })
      return
    }

    setDatePreset('custom')
    setFromDate(fromDateInput)
    setToDate(toDateInput)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setDatePreset(null)
    setFromDate("")
    setToDate("")
    setFromDateInput("")
    setToDateInput("")
    setIncidentTypeFilter(null)
    setRegionFilter('all')
    setCurrentPage(1)
  }

  const isDateRangeActive = Boolean(fromDate || toDate)
  const isIncidentTypeFilterActive = Boolean(incidentTypeFilter)
  const isRegionFilterActive = regionFilter !== 'all'
  const isClientFilterActive = isDateRangeActive || isIncidentTypeFilterActive || isRegionFilterActive

  useEffect(() => {
    const presetParam = searchParams.get('preset')
    const incidentTypeParam = searchParams.get('incidentType')
    const fromDateParam = searchParams.get('fromDate')
    const toDateParam = searchParams.get('toDate')

    if (!presetParam && !incidentTypeParam && !fromDateParam && !toDateParam) {
      return
    }

    if (presetParam === 'today' || presetParam === 'week' || presetParam === 'month') {
      const range = getPresetRange(presetParam)
      setDatePreset(presetParam)
      setFromDate(range.from)
      setToDate(range.to)
      setFromDateInput(range.from)
      setToDateInput(range.to)
      setCurrentPage(1)
    } else if (fromDateParam || toDateParam) {
      setDatePreset('custom')
      setFromDate(fromDateParam || "")
      setToDate(toDateParam || "")
      setFromDateInput(fromDateParam || "")
      setToDateInput(toDateParam || "")
      setCurrentPage(1)
    } else {
      setDatePreset(null)
      setFromDate("")
      setToDate("")
      setFromDateInput("")
      setToDateInput("")
    }

    if (incidentTypeParam) {
      setIncidentTypeFilter(incidentTypeParam)
    } else {
      setIncidentTypeFilter(null)
    }
  }, [searchParams])

  useEffect(() => {
    let isMounted = true

    const loadRegions = async () => {
      setIsLoadingRegions(true)
      try {
        const response = isCustomerView && customerId
          ? await regionService.getRegionsByCustomer(Number(customerId))
          : await regionService.getRegions()
        if (isMounted) {
          setRegions(response.success ? response.data : [])
        }
      } catch (error) {
        if (isMounted) {
          setRegions([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingRegions(false)
        }
      }
    }

    loadRegions()

    return () => {
      isMounted = false
    }
  }, [isCustomerView, customerId])

  // Fetch incidents using the API service
  const { data: incidentsResponse = { data: [], pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 0, hasPrevious: false, hasNext: false } }, isLoading, error } = useQuery({
    queryKey: ['incidents', currentPage, searchTerm, customerId, siteId, fromDate, toDate, incidentTypeFilter, regionFilter],
    queryFn: () => incidentsApi.getIncidents({
      page: currentPage,
      pageSize: itemsPerPage,
      search: searchTerm,
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(incidentTypeFilter && { incidentType: incidentTypeFilter }),
      ...(regionFilter !== 'all' && { regionId: regionFilter }),
      ...(isCustomerView && customerId && { customerId }),
      ...(siteId && { siteId })
    })
  })

  // Create/Update incident mutation using the API service
  const mutation = useMutation({
    mutationFn: async (incident: Incident) => {
      if (editingIncident) {
        return await incidentsApi.updateIncident(editingIncident.id, incident)
      } else {
        return await incidentsApi.createIncident(incident)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast({
        title: 'Success',
        description: editingIncident ? 'Incident updated successfully' : 'Incident created successfully',
      })
      setOpen(false)
      setEditingIncident(null)
    },
    onError: (error) => {
      console.error('Error saving incident:', error)
      toast({
        title: 'Error',
        description: `Failed to save incident: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    }
  })

  // Delete incident mutation using the API service
  const deleteMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      await incidentsApi.deleteIncident(incidentId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast({
        title: 'Success',
        description: 'Incident deleted successfully',
      })
      setDeletingIncident(null)
    },
    onError: (error) => {
      console.error('Error deleting incident:', error)
      toast({
        title: 'Error',
        description: `Failed to delete incident: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    }
  })

  // Fetch all incidents for stats calculation (separate query to get complete data)
  const { data: allIncidentsResponse } = useQuery({
    queryKey: ['incidents-stats', searchTerm, customerId, siteId, fromDate, toDate, incidentTypeFilter, regionFilter],
    queryFn: () => incidentsApi.getIncidents({
      page: 1,
      pageSize: 1000, // Large page size to get all incidents for stats
      search: searchTerm,
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(incidentTypeFilter && { incidentType: incidentTypeFilter }),
      ...(regionFilter !== 'all' && { regionId: regionFilter }),
      ...(isCustomerView && customerId && { customerId }),
      ...(siteId && { siteId })
    })
  })

  const filteredIncidents = useMemo(() => {
    const baseData = allIncidentsResponse?.data || incidentsResponse.data

    if (!isClientFilterActive) {
    	return baseData
    }

    const fromBoundary = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const toBoundary = toDate ? new Date(`${toDate}T23:59:59`) : null

    const selectedRegion = regions.find((region) => region.regionID.toString() === regionFilter)
    const selectedRegionName = selectedRegion?.regionName?.toLowerCase()

    return baseData.filter((incident) => {
      if (regionFilter !== 'all') {
        const regionIdMatches = incident?.regionId?.toString() === regionFilter
        const regionNameMatches = selectedRegionName
          ? (incident?.regionName || '').toLowerCase() === selectedRegionName
          : false
        if (!regionIdMatches && !regionNameMatches) {
          return false
        }
      }

      const incidentTypeValue = (incident?.incidentType || incident?.type || '').toLowerCase()
      if (incidentTypeFilter && incidentTypeValue !== incidentTypeFilter.toLowerCase()) {
        return false
      }

      const incidentDateValue = incident?.dateOfIncident || incident?.date
      if (!incidentDateValue) return false

      const incidentDate = new Date(incidentDateValue)
      if (Number.isNaN(incidentDate.getTime())) return false

      if (fromBoundary && incidentDate < fromBoundary) return false
      if (toBoundary && incidentDate > toBoundary) return false
      return true
    })
  }, [allIncidentsResponse?.data, incidentsResponse.data, isClientFilterActive, fromDate, toDate, incidentTypeFilter, regionFilter, regions])

  // Calculate statistics using useMemo with null checks
  const stats = useMemo(() => {
    // Use filtered data when a date range is active
    const statsData = isClientFilterActive
      ? filteredIncidents
      : allIncidentsResponse?.data || incidentsResponse.data
    
    return {
      totalAmountSaved: Array.prototype.reduce.call(
        statsData,
        (acc: number, incident: Incident) => acc + (incident.totalValueRecovered || 0),
        0
      ),
      uniqueSites: new Set(statsData.map(incident => incident?.siteName).filter(Boolean)).size,
      totalIncidents: isClientFilterActive
        ? filteredIncidents.length
        : allIncidentsResponse?.pagination?.totalCount || incidentsResponse.pagination?.totalCount || statsData.length
    }
  }, [allIncidentsResponse?.data, allIncidentsResponse?.pagination?.totalCount, incidentsResponse.data, incidentsResponse.pagination?.totalCount, isClientFilterActive, filteredIncidents])

  const handleSubmit = useCallback((incident: Incident) => {
    mutation.mutate(incident)
  }, [mutation])

  const handleEdit = useCallback((incident: Incident) => {
    setEditingIncident(incident)
    setOpen(true)
  }, [])

  const handleView = useCallback((incident: Incident) => {
    console.log('Viewing Incident:', incident)
    setViewingIncident(incident)
  }, [])

  const handleDelete = useCallback((incident: Incident) => {
    setDeletingIncident(incident)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (deletingIncident) {
      deleteMutation.mutate(deletingIncident.id)
    }
  }, [deletingIncident, deleteMutation])

  const clientTotalPages = Math.max(1, Math.ceil(filteredIncidents.length / itemsPerPage))
  const totalPages = isClientFilterActive ? clientTotalPages : incidentsResponse.pagination?.totalPages || 1

  // Update the filtered and paginated incidents
  const paginatedIncidents = isClientFilterActive
    ? filteredIncidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : incidentsResponse.data

  const hasIncidents = paginatedIncidents.length > 0
  const isSearchActive = Boolean(searchTerm)

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }, [totalPages])

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    try {
      setIsLoadingProduct(true)
      
      // Call product API to fetch product details by EAN/barcode
      const productData = await productService.getProductByEAN(barcode)
      
      if (!productData) {
        toast({
          title: 'Product Not Found',
          description: `No product found with barcode ${barcode}. Please enter product details manually.`,
          variant: 'destructive',
        })
        return
      }
      
      // Create stolen item from product data
      // Map Excel categories to form categories
      // Note: Ambient, Fresh, and Non Food are now direct categories in the form dropdown
      const categoryMap: Record<string, string> = {
        // Direct matches - categories that exist in the form dropdown
        'alcohol': 'alcohol',
        'tobacco': 'tobacco',
        'meat': 'meat',
        'fish': 'fish',
        'dairy': 'dairy',
        'confectionery': 'confectionery',
        'health-beauty': 'health-beauty',
        'household': 'household',
        'grocery': 'grocery',
        'frozen': 'frozen',
        'produce': 'produce',
        'bakery': 'bakery',
        // These categories are now direct options - keep as-is
        'ambient': 'ambient',
        'fresh': 'fresh',
        'non-food': 'non-food',
        // Handle variations for non-food (with spaces)
        'non food': 'non-food',
        'nonfood': 'non-food',
      }
      
      // Get original category from backend and normalize
      const originalCategory = productData.category || ''
      let mappedCategory = originalCategory.toLowerCase().trim() || ''
      
      // Debug log to help troubleshoot
      if (import.meta.env.DEV) {
        console.log('🏷️ [Barcode] Category mapping started:', {
          original: originalCategory,
          normalized: mappedCategory,
          productName: productData.productName
        })
      }
      
      if (mappedCategory) {
        // Handle "non food" variations first (with spaces) - normalize to "non-food"
        if (mappedCategory.includes('non') && mappedCategory.includes('food')) {
          mappedCategory = 'non-food'
        }
        // Normalize spaces to dashes for categories that might have spaces (e.g., "health beauty" -> "health-beauty")
        else if (mappedCategory.includes(' ')) {
          mappedCategory = mappedCategory.replace(/\s+/g, '-')
        }
        
        // Check for exact match in the category map
        if (categoryMap[mappedCategory]) {
          mappedCategory = categoryMap[mappedCategory]
        } else {
          // Try to find a partial match
          const matchedKey = Object.keys(categoryMap).find(key => {
            const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '-')
            return mappedCategory === normalizedKey || 
                   mappedCategory.includes(normalizedKey) || 
                   normalizedKey.includes(mappedCategory)
          })
          if (matchedKey) {
            mappedCategory = categoryMap[matchedKey]
          } else {
            // Default to 'other' if no match found
            mappedCategory = 'other'
          }
        }
      } else {
        // No category provided, default to 'other'
        mappedCategory = 'other'
      }
      
      // Final debug log
      if (import.meta.env.DEV) {
        console.log('✅ [Barcode] Final mapped category:', mappedCategory, 'from original:', originalCategory)
      }

      const newItem: StolenItem = {
        id: Date.now().toString(),
        category: mappedCategory,
        productName: productData.productName || '',
        description: '', // Empty - officer will fill this manually
        cost: 0, // Set to 0 - officer will fill this manually
        quantity: 1, // Default quantity is 1, officer can change
        totalAmount: 0 // Will be calculated as cost * quantity
      }

      // Update editingIncident if it exists, or initialize a new one
      if (editingIncident) {
        setEditingIncident({
          ...editingIncident,
          stolenItems: [...(editingIncident.stolenItems || []), newItem]
        })
      } else {
        // Initialize a new incident object with the scanned item
        // Open the form dialog if not already open
        const newIncident: Incident = {
          id: '',
          customerId: 0,
          customerName: '',
          siteId: '',
          siteName: '',
          officerName: '',
          officerRole: '',
          dateOfIncident: new Date().toISOString(),
          timeOfIncident: '',
          incidentType: '',
          description: '',
          incidentInvolved: [],
          policeInvolvement: false,
          dutyManagerName: '',
          status: 'pending',
          priority: 'medium',
          stolenItems: [newItem],
          totalValueRecovered: 0
        }
        setEditingIncident(newIncident)
        setOpen(true) // Open the form dialog
      }
      
      toast({
        title: 'Product Added',
        description: `${productData.productName} has been added. Category and Product Name are auto-filled. Please complete description, cost, and quantity manually.`,
      })
      
    } catch (error) {
      console.error('Error with barcode:', error)
      toast({
        title: 'Error',
        description: 'Error processing barcode. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingProduct(false)
      setScanningBarcode(false)
    }
  }, [editingIncident, toast])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading incident data...</p>
        </div>
      </div>
    )
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm">
          <div className="mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Incidents</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An error occurred while loading incident data.'}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Retry Loading
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Force refetch the data
                queryClient.invalidateQueries({ queryKey: ['incidents'] })
              }}
              className="w-full"
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50">
      <Toaster />
      <div className="container mx-auto py-3 sm:py-4 md:py-6 lg:py-8 xl:py-10 2xl:py-12 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 max-w-screen-2xl">
        {/* Header Section */}
        <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
              <div className="bg-blue-100 p-2 xl:p-3 rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Incident Reports</h1>
                <p className="text-xs sm:text-sm md:text-base xl:text-lg text-gray-500">Track and manage security incidents across all sites</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingIncident(null)
                setOpen(true)
              }}
              size="default"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base xl:text-lg xl:h-12 xl:px-6"
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />
              New Incident
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 xl:gap-6">
            <Card className="bg-gradient-to-br from-blue-800 to-blue-900 border-blue-700 shadow-md col-span-1">
              <CardHeader className="flex flex-row items-center justify-between p-2 md:p-4 xl:p-6 pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-xs sm:text-sm lg:text-base xl:text-lg font-medium text-white">Total Amount Saved</CardTitle>
                <PoundSterling className="h-3 w-3 sm:h-4 sm:w-4 xl:h-5 xl:w-5 text-blue-300" />
              </CardHeader>
              <CardContent className="p-2 md:p-4 xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">£{stats.totalAmountSaved.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-800 to-emerald-900 border-emerald-700 shadow-md col-span-1">
              <CardHeader className="flex flex-row items-center justify-between p-2 md:p-4 xl:p-6 pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-xs sm:text-sm lg:text-base xl:text-lg font-medium text-white">Unique Sites</CardTitle>
                <Store className="h-3 w-3 sm:h-4 sm:w-4 xl:h-5 xl:w-5 text-emerald-300" />
              </CardHeader>
              <CardContent className="p-2 md:p-4 xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">{stats.uniqueSites}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-800 to-purple-900 border-purple-700 shadow-md col-span-2 md:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between p-2 md:p-4 xl:p-6 pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-xs sm:text-sm lg:text-base xl:text-lg font-medium text-white">Total Incidents</CardTitle>
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 xl:h-5 xl:w-5 text-purple-300" />
              </CardHeader>
              <CardContent className="p-2 md:p-4 xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">{stats.totalIncidents}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={datePreset === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetFilter('today')}
                  className="h-9 text-xs sm:text-sm"
                >
                  Today
                </Button>
                <Button
                  variant={datePreset === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetFilter('week')}
                  className="h-9 text-xs sm:text-sm"
                >
                  Week
                </Button>
                <Button
                  variant={datePreset === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetFilter('month')}
                  className="h-9 text-xs sm:text-sm"
                >
                  Month
                </Button>
                <Button
                  variant={incidentTypeFilter === IncidentType.THEFT ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setIncidentTypeFilter((current) => current === IncidentType.THEFT ? null : IncidentType.THEFT)
                    setCurrentPage(1)
                  }}
                  className="h-9 text-xs sm:text-sm"
                >
                  Theft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 text-xs sm:text-sm"
                  disabled={!isDateRangeActive && !datePreset && !isIncidentTypeFilterActive && !isRegionFilterActive}
                >
                  Clear
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                <Select value={regionFilter} onValueChange={(value) => {
                  setRegionFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm w-full sm:w-[200px]">
                    <SelectValue placeholder={isLoadingRegions ? 'Loading regions...' : 'All regions'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.regionID} value={region.regionID.toString()}>
                        {region.regionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Input
                    type="date"
                    value={fromDateInput}
                    onChange={(e) => setFromDateInput(e.target.value)}
                    className="h-9 text-xs sm:text-sm"
                    aria-label="Filter from date"
                  />
                  <Input
                    type="date"
                    value={toDateInput}
                    onChange={(e) => setToDateInput(e.target.value)}
                    className="h-9 text-xs sm:text-sm"
                    aria-label="Filter to date"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyDateRange}
                  className="h-9 text-xs sm:text-sm w-full sm:w-auto"
                >
                  Apply
                </Button>
              </div>
            </div>

            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 xl:w-5 xl:h-5" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 xl:pl-10 border-gray-300 text-sm xl:text-base xl:h-12"
              />
            </div>
          </div>

          {!hasIncidents && (
            <div className="p-6 sm:p-8 text-center border-b border-gray-200">
              <div className="mb-4">
                <FileText className="h-10 w-10 text-gray-300 mx-auto" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {isClientFilterActive
                  ? 'No Incidents Match Your Filters'
                  : isSearchActive
                    ? 'No Incidents Match Your Search'
                    : 'No Incidents Found'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {isClientFilterActive
                  ? 'Try adjusting your filters to see more incident reports.'
                  : isSearchActive
                    ? 'Try adjusting your search terms to see more incident reports.'
                    : 'There are no incident reports available. Create your first incident report to get started.'}
              </p>
              {isClientFilterActive ? (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="text-sm"
                >
                  Clear Filters
                </Button>
              ) : isSearchActive ? (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="text-sm"
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditingIncident(null)
                    setOpen(true)
                  }}
                  className="text-sm"
                >
                  Create New Incident
                </Button>
              )}
            </div>
          )}

          {/* Mobile Card Layout - visible only on small screens */}
          {hasIncidents && (
            <div className="block md:hidden p-3 space-y-3">
              {paginatedIncidents.map((incident) => (
                <div key={incident.id} className="rounded-lg border bg-white shadow-sm p-4 space-y-3">
                  {/* Header with customer and amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{incident.customerName || 'N/A'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{incident.siteName}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-sm text-green-600">
                        £{(() => {
                          const value = incident?.totalValueRecovered
                          if (typeof value === 'number' && !isNaN(value)) {
                            return value.toFixed(2)
                          }
                          if (Array.isArray(incident?.stolenItems) && incident.stolenItems.length > 0) {
                            const total = incident.stolenItems.reduce(
                              (sum, item) => sum + (typeof item?.totalAmount === 'number' ? item.totalAmount : 0),
                              0
                            )
                            return total.toFixed(2)
                          }
                          return '0.00'
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Officer</span>
                      <div className="font-medium truncate">{incident.officerName || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Date</span>
                      <div className="font-medium">{incident.date ? new Date(incident.date).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 block mb-0.5">Incident Type</span>
                      <div className="font-medium">{incident.incidentType}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(incident)}
                      className="flex-1 h-9 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(incident)}
                      className="flex-1 h-9 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(incident)}
                      className="h-9 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Desktop Table Layout - visible on medium screens and above */}
          {hasIncidents && (
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-medium text-sm lg:text-base xl:text-lg text-gray-900 py-3 xl:py-4 whitespace-nowrap">Customer Name</TableHead>
                      <TableHead className="font-medium text-sm lg:text-base xl:text-lg text-gray-900 py-3 xl:py-4 whitespace-nowrap">Site Name</TableHead>
                      <TableHead className="font-medium text-sm lg:text-base xl:text-lg text-gray-900 py-3 xl:py-4 whitespace-nowrap">Officer Name</TableHead>
                      <TableHead className="font-medium text-sm lg:text-base xl:text-lg text-gray-900 py-3 xl:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="flex items-center gap-2 xl:gap-3">
                          <Calendar className="w-4 h-4 xl:w-5 xl:h-5 text-gray-500" />
                          <span>Incident Date</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-medium text-sm lg:text-base xl:text-lg text-gray-900 py-3 xl:py-4 whitespace-nowrap">Total Amount</TableHead>
                      <TableHead className="font-medium text-sm lg:text-base xl:text-lg text-gray-900 py-3 xl:py-4 whitespace-nowrap hidden lg:table-cell">Incident Type</TableHead>
                      <TableHead className="font-medium text-sm lg:text-base xl:text-lg text-gray-900 py-3 xl:py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedIncidents.map((incident) => (
                      <TableRow 
                        key={incident.id}
                        className="hover:bg-gray-50 transition-colors text-sm lg:text-base xl:text-lg"
                      >
                        <TableCell className="py-3 xl:py-4 font-medium whitespace-nowrap">
                          {incident.customerName || 'N/A'}
                        </TableCell>
                        <TableCell className="py-3 xl:py-4 font-medium whitespace-nowrap">
                          {incident.siteName}
                        </TableCell>
                        <TableCell className="py-3 xl:py-4 whitespace-nowrap">{incident.officerName || 'N/A'}</TableCell>
                        <TableCell className="py-3 xl:py-4 hidden lg:table-cell whitespace-nowrap">
                          {incident.date ? new Date(incident.date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="py-3 xl:py-4 whitespace-nowrap">
                          £{(() => {
                            const value = incident?.totalValueRecovered
                            if (typeof value === 'number' && !isNaN(value)) {
                              return value.toFixed(2)
                            }
                            if (Array.isArray(incident?.stolenItems) && incident.stolenItems.length > 0) {
                              const total = incident.stolenItems.reduce(
                                (sum, item) => sum + (typeof item?.totalAmount === 'number' ? item.totalAmount : 0),
                                0
                              )
                              return total.toFixed(2)
                            }
                            return '0.00'
                          })()}
                        </TableCell>
                        <TableCell className="py-3 xl:py-4 hidden lg:table-cell whitespace-nowrap">{incident.incidentType}</TableCell>
                        <TableCell className="py-3 xl:py-4">
                          <div className="flex items-center justify-end gap-2 xl:gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(incident)}
                              className="h-8 w-8 xl:h-10 xl:w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            >
                              <Eye className="w-4 h-4 xl:w-5 xl:h-5" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(incident)}
                              className="h-8 w-8 xl:h-10 xl:w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            >
                              <Edit2 className="w-4 h-4 xl:w-5 xl:h-5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(incident)}
                              className="h-8 w-8 xl:h-10 xl:w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-4 h-4 xl:w-5 xl:h-5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasIncidents && totalPages > 1 && (
          <div className="flex justify-center py-3 sm:py-4 border-t border-gray-200 bg-white">
            <Pagination>
              <PaginationContent className="flex flex-wrap items-center gap-1 sm:gap-0">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : ''} h-8 w-8 sm:h-9 sm:w-auto text-xs sm:text-sm flex items-center justify-center`}
                    aria-disabled={currentPage === 1}
                  >
                    <span className="sr-only">Go to previous page</span>
                  </PaginationPrevious>
                </PaginationItem>
                
                {/* Desktop Pagination Numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageToShow;
                  
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageToShow} className="hidden sm:inline-block">
                      <PaginationLink
                        onClick={() => handlePageChange(pageToShow)}
                        isActive={currentPage === pageToShow}
                        className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-md text-xs sm:text-sm"
                        aria-label={`Go to page ${pageToShow}`}
                      >
                        {pageToShow}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {/* Mobile Pagination Counter */}
                <PaginationItem className="sm:hidden">
                  <span className="h-8 px-3 flex items-center justify-center text-xs font-medium text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} h-8 w-8 sm:h-9 sm:w-auto text-xs sm:text-sm flex items-center justify-center`}
                    aria-disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">Go to next page</span>
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setEditingIncident(null)
          }
        }}
      >
        <DialogContent className="w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[95vw] sm:max-w-[92vw] md:max-w-[90vw] lg:max-w-[90vw] xl:max-w-[85vw] 2xl:max-w-[80vw] h-[90vh] p-0 bg-white">
          <DialogHeader className="px-4 py-3 border-b bg-white">
            <DialogTitle className="text-xl font-bold">
              {editingIncident ? 'Edit Incident Report' : 'New Incident Report'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {editingIncident ? 'Update the incident details below' : 'Fill in the incident details below'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <IncidentForm
              initialData={editingIncident}
              onSubmit={handleSubmit}
              onCancel={() => {
                setOpen(false)
                setEditingIncident(null)
              }}
              onScanBarcode={() => setScanningBarcode(true)}
              onBarcodeScanned={handleBarcodeScanned}
              isLoading={mutation.isPending}
              customerId={customerId}
              siteId={siteId}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!viewingIncident} 
        onOpenChange={(isOpen) => !isOpen && setViewingIncident(null)}
      >
        <DialogContent className="w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[95vw] sm:max-w-[92vw] md:max-w-[90vw] lg:max-w-[90vw] xl:max-w-[85vw] 2xl:max-w-[80vw] h-[90vh] p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-xl font-bold">View Incident Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Incident ID: {viewingIncident?.id}
            </DialogDescription>
          </DialogHeader>
          {viewingIncident && (
            <div className="flex-1 overflow-y-auto">
              <div className="bg-[#F8F3F1]">
                <div className="w-full max-w-[98%] mx-auto px-4 py-4">
                  {/* Basic Information */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-6 text-blue-600">📋</div>
                      <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer Name</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.customerName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Site Name</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.siteName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Officer Name</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.officerName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned To</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.assignedTo || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingIncident.date ? new Date(viewingIncident.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Incident Details */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-6 text-blue-600">🕒</div>
                      <h2 className="text-lg font-medium text-gray-900">Incident Details</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Incident</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingIncident.date ? new Date(viewingIncident.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Priority</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.priority || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Incident Type</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.incidentType || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Value Recovered</label>
                        <p className="mt-1 text-sm text-gray-900">
                          £{typeof viewingIncident.totalValueRecovered === 'number' && !isNaN(viewingIncident.totalValueRecovered)
                            ? viewingIncident.totalValueRecovered.toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-6 text-blue-600">📝</div>
                      <h2 className="text-lg font-medium text-gray-900">Description</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Incident Details</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{viewingIncident.description || 'N/A'}</p>
                      </div>
                      {viewingIncident.storeComments && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Store Comments</label>
                          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{viewingIncident.storeComments}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Police Involvement */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-6 text-blue-600">👮</div>
                      <h2 className="text-lg font-medium text-gray-900">Police Involvement</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Was Police Involved?</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingIncident.policeInvolvement ? "Yes" : "No"}</p>
                      </div>
                      {viewingIncident.policeInvolvement && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {viewingIncident.urnNumber && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">URN Number</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingIncident.urnNumber}</p>
                            </div>
                          )}
                          {viewingIncident.crimeRefNumber && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Crime Reference Number</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingIncident.crimeRefNumber}</p>
                            </div>
                          )}
                          {viewingIncident.policeID && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Police ID</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingIncident.policeID}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Offender Details */}
                  {(viewingIncident.offenderName || viewingIncident.offenderDetailsVerified !== undefined) && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 text-blue-600">👤</div>
                        <h2 className="text-lg font-medium text-gray-900">Offender Details</h2>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {viewingIncident.offenderName && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Name</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderName}</p>
                            </div>
                          )}
                          {(viewingIncident.gender || viewingIncident.offenderSex) && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Gender</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingIncident.gender || viewingIncident.offenderSex || 'N/A'}</p>
                            </div>
                          )}
                          {viewingIncident.offenderDOB && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {new Date(viewingIncident.offenderDOB).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {viewingIncident.offenderPlaceOfBirth && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Place of Birth</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderPlaceOfBirth}</p>
                            </div>
                          )}
                          {viewingIncident.offenderMarks && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <label className="text-sm font-medium text-gray-500">Distinguishing Marks</label>
                              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{viewingIncident.offenderMarks}</p>
                            </div>
                          )}
                        </div>

                        {/* Offender Address */}
                        {viewingIncident.offenderAddress && (
                          <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {viewingIncident.offenderAddress.houseName && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">House Name</label>
                                  <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderAddress.houseName}</p>
                                </div>
                              )}
                              {viewingIncident.offenderAddress.numberAndStreet && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Number and Street</label>
                                  <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderAddress.numberAndStreet}</p>
                                </div>
                              )}
                              {viewingIncident.offenderAddress.villageOrSuburb && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Village/Suburb</label>
                                  <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderAddress.villageOrSuburb}</p>
                                </div>
                              )}
                              {viewingIncident.offenderAddress.town && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Town</label>
                                  <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderAddress.town}</p>
                                </div>
                              )}
                              {viewingIncident.offenderAddress.county && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">County</label>
                                  <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderAddress.county}</p>
                                </div>
                              )}
                              {viewingIncident.offenderAddress.postCode && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Post Code</label>
                                  <p className="mt-1 text-sm text-gray-900">{viewingIncident.offenderAddress.postCode}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Verification Details */}
                        {(viewingIncident.offenderDetailsVerified !== undefined || viewingIncident.verificationMethod || viewingIncident.verificationEvidenceImage) && (
                          <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Verification Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {viewingIncident.offenderDetailsVerified !== undefined && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Details Verified</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      viewingIncident.offenderDetailsVerified 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {viewingIncident.offenderDetailsVerified ? 'Yes' : 'No'}
                                    </span>
                                  </p>
                                </div>
                              )}
                              {viewingIncident.verificationMethod && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Verification Method</label>
                                  <p className="mt-1 text-sm text-gray-900">{viewingIncident.verificationMethod}</p>
                                </div>
                              )}
                            </div>
                            {viewingIncident.verificationEvidenceImage && (
                              <div className="mt-4">
                                <label className="text-sm font-medium text-gray-500 block mb-2">Verification Evidence</label>
                                <div className="relative inline-block">
                                  <img
                                    src={viewingIncident.verificationEvidenceImage}
                                    alt="Verification Evidence"
                                    className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                      // Open image in new window for full view
                                      const newWindow = window.open('', '_blank')
                                      if (newWindow) {
                                        newWindow.document.write(`
                                          <html>
                                            <head><title>Verification Evidence</title></head>
                                            <body style="margin:0;padding:20px;text-align:center;background:#f5f5f5;">
                                              <img src="${viewingIncident.verificationEvidenceImage}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);" />
                                            </body>
                                          </html>
                                        `)
                                      }
                                    }}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Click to view full size</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Incident Categories */}
                  {viewingIncident.incidentInvolved && viewingIncident.incidentInvolved.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 text-blue-600">🏷️</div>
                        <h2 className="text-lg font-medium text-gray-900">Incident Categories</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {viewingIncident.incidentInvolved.map((type, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                            <p className="text-sm text-gray-900">{type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stolen Items */}
                  {viewingIncident.stolenItems && viewingIncident.stolenItems.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 text-blue-600">💰</div>
                        <h2 className="text-lg font-medium text-gray-900">Stolen Items</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Category</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Product Name</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Description</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-500">Cost</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-500">Qty</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-500">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewingIncident.stolenItems.map((item, index) => {
                              const cost = typeof item.cost === 'number' && !isNaN(item.cost) ? item.cost : 0
                              const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0
                              // Fallback: calculate totalAmount if not present
                              const totalAmount = typeof item.totalAmount === 'number' && !isNaN(item.totalAmount)
                                ? item.totalAmount
                                : cost * quantity
                              return (
                                <tr key={index} className="border-b">
                                  <td className="py-2 text-sm text-gray-900">{item.category || 'N/A'}</td>
                                  <td className="py-2 text-sm text-gray-900">{item.productName || 'N/A'}</td>
                                  <td className="py-2 text-sm text-gray-900">{item.description || 'N/A'}</td>
                                  <td className="py-2 text-sm text-gray-900 text-right">£{cost.toFixed(2)}</td>
                                  <td className="py-2 text-sm text-gray-900 text-right">{quantity}</td>
                                  <td className="py-2 text-sm text-gray-900 text-right">£{totalAmount.toFixed(2)}</td>
                                </tr>
                              )
                            })}
                            <tr className="bg-gray-50">
                              <td colSpan={5} className="py-2 text-sm font-medium text-gray-900">Total Value</td>
                              <td className="py-2 text-sm font-medium text-gray-900 text-right">
                                £{Array.isArray(viewingIncident?.stolenItems)
                                    ? (() => {
                                        const total = viewingIncident.stolenItems.reduce(
                                          (sum, item) => {
                                            const cost = typeof item.cost === 'number' && !isNaN(item.cost) ? item.cost : 0
                                            const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0
                                            const totalAmount = typeof item.totalAmount === 'number' && !isNaN(item.totalAmount)
                                              ? item.totalAmount
                                              : cost * quantity
                                            return sum + totalAmount
                                          },
                                          0
                                        )
                                        return typeof total === 'number' && !isNaN(total) ? total.toFixed(2) : '0.00'
                                      })()
                                    : '0.00'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(viewingIncident)}
                  className="h-9 px-4 text-sm"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewingIncident(null)}
                  className="h-9 px-4 text-sm"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={!!deletingIncident} 
        onOpenChange={(isOpen) => !isOpen && setDeletingIncident(null)}
      >
        <AlertDialogContent className="w-[calc(100%-32px)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Incident Report</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this incident report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-sm"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BarcodeScanner
        isOpen={scanningBarcode}
        onClose={() => setScanningBarcode(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  )
}