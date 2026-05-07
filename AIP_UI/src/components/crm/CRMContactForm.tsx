import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Check, X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SERVICES_HIERARCHY, ServiceItem } from '@/lib/services'
import { UK_COUNTIES, INDUSTRIES } from '@/lib/constants'
import { CRMContact, CommunicationLog } from '@/types/crmContact'
import { crmContactService } from '@/services/crmContactService'
import { toast as hotToast } from 'react-toastify'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface CRMContactFormProps {
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
	initialData?: CRMContact
	isSaving?: boolean
}

interface ServiceCategorySelectorProps {
	category: ServiceItem
	selectedServices: string[]
	onServiceToggle: (service: string) => void
	categoryIndex: number
}

type FormFieldName = 
	| 'fullName' | 'jobTitle' | 'influence' | 'email' | 'contact1Mobile' | 'contact2Landline'
	| 'linkedIn' | 'bdmContactOwner' | 'leadStatus' | 'connectedOnLinkedIn' | 'createDate'
	| 'businessName' | 'addressFirstLine' | 'addressSecondLine' | 'town' | 'postCode'
	| 'region' | 'industrySector' | 'website' | 'sizeOfBusinessEmployees' | 'sizeOfBusinessTurnover'
	| 'contractStatus' | 'includedOnNewsletter' | 'multipleOpportunities' | 'currentRisksConcerns'
	| 'nextSteps' | 'scopeOfWorks' | 'incumbentSupplier' | 'lengthOfContract'
	| 'dateOfNextReview' | 'lastActivityDate' | 'nextAppointmentDate' | 'managerReview' | 'notes'

type FormValues = Partial<Record<FormFieldName, string>>

interface StepValidationResult {
	isValid: boolean
	errors: string[]
}

// ============================================================================
// Constants
// ============================================================================

const LEAD_STATUSES = ['New Lead', 'Qualified', 'Negotiation', 'Won', 'Lost', 'Closed'] as const
const CONTRACT_STATUSES = ['Pending', 'Active', 'Expired', 'Cancelled'] as const
const YES_NO_OPTIONS = ['Yes', 'No'] as const
const COMMS_TYPES = ['Call', 'Email', 'Meeting', 'Note', 'Other'] as const

const STEPS = [
	{ id: 1, title: 'Contact Details', key: 'contact' },
	{ id: 2, title: 'Company Details', key: 'company' },
	{ id: 3, title: 'Services', key: 'services' },
	{ id: 4, title: 'Other Details', key: 'other' },
	{ id: 5, title: 'Communication Log', key: 'communications' }
] as const

const REQUIRED_STEPS = [1, 2] as const
const OPTIONAL_STEPS = [3, 4, 5] as const

const SELECT_FIELDS: FormFieldName[] = [
	'leadStatus',
	'connectedOnLinkedIn',
	'region',
	'industrySector',
	'contractStatus',
	'includedOnNewsletter'
]

const VALIDATION_DELAY_MS = 100

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email.trim())
}

/**
 * Validates step 1 (Contact Details)
 */
const validateStep1 = (formValues: FormValues): StepValidationResult => {
	const errors: string[] = []
	
	if (!formValues.fullName?.trim()) {
		errors.push('Full Name is required')
	}
	
	if (!formValues.jobTitle?.trim()) {
		errors.push('Job Title is required')
	}
	
	if (!formValues.email?.trim()) {
		errors.push('Email is required')
	} else if (!isValidEmail(formValues.email)) {
		errors.push('Please enter a valid email address')
	}
	
	return {
		isValid: errors.length === 0,
		errors
	}
}

/**
 * Validates step 2 (Company Details)
 */
const validateStep2 = (formValues: FormValues): StepValidationResult => {
	const errors: string[] = []
	
	if (!formValues.businessName?.trim()) {
		errors.push('Business Name is required')
	}
	
	if (!formValues.addressFirstLine?.trim()) {
		errors.push('Address First Line is required')
	}
	
	if (!formValues.postCode?.trim()) {
		errors.push('Post Code is required')
	}
	
	if (!formValues.town?.trim()) {
		errors.push('Town is required')
	}
	
	if (!formValues.region?.trim()) {
		errors.push('Region is required')
	}
	
	if (!formValues.industrySector?.trim()) {
		errors.push('Industry Sector is required')
	}
	
	return {
		isValid: errors.length === 0,
		errors
	}
}

/**
 * Validates a specific step
 */
