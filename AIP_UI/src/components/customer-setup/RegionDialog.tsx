import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { customerService } from "@/services/customerService"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { regionService } from "@/services/regionService"
import type { Region } from "@/types/customer"

// Validation schema
const regionFormSchema = z.object({
  fkCustomerID: z.number().min(1, "Customer is required"),
  regionName: z.string().min(1, "Region name is required").min(2, "Region name must be at least 2 characters").max(100, "Region name must be less than 100 characters"),
  regionDescription: z.string().max(500, "Description must be less than 500 characters").optional(),
  recordIsDeletedYN: z.boolean().default(false)
})

type RegionFormData = z.infer<typeof regionFormSchema>

interface RegionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  region?: Region
  selectedCustomerId: string | null
  onSuccess?: () => void
}

export function RegionDialog({ open, onOpenChange, region, selectedCustomerId, onSuccess }: RegionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<RegionFormData>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: {
      fkCustomerID: selectedCustomerId ? parseInt(selectedCustomerId) || 0 : 0,
      regionName: "",
      regionDescription: "",
      recordIsDeletedYN: false
    }
  })

  // Reset form when dialog opens/closes or region changes
  useEffect(() => {
    if (open) {
      console.log('🔧 [RegionDialog] Opening dialog with selectedCustomerId:', selectedCustomerId)
      if (region) {
        console.log('🔧 [RegionDialog] Editing existing region:', region)
        form.reset({
          fkCustomerID: region.fkCustomerID,
          regionName: region.regionName,
          regionDescription: region.regionDescription || "",
          recordIsDeletedYN: region.recordIsDeletedYN
        })
      } else {
        const customerIdNum = selectedCustomerId ? parseInt(selectedCustomerId) || 0 : 0
        console.log('🔧 [RegionDialog] Creating new region for customer ID:', customerIdNum)
        form.reset({
          fkCustomerID: customerIdNum,
          regionName: "",
          regionDescription: "",
          recordIsDeletedYN: false
        })
      }
    }
  }, [open, region, selectedCustomerId, form])

  // Load customers when dialog opens
  useEffect(() => {
    if (open) {
      const loadCustomers = async () => {
        setIsLoadingCustomers(true)
        try {
          console.log('🔧 [RegionDialog] Loading customers from API...')
          const customers = await customerService.getAllCustomers()
          console.log('🔧 [RegionDialog] Loaded customers:', customers.length)
          console.log('🔧 [RegionDialog] Customer data:', customers.map(c => ({ id: c.id, name: c.companyName, idType: typeof c.id })))
          setCustomers(customers)
        } catch (error) {
          console.error('❌ [RegionDialog] Error loading customers:', error)
          setCustomers([])
        } finally {
          setIsLoadingCustomers(false)
        }
      }
      loadCustomers()
    }
  }, [open])

  // Force re-render of Select when selectedCustomerId changes
  useEffect(() => {
    if (open && selectedCustomerId && !region) {
      const customerIdNum = parseInt(selectedCustomerId) || 0
      console.log('🔧 [RegionDialog] Force updating fkCustomerID to:', customerIdNum)
      form.setValue('fkCustomerID', customerIdNum)
    }
  }, [open, selectedCustomerId, region, form])

  const handleSubmit = async (data: RegionFormData) => {
    setIsLoading(true)
    
    console.log('🔧 [RegionDialog] Submitting form data:', data)
    
    try {
      let result
      
      if (region) {
        // Update existing region
        result = await regionService.updateRegion(region.regionID, {
          regionName: data.regionName,
          regionDescription: data.regionDescription,
          recordIsDeletedYN: data.recordIsDeletedYN
        })
      } else {
        // Create new region
        result = await regionService.createRegion({
          fkCustomerID: data.fkCustomerID,
          regionName: data.regionName,
          regionDescription: data.regionDescription,
          recordIsDeletedYN: data.recordIsDeletedYN
        })
      }

      if (result.success) {
        toast({
          title: "Success",
          description: region ? "Region updated successfully" : "Region created successfully",
        })
        
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save region",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {region ? "Edit Region" : "New Region"}
          </DialogTitle>
          <DialogDescription>
            {region ? "Update the region information below." : "Create a new region for the selected customer."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fkCustomerID"
              render={({ field }) => {
                console.log('🔧 [RegionDialog] Rendering fkCustomerID field:', {
                  fieldValue: field.value,
                  fieldValueType: typeof field.value,
                  selectedCustomerId,
                  selectedCustomerIdType: typeof selectedCustomerId
                })
                return (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select 
                      key={`customer-select-${selectedCustomerId || 'none'}`}
                      onValueChange={(value) => {
                        console.log('🔧 [RegionDialog] Select onValueChange:', value)
                        field.onChange(parseInt(value))
                      }} 
                      value={field.value.toString()}
                      disabled={!!selectedCustomerId || isLoading || isLoadingCustomers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : (selectedCustomerId ? "Customer selected" : "Select customer")}>
                                                         {(() => {
                               if (selectedCustomerId && field.value > 0) {
                                 const selectedCustomer = customers.find(c => String(c.id) === selectedCustomerId)
                                 return selectedCustomer ? selectedCustomer.companyName : "Customer selected"
                               }
                               return undefined
                             })()}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(() => {
                          console.log('🔧 [RegionDialog] Filtering customers:', {
                            totalCustomers: customers.length,
                            selectedCustomerId,
                            selectedCustomerIdType: typeof selectedCustomerId,
                            customerIds: customers.map(c => ({ id: c.id, idType: typeof c.id }))
                          })
                          const filteredCustomers = customers.filter(customer => !selectedCustomerId || String(customer.id) === selectedCustomerId)
                          console.log('🔧 [RegionDialog] Available customers:', filteredCustomers.map(c => ({ id: c.id, name: c.companyName })))
                          return filteredCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.companyName}
                            </SelectItem>
                          ))
                        })()}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            
            <FormField
              control={form.control}
              name="regionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region Name *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} placeholder="Enter region name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regionDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      disabled={isLoading} 
                      placeholder="Enter region description (optional)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : (region ? "Update Region" : "Create Region")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

