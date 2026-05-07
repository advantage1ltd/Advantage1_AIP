import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { 
  Car,
  MapPin,
  Plus,
  Trash2,
  User,
  Train,
  Bus,
  Loader2,
  X,
  Receipt,
  Wrench,
  Building,
  CircleDot,
  Bike,
  Users,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Edit3,
  Check,
  PoundSterling
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { calculatePostcodeDistance, isValidUKPostcode } from '@/utils/postcodeDistance'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { officerExpenseService } from '@/services/officerExpenseService'
import { savedLocationService, type SavedLocation as SavedLocationType } from '@/services/savedLocationService'
import type { CreateOfficerExpenseClaimDto, CreateOfficerExpenseDayDto, CreateOfficerExpenseMileageDto, CreateOfficerExpenseTravelDto } from '@/types/officerExpense'

// ============ Types ============
type VehicleType = 'car' | 'car_passenger' | 'bicycle' | 'motorbike'

interface SavedLocation {
  id: number
  name: string
  postcode: string
}

interface MileageEntry {
  id: string
  vehicleType: VehicleType
  startLocation: string
  startPostcode: string
  endLocation: string
  endPostcode: string
  returnTrip: boolean
  mileage: number
  calculatedExpense: number
}

interface TravelEntry {
  id: string
  transportType: 'train' | 'bus' | 'taxi'
  description: string
  amount: number
}

interface DayExpenses {
  day: string
  date: string
  mileageEntries: MileageEntry[]
  travelEntries: TravelEntry[]
  subsistenceHours: '0' | '5-10' | '10+'
  ongoingTravelBeyond8pm: boolean
  otherExpenses: {
    accommodation: number
    incidentals: number
    toolsEquipment: number
    sundries: number
    sundriesDescription: string
  }
  totalMileage: number
  totalTravel: number
  totalSubsistence: number
  totalOther: number
  totalExpense: number
}

type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'

// ============ Constants ============
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MILEAGE_RATE = 0.25
const FREE_MILEAGE_ALLOWANCE = 25

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: React.ReactNode }[] = [
  { value: 'car', label: 'Car/Van', icon: <Car className="h-4 w-4" /> },
  { value: 'car_passenger', label: 'Car/Van + Passenger', icon: <Users className="h-4 w-4" /> },
  { value: 'bicycle', label: 'Bicycle', icon: <Bike className="h-4 w-4" /> },
  { value: 'motorbike', label: 'Motorbike', icon: <Car className="h-4 w-4" /> },
]

const SUBSISTENCE_RATES = {
  '0': 0,
  '5-10': 5,
  '10+': 10
}

// ============ Helper Functions ============
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDayDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' })
  const formattedDate = formatDateShort(date)
  return `${dayName}, ${formattedDate}`
}

const createEmptyDay = (day: string, date: string): DayExpenses => ({
  day,
  date,
  mileageEntries: [],
  travelEntries: [],
  subsistenceHours: '0',
  ongoingTravelBeyond8pm: false,
  otherExpenses: {
    accommodation: 0,
    incidentals: 0,
    toolsEquipment: 0,
    sundries: 0,
    sundriesDescription: ''
  },
  totalMileage: 0,
  totalTravel: 0,
  totalSubsistence: 0,
  totalOther: 0,
  totalExpense: 0
})

const calculateDayTotals = (day: DayExpenses): DayExpenses => {
  // Calculate mileage totals
  let totalMiles = 0
  day.mileageEntries.forEach(entry => {
    const miles = entry.returnTrip ? entry.mileage * 2 : entry.mileage
    totalMiles += miles
  })
  
  // Apply 25 mile free allowance per day
  const billableMiles = Math.max(0, totalMiles - FREE_MILEAGE_ALLOWANCE)
  const totalMileage = billableMiles * MILEAGE_RATE
  
  // Travel expenses
  const totalTravel = day.travelEntries.reduce((sum, e) => sum + e.amount, 0)
  
  // Subsistence
  const totalSubsistence = SUBSISTENCE_RATES[day.subsistenceHours] + (day.ongoingTravelBeyond8pm ? 5 : 0)
  
  // Other expenses
  const totalOther = 
    day.otherExpenses.accommodation +
    day.otherExpenses.incidentals +
    day.otherExpenses.toolsEquipment +
    day.otherExpenses.sundries
  
  return {
    ...day,
    totalMileage,
    totalTravel,
    totalSubsistence,
    totalOther,
    totalExpense: totalMileage + totalTravel + totalSubsistence + totalOther
  }
}

const getWeekDates = (startDate: Date): { day: string; date: string }[] => {
  return DAYS_OF_WEEK.map((day, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    return {
      day,
      date: date.toISOString().split('T')[0]
    }
  })
}

// ============ Mapping Functions ============