const validateStep = (step: number, formValues: FormValues): StepValidationResult => {
	switch (step) {
		case 1:
			return validateStep1(formValues)
		case 2:
			return validateStep2(formValues)
		case 3:
		case 4:
		case 5:
			// Optional steps are always valid
			return { isValid: true, errors: [] }
		default:
			return { isValid: false, errors: ['Invalid step'] }
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Initializes form values from initialData or defaults
 */
const initializeFormValues = (initialData?: CRMContact): FormValues => {
	if (initialData) {
		return {
			// Contact Details
			fullName: initialData.fullName || '',
			jobTitle: initialData.jobTitle || '',
			influence: initialData.influence || '',
			email: initialData.email || '',
			contact1Mobile: initialData.contact1Mobile || '',
			contact2Landline: initialData.contact2Landline || '',
			linkedIn: initialData.linkedIn || '',
			bdmContactOwner: initialData.bdmContactOwner || '',
			leadStatus: initialData.leadStatus || 'New Lead',
			connectedOnLinkedIn: initialData.connectedOnLinkedIn || 'No',
			createDate: initialData.createDate ? initialData.createDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
			// Company Details
			businessName: initialData.businessName || '',
			addressFirstLine: initialData.addressFirstLine || '',
			addressSecondLine: initialData.addressSecondLine || '',
			town: initialData.town || '',
			postCode: initialData.postCode || '',
			region: initialData.region || '',
			industrySector: initialData.industrySector || '',
			website: initialData.website || '',
			sizeOfBusinessEmployees: initialData.sizeOfBusinessEmployees?.toString() || '0',
			sizeOfBusinessTurnover: initialData.sizeOfBusinessTurnover?.toString() || '0',
			// Other Details
			contractStatus: initialData.contractStatus || 'Pending',
			includedOnNewsletter: initialData.includedOnNewsletter || 'No',
			multipleOpportunities: initialData.multipleOpportunities || '',
			currentRisksConcerns: initialData.currentRisksConcerns || '',
			nextSteps: initialData.nextSteps || '',
			scopeOfWorks: initialData.scopeOfWorks || '',
			incumbentSupplier: initialData.incumbentSupplier || '',
			lengthOfContract: initialData.lengthOfContract?.toString() || '',
			dateOfNextReview: initialData.dateOfNextReview ? initialData.dateOfNextReview.split('T')[0] : '',
			lastActivityDate: initialData.lastActivityDate ? initialData.lastActivityDate.split('T')[0] : '',
			nextAppointmentDate: initialData.nextAppointmentDate ? initialData.nextAppointmentDate.split('T')[0] : '',
			managerReview: initialData.managerReview || '',
			notes: initialData.notes || '',
		}
	}
	
	// Default values for new form
	return {
		leadStatus: 'New Lead',
		connectedOnLinkedIn: 'No',
		createDate: format(new Date(), 'yyyy-MM-dd'),
		contractStatus: 'Pending',
		includedOnNewsletter: 'No',
		sizeOfBusinessEmployees: '0',
		sizeOfBusinessTurnover: '0',
	}
}

/**
 * Clears errors for a specific step
 */
const clearStepErrors = (stepErrors: Record<number, string[]>, step: number): Record<number, string[]> => {
	const newErrors = { ...stepErrors }
	delete newErrors[step]
	return newErrors
}

/**
 * Marks optional step as completed
 */
const markOptionalStepCompleted = (
	completedSteps: Set<number>,
	stepErrors: Record<number, string[]>,
	step: number
): { completedSteps: Set<number>, stepErrors: Record<number, string[]> } => {
	return {
		completedSteps: new Set([...completedSteps, step]),
		stepErrors: clearStepErrors(stepErrors, step)
	}
}

// ============================================================================
// Components
// ============================================================================

const ServiceCategorySelector = ({ category, selectedServices, onServiceToggle, categoryIndex }: ServiceCategorySelectorProps) => {
	const allServices = useMemo(() => {
		const getServicePath = (item: ServiceItem, parentPath = ''): string[] => {
			const currentPath = parentPath ? `${parentPath} > ${item.name}` : item.name
			if (!item.children || item.children.length === 0) {
				return [currentPath]
			}
			return item.children.flatMap(child => getServicePath(child, currentPath))
		}
		return getServicePath(category)
	}, [category])

	return (
		<Card className="border border-border/40">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-semibold text-primary">
					{categoryIndex}. {category.name}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[200px] pr-4">
					<div className="space-y-1" role="listbox" aria-label={`${category.name} services`}>
						{allServices.map((servicePath) => {
							const isSelected = selectedServices.includes(servicePath)
							const serviceName = servicePath.split(' > ').pop() || servicePath
							return (
								<div
									key={servicePath}
									onClick={() => onServiceToggle(servicePath)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											onServiceToggle(servicePath)
										}
									}}
									role="option"
									aria-selected={isSelected}
									tabIndex={0}
									className={cn(
										'flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
										isSelected
											? 'bg-primary/10 border border-primary/20'
											: 'hover:bg-muted/50 border border-transparent'
									)}
								>
									<span className="text-sm">{serviceName}</span>
									{isSelected ? (
										<Check className="h-4 w-4 text-primary" aria-hidden="true" />
									) : (
										<div className="h-4 w-4 rounded border border-border" aria-hidden="true" />
									)}
								</div>
							)
						})}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	)
}

