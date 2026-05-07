import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UK_COUNTIES } from "@/lib/constants"
import { DUMMY_CUSTOMERS } from "@/data/customers"
import { DUMMY_REGIONS } from "@/data/mockRegions"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { siteService } from "@/services/siteService"
import { regionService } from "@/services/regionService"
import { useAuth } from "@/contexts/AuthContext"
import type { Site, Region } from "@/types/customer"

// UK postcode validation regex
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

// Validation schema
const siteFormSchema = z.object({
  fkCustomerID: z.number().min(1, "Customer is required"),
  fkRegionID: z.number().min(1, "Region is required"),
  coreSiteYN: z.boolean().default(false),
  locationName: z.string().min(1, "Location name is required").min(2, "Location name must be at least 2 characters").max(100, "Location name must be less than 100 characters"),
  locationType: z.string().max(50, "Location type must be less than 50 characters").optional(),
          sinNumber: z.string().max(50, "SIN Number must be less than 50 characters").optional(),
  buildingName: z.string().max(100, "Building name must be less than 100 characters").optional(),
  numberandStreet: z.string().max(200, "Street address must be less than 200 characters").optional(),
  villageOrSuburb: z.string().max(100, "Village/Suburb must be less than 100 characters").optional(),
  town: z.string().max(100, "Town must be less than 100 characters").optional(),
  county: z.string().max(100, "County must be less than 100 characters").optional(),
  postcode: z.string().regex(UK_POSTCODE_REGEX, "Please enter a valid UK postcode").optional(),
  telephoneNumber: z.string().max(20, "Telephone number must be less than 20 characters").optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  details: z.string().max(1000, "Details must be less than 1000 characters").optional(),
  siteSurveyComplete: z.string().optional(),
  assignmentInstructionsIssued: z.string().optional(),
  riskAssessmentIssued: z.string().optional(),
  recordIsDeletedYN: z.boolean().default(false)
})

type SiteFormData = z.infer<typeof siteFormSchema>

interface SiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: Site
  selectedCustomerId: number | null
  onSuccess?: () => void
}

