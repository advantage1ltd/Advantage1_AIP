import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Customer, CustomerType, Region, Site } from "@/types/customer"
import { AddressSection } from "./dialog-sections/AddressSection"
import { ContactSection } from "./dialog-sections/ContactSection"
import { CompanyDetailsSection } from "./dialog-sections/CompanyDetailsSection"
import { RegionDialog } from "./RegionDialog"
import { SiteDialog } from "./SiteDialog"
import { RegionsTable } from "./RegionsTable"
import { SitesTable } from "./SitesTable"
import { customerService } from "@/services/customerService"
import { DUMMY_REGIONS } from "@/data/mockRegions"
import { DUMMY_SITES } from "@/data/mockSites"

const customerTypes: { value: CustomerType; label: string }[] = [
  { value: "retail", label: "Retail" },
  { value: "static", label: "Static" },
  { value: "gatehouse", label: "Gatehouse" },
  { value: "mobile-patrol", label: "Mobile Patrol" },
  { value: "keyholding-alarm-response", label: "Keyholding & Alarm Response" },
  { value: "event", label: "Event" }
]

// Form validation schema
const customerSchema = z.object({
  companyName: z.string().min(1, "Company name is required").min(2, "Company name must be at least 2 characters"),
  companyNumber: z.string().min(1, "Company number is required"),
  vatNumber: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  customerType: z.enum(["retail", "static", "gatehouse", "mobile-patrol", "keyholding-alarm-response", "event"]),
  address: z.object({
    building: z.string().optional(),
    street: z.string().min(1, "Street is required"),
    village: z.string().optional(),
    town: z.string().min(1, "Town/City is required"),
    county: z.string().min(1, "County is required"),
    postcode: z.string().min(1, "Postcode is required").regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, "Invalid UK postcode format")
  }),
  contact: z.object({
    title: z.string().min(1, "Title is required"),
    forename: z.string().min(1, "Forename is required"),
    surname: z.string().min(1, "Surname is required"),
    position: z.string().min(1, "Position is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required").min(10, "Phone number must be at least 10 digits")
  })
})

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  onSave: (customer: Customer) => void
}

