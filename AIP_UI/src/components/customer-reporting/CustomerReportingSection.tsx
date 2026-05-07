import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Customer, CustomerPageId } from "@/types/customer"
import { CUSTOMER_PAGES } from "@/config/customerPages"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  ClipboardList, 
  Shield, 
  Star, 
  BarChart, 
  Building2, 
  ArrowLeft,
  ChevronRight,
  Loader2,
  FileBarChart,
  AlertCircle
} from "lucide-react"
import { customerPageAccessCache } from "@/services/customerPageAccessCache"
import type { CustomerPageAccessPage } from "@/api/customerPageAccess"

interface CustomerReportingSectionProps {
  customers: Customer[]
  onNavigate: (customerId: string, pageId: CustomerPageId) => void
}

const PAGE_ICONS = {
  'incident-report': FileText,
  'daily-activity': ClipboardList,
  'incident-graph': BarChart,
  'customer-satisfaction': Star,
  'be-safe-be-secure': Shield,
} as const

export function CustomerReportingSection({ customers, onNavigate }: CustomerReportingSectionProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [pageState, setPageState] = useState<{
    isLoading: boolean
    error: string | null
    pages: CustomerPageAccessPage[]
  }>({
    isLoading: false,
    error: null,
    pages: []
  })

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer)

    const numericId = Number(customer.id)
    if (Number.isNaN(numericId)) {
      setPageState({
        isLoading: false,
        error: 'Invalid customer identifier',
        pages: []
      })
      return
    }

    setPageState({ isLoading: true, error: null, pages: [] })

    try {
      const access = await customerPageAccessCache.get(numericId)
      const assignedPages = access.availablePages
        .filter(page => access.assignedPageIds.includes(page.pageId))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

      setPageState({
        isLoading: false,
        error: null,
        pages: assignedPages
      })
    } catch (error) {
      setPageState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load customer pages',
        pages: []
      })
    }
  }

  const handleBack = () => {
    setSelectedCustomer(null)
    setPageState({
      isLoading: false,
      error: null,
      pages: []
    })
  }

  const resolvePageKey = (page: CustomerPageAccessPage): CustomerPageId | null => {
    const entry = Object.entries(CUSTOMER_PAGES).find(([_, config]) => config.id === page.pageId)
    return entry ? (entry[0] as CustomerPageId) : null
  }

  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="gap-2 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">{selectedCustomer.companyName}</span>
          </div>
        </div>

        {/* Reports Card */}
        <Card className="border-0 shadow-md bg-white overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileBarChart className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Available Reports</CardTitle>
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
                <p className="text-gray-600">Loading assigned pages...</p>
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
                {pageState.pages.map(page => {
                  const pageKey = resolvePageKey(page)
                  const Icon = pageKey ? (PAGE_ICONS[pageKey as keyof typeof PAGE_ICONS] || FileText) : FileText
                  return (
                    <Card
                      key={page.pageId}
                      className="cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
                      onClick={() => onNavigate(String(selectedCustomer.id), (pageKey ?? page.pageId) as CustomerPageId)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors flex-shrink-0">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {page.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{page.description}</p>
                            <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-0 text-xs">
                              Assigned
                            </Badge>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {!pageState.isLoading && !pageState.error && pageState.pages.length === 0 && (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assigned Pages</h3>
                <p className="text-gray-500">
                  This customer has no assigned pages.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <FileBarChart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reporting</h2>
          <p className="text-gray-500 text-sm">Select a customer to view available reports</p>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(customer => {
          const reportCount = customer.pageAssignments 
            ? Object.entries(customer.pageAssignments).filter(([_, assignment]) => (assignment as any).enabled).length
            : customer.viewConfig?.enabledPages?.length || 0

          return (
            <Card 
              key={customer.id}
              className="cursor-pointer border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 group"
              onClick={() => handleCustomerSelect(customer)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    ID: {customer.id}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {customer.companyName}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                  {customer.address?.town}, {customer.address?.county}
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {reportCount} Reports
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {customers.length === 0 && (
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Available</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                There are no customers available for reporting at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
