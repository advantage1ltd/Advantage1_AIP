import { useState, useCallback, memo, useEffect, useRef } from "react"
import { Incident, IncidentType, IncidentInvolved, StolenItem, RepeatOffenderMatch } from "@/types/incidents"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { format } from "date-fns"
import { CalendarIcon, PlusCircle, Trash2, Package, QrCode, Hash, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {  
  MOCK_OFFICER_ROLES 
} from "@/data/mockDropdownData"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { incidentService } from "@/services/incidentService"
import { useAuth } from "@/hooks/useAuth"
import { customerService } from "@/services/customerService"
import { siteService } from "@/services/siteService"
import { lookupTableService } from "@/services/lookupTableService"
import type { Customer } from "@/types/customer"
import type { Site } from "@/types/customer"
import type { LookupTableItem } from "@/services/lookupTableService"

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer name is required"),
  siteId: z.string().optional(),
  siteName: z.string().min(1, "Site name is required"),
  officerName: z.string().min(1, "Officer name is required"),
  officerRole: z.string().min(1, "Officer role is required"),
  dateOfIncident: z.date({
    required_error: "Date of incident is required",
  }),
  timeOfIncident: z.string().min(1, "Time of incident is required"),
  incidentType: z.string().min(1, "Incident type is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  incidentDetails: z.string().min(10, "Incident details must be at least 10 characters").optional(),
  storeComments: z.string().optional(),
  incidentInvolved: z.array(z.string()).min(1, "At least one incident type must be selected"),
  policeInvolvement: z.boolean().default(false),
  urnNumber: z.string().optional(),
  totalValueRecovered: z.string().optional(),
  stolenItems: z.array(z.object({
    id: z.string(),
    description: z.string(),
    cost: z.number(),
    quantity: z.number(),
    totalAmount: z.number(),
    category: z.string(),
    productName: z.string(),
  })).optional(),
  dutyManagerName: z.string().min(1, "Duty manager name is required"),
  status: z.enum(['pending', 'resolved', 'in-progress']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  actionTaken: z.string().optional(),
  evidenceAttached: z.boolean().default(false),
  witnessStatements: z.array(z.string()).optional(),
  involvedParties: z.array(z.string()).optional(),
  reportNumber: z.string().optional(),
  offenderName: z.string().optional(),
  offenderAddress: z.object({
    houseName: z.string().optional(),
    numberAndStreet: z.string().optional(),
    villageOrSuburb: z.string().optional(),
    town: z.string().optional(),
    county: z.string().optional(),
    postCode: z.string().optional(),
  }),
  gender: z.enum(['Male', 'Female', 'N/A or N/K']).default('N/A or N/K'),
  offenderDOB: z.date().optional(),
  offenderPlaceOfBirth: z.string().optional(),
  offenderMarks: z.string().max(500, 'Marks must be under 500 characters').optional(),
  policeID: z.string().optional(),
  crimeRefNumber: z.string().optional(),
  arrestSaveComment: z.string().optional(),
  offenderDetailsVerified: z.boolean().default(false),
  verificationMethod: z.string().optional(),
  verificationEvidenceImage: z.string().optional(),
}).superRefine((values, context) => {
  if (values.offenderDetailsVerified && !values.verificationMethod) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Verification method is required when details are verified.',
      path: ['verificationMethod'],
    })
  }
})

const incidentTypes: IncidentType[] = [
  IncidentType.ARREST,
  IncidentType.DETER,
  IncidentType.THEFT,
  IncidentType.VIOLENT_BEHAVIOUR,
  IncidentType.ABUSIVE_BEHAVIOUR,
  IncidentType.COLLEAGUE_ASSAULT,
  IncidentType.COLLEAGUE_ABUSE,
  IncidentType.CRIMINAL_DAMAGE,
  IncidentType.CREDIT_CARD_FRAUD,
  IncidentType.SUSPICIOUS_BEHAVIOUR,
  IncidentType.UNDERAGE_PURCHASE,
  IncidentType.ANTI_SOCIAL,
  IncidentType.OTHERS
]

const verificationMethods = [
  'Drivers licence',
  'Police',
  'ID card',
  'Others'
] as const

const formatDateSafe = (value: string | Date | undefined, pattern: string, fallback = 'N/A') => {
  if (!value) {
    return fallback
  }
  const dateValue = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return fallback
  }
  return format(dateValue, pattern)
}

const incidentInvolved: IncidentInvolved[] = [
  IncidentInvolved.SELF_SCAN_TILLS,
  IncidentInvolved.THREATS_AND_INTIMIDATION,
  IncidentInvolved.BAN_FROM_STORE,
  IncidentInvolved.SCAN_AND_GO,
  IncidentInvolved.ABUSIVE_BEHAVIOUR,
  IncidentInvolved.SPITTING,
  IncidentInvolved.VIOLENT_BEHAVIOR,
  IncidentInvolved.POLICE_FAILED_TO_ATTEND
]

// Update the retail categories
const retailCategories = {
  'COOP': [
    { id: 'alcohol', label: 'Alcohol' },
    { id: 'ambient', label: 'Ambient' },
    { id: 'tobacco', label: 'Tobacco' },
    { id: 'meat', label: 'Meat' },
    { id: 'fish', label: 'Fish' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'confectionery', label: 'Confectionery' },
    { id: 'fresh', label: 'Fresh' },
    { id: 'health-beauty', label: 'Health & Beauty' },
    { id: 'household', label: 'Household' },
    { id: 'grocery', label: 'Grocery' },
    { id: 'frozen', label: 'Frozen' },
    { id: 'produce', label: 'Produce' },
    { id: 'bakery', label: 'Bakery' },
    { id: 'non-food', label: 'Non Food' },
    { id: 'other', label: 'Other' }
  ],
  'Tesco': [
    { id: 'f&f', label: 'F&F Clothing' },
    { id: 'fresh', label: 'Fresh & Chilled' },
    { id: 'grocery', label: 'Grocery & Packaged' },
    { id: 'BWS', label: 'Beers, Wines & Spirits' },
    { id: 'health', label: 'Health & Beauty' },
    { id: 'electronics', label: 'Electronics & Entertainment' },
    { id: 'home', label: 'Home & Seasonal' },
  ]
} as const

export interface IncidentFormProps {
  initialData?: Incident | null
  onSubmit: (incident: Incident) => void
  onCancel: () => void
  onScanBarcode: () => void
  onBarcodeScanned?: (barcode: string) => void
  isLoading?: boolean
  customerId?: string
  siteId?: string | null
}