const mapDayExpensesToDto = (day: DayExpenses): CreateOfficerExpenseDayDto => {
  return {
    dayName: day.day,
    date: day.date,
    accommodation: day.otherExpenses.accommodation || undefined,
    incidentals: day.otherExpenses.incidentals || undefined,
    toolsEquipment: day.otherExpenses.toolsEquipment || undefined,
    sundries: day.otherExpenses.sundries || undefined,
    sundriesDescription: day.otherExpenses.sundriesDescription || undefined,
    mileageEntries: day.mileageEntries.map(m => ({
      vehicleType: m.vehicleType,
      startLocation: m.startLocation,
      startPostcode: m.startPostcode,
      endLocation: m.endLocation,
      endPostcode: m.endPostcode,
      returnTrip: m.returnTrip,
      mileage: m.mileage,
      calculatedExpense: m.calculatedExpense
    })),
    travelEntries: day.travelEntries.map(t => ({
      transportType: t.transportType,
      description: t.description || undefined,
      amount: t.amount
    }))
  }
}

const mapDtoToDayExpenses = (dto: any, dayName: string, date: string): DayExpenses => {
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  const day: DayExpenses = {
    day: dayName,
    date,
    mileageEntries: (dto.mileageEntries || []).map((m: any) => ({
      id: m.id?.toString() || generateId(),
      vehicleType: m.vehicleType,
      startLocation: m.startLocation,
      startPostcode: m.startPostcode,
      endLocation: m.endLocation,
      endPostcode: m.endPostcode,
      returnTrip: m.returnTrip,
      mileage: m.mileage,
      calculatedExpense: m.calculatedExpense
    })),
    travelEntries: (dto.travelEntries || []).map((t: any) => ({
      id: t.id?.toString() || generateId(),
      transportType: t.transportType,
      description: t.description || '',
      amount: t.amount
    })),
    subsistenceHours: '0',
    ongoingTravelBeyond8pm: false,
    otherExpenses: {
      accommodation: dto.accommodation || 0,
      incidentals: dto.incidentals || 0,
      toolsEquipment: dto.toolsEquipment || 0,
      sundries: dto.sundries || 0,
      sundriesDescription: dto.sundriesDescription || ''
    },
    totalMileage: 0,
    totalTravel: 0,
    totalSubsistence: 0,
    totalOther: 0,
    totalExpense: 0
  }
  
  // Calculate totals using the helper function
  return calculateDayTotals(day)
}

