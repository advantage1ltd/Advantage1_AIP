import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState, useEffect } from "react"
import type { AxiosError } from "axios"
import { Employee } from "@/types/employee"
import { UserRole } from "@/types/user"
import { lookupTableService, LookupTableItem } from "@/services/lookupTableService"
import { employeeService, EmployeeRegistrationRequest } from "@/services/employeeService"
import { mapToBackendUpdateRequest } from "@/utils/employeeMapper"
import { compressImageFileToDataUrl, validateImageFile } from "@/utils/image"
import { Upload, User, FileText, Shield, MapPin, Briefcase, CreditCard, Camera, Calendar, Mail } from "lucide-react"

const formSchema = z.object({
  // Basic Information - Backend Required Fields
  employeeNumber: z.string().min(1, "Employee number is required"),
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  surname: z.string().min(2, "Last name must be at least 2 characters"),
  startDate: z.string().min(1, "Start date is required").refine((date) => {
    if (!date) return false
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    return selectedDate <= today
  }, {
    message: "Start date cannot be in the future"
  }),
  position: z.string().min(1, "Position is required"),
  employeeStatus: z.string().min(1, "Employee status is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  
  // Optional Basic Information
  aipAccessLevel: z.string().optional(),
  
  // Contact Information
  email: z.string().email("Invalid email format").optional(),
  contactNumber: z.string().optional(),
  
  // Address Information
  houseName: z.string().optional(),
  numberAndStreet: z.string().optional(),
  town: z.string().optional(),
  county: z.string().optional(),
  postCode: z.string().optional(),
  region: z.string().optional(),
  
  // SIA Information - Conditional based on AIP Access Level
  siaLicenceType: z.string().optional(),
  siaLicenceExpiry: z.string().optional().refine((date) => {
    if (!date) return true // Optional field
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    return selectedDate >= today
  }, {
    message: "SIA licence expiry date cannot be in the past"
  }),
  
  // Personal Information
  nationality: z.string().optional(),
  rightToWorkCondition: z.string().optional(),
  
  // Driving License Information
  drivingLicenceType: z.string().optional(),
  dateDLChecked: z.string().optional(),
  drivingLicenceCopyTaken: z.boolean().optional(),
  sixMonthlyCheck: z.boolean().optional(),
  
  // Checks and References
  graydonCheckAuthorised: z.boolean().optional(),
  graydonCheckDetails: z.string().optional(),
  initialOralReferencesComplete: z.boolean().optional(),
  initialOralReferencesDate: z.string().optional(),
  writtenRefsComplete: z.boolean().optional(),
  writtenRefsCompleteDate: z.string().optional(),
  quickStarterFormCompleted: z.boolean().optional(),
  
  // Employment Documentation
  workingTimeDirective: z.string().optional(),
  workingTimeDirectiveComplete: z.boolean().optional(),
  contractOfEmploymentSigned: z.boolean().optional(),
  photoTaken: z.boolean().optional(),
  photoFile: z.string().optional(),
  idCardIssued: z.boolean().optional(),
  equipmentIssued: z.boolean().optional(),
  uniformIssued: z.boolean().optional(),
  nextOfKinDetailsComplete: z.boolean().optional(),
  
  // Training and Induction
  peopleHoursPin: z.string().optional(),
  fullRotasIssued: z.string().optional().refine((date) => {
    if (!date) return true // Optional field
    const selectedDate = new Date(date)
    return !isNaN(selectedDate.getTime())
  }, {
    message: "Please enter a valid date"
  }),
  inductionAndTrainingBooked: z.string().optional().refine((date) => {
    if (!date) return true // Optional field
    const selectedDate = new Date(date)
    return !isNaN(selectedDate.getTime())
  }, {
    message: "Please enter a valid date"
  }),
  location: z.string().optional(),
  trainer: z.string().optional(),
  
  status: z.enum(["active", "inactive"]).optional(),
}).refine((data) => {
  // SIA fields are required only for Advantageoneofficer and AdvantageoneHOofficer (case-insensitive)
  const requiresSIA = data.aipAccessLevel?.toLowerCase() === 'advantageoneofficer' || data.aipAccessLevel?.toLowerCase() === 'advantageonehoofficer'
  
  if (requiresSIA) {
    if (!data.siaLicenceType || data.siaLicenceType.trim() === '') {
      return false
    }
    if (!data.siaLicenceExpiry || data.siaLicenceExpiry.trim() === '') {
      return false
    }
  }
  
  return true
}, {
  message: "SIA Licence Type and Expiry are required for Advantageoneofficer and AdvantageoneHOofficer roles",
  path: ["siaLicenceType"] // This will show the error on the siaLicenceType field
})

type FormData = z.infer<typeof formSchema>

interface EmployeeFormProps {
  onSubmit?: (data: FormData) => Promise<void>
  onCancel: () => void
  initialData?: Employee
  isLoading?: boolean
}

// All dropdown data is now loaded dynamically from lookup tables

export function EmployeeForm({ onSubmit, onCancel, initialData, isLoading }: EmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoFile || null)
  const [trainers, setTrainers] = useState<LookupTableItem[]>([])
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false)
  const [counties, setCounties] = useState<LookupTableItem[]>([])
  const [regions, setRegions] = useState<LookupTableItem[]>([])
  const [isLoadingCounties, setIsLoadingCounties] = useState(false)
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)
  const [userRoles, setUserRoles] = useState<LookupTableItem[]>([])
  const [positions, setPositions] = useState<LookupTableItem[]>([])
  const [siaLicenceTypes, setSiaLicenceTypes] = useState<LookupTableItem[]>([])
  const [drivingLicenceTypes, setDrivingLicenceTypes] = useState<LookupTableItem[]>([])
  const [rightToWorkConditions, setRightToWorkConditions] = useState<LookupTableItem[]>([])
  const [isLoadingUserRoles, setIsLoadingUserRoles] = useState(false)
  const [isLoadingPositions, setIsLoadingPositions] = useState(false)
  const [isLoadingSiaLicenceTypes, setIsLoadingSiaLicenceTypes] = useState(false)
  const [isLoadingDrivingLicenceTypes, setIsLoadingDrivingLicenceTypes] = useState(false)
  const [isLoadingRightToWorkConditions, setIsLoadingRightToWorkConditions] = useState(false)
  const [workingTimeDirectives, setWorkingTimeDirectives] = useState<LookupTableItem[]>([])
  const [isLoadingLookupData, setIsLoadingLookupData] = useState(false)
  const [isLoadingWorkingTimeDirectives, setIsLoadingWorkingTimeDirectives] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aipAccessLevel: initialData?.aipAccessLevel || "",
      title: initialData?.title || "",
      firstName: initialData?.firstName || "",
      surname: initialData?.surname || "",
      email: initialData?.email || "",
      contactNumber: initialData?.contactNumber || "",
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
      houseName: initialData?.houseName || "",
      numberAndStreet: initialData?.numberAndStreet || "",
      town: initialData?.town || "",
      county: initialData?.county || "",
      postCode: initialData?.postCode || "",
      region: initialData?.region || "",
      position: initialData?.position || "",
      employeeNumber: initialData?.employeeNumber || "",
      employeeStatus: initialData?.employeeStatus || "Active",
      employmentType: initialData?.employmentType || "Full-time",
      siaLicenceType: initialData?.siaLicenceType || "",
      siaLicenceExpiry: initialData?.siaLicenceExpiry ? new Date(initialData.siaLicenceExpiry).toISOString().split('T')[0] : "",
      nationality: initialData?.nationality || "",
      rightToWorkCondition: initialData?.rightToWorkCondition || "",
      drivingLicenceType: initialData?.drivingLicenceType || "",
      dateDLChecked: initialData?.dateDLChecked ? new Date(initialData.dateDLChecked).toISOString().split('T')[0] : "",
      drivingLicenceCopyTaken: initialData?.drivingLicenceCopyTaken || false,
      sixMonthlyCheck: initialData?.sixMonthlyCheck || false,
      graydonCheckAuthorised: initialData?.graydonCheckAuthorised || false,
      graydonCheckDetails: initialData?.graydonCheckDetails || "",
      initialOralReferencesComplete: initialData?.initialOralReferencesComplete || false,
      initialOralReferencesDate: initialData?.initialOralReferencesDate ? new Date(initialData.initialOralReferencesDate).toISOString().split('T')[0] : "",
      writtenRefsComplete: initialData?.writtenRefsComplete || false,
      writtenRefsCompleteDate: initialData?.writtenRefsCompleteDate ? new Date(initialData.writtenRefsCompleteDate).toISOString().split('T')[0] : "",
      quickStarterFormCompleted: initialData?.quickStarterFormCompleted || false,
      workingTimeDirective: initialData?.workingTimeDirective || "",
      workingTimeDirectiveComplete: initialData?.workingTimeDirectiveComplete || false,
      contractOfEmploymentSigned: initialData?.contractOfEmploymentSigned || false,
      photoTaken: initialData?.photoTaken || false,
      photoFile: initialData?.photoFile || "",
      idCardIssued: initialData?.idCardIssued || false,
      equipmentIssued: initialData?.equipmentIssued || false,
      uniformIssued: initialData?.uniformIssued || false,
      nextOfKinDetailsComplete: initialData?.nextOfKinDetailsComplete || false,
             peopleHoursPin: initialData?.peopleHoursPin || "",
      fullRotasIssued: initialData?.fullRotasIssued ? new Date(initialData.fullRotasIssued).toISOString().split('T')[0] : "",
      inductionAndTrainingBooked: initialData?.inductionAndTrainingBooked ? new Date(initialData.inductionAndTrainingBooked).toISOString().split('T')[0] : "",
      location: initialData?.location || "",
      trainer: initialData?.trainer || "",
      status: "active",
    },
  })

  // Watch AIP Access Level to conditionally show SIA fields
  const aipAccessLevel = form.watch('aipAccessLevel')
  const requiresSIA = aipAccessLevel?.toLowerCase() === 'advantageoneofficer' || aipAccessLevel?.toLowerCase() === 'advantageonehoofficer'

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      alert(validation.message)
      event.target.value = "" // Clear the input
      return
    }

    // Show loading state
    setPhotoPreview("loading...")

    try {
      const compressedImage = await compressImageFileToDataUrl(file)
      setPhotoPreview(compressedImage)
      form.setValue("photoFile", compressedImage)
      form.setValue("photoTaken", true)
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Error processing image. Please try again.")
      setPhotoPreview(null)
      form.setValue("photoFile", "")
      form.setValue("photoTaken", false)
      event.target.value = "" // Clear the input
    }
  }

     // Load lookup data and employee data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load all lookup table data first
      const requiredCategories = [
        'Trainers',
        'UK_Counties', 
        'UK_Regions',
        'User_Roles',
        'Positions',
        'SIA_Licence_Types',
        'Driving_Licence_Types',
        'Right_To_Work_Conditions',
        'Working_Time_Directive'
      ]

      console.log('Loading lookup table data in parallel...')
      setIsLoadingLookupData(true)
      
      try {
        const lookupData = await lookupTableService.getByCategories(requiredCategories)
        
        // Set all the data at once
        setTrainers(lookupData['Trainers'] || [])
        setCounties(lookupData['UK_Counties'] || [])
        setRegions(lookupData['UK_Regions'] || [])
        setUserRoles(lookupData['User_Roles'] || [])
        setPositions(lookupData['Positions'] || [])
        setSiaLicenceTypes(lookupData['SIA_Licence_Types'] || [])
        setDrivingLicenceTypes(lookupData['Driving_Licence_Types'] || [])
        setRightToWorkConditions(lookupData['Right_To_Work_Conditions'] || [])
        setWorkingTimeDirectives(lookupData['Working_Time_Directive'] || [])
        
        console.log('All lookup table data loaded successfully')
        
        // Now load employee data if editing (after lookup data is loaded)
        if (initialData?.id) {
          try {
            const employeeData = await employeeService.getEmployeeById(Number(initialData.id))
            
            // Helper function to find matching lookup value or use original value
            const findLookupValue = (originalValue: string, lookupArray: LookupTableItem[]) => {
              if (!originalValue) return ""
              const found = lookupArray.find(item => 
                item.value.toLowerCase() === originalValue.toLowerCase() ||
                item.value === originalValue
              )
              return found ? found.value : originalValue
            }
            
            // Update form with loaded data, ensuring dropdown values match lookup data
            form.reset({
              aipAccessLevel: findLookupValue(employeeData.aipAccessLevel, lookupData['User_Roles'] || []),
              title: employeeData.title || "",
              firstName: employeeData.firstName || "",
              surname: employeeData.surname || "",
              startDate: employeeData.startDate ? new Date(employeeData.startDate).toISOString().split('T')[0] : "",
              email: employeeData.email || "",
              contactNumber: employeeData.contactNumber || "",
              houseName: employeeData.houseName || "",
              numberAndStreet: employeeData.numberAndStreet || "",
              town: employeeData.town || "",
              county: findLookupValue(employeeData.county, lookupData['UK_Counties'] || []),
              postCode: employeeData.postCode || "",
              region: findLookupValue(employeeData.region, lookupData['UK_Regions'] || []),
              position: findLookupValue(employeeData.position, lookupData['Positions'] || []),
              employeeNumber: employeeData.employeeNumber || "",
              employeeStatus: employeeData.employeeStatus || "",
              employmentType: employeeData.employmentType || "",
              siaLicenceType: findLookupValue(employeeData.siaLicenceType, lookupData['SIA_Licence_Types'] || []),
              siaLicenceExpiry: employeeData.siaLicenceExpiry ? new Date(employeeData.siaLicenceExpiry).toISOString().split('T')[0] : "",
              nationality: employeeData.nationality || "",
              rightToWorkCondition: findLookupValue(employeeData.rightToWorkCondition, lookupData['Right_To_Work_Conditions'] || []),
              drivingLicenceType: findLookupValue(employeeData.drivingLicenceType, lookupData['Driving_Licence_Types'] || []),
              dateDLChecked: employeeData.dateDLChecked ? new Date(employeeData.dateDLChecked).toISOString().split('T')[0] : "",
              drivingLicenceCopyTaken: employeeData.drivingLicenceCopyTaken || false,
              sixMonthlyCheck: employeeData.sixMonthlyCheck || false,
              graydonCheckAuthorised: employeeData.graydonCheckAuthorised || false,
              graydonCheckDetails: employeeData.graydonCheckDetails || "",
              initialOralReferencesComplete: employeeData.initialOralReferencesComplete || false,
              initialOralReferencesDate: employeeData.initialOralReferencesDate ? new Date(employeeData.initialOralReferencesDate).toISOString().split('T')[0] : "",
              writtenRefsComplete: employeeData.writtenRefsComplete || false,
              writtenRefsCompleteDate: employeeData.writtenRefsCompleteDate ? new Date(employeeData.writtenRefsCompleteDate).toISOString().split('T')[0] : "",
              quickStarterFormCompleted: employeeData.quickStarterFormCompleted || false,
              workingTimeDirective: findLookupValue(employeeData.workingTimeDirective, lookupData['Working_Time_Directive'] || []),
              workingTimeDirectiveComplete: employeeData.workingTimeDirectiveComplete || false,
              contractOfEmploymentSigned: employeeData.contractOfEmploymentSigned || false,
              photoTaken: employeeData.photoTaken || false,
              photoFile: employeeData.photoFile || "",
              idCardIssued: employeeData.idCardIssued || false,
              equipmentIssued: employeeData.equipmentIssued || false,
              uniformIssued: employeeData.uniformIssued || false,
              nextOfKinDetailsComplete: employeeData.nextOfKinDetailsComplete || false,
              peopleHoursPin: employeeData.peopleHoursPin || "",
              fullRotasIssued: employeeData.fullRotasIssued ? new Date(employeeData.fullRotasIssued).toISOString().split('T')[0] : "",
              inductionAndTrainingBooked: employeeData.inductionAndTrainingBooked ? new Date(employeeData.inductionAndTrainingBooked).toISOString().split('T')[0] : "",
              location: employeeData.location || "",
              trainer: findLookupValue(employeeData.trainer, lookupData['Trainers'] || []),
              status: employeeData.employeeStatus === "Active" ? "active" : "inactive",
            })
            
            // Update photo preview
            if (employeeData.photoFile) {
              setPhotoPreview(employeeData.photoFile)
            }
          } catch (error) {
            console.error('Failed to load employee data:', error)
          }
        }
      } catch (error) {
        console.error('Failed to load lookup table data:', error)
      } finally {
        setIsLoadingLookupData(false)
      }
    }

    loadData()
  }, [initialData?.id, form])

  // Reset form when initialData changes to null (when switching from edit to create mode)
  useEffect(() => {
    if (!initialData) {
      form.reset()
      form.clearErrors()
      setPhotoPreview(null)
    }
  }, [initialData, form])

  // Force form reset when employee ID changes (for switching between employees)
  useEffect(() => {
    console.log('🔄 [EmployeeForm] Employee ID changed:', initialData?.id)
    if (initialData?.id) {
      // Reset form immediately when switching to a different employee
      console.log('🔄 [EmployeeForm] Resetting form for employee ID:', initialData.id)
      form.reset()
      form.clearErrors()
      setPhotoPreview(null)
      setSubmitError(null)
    }
  }, [initialData?.id, form])

  // Cleanup form state when component unmounts
  useEffect(() => {
    return () => {
      form.reset()
      form.clearErrors()
      setPhotoPreview(null)
    }
  }, [form])

  const handleSubmit = async (data: FormData) => {
    console.log('🚀 [EmployeeForm] Starting form submission...')
    console.log('📝 [EmployeeForm] Form data received:', data)
    console.log('🆔 [EmployeeForm] Current employee ID:', initialData?.id)
    
    // Validate required fields before submission
    const requiredFields = ['employeeNumber', 'title', 'firstName', 'surname', 'startDate', 'position', 'employeeStatus', 'employmentType']
    const missingFields = requiredFields.filter(field => !data[field as keyof FormData])
    
    console.log('🔍 [EmployeeForm] Form validation - Required fields:', requiredFields)
    console.log('🔍 [EmployeeForm] Form validation - Missing fields:', missingFields)
    console.log('🔍 [EmployeeForm] Form validation - Employee number:', data.employeeNumber)
    
    if (missingFields.length > 0) {
      console.error('❌ [EmployeeForm] Missing required fields:', missingFields)
      setSubmitError(`Please fill in all required fields: ${missingFields.join(', ')}`)
      setIsSubmitting(false)
      return
    }
    
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      if (onSubmit) {
        console.log('🔄 [EmployeeForm] Using custom onSubmit')
        // Use custom onSubmit if provided
        await onSubmit(data)
      } else {
        console.log('🔄 [EmployeeForm] Using real API service')
        // Use real API service with frontend data format
        console.log('📤 [EmployeeForm] Using frontend data format for API call')
        console.log('📤 [EmployeeForm] Form data being sent:', JSON.stringify(data, null, 2))

        if (initialData?.id) {
          console.log('🔄 [EmployeeForm] Updating existing employee with ID:', initialData.id)
          // Update existing employee - convert form data to Employee format
          const employeeData: Partial<Employee> = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            siaLicenceExpiry: data.siaLicenceExpiry ? new Date(data.siaLicenceExpiry) : undefined,
            dateDLChecked: data.dateDLChecked ? new Date(data.dateDLChecked) : undefined,
            initialOralReferencesDate: data.initialOralReferencesDate ? new Date(data.initialOralReferencesDate) : undefined,
            writtenRefsCompleteDate: data.writtenRefsCompleteDate ? new Date(data.writtenRefsCompleteDate) : undefined,
            fullRotasIssued: data.fullRotasIssued ? new Date(data.fullRotasIssued) : undefined,
            inductionAndTrainingBooked: data.inductionAndTrainingBooked ? new Date(data.inductionAndTrainingBooked) : undefined,
          }
          const result = await employeeService.updateEmployee(Number(initialData.id), employeeData)
          console.log('✅ [EmployeeForm] Employee update successful:', result)
        } else {
          console.log('🆕 [EmployeeForm] Creating new employee')
          // Create new employee - convert form data to Employee format
          const employeeData: Partial<Employee> = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            siaLicenceExpiry: data.siaLicenceExpiry ? new Date(data.siaLicenceExpiry) : undefined,
            dateDLChecked: data.dateDLChecked ? new Date(data.dateDLChecked) : undefined,
            initialOralReferencesDate: data.initialOralReferencesDate ? new Date(data.initialOralReferencesDate) : undefined,
            writtenRefsCompleteDate: data.writtenRefsCompleteDate ? new Date(data.writtenRefsCompleteDate) : undefined,
            fullRotasIssued: data.fullRotasIssued ? new Date(data.fullRotasIssued) : undefined,
            inductionAndTrainingBooked: data.inductionAndTrainingBooked ? new Date(data.inductionAndTrainingBooked) : undefined,
          }
          const result = await employeeService.registerEmployeeFromFrontend(employeeData)
          console.log('✅ [EmployeeForm] Employee creation successful:', result)
        }
      }
      
      console.log('✅ [EmployeeForm] Form submission completed successfully')
      
      // Reset form state to clear any cached data and validation errors
      form.reset()
      form.clearErrors()
      setSubmitError(null)
      
      // Force a complete form reset by resetting all state
      setTimeout(() => {
        form.reset()
        form.clearErrors()
      }, 0)
      
      // Close form or show success message
      onCancel()
    } catch (error) {
      console.error('❌ [EmployeeForm] Error submitting employee form:', error)
      console.error('❌ [EmployeeForm] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      
      // Extract specific error message from backend response
      let errorMessage = 'An error occurred while saving the employee'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Handle Axios error response
        const axiosError = error as AxiosError<{ message?: string; Message?: string }>
        const responseMessage = axiosError.response?.data?.message ?? axiosError.response?.data?.Message
        if (responseMessage) {
          errorMessage = responseMessage
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }
      }
      
      setSubmitError(errorMessage)
    } finally {
      console.log('🏁 [EmployeeForm] Form submission process finished')
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form} key={initialData?.id || 'new-employee'}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="aipAccessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AIP Access Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingLookupData ? "Loading..." : "Select access level"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.lookupId} value={role.value}>
                          {role.value}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Mr, Mrs, Ms, Dr, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      max={new Date().toISOString().split('T')[0]}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Number</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+44 123 456 7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Address Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="houseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Name</FormLabel>
                  <FormControl>
                    <Input placeholder="The Cottage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberAndStreet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number and Street</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
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
                    <Input placeholder="Birmingham" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingLookupData ? "Loading..." : "Select county"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county.lookupId} value={county.value}>
                          {county.value}
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
              name="postCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Code</FormLabel>
                  <FormControl>
                    <Input placeholder="B1 1AA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingLookupData ? "Loading..." : "Select region"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.lookupId} value={region.value}>
                          {region.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Employment Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingLookupData ? "Loading..." : "Select position"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.lookupId} value={position.value}>
                          {position.value}
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
              name="employeeStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality</FormLabel>
                  <FormControl>
                    <Input placeholder="British" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rightToWorkCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Right to Work Condition</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingRightToWorkConditions ? "Loading conditions..." : "Select condition"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rightToWorkConditions.map((condition) => (
                        <SelectItem key={condition.lookupId} value={condition.value}>
                          {condition.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* SIA Information Section - Only show for Advantageoneofficer and AdvantageoneHOofficer */}
        {requiresSIA && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> SIA information is required for Advantageoneofficer and AdvantageoneHOofficer roles.
              </p>
            </div>
          </>
        )}
        {!requiresSIA && aipAccessLevel && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> SIA information is not required for the selected role ({aipAccessLevel}).
            </p>
          </div>
        )}
        {requiresSIA && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SIA Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="siaLicenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIA Licence Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingLookupData ? "Loading..." : "Select licence type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siaLicenceTypes.map((type) => (
                          <SelectItem key={type.lookupId} value={type.value}>
                            {type.value}
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
                name="siaLicenceExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIA Licence Expiry *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Driving License Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Driving License Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="drivingLicenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driving Licence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingDrivingLicenceTypes ? "Loading licence types..." : "Select licence type"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivingLicenceTypes.map((type) => (
                        <SelectItem key={type.lookupId} value={type.value}>
                          {type.value}
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
              name="dateDLChecked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date D/L Checked</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="drivingLicenceCopyTaken"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Copy taken?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sixMonthlyCheck"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>6 monthly check?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Checks and References Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Checks and References
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="graydonCheckAuthorised"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Graydon check Authorised?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="graydonCheckDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graydon check details</FormLabel>
                    <FormControl>
                      <Input placeholder="Details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialOralReferencesComplete"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Initial oral References complete?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialOralReferencesDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="writtenRefsComplete"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Written References complete?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="writtenRefsCompleteDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quickStarterFormCompleted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Quick starter form complete?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment Documentation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Employment Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="workingTimeDirective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Time Directive</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingWorkingTimeDirectives ? "Loading options..." : "Select option"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workingTimeDirectives.map((option) => (
                        <SelectItem key={option.lookupId} value={option.value}>
                          {option.value}
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
              name="workingTimeDirectiveComplete"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Working Time Directive Complete?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractOfEmploymentSigned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Contract of Employment signed?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photoTaken"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Photo taken?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photoFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo Upload</FormLabel>
                  <div className="space-y-4">
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="cursor-pointer"
                      />
                    </FormControl>
                    
                                         {/* Photo Preview/Placeholder */}
                     <div className="flex items-center justify-center">
                       {photoPreview ? (
                         photoPreview === 'loading...' ? (
                           <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                             <p className="text-xs text-gray-500 text-center px-2">
                               Processing image...
                             </p>
                           </div>
                         ) : (
                           <div className="relative group">
                             <div className="w-32 h-32 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                               <img
                                 src={photoPreview}
                                 alt="Employee photo"
                                 className="w-full h-full object-cover"
                                 style={{ imageRendering: 'auto' }}
                               />
                             </div>
                             <button
                               type="button"
                               onClick={() => {
                                 setPhotoPreview(null)
                                 form.setValue('photoFile', '')
                                 form.setValue('photoTaken', false)
                               }}
                               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                               title="Remove photo"
                             >
                               ×
                             </button>
                             {/* Hover overlay for better UX */}
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                               <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium transition-opacity duration-200">
                                 Click to remove
                               </span>
                             </div>
                           </div>
                         )
                       ) : (
                         <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:border-gray-400 transition-colors">
                           <Camera className="h-8 w-8 text-gray-400 mb-2" />
                           <p className="text-xs text-gray-500 text-center px-2">
                             No photo uploaded
                           </p>
                         </div>
                       )}
                     </div>
                    
                    <p className="text-xs text-gray-500">
                      Upload a professional headshot (JPG, PNG, max 5MB). Photos will be saved after employee registration.
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idCardIssued"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>ID card issued?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipmentIssued"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Equipment issued?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uniformIssued"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Uniform issued?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextOfKinDetailsComplete"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Next of kin details complete?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="peopleHoursPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>People Hours PIN</FormLabel>
                  <FormControl>
                    <Input placeholder="PIN number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Training and Induction Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Training and Induction
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
               control={form.control}
               name="fullRotasIssued"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Full Rotas Issued</FormLabel>
                   <FormControl>
                     <Input type="date" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />

             <FormField
               control={form.control}
               name="inductionAndTrainingBooked"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Induction and Training Booked</FormLabel>
                   <FormControl>
                     <Input type="date" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Training location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

                         <FormField
               control={form.control}
               name="trainer"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Trainer</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                     <FormControl>
                       <SelectTrigger>
                         <SelectValue placeholder={isLoadingLookupData ? "Loading..." : "Select trainer"} />
                       </SelectTrigger>
                     </FormControl>
                     <SelectContent>
                       {trainers.map((trainer) => (
                         <SelectItem key={trainer.lookupId} value={trainer.value}>
                           {trainer.value}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <FormMessage />
                 </FormItem>
               )}
             />
          </CardContent>
        </Card>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {submitError}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isSubmitting}>
            {isLoading || isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