export function CustomerDialog({ open, onOpenChange, customer, onSave }: CustomerDialogProps) {
  const { toast } = useToast()
  const [regions, setRegions] = useState<Region[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [regionDialogOpen, setRegionDialogOpen] = useState(false)
  const [siteDialogOpen, setSiteDialogOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>()
  const [selectedSite, setSelectedSite] = useState<Site | undefined>()
  const [isLoadingRegions] = useState(false)
  const [isLoadingSites] = useState(false)

  // Load regions and sites when customer changes
  useEffect(() => {
    const loadCustomerData = async () => {
      if (customer?.id) {
        console.log('🔧 [CustomerDialog] Loading regions and sites for customer:', customer.id)
        
        // Reset arrays when customer changes
        setRegions([])
        setSites([])
        
        // For now, use mock data filtered by customer ID
        // TODO: Replace with actual API calls when backend is ready
        const customerIdNum = parseInt(customer.id) || 0
        if (customerIdNum > 0) {
          // Filter mock data by customer ID
          const customerRegions = DUMMY_REGIONS.filter(region => region.fkCustomerID === customerIdNum)
          const customerSites = DUMMY_SITES.filter(site => site.fkCustomerID === customerIdNum)
          
          setRegions(customerRegions)
          setSites(customerSites)
          console.log('🔧 [CustomerDialog] Loaded mock data:', { regions: customerRegions.length, sites: customerSites.length })
        }
        
        // TODO: Replace with actual API calls:
        // const regionsResult = await regionsService.getRegionsByCustomer(customer.id)
        // const sitesResult = await sitesService.getSitesByCustomer(customer.id)
        // setRegions(regionsResult.data || [])
        // setSites(sitesResult.data || [])
      } else {
        setRegions([])
        setSites([])
      }
    }

    loadCustomerData()
  }, [customer])

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: "",
      companyNumber: "",
      vatNumber: "",
      status: "active",
      customerType: "retail",
      address: {
        building: "",
        street: "",
        village: "",
        town: "",
        county: "",
        postcode: ""
      },
      contact: {
        title: "",
        forename: "",
        surname: "",
        position: "",
        email: "",
        phone: ""
      }
    }
  })

  // Reset form when customer data changes
  useEffect(() => {
    if (customer) {
      console.log('Loading customer data into form:', customer)
      form.reset({
        companyName: customer.companyName || "",
        companyNumber: customer.companyNumber || "",
        vatNumber: customer.vatNumber || "",
        status: customer.status || "active",
        customerType: customer.customerType || "retail",
        address: {
          building: customer.address?.building || "",
          street: customer.address?.street || "",
          village: customer.address?.village || "",
          town: customer.address?.town || "",
          county: customer.address?.county || "",
          postcode: customer.address?.postcode || ""
        },
        contact: {
          title: customer.contact?.title || "",
          forename: customer.contact?.forename || "",
          surname: customer.contact?.surname || "",
          position: customer.contact?.position || "",
          email: customer.contact?.email || "",
          phone: customer.contact?.phone || ""
        }
      })
    } else {
      // Reset to empty form for new customer
      form.reset({
        companyName: "",
        companyNumber: "",
        vatNumber: "",
        status: "active",
        customerType: "retail",
        address: {
          building: "",
          street: "",
          village: "",
          town: "",
          county: "",
          postcode: ""
        },
        contact: {
          title: "",
          forename: "",
          surname: "",
          position: "",
          email: "",
          phone: ""
        }
      })
    }
  }, [customer, form])

  const onSubmit = async (data: z.infer<typeof customerSchema>) => {
    try {
      // Ensure we don't generate new IDs for existing customers
      const isExistingCustomer = customer && customer.id && !String(customer.id).startsWith('CUST')
      const customerId = isExistingCustomer ? customer.id : (customer?.id || `CUST${Date.now()}`)
      
      console.log('🔧 [CustomerDialog] onSubmit - customer ID logic:', {
        isExistingCustomer,
        originalId: customer?.id,
        finalId: customerId
      })
      
      const customerData = {
        ...data,
        pageAssignments: customer?.pageAssignments || [],
        id: customerId,
        createdAt: customer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewConfig: {
          id: customer?.viewConfig?.id || `VC${Date.now()}`,
          customerId: customerId,
          customerType: data.customerType,
          enabledPages: customer?.viewConfig?.enabledPages || [],
          createdAt: customer?.viewConfig?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      
      console.log('🔧 [CustomerDialog] onSubmit - final customerData:', {
        id: customerData.id,
        companyName: customerData.companyName,
        pageAssignmentsCount: customerData.pageAssignments?.length || 0,
        enabledPagesCount: customerData.viewConfig.enabledPages.length
      })
      
      // Save customer data first
      onSave(customerData as Customer)
      
      // Note: Success/error notifications are handled in the parent component
      // Only close dialog on successful validation
      
    } catch (error) {
      console.error('❌ [CustomerDialog] onSubmit - error:', error)
      toast({
        title: "Validation Error",
        description: "Please check all required fields and try again.",
        variant: "destructive"
      })
    }
  }

  const handleRegionSuccess = () => {
    // Refresh regions list
    console.log('🔧 [CustomerDialog] Region updated, refreshing list')
    // TODO: Reload regions from API
  }

  const handleSiteSuccess = () => {
    // Refresh sites list
    console.log('🔧 [CustomerDialog] Site updated, refreshing list')
    // TODO: Reload sites from API
  }

  const handleEditRegion = (region: Region) => {
    setSelectedRegion(region)
    setRegionDialogOpen(true)
  }

  const handleEditSite = (site: Site) => {
    setSelectedSite(site)
    setSiteDialogOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[800px] xl:max-w-[1000px] p-4 sm:p-6 xl:p-8 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl xl:text-2xl">
            {customer ? "Edit Customer" : "New Customer"}
          </DialogTitle>
          <DialogDescription>
            {customer ? "Update customer information, regions, and sites" : "Create a new customer. Regions and sites can be added after saving."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="details" className="w-full" activationMode="manual">
              <TabsList className={`grid w-full ${customer?.id ? 'grid-cols-3' : 'grid-cols-1'} transition-none`}>
                <TabsTrigger value="details">Customer Details</TabsTrigger>
                {customer?.id && (
                  <>
                    <TabsTrigger value="regions">Regions</TabsTrigger>
                    <TabsTrigger value="sites">Sites</TabsTrigger>
                  </>
                )}
              </TabsList>
              
              <TabsContent value="details" className="space-y-6 mt-6">
                {!customer?.id && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Regions and Sites
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            After creating this customer, you'll be able to add regions and sites using the dedicated tabs that will appear.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <CompanyDetailsSection form={form} />
                <AddressSection form={form} />
                <ContactSection form={form} />
              </TabsContent>
              
              {customer?.id && (
                <>
                  <TabsContent value="regions" className="mt-6">
                  <RegionsTable
                    customerId={customer?.id ? parseInt(customer.id) || 0 : null}
                    regions={regions}
                    onEdit={handleEditRegion}
                    onDataChange={handleRegionSuccess}
                  />
                  <div className="mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedRegion(undefined)
                        setRegionDialogOpen(true)
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Add Region
                    </Button>
                  </div>
                  </TabsContent>
                  
                  <TabsContent value="sites" className="mt-6">
                    <SitesTable
                      customerId={customer?.id ? parseInt(customer.id) || 0 : null}
                      sites={sites}
                      onEdit={handleEditSite}
                      onDataChange={handleSiteSuccess}
                    />
                    <div className="mt-4">
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedSite(undefined)
                          setSiteDialogOpen(true)
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Add Site
                      </Button>
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {customer ? "Update Customer" : "Create Customer"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Region Dialog */}
        {customer?.id && (
          <RegionDialog
            open={regionDialogOpen}
            onOpenChange={setRegionDialogOpen}
            region={selectedRegion}
            selectedCustomerId={customer?.id ? parseInt(customer.id) || 0 : null}
            onSuccess={handleRegionSuccess}
          />
        )}

        {/* Site Dialog */}
        {customer?.id && (
          <SiteDialog
            open={siteDialogOpen}
            onOpenChange={setSiteDialogOpen}
            site={selectedSite}
            selectedCustomerId={customer?.id ? parseInt(customer.id) || 0 : null}
            onSuccess={handleSiteSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}