import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Customer } from "@/types/customer"
import useAuth from "@/hooks/useAuth"
import { 
  RefreshCw, 
  FileBarChart, 
  Building2, 
  ChevronRight, 
  Loader2, 
  Users, 
  FileText,
  AlertCircle,
  Layers
} from "lucide-react"
import { customerService } from "@/services/customerService"
import { customerPageAccessCache } from "@/services/customerPageAccessCache"
import type { CustomerPageAccessPage } from "@/api/customerPageAccess"
import { cn } from "@/lib/utils"

export default function CustomerReporting() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [pageState, setPageState] = useState<{
    isLoading: boolean
    error: string | null
    pages: CustomerPageAccessPage[]
  }>({
    isLoading: false,
    error: null,
    pages: []
  })

  // Refresh data when needed
  const refreshData = () => setRefreshTrigger(prev => prev + 1)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true)
        
        // Load customer data from customer store (which uses cached data)
        let customerData = await customerService.getAllCustomers()
        
        // For officers, filter to only assigned customers
        if (user?.role === 'advantageoneofficer') {
          const assignedCustomerIds = user.assignedCustomerIds || []
          // Normalize IDs to numbers for comparison (customer.id might be string or number)
          const assignedIdsAsNumbers = assignedCustomerIds.map(id => Number(id)).filter(id => !isNaN(id))
          
          customerData = customerData.filter((customer: any) => {
            const customerId = Number(customer.id)
            const isAssigned = !isNaN(customerId) && assignedIdsAsNumbers.includes(customerId)
            return isAssigned
          })
        }
        
        setCustomers(customerData)
      } catch (error) {
        console.error('Error loading customers:', error)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [user, refreshTrigger])

  // Listen for customer data updates to refresh data automatically
  useEffect(() => {
    const handleCustomerDataUpdate = (event: CustomEvent) => {
      refreshData()
    }

    window.addEventListener('customer-data-updated', handleCustomerDataUpdate as EventListener)
    
    return () => {
      window.removeEventListener('customer-data-updated', handleCustomerDataUpdate as EventListener)
    }
  }, [refreshData])

  useEffect(() => {
    let isActive = true

    if (!selectedCustomer) {
      setPageState({
        isLoading: false,
        error: null,
        pages: []
      })
      return
    }

    const loadCustomerPages = async () => {
      try {
        setPageState(prev => ({ ...prev, isLoading: true, error: null, pages: [] }))
        const customerId = Number(selectedCustomer)
        if (Number.isNaN(customerId)) {
          throw new Error('Invalid customer selection')
        }

        const access = await customerPageAccessCache.get(customerId)
        const assignedPages = access.availablePages
          .filter(page => access.assignedPageIds.includes(page.pageId))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

        if (!isActive) return

        setPageState({
          isLoading: false,
          error: null,
          pages: assignedPages
        })
      } catch (error) {
        if (!isActive) return
        const message = error instanceof Error ? error.message : 'Failed to load customer pages'
        setPageState({
          isLoading: false,
          error: message,
          pages: []
        })
      }
    }

    loadCustomerPages()

    return () => {
      isActive = false
    }
  }, [selectedCustomer])

  const handlePageSelect = (page: CustomerPageAccessPage) => {
    if (page?.path) {
      navigate(page.path)
    }
  }

  const selectedCustomerData = customers.find(c => c.id.toString() === selectedCustomer)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFF4FF]">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-blue-100 animate-pulse" />
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading customer data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-[#EFF4FF]">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Assigned</h3>
            <p className="text-gray-500 max-w-md text-center mb-6">
              No customers are currently assigned to you. Please contact your administrator to get access to customer reports.
            </p>
            <Button onClick={refreshData} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <FileBarChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customer Reporting</h1>
                <p className="text-gray-500 text-sm">
                  Select a customer to view their reports and metrics
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="gap-2 bg-white hover:bg-gray-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Customer Selector Card */}
        <Card className="border-0 shadow-md bg-white overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white py-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Select Customer</CardTitle>
              <Badge className="bg-blue-100 text-blue-700 border-0">
                {customers.length} available
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-w-md">
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Choose a customer to view reports..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {customer.companyName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Selected Customer Info & Pages */}
        {selectedCustomer && (
          <Card className="border-0 shadow-md bg-white overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  <div>
                    <CardTitle className="text-base">Available Reports</CardTitle>
                    {selectedCustomerData && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        for {selectedCustomerData.companyName}
                      </p>
                    )}
                  </div>
                </div>
                {!pageState.isLoading && !pageState.error && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {pageState.pages.length} reports
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {pageState.isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading available reports...</p>
                </div>
              )}

              {!pageState.isLoading && pageState.error && (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-red-600">{pageState.error}</p>
                </div>
              )}

              {!pageState.isLoading && !pageState.error && pageState.pages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pageState.pages.map(page => (
                    <Card
                      key={page.pageId}
                      className="cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
                      onClick={() => handlePageSelect(page)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {page.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{page.description}</p>
                            {page.category && (
                              <Badge variant="outline" className="mt-2 text-xs bg-gray-50">
                                {page.category}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!pageState.isLoading && !pageState.error && pageState.pages.length === 0 && (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Configured</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    No pages have been configured for this customer. Please contact your administrator to set up page access.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State when no customer selected */}
        {!selectedCustomer && (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-5">
                  <Building2 className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Customer</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Choose a customer from the dropdown above to view their available reports and metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
