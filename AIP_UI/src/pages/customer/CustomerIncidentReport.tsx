import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import IncidentReportPage from "@/pages/operations/IncidentReportPage"
import { useAuth } from "@/contexts/AuthContext"
import { useCustomerSelection } from "@/contexts/CustomerSelectionContext"
import { findCustomerById } from "@/hooks/useAvailableCustomers"
import { siteService } from '@/services/siteService'
import { extractCustomerId } from '@/utils/customerId'

export default function CustomerIncidentReport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { isAdmin } = useCustomerSelection()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [selectedSiteName, setSelectedSiteName] = useState<string | null>(null)

  const fetchSiteName = async (customerId: number, siteId: string) => {
    try {
      const response = await siteService.getSitesByCustomer(customerId)
      if (response.success) {
        const site = response.data.find((s) => String(s.siteID) === siteId)
        if (site) {
          setSelectedSiteName(site.locationName)
          console.log('CustomerIncidentReport: Found site name:', site.locationName)
        }
      }
    } catch (error) {
      console.error('Failed to fetch site name:', error)
    }
  }

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          return;
        }

        // Get customer ID from URL parameter or user's customerId (for customer users)
        const urlCustomerId = searchParams.get('customerId')
        const urlSiteId = searchParams.get('siteId')
        const userCustomerId = extractCustomerId(user)
        const targetCustomerId = urlCustomerId ? parseInt(urlCustomerId) : (userCustomerId || undefined)

        console.log('CustomerIncidentReport: URL customerId:', urlCustomerId)
        console.log('CustomerIncidentReport: URL siteId:', urlSiteId)
        console.log('CustomerIncidentReport: User customerId:', userCustomerId)
        console.log('CustomerIncidentReport: Target customerId:', targetCustomerId)

        // Set selected site if provided in URL
        if (urlSiteId && targetCustomerId) {
          setSelectedSiteId(urlSiteId)
          // Fetch site name for display
          fetchSiteName(targetCustomerId, urlSiteId)
        }

        if (!targetCustomerId) {
          if (isAdmin) {
            setError("Please select a customer from the sidebar to view this page. Open the Customer section and select a customer from the dropdown.")
          } else {
            setError("No customer ID found")
          }
          return
        }

        const customerData = await findCustomerById(targetCustomerId)
        console.log('CustomerIncidentReport: Found customer:', customerData)
        
        if (!customerData) {
          setError("Customer not found")
          return
        }
        
        console.log('CustomerIncidentReport: Access granted - setting customer')
        setCustomer(customerData)
      } catch (err) {
        console.error('CustomerIncidentReport: Error loading customer:', err)
        setError("Failed to load customer data")
      } finally {
        setLoading(false)
      }
    }

    loadCustomer()
  }, [user, authLoading, searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className={`p-4 rounded-lg border ${
          isAdmin 
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800' 
            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
        }`}>
          <p className={isAdmin ? 'text-amber-800 dark:text-amber-200' : 'text-red-600 dark:text-red-400'}>
            {error}
          </p>
          {isAdmin && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              As an administrator, you need to select a customer first before accessing customer-specific pages.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{customer?.name} - Incident Reports</h2>
          {selectedSiteName && (
            <p className="text-sm text-gray-600 mt-1">
              Filtered by site: <span className="font-medium">{selectedSiteName}</span>
            </p>
          )}
        </div>
      </div>

      <IncidentReportPage 
        isCustomerView={true}
        customerId={customer?.id.toString()}
        siteId={selectedSiteId}
      />
    </div>
  )
} 