// ============================================================================
// Main Component
// ============================================================================

export function CRMContactForm({ onSubmit, initialData, isSaving = false }: CRMContactFormProps) {
	// Get current date and time for communication log
	const getCurrentDateTime = () => {
		const now = new Date()
		return {
			date: format(now, 'yyyy-MM-dd'),
			time: format(now, 'HH:mm')
		}
	}

	// When editing, start at step 5 (Communication Log) to make it easy to add new logs
	// When creating new, start at step 1
	const [currentStep, setCurrentStep] = useState(initialData ? 5 : 1)
	const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.services || [])
	const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>(initialData?.communicationLogs || [])
	const currentDateTime = getCurrentDateTime()
	
	const [newCommLog, setNewCommLog] = useState<Partial<CommunicationLog> & { callTime?: string }>({
		callDate: currentDateTime.date,
		callTime: currentDateTime.time,
		commsType: 'Call',
		personSpokenTo: '',
		notes: ''
	})
	const [isAddingLog, setIsAddingLog] = useState(false)
	const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({})
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
	const [formValues, setFormValues] = useState<FormValues>(() => initializeFormValues(initialData))
	const formRef = useRef<HTMLFormElement>(null)

	// Initialize form values when initialData changes
	useEffect(() => {
		if (initialData) {
			setSelectedServices(initialData.services || [])
			setCommunicationLogs(initialData.communicationLogs || [])
			setFormValues(initializeFormValues(initialData))
			// When editing, mark all steps as completed since data already exists
			setCompletedSteps(new Set([1, 2, 3, 4, 5]))
		} else {
			setFormValues(initializeFormValues())
			setCurrentStep(1)
			setCompletedSteps(new Set())
		}
	}, [initialData])

	// Validate current step when formValues change (only for required steps)
	useEffect(() => {
		if (REQUIRED_STEPS.includes(currentStep as typeof REQUIRED_STEPS[number])) {
			const timer = setTimeout(() => {
				const validation = validateStep(currentStep, formValues)
				if (validation.isValid) {
					setCompletedSteps(prev => new Set([...prev, currentStep]))
					setStepErrors(prev => clearStepErrors(prev, currentStep))
				} else {
					setCompletedSteps(prev => {
						const newSet = new Set(prev)
						newSet.delete(currentStep)
						return newSet
					})
				}
			}, VALIDATION_DELAY_MS)
			return () => clearTimeout(timer)
		} else if (OPTIONAL_STEPS.includes(currentStep as typeof OPTIONAL_STEPS[number])) {
			// Automatically mark optional steps as completed
			// Use functional updates to avoid dependency issues
			setCompletedSteps(prev => new Set([...prev, currentStep]))
			setStepErrors(prev => clearStepErrors(prev, currentStep))
		}
	}, [formValues, currentStep])

	// ============================================================================
	// Handlers
	// ============================================================================

	const handleServiceToggle = useCallback((service: string) => {
		setSelectedServices(prev =>
			prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
		)
	}, [])

	const handleAddCommunicationLog = useCallback(async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newCommLog.callDate || !newCommLog.callTime || !newCommLog.personSpokenTo || !newCommLog.notes) {
			hotToast.error('Please fill in all required fields')
			return
		}

		// Combine date and time for the callDate field
		const dateTime = `${newCommLog.callDate}T${newCommLog.callTime}:00`

		// If editing an existing contact, use the dedicated API endpoint
		if (initialData?.id) {
			try {
				setIsAddingLog(true)
				const savedLog = await crmContactService.addCommunicationLog(initialData.id, {
					callDate: dateTime,
					commsType: newCommLog.commsType || 'Call',
					personSpokenTo: newCommLog.personSpokenTo,
					notes: newCommLog.notes
				})
				
				// Add to local state for immediate UI update
				setCommunicationLogs(prev => [...prev, savedLog])
				hotToast.success('Communication log added successfully')
				
				// Reset form
				const currentDateTime = getCurrentDateTime()
				setNewCommLog({
					callDate: currentDateTime.date,
					callTime: currentDateTime.time,
					commsType: 'Call',
					personSpokenTo: '',
					notes: ''
				})
			} catch (error) {
				console.error('Error adding communication log:', error)
				hotToast.error('Failed to add communication log')
			} finally {
				setIsAddingLog(false)
			}
		} else {
			// For new contacts, add to local state (will be sent with contact creation)
			const newLog: CommunicationLog = {
				id: `comm-${Date.now()}`,
				callDate: dateTime,
				commsType: newCommLog.commsType || 'Call',
				personSpokenTo: newCommLog.personSpokenTo,
				notes: newCommLog.notes,
				createdAt: new Date().toISOString()
			}

			setCommunicationLogs(prev => [...prev, newLog])
			const currentDateTime = getCurrentDateTime()
			setNewCommLog({
				callDate: currentDateTime.date,
				callTime: currentDateTime.time,
				commsType: 'Call',
				personSpokenTo: '',
				notes: ''
			})
		}
	}, [newCommLog, initialData])

	const handleClearCommLog = useCallback(() => {
		const currentDateTime = getCurrentDateTime()
		setNewCommLog({
			callDate: currentDateTime.date,
			callTime: currentDateTime.time,
			commsType: 'Call',
			personSpokenTo: '',
			notes: ''
		})
	}, [])

	const handleFieldChange = useCallback((fieldName: FormFieldName, value: string) => {
		setFormValues(prev => ({ ...prev, [fieldName]: value }))
	}, [])

	const getFieldValue = useCallback((fieldName: FormFieldName): string => {
		return formValues[fieldName] ?? ''
	}, [formValues])

	const handleNext = useCallback((e?: React.MouseEvent) => {
		// Prevent any form submission
		if (e) {
			e.preventDefault()
			e.stopPropagation()
		}
		
		// Only validate required steps (1 and 2)
		// Optional steps (3, 4, 5) can always proceed
		if (REQUIRED_STEPS.includes(currentStep as typeof REQUIRED_STEPS[number])) {
			const validation = validateStep(currentStep, formValues)
			
			if (!validation.isValid) {
				setStepErrors(prev => ({ ...prev, [currentStep]: validation.errors }))
				return
			}
		}

		// Only proceed if not on the last step
		if (currentStep < STEPS.length) {
			const nextStep = currentStep + 1
			setCurrentStep(nextStep)
			// Clear errors for the step we're leaving
			setStepErrors(prev => clearStepErrors(prev, currentStep))
			
			// Automatically mark optional steps as completed and clear any errors
			if (OPTIONAL_STEPS.includes(nextStep as typeof OPTIONAL_STEPS[number])) {
				const { completedSteps: newCompleted, stepErrors: newErrors } = markOptionalStepCompleted(
					completedSteps,
					stepErrors,
					nextStep
				)
				setCompletedSteps(newCompleted)
				setStepErrors(newErrors)
			}
		}
	}, [currentStep, formValues, completedSteps, stepErrors])

	const handlePrevious = useCallback(() => {
		if (currentStep > 1) {
			setCurrentStep(prev => prev - 1)
			setStepErrors(prev => clearStepErrors(prev, currentStep))
		}
	}, [currentStep])

	const handleStepClick = useCallback((step: number) => {
		// Only allow clicking on completed steps, current step, or next step (if current is valid)
		if (step < currentStep && completedSteps.has(step)) {
			setCurrentStep(step)
			if (OPTIONAL_STEPS.includes(step as typeof OPTIONAL_STEPS[number])) {
				setStepErrors(prev => clearStepErrors(prev, step))
			}
		} else if (step === currentStep) {
			setCurrentStep(step)
			if (OPTIONAL_STEPS.includes(step as typeof OPTIONAL_STEPS[number])) {
				setStepErrors(prev => clearStepErrors(prev, step))
			}
		} else if (step === currentStep + 1) {
			const validation = validateStep(currentStep, formValues)
			if (validation.isValid) {
				setCurrentStep(step)
				if (OPTIONAL_STEPS.includes(step as typeof OPTIONAL_STEPS[number])) {
					const { completedSteps: newCompleted, stepErrors: newErrors } = markOptionalStepCompleted(
						completedSteps,
						stepErrors,
						step
					)
					setCompletedSteps(newCompleted)
					setStepErrors(newErrors)
				}
			}
		}
	}, [currentStep, completedSteps, formValues, stepErrors])

	const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		
		// Validate all required steps
		const step1Validation = validateStep(1, formValues)
		const step2Validation = validateStep(2, formValues)
		
		if (!step1Validation.isValid || !step2Validation.isValid) {
			if (!step1Validation.isValid) {
				setCurrentStep(1)
				setStepErrors(prev => ({ ...prev, 1: step1Validation.errors }))
			} else if (!step2Validation.isValid) {
				setCurrentStep(2)
				setStepErrors(prev => ({ ...prev, 2: step2Validation.errors }))
			}
			return
		}
		
		// Double-check all required fields have values
		const requiredFields: FormFieldName[] = [
			'fullName', 'jobTitle', 'email', 'businessName', 
			'addressFirstLine', 'postCode', 'town', 'region', 'industrySector'
		]
		
		const missingFields = requiredFields.filter(field => {
			const value = formValues[field]
			return !value || !value.trim()
		})
		
		if (missingFields.length > 0) {
			console.warn('Missing required fields in formValues:', missingFields)
			setCurrentStep(1)
			return
		}
		
		// Sync formValues to hidden inputs before submission
		// All form fields have hidden inputs that are always in the DOM
		// This ensures FormData can read all values regardless of which step is visible
		if (formRef.current) {
			// Update all hidden inputs with current formValues
			Object.keys(formValues).forEach(key => {
				const hiddenInput = formRef.current?.querySelector(
					`input[type="hidden"][name="${key}"]`
				) as HTMLInputElement | null
				if (hiddenInput) {
					hiddenInput.value = formValues[key as FormFieldName] || ''
				}
			})
			
			// Ensure services and communicationLogs hidden inputs are updated
			const servicesInput = formRef.current.querySelector('input[type="hidden"][name="services"]') as HTMLInputElement | null
			if (servicesInput) {
				servicesInput.value = JSON.stringify(selectedServices)
			}
			
			const commLogsInput = formRef.current.querySelector('input[type="hidden"][name="communicationLogs"]') as HTMLInputElement | null
			if (commLogsInput) {
				commLogsInput.value = JSON.stringify(communicationLogs)
			}
		}
		
		// All required fields are valid, proceed with submission
		// FormData will read the updated values from the form
		onSubmit(e)
	}, [formValues, onSubmit, selectedServices, communicationLogs])

	// ============================================================================
	// Render Helpers
	// ============================================================================

	const renderStepIndicator = () => (
		<div className="w-full">
			<div className="flex items-center justify-between mb-4" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Form progress">
				{STEPS.map((step, index) => (
					<div key={step.id} className="flex items-center flex-1">
						<div className="flex flex-col items-center flex-1">
							<button
								type="button"
								onClick={() => handleStepClick(step.id)}
								disabled={step.id > currentStep + 1}
								aria-label={`Go to step ${step.id}: ${step.title}`}
								aria-current={step.id === currentStep ? 'step' : undefined}
								className={cn(
									'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
									step.id < currentStep
										? 'bg-primary border-primary text-white'
										: step.id === currentStep
										? 'bg-primary border-primary text-white ring-4 ring-primary/20'
										: 'bg-background border-muted-foreground/30 text-muted-foreground cursor-not-allowed'
								)}
							>
								{completedSteps.has(step.id) ? (
									<CheckCircle2 className="h-5 w-5" aria-hidden="true" />
								) : (
									<span className="font-semibold">{step.id}</span>
								)}
							</button>
							<span
								className={cn(
									'text-xs mt-2 text-center max-w-[80px]',
									step.id === currentStep
										? 'font-semibold text-primary'
										: completedSteps.has(step.id)
										? 'text-muted-foreground'
										: 'text-muted-foreground/60'
								)}
							>
								{step.title}
							</span>
						</div>
						{index < STEPS.length - 1 && (
							<div
								className={cn(
									'flex-1 h-0.5 mx-2 transition-colors',
									step.id < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
								)}
								aria-hidden="true"
							/>
						)}
					</div>
				))}
			</div>

			{/* Step Errors */}
			{stepErrors[currentStep] && stepErrors[currentStep].length > 0 && (
				<div 
					className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
					role="alert"
					aria-live="polite"
					aria-atomic="true"
				>
					<p className="text-sm font-semibold text-destructive mb-1">Please fix the following errors:</p>
					<ul className="text-sm text-destructive list-disc list-inside">
						{stepErrors[currentStep].map((error, idx) => (
							<li key={idx}>{error}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)

	const renderField = (
		fieldName: FormFieldName,
		label: string,
		required = false,
		type: 'text' | 'email' | 'date' | 'number' = 'text',
		placeholder?: string,
		stepNumber: 1 | 2 = 1,
		colSpan?: 'full'
	) => {
		const hasError = stepErrors[stepNumber]?.some(e => e.includes(label.split(' *')[0]))
		const fieldValue = getFieldValue(fieldName)
		
		const fieldContent = (
			<div className="space-y-2">
				<Label htmlFor={fieldName}>
					{label}
					{required && <span className="text-destructive ml-1" aria-label="required">*</span>}
				</Label>
				<Input
					id={fieldName}
					name={fieldName}
					type={type}
					value={fieldValue}
					onChange={(e) => handleFieldChange(fieldName, e.target.value)}
					required={required}
					placeholder={placeholder}
					aria-invalid={hasError}
					aria-describedby={hasError ? `${fieldName}-error` : undefined}
					className={hasError ? 'border-destructive' : ''}
				/>
				{hasError && (
					<span id={`${fieldName}-error`} className="text-xs text-destructive sr-only">
						{stepErrors[stepNumber]?.find(e => e.includes(label.split(' *')[0]))}
					</span>
				)}
			</div>
		)
		
		if (colSpan === 'full') {
			return <div className="md:col-span-2">{fieldContent}</div>
		}
		
		return fieldContent
	}

	const renderSelectField = (
		fieldName: FormFieldName,
		label: string,
		options: readonly string[],
		required = false,
		stepNumber: 1 | 2 = 1,
		placeholder?: string
	) => {
		const hasError = stepErrors[stepNumber]?.some(e => e.includes(label.split(' *')[0]))
		const fieldValue = getFieldValue(fieldName)
		
		return (
			<div className="space-y-2">
				<Label htmlFor={fieldName}>
					{label}
					{required && <span className="text-destructive ml-1" aria-label="required">*</span>}
				</Label>
				<Select 
					name={fieldName} 
					value={fieldValue}
					onValueChange={(value) => handleFieldChange(fieldName, value)}
					required={required}
				>
					<SelectTrigger 
						className={hasError ? 'border-destructive' : ''}
						aria-invalid={hasError}
						aria-describedby={hasError ? `${fieldName}-error` : undefined}
					>
						<SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
					</SelectTrigger>
					<SelectContent>
						{options.map(option => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{hasError && (
					<span id={`${fieldName}-error`} className="text-xs text-destructive sr-only">
						{stepErrors[stepNumber]?.find(e => e.includes(label.split(' *')[0]))}
					</span>
				)}
			</div>
		)
	}

	return (
		<form 
			ref={formRef} 
			onSubmit={handleFormSubmit} 
			className="space-y-6"
			aria-label="CRM Contact Form"
			noValidate
		>
			{/* Hidden inputs for services and communication logs */}
			<input type="hidden" name="services" value={JSON.stringify(selectedServices)} />
			<input type="hidden" name="communicationLogs" value={JSON.stringify(communicationLogs)} />
			
			{/* Hidden inputs for ALL form fields to ensure FormData can read them
			    This is necessary because fields are conditionally rendered based on currentStep
			    and FormData needs all values to be in the DOM */}
			{Object.keys(formValues).map(key => {
				const fieldName = key as FormFieldName
				const value = getFieldValue(fieldName)
				return (
					<input 
						key={fieldName}
						type="hidden" 
						name={fieldName} 
						value={value} 
					/>
				)
			})}

			{/* Progress Steps Indicator */}
			{renderStepIndicator()}

			{/* Step Content */}
			<div className="min-h-[400px]" role="region" aria-label={`Step ${currentStep} of ${STEPS.length}`}>
				{/* Step 1: Contact Details */}
				{currentStep === 1 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Contact Details</CardTitle>
							<p className="text-sm text-muted-foreground">Please provide the contact information</p>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{renderField('fullName', 'Full Name *', true, 'text', undefined, 1)}
								{renderField('jobTitle', 'Job Title *', true, 'text', undefined, 1)}
								{renderField('influence', 'Influence', false, 'text', 'e.g., decision maker', 1)}
								{renderField('email', 'Email *', true, 'email', undefined, 1)}
								{renderField('contact1Mobile', 'Mobile', false, 'text', undefined, 1)}
								{renderField('contact2Landline', 'Landline', false, 'text', undefined, 1)}
								{renderField('linkedIn', 'LinkedIn', false, 'text', 'LinkedIn profile URL', 1)}
								{renderField('bdmContactOwner', 'BDM Contact Owner', false, 'text', undefined, 1)}
								{renderSelectField('leadStatus', 'Lead Status', LEAD_STATUSES, false, 1)}
								{renderSelectField('connectedOnLinkedIn', 'Connected on LinkedIn', YES_NO_OPTIONS, false, 1)}
								{renderField('createDate', 'Create Date', false, 'date', undefined, 1)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 2: Company Details */}
				{currentStep === 2 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Company Details</CardTitle>
							<p className="text-sm text-muted-foreground">Please provide the company information</p>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{renderField('businessName', 'Business Name *', true, 'text', undefined, 2, 'full')}
								{renderField('addressFirstLine', 'Address First Line *', true, 'text', undefined, 2, 'full')}
								{renderField('addressSecondLine', 'Address Second Line', false, 'text', undefined, 2, 'full')}
								{renderField('town', 'Town *', true, 'text', undefined, 2)}
								{renderField('postCode', 'Post Code *', true, 'text', undefined, 2)}
								{renderSelectField('region', 'Region *', UK_COUNTIES, true, 2, 'Select region')}
								{renderSelectField('industrySector', 'Industry Sector *', INDUSTRIES, true, 2, 'Select industry')}
								{renderField('website', 'Website', false, 'text', 'https://example.com', 2)}
								{renderField('sizeOfBusinessEmployees', 'Size of Business (Employees)', false, 'number', undefined, 2, undefined, undefined, '0')}
								{renderField('sizeOfBusinessTurnover', 'Size of Business (Turnover)', false, 'number', undefined, 2, undefined, '0.01', '0')}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 3: Services */}
				{currentStep === 3 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Services</CardTitle>
							<p className="text-sm text-muted-foreground">Select the services this contact is interested in (optional)</p>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{SERVICES_HIERARCHY.map((category, index) => (
									<ServiceCategorySelector
										key={category.name}
										category={category}
										selectedServices={selectedServices}
										onServiceToggle={handleServiceToggle}
										categoryIndex={index + 1}
									/>
								))}
								{selectedServices.length > 0 && (
									<div className="mt-4 p-4 bg-muted/30 rounded-lg">
										<p className="text-sm font-semibold mb-2">Selected Services ({selectedServices.length}):</p>
										<div className="flex flex-wrap gap-2" role="list" aria-label="Selected services">
											{selectedServices.map(service => (
												<Badge key={service} variant="secondary" className="text-xs">
													{service.split(' > ').pop()}
												</Badge>
											))}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 4: Other Details */}
				{currentStep === 4 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Other Details</CardTitle>
							<p className="text-sm text-muted-foreground">Additional information (optional)</p>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{renderSelectField('contractStatus', 'Contract Status', CONTRACT_STATUSES, false, 1)}
								{renderSelectField('includedOnNewsletter', 'Included on Newsletter', YES_NO_OPTIONS, false, 1)}
								
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="multipleOpportunities">Multiple Opportunities</Label>
									<Textarea
										id="multipleOpportunities"
										name="multipleOpportunities"
										value={getFieldValue('multipleOpportunities')}
										onChange={(e) => handleFieldChange('multipleOpportunities', e.target.value)}
										className="min-h-[100px]"
									/>
								</div>

								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="currentRisksConcerns">Current Risks/Concerns</Label>
									<Textarea
										id="currentRisksConcerns"
										name="currentRisksConcerns"
										value={getFieldValue('currentRisksConcerns')}
										onChange={(e) => handleFieldChange('currentRisksConcerns', e.target.value)}
										className="min-h-[100px]"
									/>
								</div>

								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="nextSteps">Next Steps</Label>
									<Textarea
										id="nextSteps"
										name="nextSteps"
										value={getFieldValue('nextSteps')}
										onChange={(e) => handleFieldChange('nextSteps', e.target.value)}
										className="min-h-[100px]"
									/>
								</div>

								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="scopeOfWorks">Scope of Works</Label>
									<Textarea
										id="scopeOfWorks"
										name="scopeOfWorks"
										value={getFieldValue('scopeOfWorks')}
										onChange={(e) => handleFieldChange('scopeOfWorks', e.target.value)}
										className="min-h-[100px]"
									/>
								</div>

								{renderField('incumbentSupplier', 'Incumbent Supplier', false, 'text', undefined, 1)}
								{renderField('lengthOfContract', 'Length of Contract (years)', false, 'number', undefined, 1, undefined, undefined, '0')}
								{renderField('dateOfNextReview', 'Date of Next Review', false, 'date', undefined, 1)}
								{renderField('lastActivityDate', 'Last Activity Date', false, 'date', undefined, 1)}
								{renderField('nextAppointmentDate', 'Next Appointment Date', false, 'date', undefined, 1)}

								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="managerReview">Manager Review</Label>
									<Textarea
										id="managerReview"
										name="managerReview"
										value={getFieldValue('managerReview')}
										onChange={(e) => handleFieldChange('managerReview', e.target.value)}
										className="min-h-[100px]"
									/>
								</div>

								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="notes">Notes</Label>
									<Textarea
										id="notes"
										name="notes"
										value={getFieldValue('notes')}
										onChange={(e) => handleFieldChange('notes', e.target.value)}
										className="min-h-[120px]"
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 5: Communication Log */}
				{currentStep === 5 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Communication Log</CardTitle>
							<p className="text-sm text-muted-foreground">
								{initialData 
									? 'Add new communication entries to track ongoing conversations with this contact'
									: 'Add communication history (optional)'}
							</p>
							{initialData && communicationLogs.length > 0 && (
								<p className="text-xs text-muted-foreground mt-1">
									{communicationLogs.length} existing {communicationLogs.length === 1 ? 'entry' : 'entries'} on record
								</p>
							)}
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Add New Communication Log Form */}
							<div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/40">
								<h3 className="text-sm font-semibold">Add New Communication</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="commCallDate">Date *</Label>
										<Input
											id="commCallDate"
											type="date"
											value={newCommLog.callDate}
											onChange={e => setNewCommLog(prev => ({ ...prev, callDate: e.target.value }))}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="commCallTime">Time *</Label>
										<Input
											id="commCallTime"
											type="time"
											value={newCommLog.callTime}
											onChange={e => setNewCommLog(prev => ({ ...prev, callTime: e.target.value }))}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="commType">Communication Type</Label>
										<Select
											value={newCommLog.commsType}
											onValueChange={value => setNewCommLog(prev => ({ ...prev, commsType: value as CommunicationLog['commsType'] }))}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{COMMS_TYPES.map(type => (
													<SelectItem key={type} value={type}>
														{type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="commPersonSpokenTo">Person Spoken To</Label>
										<Input
											id="commPersonSpokenTo"
											value={newCommLog.personSpokenTo}
											onChange={e => setNewCommLog(prev => ({ ...prev, personSpokenTo: e.target.value }))}
										/>
									</div>

									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="commNotes">Notes</Label>
										<Textarea
											id="commNotes"
											value={newCommLog.notes}
											onChange={e => setNewCommLog(prev => ({ ...prev, notes: e.target.value }))}
											className="min-h-[100px]"
										/>
									</div>

									<div className="flex gap-2 md:col-span-2">
										<Button 
											type="button" 
											onClick={handleAddCommunicationLog} 
											variant="default" 
											size="sm"
											disabled={isAddingLog || !newCommLog.callDate || !newCommLog.callTime || !newCommLog.personSpokenTo || !newCommLog.notes}
										>
											{isAddingLog ? 'Adding...' : 'Add Communication'}
										</Button>
										<Button type="button" onClick={handleClearCommLog} variant="outline" size="sm">
											Clear
										</Button>
									</div>
								</div>
							</div>

							{/* Existing Communication Logs */}
							{communicationLogs.length > 0 && (
								<div className="space-y-3">
									<h3 className="text-sm font-semibold">Communication History</h3>
									<ScrollArea className="h-[300px] pr-4">
										<div className="space-y-3" role="list" aria-label="Communication history">
											{communicationLogs.map(log => (
												<Card key={log.id} className="border border-border/40">
													<CardContent className="p-4">
														<div className="flex justify-between items-start mb-2">
															<div className="flex items-center gap-2 flex-wrap">
																<Badge variant="outline">{log.commsType}</Badge>
																<span className="text-sm text-muted-foreground font-medium">
																	{(() => {
																		try {
																			const date = new Date(log.callDate)
																			if (log.callDate.includes('T')) {
																				return format(date, 'dd/MM/yyyy HH:mm')
																			}
																			return format(date, 'dd/MM/yyyy')
																		} catch {
																			return log.callDate
																		}
																	})()}
																</span>
																{log.createdAt && (
																	<span className="text-xs text-muted-foreground/70">
																		(Logged: {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')})
																	</span>
																)}
															</div>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => setCommunicationLogs(prev => prev.filter(l => l.id !== log.id))}
																className="h-6 w-6 p-0 text-destructive hover:text-destructive"
																aria-label={`Delete communication log from ${format(new Date(log.callDate), 'dd/MM/yyyy')}`}
															>
																<X className="h-4 w-4" />
															</Button>
														</div>
														<p className="text-sm font-medium mb-1">Person: {log.personSpokenTo}</p>
														<p className="text-sm text-muted-foreground">{log.notes}</p>
													</CardContent>
												</Card>
											))}
										</div>
									</ScrollArea>
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Navigation Buttons */}
			<div className="flex justify-between items-center pt-4 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={handlePrevious}
					disabled={currentStep === 1}
					className="flex items-center gap-2"
					aria-label="Go to previous step"
				>
					<ChevronLeft className="h-4 w-4" aria-hidden="true" />
					Previous
				</Button>

				<div className="text-sm text-muted-foreground" aria-live="polite">
					Step {currentStep} of {STEPS.length}
				</div>

				{currentStep < STEPS.length ? (
					<Button
						type="button"
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							handleNext(e)
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault()
								e.stopPropagation()
								handleNext()
							}
						}}
						disabled={(currentStep === 1 || currentStep === 2) && !completedSteps.has(currentStep)}
						className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Go to next step"
					>
						Next
						<ChevronRight className="h-4 w-4" aria-hidden="true" />
					</Button>
				) : (
					<Button 
						type="submit" 
						className="bg-primary hover:bg-primary/90" 
						disabled={isSaving}
						aria-label={isSaving ? 'Saving contact' : initialData ? 'Update contact' : 'Save new contact'}
					>
						{isSaving ? 'Saving...' : initialData ? 'Modify Selected Record' : 'Save As New Record'}
					</Button>
				)}
			</div>
		</form>
	)
}