// ============ Component ============
const OfficerExpensesPage = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Get officer name from authenticated user
  const officerName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStartDate(new Date()))
  const [days, setDays] = useState<DayExpenses[]>([])
  const [currentClaimId, setCurrentClaimId] = useState<number | null>(null)
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('draft')
  
  // Format week start date for API
  const weekStartDateStr = currentWeekStart.toISOString().split('T')[0]
  const weekEndDate = new Date(currentWeekStart)
  weekEndDate.setDate(currentWeekStart.getDate() + 6)
  const weekEndDateStr = weekEndDate.toISOString().split('T')[0]
  
  // Fetch existing claim for current week
  const { data: existingClaim, isLoading: isLoadingClaim } = useQuery({
    queryKey: ['officerExpense', weekStartDateStr],
    queryFn: () => officerExpenseService.getClaimByWeek(weekStartDateStr),
    enabled: !!user?.id,
    staleTime: 30000 // 30 seconds
  })
  
  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (claimData: CreateOfficerExpenseClaimDto) => {
      if (currentClaimId) {
        return officerExpenseService.updateClaim(currentClaimId, { days: claimData.days })
      } else {
        return officerExpenseService.createClaim(claimData)
      }
    },
    onSuccess: (data) => {
      setCurrentClaimId(data.id)
      queryClient.invalidateQueries({ queryKey: ['officerExpense'] })
      toast({
        title: "Success",
        description: currentClaimId ? "Expense claim updated successfully" : "Expense claim created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save expense claim",
        variant: "destructive",
      })
    }
  })
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (id: number) => officerExpenseService.submitClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officerExpense'] })
      toast({
        title: "Success",
        description: "Expense claim submitted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit expense claim",
        variant: "destructive",
      })
    }
  })
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => officerExpenseService.deleteClaim(id),
    onSuccess: () => {
      setCurrentClaimId(null)
      queryClient.invalidateQueries({ queryKey: ['officerExpense'] })
      toast({
        title: "Success",
        description: "Expense claim deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete expense claim",
        variant: "destructive",
      })
    }
  })

  // Review mutation (approve/reject) - Admin only
  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: 'Approved' | 'Rejected'; notes?: string }) => 
      officerExpenseService.reviewClaim(id, { status, approvalNotes: notes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['officerExpense'] })
      setApprovalStatus(data.status === 'Approved' ? 'approved' : 'rejected')
      toast({
        title: "Success",
        description: `Expense claim ${data.status.toLowerCase()} successfully`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to review expense claim",
        variant: "destructive",
      })
    }
  })

  // Check if user is admin (normalize role to lowercase for comparison)
  // Also check cached user in case API fetch failed
  const isAdmin = useMemo(() => {
    // Get role from user object (could be from API or cached)
    const role = user?.role?.toLowerCase() || ''
    
    // Also check if role might be in different property (backend sometimes uses different casing)
    const roleAlt = (user as any)?.Role?.toLowerCase() || ''
    const effectiveRole = role || roleAlt
    
    const adminCheck = effectiveRole === 'administrator' || effectiveRole === 'advantageonehoofficer'
    
    // Debug logging with expanded object values
    if (import.meta.env.DEV) {
      console.log('🔍 [OfficerExpensesPage] Admin check details:')
      console.log('  - User object:', user)
      console.log('  - user.role:', user?.role)
      console.log('  - user.Role (alt):', (user as any)?.Role)
      console.log('  - Normalized role:', effectiveRole)
      console.log('  - Is Admin?:', adminCheck)
      console.log('  - Current Claim ID:', currentClaimId)
      console.log('  - Approval Status:', approvalStatus)
      console.log('  - Show buttons?:', adminCheck && !!currentClaimId && approvalStatus === 'pending')
    }
    
    return adminCheck
  }, [user, currentClaimId, approvalStatus])
  
  // Dialog states
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  
  // Modal states
  const [showMileageModal, setShowMileageModal] = useState(false)
  const [showTravelModal, setShowTravelModal] = useState(false)
  const [editingMileage, setEditingMileage] = useState<MileageEntry | null>(null)
  const [editingTravel, setEditingTravel] = useState<TravelEntry | null>(null)
  
  // Mileage form
  const [mileageForm, setMileageForm] = useState({
    vehicleType: 'car' as VehicleType,
    startLocation: '',
    startPostcode: '',
    endLocation: '',
    endPostcode: '',
    returnTrip: false,
    mileage: 0
  })
  const [isCalculating, setIsCalculating] = useState(false)
  
  // Travel form
  const [travelForm, setTravelForm] = useState({
    transportType: 'train' as 'train' | 'bus' | 'taxi',
    description: '',
    amount: 0
  })
  
  // Saved locations - fetch from API
  const { data: savedLocations = [], isLoading: isLoadingLocations, refetch: refetchLocations } = useQuery({
    queryKey: ['savedLocations', user?.id],
    queryFn: () => savedLocationService.getUserLocations(),
    enabled: !!user?.id,
    staleTime: 60000 // 1 minute
  })
  
  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: (dto: { name: string; postcode: string }) => savedLocationService.createLocation(dto),
    onSuccess: () => {
      refetchLocations()
      setShowSaveLocationDialog(false)
      setNewLocationName('')
      setNewLocationPostcode('')
      toast({ title: "Location saved", description: "Location has been saved successfully" })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save location",
        variant: "destructive"
      })
    }
  })
  
  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: (id: number) => savedLocationService.deleteLocation(id),
    onSuccess: () => {
      refetchLocations()
      toast({ title: "Location deleted", description: "Location has been deleted successfully" })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete location",
        variant: "destructive"
      })
    }
  })
  
  const [showSaveLocationDialog, setShowSaveLocationDialog] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationPostcode, setNewLocationPostcode] = useState('')
  const [startLocationOpen, setStartLocationOpen] = useState(false)
  const [endLocationOpen, setEndLocationOpen] = useState(false)

  // Initialize days when week changes or when claim is loaded
  useEffect(() => {
    if (isLoadingClaim) return // Don't initialize while loading
    
    const weekDates = getWeekDates(currentWeekStart)
    
    if (existingClaim && existingClaim.days && existingClaim.days.length > 0) {
      // Load from existing claim
      const loadedDays = weekDates.map(({ day, date }) => {
        const dayData = existingClaim.days.find(d => d.dayName === day)
        if (dayData) {
          return mapDtoToDayExpenses(dayData, day, date)
        }
        return createEmptyDay(day, date)
      })
      setDays(loadedDays)
      setCurrentClaimId(existingClaim.id)
      setApprovalStatus(existingClaim.status === 'Approved' ? 'approved' : 
                       existingClaim.status === 'Rejected' ? 'rejected' : 
                       existingClaim.status === 'Pending' ? 'pending' : 'draft')
    } else {
      // Initialize empty days
      setDays(weekDates.map(({ day, date }) => createEmptyDay(day, date)))
      setCurrentClaimId(null)
      setApprovalStatus('draft')
    }
  }, [currentWeekStart, existingClaim, isLoadingClaim])

  // Auto-calculate mileage when both postcodes are valid
  useEffect(() => {
    const autoCalculate = async () => {
      const { startPostcode, endPostcode } = mileageForm
      if (!startPostcode || !endPostcode) return
      if (!isValidUKPostcode(startPostcode) || !isValidUKPostcode(endPostcode)) return
      
      setIsCalculating(true)
      try {
        const result = await calculatePostcodeDistance(startPostcode, endPostcode)
        if (result && !result.error) {
          setMileageForm(prev => ({ ...prev, mileage: result.distance }))
        }
      } catch {
        // Silently fail - user can still enter manually
      } finally {
        setIsCalculating(false)
      }
    }
    
    const timer = setTimeout(autoCalculate, 500)
    return () => clearTimeout(timer)
  }, [mileageForm.startPostcode, mileageForm.endPostcode])

  // Add new saved location
  const handleSaveLocation = useCallback(() => {
    if (!newLocationName.trim() || !newLocationPostcode.trim()) return
    if (!isValidUKPostcode(newLocationPostcode)) {
      toast({ title: "Invalid postcode", description: "Please enter a valid UK postcode", variant: "destructive" })
      return
    }
    
    createLocationMutation.mutate({
      name: newLocationName.trim(),
      postcode: newLocationPostcode.toUpperCase().trim()
    })
  }, [newLocationName, newLocationPostcode, createLocationMutation, toast])

  // Delete saved location
  const handleDeleteLocation = useCallback((id: number) => {
    deleteLocationMutation.mutate(id)
  }, [deleteLocationMutation])

  // Apply saved location to form
  const applyLocationToForm = useCallback((location: SavedLocation, type: 'start' | 'end') => {
    if (type === 'start') {
      setMileageForm(prev => ({
        ...prev,
        startLocation: location.name,
        startPostcode: location.postcode
      }))
    } else {
      setMileageForm(prev => ({
        ...prev,
        endLocation: location.name,
        endPostcode: location.postcode
      }))
    }
  }, [])

  // Week navigation
  const goToPreviousWeek = useCallback(() => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }, [currentWeekStart])

  const goToNextWeek = useCallback(() => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }, [currentWeekStart])

  // Open expense entry for a specific day
  const openExpenseEntry = useCallback((dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setShowExpenseDialog(true)
  }, [])

  // Add/Update mileage entry
  const handleSaveMileage = useCallback(() => {
    if (!mileageForm.mileage) return
    
    const miles = mileageForm.returnTrip ? mileageForm.mileage * 2 : mileageForm.mileage
    const expense = Math.max(0, miles - FREE_MILEAGE_ALLOWANCE) * MILEAGE_RATE
    
    const entry: MileageEntry = {
      id: editingMileage?.id || Date.now().toString(),
      ...mileageForm,
      calculatedExpense: expense
    }

    setDays(prev => prev.map((day, i) => {
      if (i !== selectedDayIndex) return day
      
      let mileageEntries: MileageEntry[]
      if (editingMileage) {
        mileageEntries = day.mileageEntries.map(e => e.id === editingMileage.id ? entry : e)
      } else {
        mileageEntries = [...day.mileageEntries, entry]
      }
      
      return calculateDayTotals({ ...day, mileageEntries })
    }))

    setShowMileageModal(false)
    setEditingMileage(null)
    setMileageForm({
      vehicleType: 'car',
      startLocation: '',
      startPostcode: '',
      endLocation: '',
      endPostcode: '',
      returnTrip: false,
      mileage: 0
    })
  }, [mileageForm, selectedDayIndex, editingMileage])

  // Add/Update travel entry
  const handleSaveTravel = useCallback(() => {
    if (!travelForm.amount) return
    
    const entry: TravelEntry = {
      id: editingTravel?.id || Date.now().toString(),
      ...travelForm
    }

    setDays(prev => prev.map((day, i) => {
      if (i !== selectedDayIndex) return day
      
      let travelEntries: TravelEntry[]
      if (editingTravel) {
        travelEntries = day.travelEntries.map(e => e.id === editingTravel.id ? entry : e)
      } else {
        travelEntries = [...day.travelEntries, entry]
      }
      
      return calculateDayTotals({ ...day, travelEntries })
    }))

    setShowTravelModal(false)
    setEditingTravel(null)
    setTravelForm({ transportType: 'train', description: '', amount: 0 })
  }, [travelForm, selectedDayIndex, editingTravel])

  // Delete mileage entry
  const handleDeleteMileage = useCallback((entryId: string) => {
    setDays(prev => prev.map((day, i) => {
      if (i !== selectedDayIndex) return day
      const mileageEntries = day.mileageEntries.filter(e => e.id !== entryId)
      return calculateDayTotals({ ...day, mileageEntries })
    }))
  }, [selectedDayIndex])

  // Delete travel entry
  const handleDeleteTravel = useCallback((entryId: string) => {
    setDays(prev => prev.map((day, i) => {
      if (i !== selectedDayIndex) return day
      const travelEntries = day.travelEntries.filter(e => e.id !== entryId)
      return calculateDayTotals({ ...day, travelEntries })
    }))
  }, [selectedDayIndex])

  // Update day field
  const updateDayField = useCallback((field: string, value: any) => {
    setDays(prev => prev.map((day, i) => {
      if (i !== selectedDayIndex) return day
      
      let updatedDay: DayExpenses
      if (field.startsWith('otherExpenses.')) {
        const subField = field.replace('otherExpenses.', '')
        updatedDay = {
          ...day,
          otherExpenses: { ...day.otherExpenses, [subField]: value }
        }
      } else {
        updatedDay = { ...day, [field]: value }
      }
      
      return calculateDayTotals(updatedDay)
    }))
  }, [selectedDayIndex])

  // Submit expenses
  const handleSave = useCallback(async () => {
    if (!user?.id) return
    
    // Filter days that have expenses
    const daysWithExpenses = days.filter(day => {
      const hasMileage = day.mileageEntries.length > 0
      const hasTravel = day.travelEntries.length > 0
      const hasOther = (day.otherExpenses.accommodation || 0) + 
                      (day.otherExpenses.incidentals || 0) + 
                      (day.otherExpenses.toolsEquipment || 0) + 
                      (day.otherExpenses.sundries || 0) > 0
      return hasMileage || hasTravel || hasOther
    })
    
    if (daysWithExpenses.length === 0) {
      toast({
        title: "No expenses",
        description: "Please add at least one expense entry",
        variant: "destructive"
      })
      return
    }
    
    const claimData: CreateOfficerExpenseClaimDto = {
      weekStartDate: weekStartDateStr,
      weekEndDate: weekEndDateStr,
      days: daysWithExpenses.map(mapDayExpensesToDto)
    }
    
    saveMutation.mutate(claimData)
  }, [days, user, weekStartDateStr, weekEndDateStr, saveMutation, toast])
  
  const handleSubmit = useCallback(() => {
    if (!currentClaimId) {
      toast({
        title: "Save first",
        description: "Please save your expenses before submitting",
        variant: "destructive"
      })
      return
    }
    
    submitMutation.mutate(currentClaimId)
  }, [currentClaimId, submitMutation, toast])

  // Computed values
  const currentDay = days[selectedDayIndex]
  const weekNumber = getWeekNumber(currentWeekStart)
  const weekTotal = useMemo(() => days.reduce((sum, day) => sum + day.totalExpense, 0), [days])

  // Filter to only days with expenses for display in table
  const daysWithExpenses = useMemo(() => days.filter(day => day.totalExpense > 0), [days])
  
  // Check if any day has expenses
  const hasExpenses = daysWithExpenses.length > 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EFF4FF' }}>
      <div className="container mx-auto p-4 lg:p-6 max-w-[1200px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your expenses</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewLocationName('')
                setNewLocationPostcode('')
                setShowSaveLocationDialog(true)
              }}
              className="text-gray-600"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              My Locations ({isLoadingLocations ? '...' : savedLocations.length})
            </Button>
            <Badge className={cn(
              "flex items-center gap-1.5 px-3 py-1.5",
              approvalStatus === 'approved' && "bg-emerald-100 text-emerald-800",
              approvalStatus === 'pending' && "bg-amber-100 text-amber-800",
              approvalStatus === 'rejected' && "bg-red-100 text-red-800",
              approvalStatus === 'draft' && "bg-gray-100 text-gray-800"
            )}>
              <Clock className="h-3.5 w-3.5" />
              {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Payment Period Card */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Week Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <span className="text-sm font-medium text-gray-700">Payment period</span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="h-10 px-3 border-gray-300 hover:bg-gray-100 gap-1" 
                    onClick={goToPreviousWeek}
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm">Prev</span>
                  </Button>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium whitespace-nowrap">
                      Week {weekNumber}, {formatDateShort(currentWeekStart)} - {formatDateShort(weekEndDate)}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-10 px-3 border-gray-300 hover:bg-gray-100 gap-1" 
                    onClick={goToNextWeek}
                  >
                    <span className="hidden sm:inline text-sm">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Enter Expenses Button */}
              <Button
                onClick={() => openExpenseEntry(0)}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Enter expenses
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-0">
            {daysWithExpenses.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PoundSterling className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses recorded</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Click "Enter expenses" to add travel, mileage, or other expenses for this week.
                </p>
                <Button
                  onClick={() => openExpenseEntry(0)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Enter expenses
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium">Date</TableHead>
                    <TableHead className="font-medium text-right">Travel (£)</TableHead>
                    <TableHead className="font-medium text-right">Mileage (£)</TableHead>
                    <TableHead className="font-medium text-right">Other expenses (£)</TableHead>
                    <TableHead className="w-24 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daysWithExpenses.map((day) => {
                    const dayIndex = days.findIndex(d => d.date === day.date)
                    return (
                      <TableRow key={day.date} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{formatDayDate(day.date)}</TableCell>
                        <TableCell className="text-right">
                          £{day.totalTravel.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          £{day.totalMileage.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          £{day.totalOther.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 hover:border-blue-400 font-medium shadow-sm"
                            onClick={() => openExpenseEntry(dayIndex)}
                            title="Edit expenses"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span className="text-sm">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-lg">
            <span className="text-gray-600">Total: </span>
            <span className="font-bold text-gray-900">£{weekTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            {isAdmin && currentClaimId && approvalStatus === 'pending' && (
              <>
                <Button
                  onClick={() => reviewMutation.mutate({ id: currentClaimId, status: 'Approved' })}
                  disabled={reviewMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {reviewMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => reviewMutation.mutate({ id: currentClaimId, status: 'Rejected' })}
                  disabled={reviewMutation.isPending}
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  {reviewMutation.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
              </>
            )}
            {currentClaimId && approvalStatus === 'draft' && (
          <Button
            onClick={handleSubmit}
                disabled={!hasExpenses || submitMutation.isPending}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
            )}
            {isAdmin && currentClaimId && approvalStatus !== 'pending' && approvalStatus !== 'draft' && (
              <div className="text-sm text-gray-500 flex items-center">
                Claim status: {approvalStatus}
              </div>
            )}
            {!currentClaimId && isAdmin && (
              <div className="text-sm text-gray-500 flex items-center">
                No claim found for this week
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Entry Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="!max-w-6xl w-[95vw] !h-[90vh] max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-white flex justify-between items-start">
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Enter expenses, {formatDateShort(currentWeekStart)} - {formatDateShort(weekEndDate)}
                </DialogTitle>
              </div>
              <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg mr-10 min-w-[120px]">
                <p className="text-xs">Week total</p>
                <p className="text-xl font-bold">£{weekTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Day Tabs - Horizontal with amounts below */}
            <div className="bg-gray-900 rounded-t-lg">
              <div className="px-4 pt-3 pb-2">
                <p className="text-xs text-gray-300 mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Select a day below to add expenses for that day
                </p>
              </div>
              <div className="flex px-2 pb-2">
                {days.map((day, index) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDayIndex(index)}
                    className={cn(
                      "flex-1 py-4 px-3 text-center transition-all rounded-lg mx-1 flex flex-col items-center justify-center min-h-[80px]",
                      selectedDayIndex === index
                        ? "bg-gray-700 ring-2 ring-orange-500 ring-offset-2 ring-offset-gray-900"
                        : "bg-gray-800 hover:bg-gray-700/70 hover:scale-105"
                    )}
                  >
                    <div className={cn(
                      "text-base font-semibold text-white mb-1",
                      selectedDayIndex === index && "text-orange-300"
                    )}>
                      {day.day}
                    </div>
                    <div className={cn(
                      "text-sm font-medium",
                      day.totalExpense > 0 ? "text-white" : "text-gray-400"
                    )}>
                      £{day.totalExpense.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Content */}
            {currentDay && (
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-0">
                {/* First Row: Travel and Mileage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Travel Section */}
                  <Card className="border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Train className="h-5 w-5 text-blue-600" />
                          Travel
                        </h3>
                        <span className="text-sm font-medium text-gray-600">Total: £{currentDay.totalTravel.toFixed(2)}</span>
                      </div>
                      {currentDay.travelEntries.length === 0 ? (
                        <div className="text-center py-8">
                          <Train className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No travel expenses</p>
                        </div>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {currentDay.travelEntries.map(entry => (
                            <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                              <span className="text-sm font-medium">Fares & fees</span>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">£{entry.amount.toFixed(2)}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTravel(entry.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full h-10" onClick={() => setShowTravelModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add travel
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mileage Section */}
                  <Card className="border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Car className="h-5 w-5 text-emerald-600" />
                          Mileage
                        </h3>
                        <span className="text-sm font-medium text-gray-600">Total: £{currentDay.totalMileage.toFixed(2)}</span>
                      </div>
                      {currentDay.mileageEntries.length === 0 ? (
                        <div className="text-center py-8">
                          <Car className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No mileage expenses</p>
                        </div>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {currentDay.mileageEntries.map(entry => (
                            <div key={entry.id} className="p-3 bg-gray-50 rounded-lg border">
                              <div className="flex justify-between items-start">
                                <div className="text-sm flex-1">
                                  <p className="font-medium">{entry.startLocation} → {entry.endLocation}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{entry.mileage} mi {entry.returnTrip && '(return)'}</p>
                                </div>
                                <div className="flex items-center gap-3 ml-3">
                                  <span className="font-semibold">£{entry.calculatedExpense.toFixed(2)}</span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteMileage(entry.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full h-10" onClick={() => setShowMileageModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add mileage
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Second Row: Other Expenses and Receipts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Other Expenses Section */}
                  <Card className="border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-amber-600" />
                          Other expenses
                        </h3>
                        <span className="text-sm font-medium text-gray-600">Total: £{currentDay.totalOther.toFixed(2)}</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <Label className="text-sm font-medium">Overnight accommodation</Label>
                          <div className="flex items-center border rounded-lg overflow-hidden w-32">
                            <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r">£</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentDay.otherExpenses.accommodation || ''}
                              onChange={(e) => updateDayField('otherExpenses.accommodation', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="h-9 text-right border-0 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <Label className="text-sm font-medium">Incidental expenses</Label>
                          <div className="flex items-center border rounded-lg overflow-hidden w-32">
                            <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r">£</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentDay.otherExpenses.incidentals || ''}
                              onChange={(e) => updateDayField('otherExpenses.incidentals', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="h-9 text-right border-0 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <Label className="text-sm font-medium">Tools & equipment</Label>
                          <div className="flex items-center border rounded-lg overflow-hidden w-32">
                            <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r">£</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentDay.otherExpenses.toolsEquipment || ''}
                              onChange={(e) => updateDayField('otherExpenses.toolsEquipment', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="h-9 text-right border-0 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <Label className="text-sm font-medium">Sundries expenses</Label>
                          <div className="flex items-center border rounded-lg overflow-hidden w-32">
                            <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r">£</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentDay.otherExpenses.sundries || ''}
                              onChange={(e) => updateDayField('otherExpenses.sundries', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="h-9 text-right border-0 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                        <div className="pt-2">
                          <Label className="text-xs text-gray-500 mb-1 block">Sundries description</Label>
                          <Input
                            value={currentDay.otherExpenses.sundriesDescription}
                            onChange={(e) => updateDayField('otherExpenses.sundriesDescription', e.target.value)}
                            placeholder="Enter description..."
                            className="h-9"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Receipts Section */}
                  <Card className="border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg mb-4">Receipts</h3>
                      <div className="text-center py-8">
                        <PoundSterling className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 mb-4">No receipts attached</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full h-10">
                        <Plus className="h-4 w-4 mr-2" />
                        Add attachment
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t bg-white flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>Back</Button>
              <Button 
                onClick={() => {
                  handleSave()
                  setShowExpenseDialog(false)
                }} 
                disabled={saveMutation.isPending}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Mileage Modal */}
      <Dialog open={showMileageModal} onOpenChange={setShowMileageModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Add Mileage
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewLocationName('')
                  setNewLocationPostcode('')
                  setShowSaveLocationDialog(true)
                }}
                className="text-blue-600 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Save New Location
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {/* Vehicle Type Selection */}
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setMileageForm(prev => ({ ...prev, vehicleType: type.value }))}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                  mileageForm.vehicleType === type.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>

          {/* Start Location */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <CircleDot className="h-3 w-3 text-orange-500" />
              Start Location
            </Label>
            <div className="flex items-center gap-2">
              <Popover open={startLocationOpen} onOpenChange={setStartLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={startLocationOpen}
                    className="flex-1 justify-between h-10"
                  >
                    <span className="truncate">
                      {mileageForm.startLocation 
                        ? `${mileageForm.startLocation} (${mileageForm.startPostcode})`
                        : "Select or type location..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
                  <Command>
                    <CommandInput 
                      placeholder="Search locations..." 
                    />
                    <CommandList>
                      {savedLocations.length === 0 ? (
                        <CommandEmpty>
                          <div className="py-4 text-center text-sm">
                            <p>No saved locations found.</p>
                            <p className="text-xs text-gray-500 mt-1">Type location name and postcode below, then save</p>
                          </div>
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {savedLocations.map((location) => (
                            <CommandItem
                              key={location.id}
                              value={`${location.name} ${location.postcode}`}
                              onSelect={() => {
                                setMileageForm(prev => ({
                                  ...prev,
                                  startLocation: location.name,
                                  startPostcode: location.postcode
                                }))
                                setStartLocationOpen(false)
                              }}
                              className="cursor-pointer"
                            >
                              <CircleDot className="mr-2 h-4 w-4 text-orange-500 shrink-0" />
                              <span className="font-medium">{location.name}</span>
                              <span className="ml-2 text-xs text-gray-500">({location.postcode})</span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0",
                                  mileageForm.startLocation === location.name && mileageForm.startPostcode === location.postcode
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {mileageForm.startLocation && mileageForm.startPostcode && !savedLocations.find(l => l.name === mileageForm.startLocation && l.postcode === mileageForm.startPostcode) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-blue-600"
                  title="Save this location"
                  onClick={() => {
                    setNewLocationName(mileageForm.startLocation)
                    setNewLocationPostcode(mileageForm.startPostcode)
                    setShowSaveLocationDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* Manual entry for start location */}
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={mileageForm.startLocation}
                onChange={(e) => setMileageForm(prev => ({ ...prev, startLocation: e.target.value }))}
                placeholder="Or type location name"
                className="flex-1 h-9"
              />
              <Input
                value={mileageForm.startPostcode}
                onChange={(e) => setMileageForm(prev => ({ ...prev, startPostcode: e.target.value.toUpperCase() }))}
                placeholder="Postcode"
                className="w-28 h-9"
              />
            </div>
          </div>

          {/* End Location */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-500" />
              Destination
            </Label>
            <div className="flex items-center gap-2">
              <Popover open={endLocationOpen} onOpenChange={setEndLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={endLocationOpen}
                    className="flex-1 justify-between h-10"
                  >
                    <span className="truncate">
                      {mileageForm.endLocation 
                        ? `${mileageForm.endLocation} (${mileageForm.endPostcode})`
                        : "Select or type location..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
                  <Command>
                    <CommandInput 
                      placeholder="Search locations..." 
                    />
                    <CommandList>
                      {savedLocations.length === 0 ? (
                        <CommandEmpty>
                          <div className="py-4 text-center text-sm">
                            <p>No saved locations found.</p>
                            <p className="text-xs text-gray-500 mt-1">Type location name and postcode below, then save</p>
                          </div>
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {savedLocations.map((location) => (
                            <CommandItem
                              key={location.id}
                              value={`${location.name} ${location.postcode}`}
                              onSelect={() => {
                                setMileageForm(prev => ({
                                  ...prev,
                                  endLocation: location.name,
                                  endPostcode: location.postcode
                                }))
                                setEndLocationOpen(false)
                              }}
                              className="cursor-pointer"
                            >
                              <MapPin className="mr-2 h-4 w-4 text-emerald-500 shrink-0" />
                              <span className="font-medium">{location.name}</span>
                              <span className="ml-2 text-xs text-gray-500">({location.postcode})</span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0",
                                  mileageForm.endLocation === location.name && mileageForm.endPostcode === location.postcode
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {mileageForm.endLocation && mileageForm.endPostcode && !savedLocations.find(l => l.name === mileageForm.endLocation && l.postcode === mileageForm.endPostcode) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-blue-600"
                  title="Save this location"
                  onClick={() => {
                    setNewLocationName(mileageForm.endLocation)
                    setNewLocationPostcode(mileageForm.endPostcode)
                    setShowSaveLocationDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* Manual entry for end location */}
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={mileageForm.endLocation}
                onChange={(e) => setMileageForm(prev => ({ ...prev, endLocation: e.target.value }))}
                placeholder="Or type location name"
                className="flex-1 h-9"
              />
              <Input
                value={mileageForm.endPostcode}
                onChange={(e) => setMileageForm(prev => ({ ...prev, endPostcode: e.target.value.toUpperCase() }))}
                placeholder="Postcode"
                className="w-28 h-9"
              />
            </div>
          </div>

          {/* Mileage Display */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Distance:</Label>
              {isCalculating ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={mileageForm.mileage || ''}
                    onChange={(e) => setMileageForm(prev => ({ ...prev, mileage: parseFloat(e.target.value) || 0 }))}
                    className="w-20 h-8"
                  />
                  <span className="text-sm text-gray-500">miles</span>
                </div>
              )}
            </div>
            {mileageForm.mileage > 0 && (
              <Badge className="bg-emerald-100 text-emerald-800">
                Est. £{(Math.max(0, (mileageForm.returnTrip ? mileageForm.mileage * 2 : mileageForm.mileage) - FREE_MILEAGE_ALLOWANCE) * MILEAGE_RATE).toFixed(2)}
              </Badge>
            )}
          </div>

          {/* Return Trip */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="return-trip"
              checked={mileageForm.returnTrip}
              onCheckedChange={(checked) => setMileageForm(prev => ({ ...prev, returnTrip: !!checked }))}
            />
            <Label htmlFor="return-trip">Return trip to start</Label>
            {mileageForm.returnTrip && mileageForm.mileage > 0 && (
              <span className="text-xs text-gray-500">({(mileageForm.mileage * 2).toFixed(1)} miles total)</span>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMileageModal(false)}>Cancel</Button>
            <Button onClick={handleSaveMileage} disabled={!mileageForm.mileage || isCalculating} className="bg-gray-900 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Travel Modal */}
      <Dialog open={showTravelModal} onOpenChange={setShowTravelModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add travel expenses</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            {(['train', 'bus', 'taxi'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTravelForm(prev => ({ ...prev, transportType: type }))}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                  travelForm.transportType === type
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center border rounded-lg overflow-hidden">
            <span className="px-3 py-2 bg-gray-50 text-gray-500 border-r">£</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={travelForm.amount || ''}
              onChange={(e) => setTravelForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="border-0 focus-visible:ring-0"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowTravelModal(false)}>Cancel</Button>
            <Button onClick={handleSaveTravel} disabled={!travelForm.amount} className="bg-gray-900 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Location Dialog */}
      <Dialog open={showSaveLocationDialog} onOpenChange={setShowSaveLocationDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Location Name</Label>
              <Input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g., Home, Office, Client Site"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Postcode</Label>
              <Input
                value={newLocationPostcode}
                onChange={(e) => setNewLocationPostcode(e.target.value.toUpperCase())}
                placeholder="e.g., B1 1AA"
                className="mt-1"
              />
            </div>
            {savedLocations.length > 0 && (
              <div className="border-t pt-3">
                <Label className="text-xs text-gray-500">Manage Saved Locations:</Label>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {savedLocations.map(loc => (
                    <div key={loc.id} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                      <span>{loc.name} ({loc.postcode})</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteLocation(loc.id)}
                        disabled={deleteLocationMutation.isPending}
                        title="Delete location"
                      >
                        {deleteLocationMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                        <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveLocationDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSaveLocation}
              disabled={!newLocationName.trim() || !newLocationPostcode.trim() || createLocationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createLocationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Location'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OfficerExpensesPage