export function SiteDialog({ open, onOpenChange, site, selectedCustomerId, onSuccess }: SiteDialogProps) {
  const [availableRegions, setAvailableRegions] = useState<Region[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Load regions from service
  const loadRegions = async () => {
    if (!selectedCustomerId || isLoadingRegions) return
    
    setIsLoadingRegions(true)
    try {
      console.log('🔧 [SiteDialog] Loading regions from service for customer:', selectedCustomerId)
      const result = await regionService.getRegionsByCustomer(selectedCustomerId)
      if (result.success) {
        console.log('🔧 [SiteDialog] Found regions from service:', result.data.length)
        setAvailableRegions(result.data)
      }
    } catch (error) {
      console.log('🔧 [SiteDialog] Service failed, using fallback data')
      // Fallback to static data if service fails
      const filteredRegions = selectedCustomerId
        ? DUMMY_REGIONS.filter(region => region.fkCustomerID === selectedCustomerId)
        : DUMMY_REGIONS
      console.log('🔧 [SiteDialog] Found regions from fallback:', filteredRegions.length)
      setAvailableRegions(filteredRegions as Region[])
    } finally {
      setIsLoadingRegions(false)
    }
  }
  
  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      fkCustomerID: selectedCustomerId || 0,
      fkRegionID: 0,
      coreSiteYN: false,
      locationName: "",
      locationType: "",
      sinNumber: "",
      buildingName: "",
      numberandStreet: "",
      villageOrSuburb: "",
      town: "",
      county: "",
      postcode: "",
      telephoneNumber: "",
      contractStartDate: "",
      contractEndDate: "",
      details: "",
      siteSurveyComplete: "",
      assignmentInstructionsIssued: "",
      riskAssessmentIssued: "",
      recordIsDeletedYN: false
    }
  })

  // Helpers: date normalization for input[type="date"] and payloads
  const formatDateForInput = (value?: string | null): string => {
    if (!value) return ""
    // Accept both ISO strings and already formatted YYYY-MM-DD
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const toNullableDateString = (value?: string | null): string | undefined => {
    if (!value) return undefined
    // Send as YYYY-MM-DD (acceptable for backend DateTime parsing)
    return value
  }

  // Load regions when dialog opens or customer changes
  useEffect(() => {
    if (!open) return
    const effectiveCustomerId = selectedCustomerId || site?.fkCustomerID
    if (effectiveCustomerId) {
      loadRegions()
    }
  }, [open, selectedCustomerId, site?.fkCustomerID])

  // Reset form when dialog opens/closes or site changes
  useEffect(() => {
    if (open) {
      if (site) {
        form.reset({
          fkCustomerID: site.fkCustomerID,
          fkRegionID: site.fkRegionID,
          coreSiteYN: site.coreSiteYN,
          locationName: site.locationName,
          locationType: site.locationType || "",
          sinNumber: site.sinNumber || "",
          buildingName: site.buildingName || "",
          numberandStreet: site.numberandStreet || "",
          villageOrSuburb: site.villageOrSuburb || "",
          town: site.town || "",
          county: site.county || "",
          postcode: site.postcode || "",
          telephoneNumber: site.telephoneNumber || "",
          contractStartDate: formatDateForInput(site.contractStartDate || undefined),
          contractEndDate: formatDateForInput(site.contractEndDate || undefined),
          details: site.details || "",
          siteSurveyComplete: formatDateForInput(site.siteSurveyComplete || undefined),
          assignmentInstructionsIssued: formatDateForInput(site.assignmentInstructionsIssued || undefined),
          riskAssessmentIssued: formatDateForInput(site.riskAssessmentIssued || undefined),
          recordIsDeletedYN: site.recordIsDeletedYN
        })
      } else {
        form.reset({
          fkCustomerID: selectedCustomerId || 0,
          fkRegionID: 0,
          coreSiteYN: false,
          locationName: "",
          locationType: "",
          sinNumber: "",
          buildingName: "",
          numberandStreet: "",
          villageOrSuburb: "",
          town: "",
          county: "",
          postcode: "",
          telephoneNumber: "",
          contractStartDate: "",
          contractEndDate: "",
          details: "",
          siteSurveyComplete: "",
          assignmentInstructionsIssued: "",
          riskAssessmentIssued: "",
          recordIsDeletedYN: false
        })
      }
    }
  }, [open, site, selectedCustomerId, form])

  const handleSubmit = async (data: SiteFormData) => {
    setIsLoading(true)
    
    try {
      let result
      
      if (site) {
        // Update existing site
        result = await siteService.updateSite(site.siteID, {
          coreSiteYN: !!data.coreSiteYN,
          locationName: data.locationName || "",
          locationType: data.locationType || undefined,
          sinNumber: data.sinNumber || undefined,
          buildingName: data.buildingName || undefined,
          numberandStreet: data.numberandStreet || undefined,
          villageOrSuburb: data.villageOrSuburb || undefined,
          town: data.town || undefined,
          county: data.county || undefined,
          postcode: data.postcode || undefined,
          telephoneNumber: data.telephoneNumber || undefined,
          contractStartDate: toNullableDateString(data.contractStartDate),
          contractEndDate: toNullableDateString(data.contractEndDate),
          details: data.details || undefined,
          siteSurveyComplete: toNullableDateString(data.siteSurveyComplete),
          assignmentInstructionsIssued: toNullableDateString(data.assignmentInstructionsIssued),
          riskAssessmentIssued: toNullableDateString(data.riskAssessmentIssued),
          recordIsDeletedYN: !!data.recordIsDeletedYN,
          modifiedBy: user?.username || user?.id?.toString() || "system"
        })
      } else {
        // Create new site
        result = await siteService.createSite({
          fkCustomerID: data.fkCustomerID || selectedCustomerId || 0,
          fkRegionID: data.fkRegionID || 0,
          coreSiteYN: !!data.coreSiteYN,
          locationName: data.locationName || "",
          locationType: data.locationType || undefined,
          sinNumber: data.sinNumber || undefined,
          buildingName: data.buildingName || undefined,
          numberandStreet: data.numberandStreet || undefined,
          villageOrSuburb: data.villageOrSuburb || undefined,
          town: data.town || undefined,
          county: data.county || undefined,
          postcode: data.postcode || undefined,
          telephoneNumber: data.telephoneNumber || undefined,
          contractStartDate: toNullableDateString(data.contractStartDate),
          contractEndDate: toNullableDateString(data.contractEndDate),
          details: data.details || undefined,
          siteSurveyComplete: toNullableDateString(data.siteSurveyComplete),
          assignmentInstructionsIssued: toNullableDateString(data.assignmentInstructionsIssued),
          riskAssessmentIssued: toNullableDateString(data.riskAssessmentIssued),
          recordIsDeletedYN: !!data.recordIsDeletedYN,
          createdBy: user?.username || user?.id?.toString() || "system"
        })
      }

      if (result.success) {
        toast({
          title: "Success",
          description: site ? "Site updated successfully" : "Site created successfully",
        })
        
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save site",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] xl:max-w-[800px] p-4 sm:p-6 xl:p-8 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {site ? "Edit Site" : "Add New Site"}
          </DialogTitle>
          <DialogDescription>
            {site ? "Update the site information below." : "Fill in the details to create a new site for the selected customer."}
          </DialogDescription>
          {availableRegions.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    No Regions Available
                  </h3>
                  <div className="mt-1 text-sm text-amber-700">
                    <p>
                      This customer doesn't have any regions yet. Please create a region first before adding sites.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!selectedCustomerId && (
                  <FormField
                    control={form.control}
                    name="fkCustomerID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DUMMY_CUSTOMERS.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="fkRegionID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()} disabled={isLoading || isLoadingRegions}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={availableRegions.length === 0 ? "No regions available" : "Select region"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRegions.length === 0 ? (
                            <SelectItem value="no-regions" disabled>
                              No regions available for this customer
                            </SelectItem>
                          ) : (
                            availableRegions.map((region) => (
                              <SelectItem key={region.regionID} value={region.regionID.toString()}>
                                {region.regionName}
                                {region.regionDescription && (
                                  <span className="text-gray-500 ml-2">- {region.regionDescription}</span>
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {availableRegions.length === 0 && (
                        <p className="text-sm text-amber-600 mt-1">
                          Please create a region for this customer first before adding sites.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter location name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="e.g., Office, Warehouse, Retail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sinNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIN Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter SIN Number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buildingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter building name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberandStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter street address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="villageOrSuburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village/Suburb</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter village or suburb" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter town" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>County</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select county" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UK_COUNTIES.map((county) => (
                            <SelectItem key={county} value={county}>
                              {county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter postcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact & Contract Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact & Contract Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telephoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} placeholder="Enter telephone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Site Status & Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Site Status & Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="coreSiteYN"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={!!field.value}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Core Site</FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siteSurveyComplete"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Survey Complete Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignmentInstructionsIssued"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Instructions Issued Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskAssessmentIssued"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Assessment Issued Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Details</h3>
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        disabled={isLoading} 
                        placeholder="Enter additional details about the site"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : (site ? "Update Site" : "Create Site")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