const IncidentForm: React.FC<IncidentFormProps> = memo(({ initialData, onSubmit, onCancel, onScanBarcode, onBarcodeScanned, isLoading = false, customerId: propCustomerId, siteId: propSiteId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';
  
  // Debug logging (remove in production)
  if (initialData) {
    console.log('📝 Form initializing with incident:', initialData.id, '|', initialData.customerName, '|', initialData.siteName)
  }
  
  const [stolenItems, setStolenItems] = useState<StolenItem[]>(initialData?.stolenItems || [])
  const [incidentType, setIncidentType] = useState(initialData?.incidentType || '')
  const [arrestSaveComment, setArrestSaveComment] = useState(initialData?.arrestSaveComment || '')
  const [formErrors, setFormErrors] = useState<{ arrestSaveComment?: string }>({})
  const [offenderVerified, setOffenderVerified] = useState(false)
  const [repeatOffenderCount, setRepeatOffenderCount] = useState(0)
  const [isSearchingOffender, setIsSearchingOffender] = useState(false)
  const [offenderHistory, setOffenderHistory] = useState<{
    matches: RepeatOffenderMatch[];
    totalCount: number;
  } | null>(null)
  const [offenderSearchError, setOffenderSearchError] = useState<string | null>(null)
  const [offenderMarksPreview, setOffenderMarksPreview] = useState<string>(initialData?.offenderMarks || '')
  const [verificationEvidencePreview, setVerificationEvidencePreview] = useState<string>(initialData?.verificationEvidenceImage || '')
  const [zoomedEvidenceImage, setZoomedEvidenceImage] = useState<string | null>(null)
  const [verificationFileName, setVerificationFileName] = useState<string>('')
  const [isProcessingVerificationImage, setIsProcessingVerificationImage] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  
  // State for dynamic customers and sites
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isLoadingSites, setIsLoadingSites] = useState(false)
  
  // State for counties from lookup table
  const [counties, setCounties] = useState<LookupTableItem[]>([])
  const [isLoadingCounties, setIsLoadingCounties] = useState(false)
  
  // State for manual barcode entry
  const [manualBarcode, setManualBarcode] = useState('')
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false)
  const didPrefillSiteRef = useRef(false)
  const previousCustomerIdRef = useRef<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const searchOffender = async (name: string, dob?: Date, marks?: string) => {
    setIsSearchingOffender(true);
    setOffenderSearchError(null);
    try {
      const payload = {
        name,
        dateOfBirth: dob ? format(dob, 'yyyy-MM-dd') : undefined,
        marks: marks?.trim() || undefined,
        page: 1,
        pageSize: 5
      }
      
      const result = await incidentService.searchRepeatOffenders(payload)

      if (result.data.length === 0) {
        setOffenderVerified(false)
        setRepeatOffenderCount(0)
        setOffenderHistory(null)
        return
      }

      setOffenderHistory({
        matches: result.data,
        totalCount: result.pagination.totalCount
      })

      setRepeatOffenderCount(result.pagination.totalCount)
      setOffenderVerified(result.data.length > 0)

      const topMatch = result.data[0]
      if (topMatch.offenderAddress) {
        form.setValue('offenderAddress', topMatch.offenderAddress)
      }
      if (topMatch.gender) {
        const normalizedGender = topMatch.gender.toLowerCase().trim()
        const genderMap: Record<string, 'Male' | 'Female' | 'N/A or N/K'> = {
          male: 'Male',
          female: 'Female',
          'n/a or n/k': 'N/A or N/K',
          'n/a': 'N/A or N/K',
          'n/k': 'N/A or N/K',
          'unknown': 'N/A or N/K'
        }
        const mappedGender = genderMap[normalizedGender]
        if (mappedGender) {
          form.setValue('gender', mappedGender)
        }
      }
      if (topMatch.offenderDOB) {
        form.setValue('offenderDOB', new Date(topMatch.offenderDOB))
      }
      if (topMatch.offenderPlaceOfBirth) {
        form.setValue('offenderPlaceOfBirth', topMatch.offenderPlaceOfBirth)
      }
      if (topMatch.offenderMarks) {
        form.setValue('offenderMarks', topMatch.offenderMarks)
        setOffenderMarksPreview(topMatch.offenderMarks)
      }
    } catch (error) {
      console.error('Error searching offender:', error);
      setOffenderSearchError(error instanceof Error ? error.message : 'Unable to search repeat offenders')
      setOffenderVerified(false);
      setRepeatOffenderCount(0);
      setOffenderHistory(null);
    } finally {
      setIsSearchingOffender(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Validate on change to update isValid state
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      customerId: initialData?.customerId?.toString() || "",
      customerName: initialData?.customerName || "",
      siteId: initialData?.siteId || "",
      siteName: initialData?.siteName || "",
      officerName: initialData?.officerName || "",
      officerRole: initialData?.officerRole || "",
      dateOfIncident: initialData?.dateOfIncident ? new Date(initialData.dateOfIncident) : new Date(),
      timeOfIncident: initialData?.timeOfIncident || "",
      incidentType: initialData?.incidentType || "",
      description: initialData?.description || "",
      incidentDetails: initialData?.incidentDetails || initialData?.description || "",
      storeComments: initialData?.storeComments || "",
      incidentInvolved: initialData?.incidentInvolved || [],
      policeInvolvement: initialData?.policeInvolvement || false,
      urnNumber: initialData?.urnNumber || "",
      totalValueRecovered: initialData?.totalValueRecovered?.toString() || "",
      stolenItems: initialData?.stolenItems || [],
      dutyManagerName: initialData?.dutyManagerName || "",
      status: initialData?.status || 'pending',
      priority: initialData?.priority || 'medium',
      actionTaken: initialData?.actionTaken || "",
      evidenceAttached: initialData?.evidenceAttached || false,
      witnessStatements: initialData?.witnessStatements || [],
      involvedParties: initialData?.involvedParties || [],
      reportNumber: initialData?.reportNumber || "",
      offenderName: initialData?.offenderName || "",
      offenderAddress: initialData?.offenderAddress || {
        houseName: "",
        numberAndStreet: "",
        villageOrSuburb: "",
        town: "",
        county: "",
        postCode: "",
      },
      gender: initialData?.gender || 'N/A or N/K',
      offenderDOB: initialData?.offenderDOB ? new Date(initialData.offenderDOB) : undefined,
      offenderPlaceOfBirth: initialData?.offenderPlaceOfBirth || "",
      offenderMarks: initialData?.offenderMarks || "",
      offenderDetailsVerified: initialData?.offenderDetailsVerified || false,
      verificationMethod: initialData?.verificationMethod || "",
      verificationEvidenceImage: initialData?.verificationEvidenceImage || "",
      policeID: initialData?.policeID || "",
      crimeRefNumber: initialData?.crimeRefNumber || "",
      arrestSaveComment: initialData?.arrestSaveComment || "",
    },
  })

  // Watch customerId for cascading dropdown
  const customerId = form.watch('customerId')
  const selectedCustomer = customers.find(c => c.id.toString() === customerId)
  const offenderMarksValue = form.watch('offenderMarks')
  const offenderDetailsVerified = form.watch('offenderDetailsVerified')
  
  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true)
      try {
        const fetchedCustomers = await customerService.getAllCustomers()
        setCustomers(fetchedCustomers)
        console.log('✅ [IncidentForm] Loaded customers:', fetchedCustomers.length)
      } catch (error) {
        console.error('❌ [IncidentForm] Failed to load customers:', error)
      } finally {
        setIsLoadingCustomers(false)
      }
    }
    
    fetchCustomers()
  }, [])
  
  // Fetch counties from lookup table on mount
  useEffect(() => {
    const fetchCounties = async () => {
      setIsLoadingCounties(true)
      try {
        const fetchedCounties = await lookupTableService.getByCategory('UK_Counties')
        setCounties(fetchedCounties)
        console.log('✅ [IncidentForm] Loaded counties:', fetchedCounties.length)
      } catch (error) {
        console.error('❌ [IncidentForm] Failed to load counties:', error)
        setCounties([])
      } finally {
        setIsLoadingCounties(false)
      }
    }
    
    fetchCounties()
  }, [])
  
  // Fetch sites when customer changes
  useEffect(() => {
    const fetchSites = async () => {
      if (!customerId) {
        setSites([])
        form.setValue('siteId', '')
        form.setValue('siteName', '')
        return
      }

      if (previousCustomerIdRef.current && previousCustomerIdRef.current !== customerId) {
        didPrefillSiteRef.current = false
      }
      
      setIsLoadingSites(true)
      try {
        const customerIdNum = parseInt(customerId, 10)
        const response = await siteService.getSitesByCustomer(customerIdNum)
        if (response.success) {
          setSites(response.data)
          console.log('✅ [IncidentForm] Loaded sites for customer:', response.data.length)
          if (initialData?.siteId && !didPrefillSiteRef.current) {
            const matchById = response.data.find(site => site.siteID?.toString() === initialData.siteId)
            const matchByName = response.data.find(site =>
              site.locationName?.toLowerCase().trim() === (initialData.siteName || '').toLowerCase().trim()
            )
            const matchedSite = matchById || matchByName

            form.setValue('siteId', matchedSite?.siteID?.toString() || initialData.siteId)
            form.setValue('siteName', matchedSite?.locationName || initialData.siteName || '')
            didPrefillSiteRef.current = true
          } else if (!initialData) {
            // Reset site selection when customer changes for new incidents
            form.setValue('siteId', '')
            form.setValue('siteName', '')
          }
        }
      } catch (error) {
        console.error('❌ [IncidentForm] Failed to load sites:', error)
        setSites([])
      } finally {
        previousCustomerIdRef.current = customerId
        setIsLoadingSites(false)
      }
    }
    
    fetchSites()
  }, [customerId, form])

  // Helper functions to get pre-filled data
  const getCustomerNameFromId = (customerId: string): string => {
    // Direct mapping based on actual database customer IDs
    const customerMap: Record<string, string> = {
      '21': 'Central England COOP',
      '22': 'Heart of England COOP', 
      '23': 'Midcounties COOP',
      // Also support MOCK_CUSTOMERS IDs for backward compatibility
      '1': 'Central England COOP',
      '2': 'Midcounties COOP',
      '3': 'Heart of England COOP',
    };
    
    const customerName = customerMap[customerId];
    return customerName || '';
  };

    const getSiteNameFromId = (siteId: string): string => {
    // Map database site IDs to site names (consistent with database sites table)
    const siteMap: Record<string, string> = {
      'SITE001': 'Leicester Central',
      'SITE002': 'Birmingham Store', 
      'SITE003': 'Sheffield Branch',
      'SITE004': 'Oxford City Centre',
      'SITE005': 'Cheltenham Store',
      'SITE006': 'Swindon Branch',
      'SITE007': 'Coventry Central',
      'SITE008': 'Nuneaton Main Store',
      'SITE009': 'Rugby Store',
    };
    
    return siteMap[siteId] || '';
  };

  // Handle customer change
  const handleCustomerChange = (customerIdValue: string) => {
    const customer = customers.find(c => c.id.toString() === customerIdValue)
    if (customer) {
      form.setValue('customerId', customerIdValue)
      form.setValue('customerName', customer.companyName)
      // Site will be reset by the useEffect above
    }
  }
  
  // Handle site change
  const handleSiteChange = (siteIdValue: string) => {
    const site = sites.find(s => s.siteID?.toString() === siteIdValue)
    if (site) {
      form.setValue('siteId', siteIdValue)
      form.setValue('siteName', site.locationName || '')
    }
  }

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    setIsCameraActive(false)
  }

  const startCamera = () => {
    setCameraError(null)
    setIsCameraActive(true)
  }

  const captureVerificationImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    // Set canvas dimensions (limit max size for GDPR-compliant storage)
    const maxWidth = 1920
    const maxHeight = 1080
    let width = video.videoWidth
    let height = video.videoHeight

    // Scale down if image is too large to reduce base64 size
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }

    canvas.width = width
    canvas.height = height
    context.drawImage(video, 0, 0, width, height)

    // Convert to base64 JPEG with quality compression (GDPR compliant - stored in-app)
    // Quality 0.75 provides good balance between size and quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
    
    // Validate size (warn if too large, but still allow)
    const base64Size = dataUrl.length
    if (base64Size > 500000) { // ~500KB base64 = ~375KB image
      console.warn(`Image size is ${Math.round(base64Size / 1024)}KB. Consider retaking with better lighting.`)
    }

    form.setValue('verificationEvidenceImage', dataUrl, { shouldValidate: true })
    setVerificationEvidencePreview(dataUrl)
    setVerificationFileName('captured-image.jpg')
    stopCamera()
  }

  const handleRetakeVerificationImage = () => {
    setVerificationEvidencePreview('')
    setVerificationFileName('')
    form.setValue('verificationEvidenceImage', '')
    setCameraError(null)
  }

  // Pre-fill customer, site, and officer info for new incidents
  useEffect(() => {
    if (!initialData && customers.length > 0) {
      // Auto-fill customer and site when props are provided
      if (propCustomerId) {
        const customer = customers.find(c => c.id.toString() === propCustomerId)
        if (customer) {
          form.setValue('customerId', propCustomerId)
          form.setValue('customerName', customer.companyName)
          
          // If siteId is also provided, fetch sites and set the site
          if (propSiteId && sites.length > 0) {
            const site = sites.find(s => s.siteID?.toString() === propSiteId)
            if (site) {
              form.setValue('siteId', propSiteId)
              form.setValue('siteName', site.locationName || '')
            }
          }
        }
      }
      
      // Auto-fill officer information from current user
      if (user) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (fullName) {
          form.setValue('officerName', fullName);
        }
        
        // Auto-fill officer role if available
        if (user.role) {
          // Map user roles to officer roles
          const roleMapping: Record<string, string> = {
            'Security Officer': 'Security Officer',
            'advantageoneofficer': 'Security Officer',
            'customersitemanager': 'Site Manager',
            'customerhomanager': 'Head of Security',
            'administrator': 'Security Officer'
          };
          
          const officerRole = roleMapping[user.role] || 'Security Officer';
          form.setValue('officerRole', officerRole);
        }
      }
    }
  }, [propCustomerId, propSiteId, initialData, form, user, customers, sites]);

  useEffect(() => {
    if (initialData && initialData.id) {
      setStolenItems(initialData.stolenItems || [])
      setIncidentType(initialData.incidentType || '')
      setArrestSaveComment(initialData.arrestSaveComment || '')
      setVerificationEvidencePreview(initialData.verificationEvidenceImage || '')
      
      // Reset form with the new initial data - fix date handling
      const formData = {
        customerId: initialData.customerId?.toString() || "",
        customerName: initialData.customerName || "",
        siteId: initialData.siteId || "",
        siteName: initialData.siteName || "",
        officerName: initialData.officerName || "",
        officerRole: initialData.officerRole || "",
        dateOfIncident: initialData.dateOfIncident ? new Date(initialData.dateOfIncident) : new Date(),
        timeOfIncident: initialData.timeOfIncident || "",
        incidentType: initialData.incidentType || "",
        description: initialData.description || "",
        incidentDetails: initialData.incidentDetails || initialData.description || "",
        storeComments: initialData.storeComments || "",
        incidentInvolved: initialData.incidentInvolved || [],
        policeInvolvement: initialData.policeInvolvement || false,
        urnNumber: initialData.urnNumber || "",
        totalValueRecovered: initialData.totalValueRecovered?.toString() || "",
        stolenItems: initialData.stolenItems || [],
        dutyManagerName: initialData.dutyManagerName || "",
        status: initialData.status || 'pending',
        priority: initialData.priority || 'medium',
        actionTaken: initialData.actionTaken || "",
        evidenceAttached: initialData.evidenceAttached || false,
        witnessStatements: initialData.witnessStatements || [],
        involvedParties: initialData.involvedParties || [],
        reportNumber: initialData.reportNumber || "",
        offenderName: initialData.offenderName || "",
        offenderAddress: initialData.offenderAddress || {
          houseName: "",
          numberAndStreet: "",
          villageOrSuburb: "",
          town: "",
          county: "",
          postCode: "",
        },
        gender: initialData.gender || 'N/A or N/K',
        offenderDOB: initialData.offenderDOB ? new Date(initialData.offenderDOB) : undefined,
        offenderPlaceOfBirth: initialData.offenderPlaceOfBirth || "",
        offenderMarks: initialData.offenderMarks || "",
        offenderDetailsVerified: initialData.offenderDetailsVerified || false,
        verificationMethod: initialData.verificationMethod || "",
        verificationEvidenceImage: initialData.verificationEvidenceImage || "",
        policeID: initialData.policeID || "",
        crimeRefNumber: initialData.crimeRefNumber || "",
        arrestSaveComment: initialData.arrestSaveComment || "",
      }
      
      // Use form.reset with proper timing to ensure all fields update
      setTimeout(() => {
        form.reset(formData)
        // Force update critical fields that might not populate correctly
        form.setValue('customerId', formData.customerId)
        form.setValue('customerName', formData.customerName)
        form.setValue('siteId', formData.siteId)
        form.setValue('siteName', formData.siteName)
        form.setValue('officerName', formData.officerName)
        form.setValue('incidentType', formData.incidentType)
        form.setValue('status', formData.status)
        form.setValue('priority', formData.priority)
        form.setValue('incidentInvolved', formData.incidentInvolved)
        if (formData.dateOfIncident) {
          form.setValue('dateOfIncident', formData.dateOfIncident)
        }
        if (formData.offenderDOB) {
          form.setValue('offenderDOB', formData.offenderDOB)
        }
        if (formData.verificationEvidenceImage) {
          setVerificationEvidencePreview(formData.verificationEvidenceImage)
        } else {
          setVerificationEvidencePreview('')
        }
      }, 100)
    }
  }, [initialData?.id, form])

  // Update stolen items when initialData.stolenItems changes (e.g., from barcode scanning)
  useEffect(() => {
    if (initialData?.stolenItems && initialData.stolenItems.length !== stolenItems.length) {
      setStolenItems(initialData.stolenItems)
    } else if (initialData?.stolenItems) {
      // Deep comparison for array content changes
      const currentIds = stolenItems.map(item => item.id).join(',')
      const newIds = initialData.stolenItems.map(item => item.id).join(',')
      if (currentIds !== newIds) {
        setStolenItems(initialData.stolenItems)
      }
    }
  }, [initialData?.stolenItems, stolenItems])

  // Add useEffect to update totalValueRecovered when stolen items change
  React.useEffect(() => {
    const totalValue = stolenItems.reduce((sum, item) => sum + item.totalAmount, 0);
    form.setValue('totalValueRecovered', totalValue.toString(), { shouldValidate: false });
  }, [stolenItems, form]);

  // Update incidentDetails value whenever description changes
  const descriptionValue = form.watch('description')
  React.useEffect(() => {
    if (descriptionValue) {
      form.setValue('incidentDetails', descriptionValue, { shouldValidate: true })
    }
  }, [descriptionValue, form])

  React.useEffect(() => {
    setOffenderMarksPreview(offenderMarksValue || '')
  }, [offenderMarksValue])

  React.useEffect(() => {
    if (!offenderDetailsVerified) {
      form.setValue('verificationMethod', '')
      form.setValue('verificationEvidenceImage', '')
      setVerificationEvidencePreview('')
      setVerificationFileName('')
      stopCamera()
    }
  }, [offenderDetailsVerified, form])

  useEffect(() => {
    const attachCameraStream = async () => {
      if (!isCameraActive) {
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported in this browser or context.')
        setIsCameraActive(false)
        return
      }

      setIsProcessingVerificationImage(true)

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        })
        cameraStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        setCameraError('Unable to access camera. Please check permissions or HTTPS.')
        setIsCameraActive(false)
      } finally {
        setIsProcessingVerificationImage(false)
      }
    }

    attachCameraStream()
  }, [isCameraActive])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Log form values for debugging
      console.log('Form values (on submit):', values)
      console.log('URN Number:', values.urnNumber)
      console.log('Crime Ref Number:', values.crimeRefNumber)
      console.log('Form validation state:', form.formState)

      // Guard for dateOfIncident
      const isValidDateOfIncident = values.dateOfIncident && !isNaN(new Date(values.dateOfIncident).getTime())
      
      // Format time of day safely
      let timeOfDay = ''
      if (values.timeOfIncident && isValidDateOfIncident) {
        try {
          // Create a date object from today's date and the time value
          const [hours, minutes] = values.timeOfIncident.split(':')
          const date = new Date()
          date.setHours(parseInt(hours, 10))
          date.setMinutes(parseInt(minutes, 10))
          timeOfDay = format(date, 'HH:mm')
        } catch (error) {
          console.error('Error formatting time:', error)
          timeOfDay = values.timeOfIncident // fallback to original value
        }
      }

      let errors: { arrestSaveComment?: string } = {}
      if (values.incidentType === 'Arrest - Saved?' && !values.arrestSaveComment.trim()) {
        errors.arrestSaveComment = 'This comment is required.'
      }
      setFormErrors(errors)
      if (Object.keys(errors).length > 0) return

      // Get customerId and siteId from form values or props
      const finalCustomerId = values.customerId || propCustomerId || selectedCustomer?.id?.toString() || '0'
      const finalSiteId = values.siteId || propSiteId || ''
      
      const formattedData: Incident = {
        id: initialData?.id || uuidv4(),
        customerId: parseInt(finalCustomerId, 10),
        siteId: finalSiteId,
        customerName: values.customerName,
        siteName: values.siteName,
        officerName: values.officerName,
        officerRole: values.officerRole,
        dateOfIncident: isValidDateOfIncident ? new Date(values.dateOfIncident).toISOString() : '',
        timeOfIncident: values.timeOfIncident,
        incidentType: values.incidentType,
        description: values.description,
        incidentInvolved: values.incidentInvolved,
        policeInvolvement: values.policeInvolvement,
        dutyManagerName: values.dutyManagerName,
        status: values.status,
        priority: values.priority,
        evidenceAttached: values.evidenceAttached,
        offenderAddress: values.offenderAddress,
        gender: values.gender,
        stolenItems: stolenItems.map(item => ({
          ...item,
          totalAmount: item.cost * item.quantity
        })),
        // Optional fields
        incidentDetails: values.incidentDetails,
        storeComments: values.storeComments,
        urnNumber: values.urnNumber || '',
        totalValueRecovered: parseFloat(values.totalValueRecovered || '0'),
        actionTaken: values.actionTaken,
        witnessStatements: values.witnessStatements,
        involvedParties: values.involvedParties,
        reportNumber: values.reportNumber,
        offenderName: values.offenderName,
        offenderDOB: values.offenderDOB,
        offenderPlaceOfBirth: values.offenderPlaceOfBirth,
        offenderMarks: values.offenderMarks,
        offenderDetailsVerified: values.offenderDetailsVerified,
        verificationMethod: values.verificationMethod,
        verificationEvidenceImage: values.verificationEvidenceImage,
        policeID: values.policeID,
        crimeRefNumber: values.crimeRefNumber || '',
        // Additional fields
        dateInputted: new Date().toISOString(),
        arrestSaveComment: values.arrestSaveComment,
      }
      console.log('Formatted data to submit:', formattedData)
      onSubmit(formattedData)
    } catch (error) {
      console.error('Error submitting incident:', error)
    }
  }

  const addStolenItem = () => {
    // Check if the last stolen item is complete before adding a new one
    if (stolenItems.length > 0) {
      const lastItem = stolenItems[stolenItems.length - 1]
      const incompleteFields = []
      
      if (!lastItem.category) incompleteFields.push('Category')
      if (!lastItem.productName) incompleteFields.push('Product Name')
      if (!lastItem.description) incompleteFields.push('Description')
      if (!lastItem.cost || lastItem.cost <= 0) incompleteFields.push('Cost')
      if (!lastItem.quantity || lastItem.quantity <= 0) incompleteFields.push('Quantity')

      if (incompleteFields.length > 0) {
        // Show error message to user
        form.setError('root', {
          type: 'manual',
          message: `Please complete the previous stolen item before adding a new one. Missing: ${incompleteFields.join(', ')}`
        })
        return
      }
    }

    // Clear any existing error
    form.clearErrors('root')
    
    setStolenItems([
      ...stolenItems,
      {
        id: Date.now().toString(),
        category: "",
        description: "",
        productName: "",
        cost: 0,
        quantity: 1,
        totalAmount: 0,
      },
    ])
  }

  const updateStolenItem = (index: number, field: keyof StolenItem, value: any) => {
    const updatedItems = [...stolenItems]
    const item = updatedItems[index]
    
    const updatedItem = {
      ...item,
      [field]: value
    }
    
    // Update totalAmount if cost or quantity changes
    if (field === 'cost' || field === 'quantity') {
      updatedItem.totalAmount = updatedItem.cost * updatedItem.quantity
    }
    
    updatedItems[index] = updatedItem
    setStolenItems(updatedItems)
  }

  const removeStolenItem = (index: number) => {
    setStolenItems(stolenItems.filter((_, i) => i !== index))
  }

  const handleManualBarcodeEntry = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    const barcode = manualBarcode.trim()
    
    if (!barcode) {
      return
    }
    
    if (!onBarcodeScanned) {
      console.warn('onBarcodeScanned handler not provided')
      return
    }
    
    setIsProcessingBarcode(true)
    try {
      await onBarcodeScanned(barcode)
      setManualBarcode('') // Clear input on success
    } catch (error) {
      console.error('Error processing manual barcode:', error)
    } finally {
      setIsProcessingBarcode(false)
    }
  }

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualBarcodeEntry()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 min-h-screen">
        {zoomedEvidenceImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Verification evidence preview"
            onClick={() => setZoomedEvidenceImage(null)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-3xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute -top-3 -right-3 rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow"
                onClick={() => setZoomedEvidenceImage(null)}
                aria-label="Close preview"
              >
                Close
              </button>
              <img
                src={zoomedEvidenceImage}
                alt="Verification evidence enlarged view"
                className="max-h-[90vh] w-full rounded-lg bg-white object-contain"
              />
            </div>
          </div>
        )}
        <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">New Incident Report</h1>
                <p className="text-gray-600 mt-1">Complete all required fields to submit your incident report. Fields marked with * are mandatory.</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                    <p className="text-sm text-gray-500">Essential incident details</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Customer Name *</FormLabel>
                        {!isAdmin && propCustomerId ? (
                          <div className="flex h-11 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                            {form.watch('customerName') || 'Loading...'}
                          </div>
                        ) : (
                          <Select 
                            onValueChange={handleCustomerChange} 
                            value={field.value}
                            disabled={isLoadingCustomers}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                                <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select customer"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.companyName}
                                </SelectItem>
                              ))}
                              {customers.length === 0 && !isLoadingCustomers && (
                                <SelectItem value="no-customers" disabled>No customers available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Site Name *</FormLabel>
                        {!isAdmin && propSiteId ? (
                          <div className="flex h-11 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                            {form.watch('siteName') || 'Loading...'}
                          </div>
                        ) : (
                          <Select 
                            onValueChange={handleSiteChange} 
                            value={field.value || ''}
                            disabled={!customerId || isLoadingSites}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                                <SelectValue placeholder={
                                  !customerId 
                                    ? "Select customer first" 
                                    : isLoadingSites 
                                      ? "Loading sites..." 
                                      : "Select site"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sites.map((site) => {
                                const siteIdValue = site.siteID?.toString() || ''
                                const siteNameValue = site.locationName || ''
                                return (
                                  <SelectItem key={siteIdValue} value={siteIdValue}>
                                    {siteNameValue}
                                  </SelectItem>
                                )
                              })}
                              {sites.length === 0 && customerId && !isLoadingSites && (
                                <SelectItem value="no-sites" disabled>No sites available for this customer</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="officerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Officer Name *</FormLabel>
                        <FormControl>
                          <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter officer name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="officerRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Officer Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOCK_OFFICER_ROLES.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
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
                    name="dutyManagerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Duty Manager Name *</FormLabel>
                        <FormControl>
                          <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter duty manager name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Incident Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600">🕒</div>
                  <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900">Incident Details</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dateOfIncident"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Date of Incident *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full h-12 px-4 text-left font-medium bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg shadow-sm",
                                  !field.value && "text-gray-400"
                                )}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="flex items-center gap-3">
                                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                                    {field.value ? (
                                      <span className="text-gray-900 font-medium">
                                        {format(field.value, "EEE, MMM d, yyyy")}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">Select incident date</span>
                                    )}
                                  </span>
                                </div>
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-2 border-gray-200 shadow-lg rounded-lg" align="start">
                            <div className="p-4 bg-white rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={field.value ? field.value.getMonth() : new Date().getMonth()}
                                    onChange={(e) => {
                                      const newDate = new Date(field.value || new Date())
                                      newDate.setMonth(parseInt(e.target.value))
                                      field.onChange(newDate)
                                    }}
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i} value={i}>
                                        {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={field.value ? field.value.getFullYear() : new Date().getFullYear()}
                                    onChange={(e) => {
                                      const newDate = new Date(field.value || new Date())
                                      newDate.setFullYear(parseInt(e.target.value))
                                      field.onChange(newDate)
                                    }}
                                  >
                                    {Array.from({ length: 100 }, (_, i) => {
                                      const year = new Date().getFullYear() - i
                                      return (
                                        <option key={year} value={year}>
                                          {year}
                                        </option>
                                      )
                                    })}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => field.onChange(new Date())}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                >
                                  Today
                                </button>
                              </div>
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                month={field.value || new Date()}
                                onMonthChange={(month) => {
                                  const newDate = new Date(field.value || new Date())
                                  newDate.setMonth(month.getMonth())
                                  newDate.setFullYear(month.getFullYear())
                                  field.onChange(newDate)
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date('1920-01-01')
                                }
                                className="rounded-lg"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeOfIncident"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Time of Incident *</FormLabel>
                        <FormControl>
                          <Input type="time" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Type of Incident *</FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={value => {
                            field.onChange(value) // Update form field
                            setIncidentType(value) // Update local state for UI logic
                            if (value !== 'Arrest - Saved?') {
                              setArrestSaveComment('')
                              form.setValue('arrestSaveComment', '') // Clear form field too
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incidentTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(field.value === 'Arrest - Saved?' || incidentType === 'Arrest - Saved?') && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrest Save Comment <span className="text-red-500">*</span></label>
                            <textarea
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={arrestSaveComment}
                              onChange={e => {
                                const value = e.target.value
                                setArrestSaveComment(value)
                                form.setValue('arrestSaveComment', value) // Sync with form
                              }}
                              required
                              placeholder="Did this lead to a save or was the item lost after arrest?"
                            />
                            {formErrors.arrestSaveComment && (
                              <p className="text-xs text-red-600 mt-1">{formErrors.arrestSaveComment}</p>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600">📝</div>
                  <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900">Description</h2>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Incident Details *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the incident in detail"
                            className="min-h-[150px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hidden field for incidentDetails */}
                  <FormField
                    control={form.control}
                    name="incidentDetails"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Store Comments</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any store-specific comments"
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Police Involvement */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600">👮</div>
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900">Police Involvement</h2>
                </div>
              </div>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="policeInvolvement"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-8">
                        <FormLabel className="text-base font-medium sm:min-w-[150px] lg:min-w-[180px]">Was Police Involved?</FormLabel>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={field.value === true}
                              onChange={() => field.onChange(true)}
                              className="h-5 w-5"
                            />
                            <span className="text-base">Yes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={field.value === false}
                              onChange={() => field.onChange(false)}
                              className="h-5 w-5"
                            />
                            <span className="text-base">No</span>
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('policeInvolvement') && (
                  <div className="space-y-3 sm:space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="urnNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 mb-2">URN Number</FormLabel>
                            <FormControl>
                              <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter URN Number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="crimeRefNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Crime Reference Number</FormLabel>
                            <FormControl>
                              <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter reference number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Offender Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600">👤</div>
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900">Offender Details</h2>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="offenderName"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Offender Name</FormLabel>
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <FormControl>
                              <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter offender name" />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 whitespace-nowrap"
                              onClick={() => {
                                if (!field.value) return;
                                const dob = form.getValues('offenderDOB');
                                const marks = form.getValues('offenderMarks');
                                searchOffender(field.value, dob, marks || offenderMarksPreview);
                              }}
                              disabled={isSearchingOffender}
                            >
                              {isSearchingOffender ? 'Searching...' : 'Search History'}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                              "border",
                              repeatOffenderCount > 0 
                                ? "bg-red-50 text-red-800 border-red-100"
                                : "bg-green-50 text-green-800 border-green-100"
                            )}>
                              Repeat Offender Count: {repeatOffenderCount}
                            </Badge>
                            <Badge variant="outline" className={cn(
                              "border",
                              offenderVerified
                                ? "bg-green-50 text-green-800 border-green-100"
                                : "bg-blue-50 text-blue-800 border-blue-100"
                            )}>
                              {offenderVerified ? 'Details Verified' : 'Details Not Verified'}
                            </Badge>
                          </div>
                        {offenderSearchError && (
                          <div className="mt-2 text-sm text-red-600">
                            {offenderSearchError}
                          </div>
                        )}
                        {offenderHistory && (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-700">Potential Matches</p>
                              <span className="text-xs text-gray-500">
                                Showing {offenderHistory.matches.length} of {offenderHistory.totalCount}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {offenderHistory.matches.map((match, matchIndex) => (
                                <div key={`${match.offenderName}-${matchIndex}`} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">{match.offenderName}</p>
                                      <p className="text-xs text-gray-600">
                                        DOB: {formatDateSafe(match.offenderDOB, 'dd MMM yyyy')}
                                      </p>
                                      {match.offenderMarks && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          Marks: {match.offenderMarks}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700"
                                      onClick={() => {
                                        form.setValue('offenderName', match.offenderName)
                                        if (match.offenderDOB) {
                                          form.setValue('offenderDOB', new Date(match.offenderDOB))
                                        }
                                        if (match.offenderAddress) {
                                          form.setValue('offenderAddress', match.offenderAddress)
                                        }
                                        if (match.gender) {
                                          form.setValue('gender', match.gender as 'Male' | 'Female' | 'N/A or N/K')
                                        }
                                        if (match.offenderPlaceOfBirth) {
                                          form.setValue('offenderPlaceOfBirth', match.offenderPlaceOfBirth)
                                        }
                                        if (match.offenderMarks) {
                                          form.setValue('offenderMarks', match.offenderMarks)
                                          setOffenderMarksPreview(match.offenderMarks)
                                        }
                                        const verificationSource = match.recentIncidents.find((incident) =>
                                          incident.offenderDetailsVerified !== undefined ||
                                          Boolean(incident.verificationMethod) ||
                                          Boolean(incident.verificationEvidenceImage)
                                        )
                                        if (verificationSource) {
                                          const isVerified = verificationSource.offenderDetailsVerified
                                            ?? Boolean(verificationSource.verificationMethod || verificationSource.verificationEvidenceImage)
                                          form.setValue('offenderDetailsVerified', isVerified, { shouldValidate: true })
                                          form.setValue('verificationMethod', verificationSource.verificationMethod || '', { shouldValidate: true })
                                          form.setValue('verificationEvidenceImage', verificationSource.verificationEvidenceImage || '', { shouldValidate: true })
                                          setVerificationEvidencePreview(verificationSource.verificationEvidenceImage || '')
                                          setVerificationFileName(verificationSource.verificationEvidenceImage ? 'history-evidence.jpg' : '')
                                        }
                                        setOffenderVerified(true)
                                      }}
                                      aria-label={`Use offender details for ${match.offenderName}`}
                                    >
                                      Use details
                                    </Button>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    {match.recentIncidents.map((incident) => (
                                      <div key={incident.incidentId} className="text-xs text-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-t border-dashed pt-1 first:border-none first:pt-0">
                                        <span>{formatDateSafe(incident.dateOfIncident, 'dd MMM yyyy')} - {incident.siteName}</span>
                                        <span className="text-gray-500">{incident.incidentType}</span>
												{(incident.offenderDetailsVerified !== undefined || incident.verificationMethod || incident.verificationEvidenceImage) && (
													<div className="text-[11px] text-gray-600 flex flex-wrap gap-x-2 gap-y-1 sm:basis-full">
														{incident.offenderDetailsVerified !== undefined && (
															<span>Verified: {incident.offenderDetailsVerified ? 'Yes' : 'No'}</span>
														)}
														{incident.verificationMethod && (
															<span>Method: {incident.verificationMethod}</span>
														)}
														{incident.verificationEvidenceImage && (
															<span className="text-gray-500">Evidence attached</span>
														)}
													</div>
												)}
												{incident.verificationEvidenceImage && (
													<img
														src={incident.verificationEvidenceImage}
														alt={`Verification evidence for ${match.offenderName}`}
														className="mt-1 max-h-20 w-full max-w-[160px] cursor-zoom-in rounded-md border border-gray-200 object-contain sm:basis-full"
														loading="lazy"
														onClick={() => setZoomedEvidenceImage(incident.verificationEvidenceImage || null)}
													/>
												)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-1">
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                              <SelectValue placeholder="N/A or N/K" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="N/A or N/K">N/A or N/K</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="offenderDOB"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full h-11 pl-3 text-left font-normal bg-white",
                                  !field.value && "text-muted-foreground hover:bg-gray-50",
                                  field.value && "text-gray-900 hover:bg-gray-50"
                                )}
                              >
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2 opacity-50" />
                                  {field.value ? (
                                    <span>{format(field.value, "PPP")}</span>
                                  ) : (
                                    <span className="text-gray-500">Select date of birth</span>
                                  )}
                                </div>
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-2 border-gray-200 shadow-lg rounded-lg" align="start">
                            <div className="p-4 bg-white rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={field.value ? field.value.getMonth() : 0}
                                    onChange={(e) => {
                                      const newDate = new Date(field.value || new Date(1990, 0, 1))
                                      newDate.setMonth(parseInt(e.target.value))
                                      field.onChange(newDate)
                                    }}
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i} value={i}>
                                        {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={field.value ? field.value.getFullYear() : 1990}
                                    onChange={(e) => {
                                      const newDate = new Date(field.value || new Date(1990, 0, 1))
                                      newDate.setFullYear(parseInt(e.target.value))
                                      field.onChange(newDate)
                                    }}
                                  >
                                    {Array.from({ length: 100 }, (_, i) => {
                                      const year = 2010 - i
                                      return (
                                        <option key={year} value={year}>
                                          {year}
                                        </option>
                                      )
                                    })}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => field.onChange(new Date(1990, 0, 1))}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                >
                                  1990
                                </button>
                              </div>
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                month={field.value || new Date(1990, 0)}
                                onMonthChange={(month) => {
                                  const newDate = new Date(field.value || new Date(1990, 0, 1))
                                  newDate.setMonth(month.getMonth())
                                  newDate.setFullYear(month.getFullYear())
                                  field.onChange(newDate)
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date('1920-01-01')
                                }
                                className="rounded-lg"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        {field.value && (
                          <div className="mt-1.5 text-sm text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Age: <span className="font-medium">{Math.floor((new Date().getTime() - field.value.getTime()) / (365.25 * 24 * 60 * 60 * 1000))}</span>
                            </span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="offenderMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Distinguishing Marks / Tattoos</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe tattoos, scars, or other identifying marks"
                            className="min-h-[80px]"
                            {...field}
                            onChange={(event) => {
                              field.onChange(event)
                              setOffenderMarksPreview(event.target.value)
                            }}
                          />
                        </FormControl>
                        <FormDescription>Include tattoos, scars, or marks that aid identification (max 500 chars).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="offenderDetailsVerified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Details Verified?</FormLabel>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                            className="h-4 w-4"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                            className="h-4 w-4"
                          />
                          No
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              {offenderDetailsVerified && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                  <FormField
                    control={form.control}
                    name="verificationMethod"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-1">
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Verification Method *</FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                              <SelectValue placeholder="Select verification method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {verificationMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
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
                    name="verificationEvidenceImage"
                    render={() => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Verification Evidence</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {verificationEvidencePreview ? (
                              <div className="space-y-3">
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <img
                                    src={verificationEvidencePreview}
                                    alt="Verification evidence preview"
                                    className="max-h-56 w-full cursor-zoom-in rounded-md object-contain"
                                    onClick={() => setZoomedEvidenceImage(verificationEvidencePreview)}
                                  />
                                  {verificationFileName && (
                                    <p className="mt-2 text-xs text-gray-500">{verificationFileName}</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={startCamera}
                                    className="h-9 text-xs sm:text-sm"
                                  >
                                    Capture New Image
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRetakeVerificationImage}
                                    className="h-9 text-xs sm:text-sm"
                                  >
                                    Remove Image
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {isCameraActive ? (
                                  <div className="space-y-3">
                                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                                      <div className="mx-auto w-full max-w-sm sm:max-w-lg">
                                        <video ref={videoRef} className="w-full rounded-md" playsInline muted />
                                      </div>
                                      <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={captureVerificationImage}
                                        className="h-9 text-xs sm:text-sm"
                                      >
                                        Capture Image
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={stopCamera}
                                        className="h-9 text-xs sm:text-sm"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={startCamera}
                                    className="h-9 text-xs sm:text-sm"
                                    disabled={isProcessingVerificationImage}
                                  >
                                    {isProcessingVerificationImage ? 'Starting Camera...' : 'Capture Image'}
                                  </Button>
                                )}
                              </div>
                            )}
                            {cameraError && (
                              <p className="text-xs text-red-600">{cameraError}</p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

                <div className="space-y-3 sm:space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="offenderAddress.numberAndStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Address</FormLabel>
                        <FormControl>
                          <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter street address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="offenderAddress.town"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Town</FormLabel>
                          <FormControl>
                            <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter town" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offenderAddress.county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 mb-2">County</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            disabled={isLoadingCounties}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                                <SelectValue placeholder={isLoadingCounties ? "Loading counties..." : "Select county"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {counties.map((county) => (
                                <SelectItem key={county.lookupId} value={county.value}>
                                  {county.value}
                                </SelectItem>
                              ))}
                              {counties.length === 0 && !isLoadingCounties && (
                                <SelectItem value="no-counties" disabled>No counties available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offenderPlaceOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Place of Birth</FormLabel>
                          <FormControl>
                            <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter place of birth" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offenderAddress.postCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 mb-2">Post Code</FormLabel>
                          <FormControl>
                            <Input className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm" {...field} placeholder="Enter post code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600">🏷️</div>
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900">Incident Categories</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {incidentInvolved.map((type) => (
                  <FormField
                    key={type}
                    control={form.control}
                    name="incidentInvolved"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(type)}
                            onCheckedChange={(checked) => {
                              const current = field.value || []
                              const updated = checked
                                ? [...current, type]
                                : current.filter((value) => value !== type)
                              field.onChange(updated)
                            }}
                            className="h-5 w-5 mt-1"
                          />
                        </FormControl>
                        <FormLabel className="text-base font-normal">
                          {type}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Stolen Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600">💰</div>
                  <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900">Stolen Items</h2>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={onScanBarcode}
                    variant="outline"
                    size="lg"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
                  >
                    <QrCode className="h-5 w-5" />
                    Scan Barcode
                  </Button>
                  <Button
                    type="button"
                    onClick={addStolenItem}
                    variant="outline"
                    size="lg"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Manual Barcode Entry */}
              {onBarcodeScanned && (
                <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label htmlFor="manual-barcode" className="text-sm font-medium text-gray-700 mb-2 block">
                    Or enter barcode number manually
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="manual-barcode"
                        type="text"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="Enter barcode number"
                        disabled={isProcessingBarcode}
                        className="pl-10 h-11 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                        aria-label="Manual barcode entry"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleManualBarcodeEntry}
                      disabled={!manualBarcode.trim() || isProcessingBarcode}
                      variant="default"
                      size="lg"
                      className="min-h-[44px] sm:w-auto w-full"
                    >
                      {isProcessingBarcode ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Add Product
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the barcode number and press Enter or click "Add Product" to automatically add the product
                  </p>
                </div>
              )}

              {/* Validation Error Display */}
              {form.formState.errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-red-700">
                    {form.formState.errors.root.message}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="hidden sm:grid sm:grid-cols-12 gap-4">
                  <div className="col-span-2">
                    <Label className="text-base font-medium">Category</Label>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-base font-medium">Product Name</Label>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-base font-medium">Description</Label>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-base font-medium">Cost</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-base font-medium">Qty</Label>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-base font-medium">Total</Label>
                  </div>
                </div>

                {stolenItems.length > 0 ? (
                  <div className="space-y-4">
                    {stolenItems.map((item, index) => (
                      <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center border-b sm:border-0 pb-4 sm:pb-0">
                        <div className="w-full sm:col-span-2">
                          <Label className="sm:hidden mb-1 block text-sm font-medium">Category</Label>
                          <Select
                            value={item.category}
                            onValueChange={(value) => updateStolenItem(index, "category", value)}
                          >
                            <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {retailCategories.COOP.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full sm:col-span-3">
                          <Label className="sm:hidden mb-1 block text-sm font-medium">Product Name</Label>
                          <Input
                            className="h-11"
                            value={item.productName}
                            onChange={(e) => updateStolenItem(index, "productName", e.target.value)}
                            placeholder="Product name"
                          />
                        </div>
                        <div className="w-full sm:col-span-2">
                          <Label className="sm:hidden mb-1 block text-sm font-medium">Description</Label>
                          <Input
                            className="h-11"
                            value={item.description}
                            onChange={(e) => updateStolenItem(index, "description", e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="w-full sm:col-span-2">
                          <Label className="sm:hidden mb-1 block text-sm font-medium">Cost</Label>
                          <Input
                            className="h-11"
                            type="number"
                            step="0.01"
                            value={item.cost}
                            onChange={(e) => updateStolenItem(index, "cost", parseFloat(e.target.value))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="w-full sm:col-span-1">
                          <Label className="sm:hidden mb-1 block text-sm font-medium">Quantity</Label>
                          <Input
                            className="h-11"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateStolenItem(index, "quantity", parseInt(e.target.value))}
                            placeholder="1"
                          />
                        </div>
                        <div className="w-full sm:col-span-2 flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="sm:hidden mb-1 block text-sm font-medium">Total</Label>
                            <Input
                              className="h-11 text-right"
                              type="number"
                              value={item.totalAmount}
                              disabled
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStolenItem(index)}
                            className="text-red-500 hover:text-red-600 h-12 w-12 flex items-center justify-center"
                          >
                            <Trash2 className="h-7 w-7" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 lg:py-12 border border-dashed rounded-lg">
                    <div className="flex justify-center mb-4">
                      <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    </div>
                    <p className="text-base text-gray-600">No items added</p>
                    <p className="text-sm text-gray-500">Click "Add Item" to start recording stolen items</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">Total Items:</span>
                    <span className="text-lg font-semibold">{stolenItems.length}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="text-base font-medium">Total Value Recovered:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg sm:text-xl font-semibold">£</span>
                      <span className="text-lg sm:text-xl font-semibold">
                        {stolenItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">(Auto-saved)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col gap-3 pt-4">
              {/* Error Summary */}
              {(() => {
                const errors: Array<{ field: string; message: string }> = []
                
                // Flatten nested errors (e.g., offenderAddress.county)
                const flattenErrors = (obj: any, prefix = ''): void => {
                  Object.entries(obj).forEach(([key, value]) => {
                    const fieldPath = prefix ? `${prefix}.${key}` : key
                    if (value && typeof value === 'object') {
                      if ('message' in value) {
                        errors.push({ field: fieldPath, message: (value as any).message })
                      } else {
                        flattenErrors(value, fieldPath)
                      }
                    }
                  })
                }
                
                flattenErrors(form.formState.errors)
                
                return errors.length > 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {errors.map(({ field, message }) => (
                        <li key={field}>
                          <span className="font-semibold">{field}:</span> {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              })()}
              
              <div className="flex justify-end items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="h-9 px-4 text-sm"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="h-9 px-4 text-sm bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
})

IncidentForm.displayName = 'IncidentForm'

export { IncidentForm }
