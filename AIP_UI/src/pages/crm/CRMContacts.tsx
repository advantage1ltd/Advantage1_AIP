import { useState, useMemo, useCallback, useEffect } from 'react'
import React from 'react'
import { Plus, Search, Users, Building, CheckCircle2, FileText, X, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { CRMContactForm } from '@/components/crm/CRMContactForm'
import { CommunicationHistory } from '@/components/crm/CommunicationHistory'
import { CRMContact } from '@/types/crmContact'
import { toast as hotToast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { crmContactService } from '@/services/crmContactService'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogClose
} from '@/components/ui/dialog'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { v4 as uuidv4 } from 'uuid'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

type GroupByOption = 'status' | 'company' | null
type LeadStatus = 'New Lead' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost' | 'Closed'

type Filters = { status?: LeadStatus }

type StatCard = {
	label: string
	value: number
	icon: React.ElementType
	bgColor: string
	hoverColor: string
}

// Sample data - replace with actual data fetching
const SAMPLE_CRM_CONTACTS: CRMContact[] = [
	{
		id: '1',
		fullName: 'Rachel Friend',
		influence: 'decision maker',
		contact1Mobile: 'tbc',
		contact2Landline: '0121 249 2500',
		linkedIn: '',
		bdmContactOwner: 'Jas Jassi',
		leadStatus: 'Closed',
		jobTitle: 'Head of Indirect Procurement',
		email: 'rachel.friend@dana.com',
		connectedOnLinkedIn: 'No',
		createDate: '2025-10-16',
		businessName: 'DANA UK Axle',
		addressFirstLine: 'Birch Road',
		addressSecondLine: '',
		postCode: 'B6 7JR',
		town: 'Birmingham',
		region: 'West Midlands',
		website: 'www.dana.com',
		sizeOfBusinessEmployees: 0,
		sizeOfBusinessTurnover: 0,
		industrySector: 'Other',
		services: ['Manned Security > Gatehouse Officers', 'Monitoring > CCTV Monitoring'],
		multipleOpportunities: 'CCTV & Gatehouse',
		currentRisksConcerns: '',
		contractStatus: 'Pending',
		nextSteps: 'SEND INTRO EMAIL',
		includedOnNewsletter: 'No',
		notes: 'Rachel Friend is the INDIRECT PROCURMENT MANAGER responsible for all security procurement Lynne Worwood - lynne.worwood@dana.com (HR Business partner',
		scopeOfWorks: 'Gatehouse and CCTV',
		incumbentSupplier: 'Magenta',
		lengthOfContract: 2,
		dateOfNextReview: '2025-12-04',
		managerReview: '',
		lastActivityDate: '2025-10-16',
		nextAppointmentDate: '2025-12-04',
		communicationLogs: [
			{
				id: 'comm-1',
				callDate: '2025-10-16',
				commsType: 'Call',
				personSpokenTo: 'Lynne Worwood (HR Business Partner)',
				notes: 'spoken to Lynne Worwood the HR business partner for Dana she explained that they are in a 2 year contract with Magenta and have an SLA in place. Asked me to send an email through and all emails are kept for 3 months prior to archive',
				createdAt: '2025-10-16T00:00:00Z'
			}
		]
	}
]

const StatCardComponent = React.memo(
	({
		stat,
		isLast,
		totalStats
	}: {
		stat: StatCard
		isLast: boolean
		totalStats: number
	}) => {
		const Icon = stat.icon
		return (
			<Card
				className={`${stat.bgColor} ${stat.hoverColor} transition-all duration-200 rounded-lg shadow-sm overflow-hidden`}
			>
				<div className="p-3">
					<div className="flex items-center justify-between mb-1.5">
						<span className="text-sm text-white font-medium truncate">{stat.label}</span>
						<Icon className="h-4 w-4 text-white/80" />
					</div>
					<p className="text-xl font-bold text-white">{stat.value}</p>
				</div>
			</Card>
		)
	}
)

const EmptyState = React.memo(
	({
		searchQuery,
		filters,
		onAddContact
	}: {
		searchQuery: string
		filters: Filters
		onAddContact: () => void
	}) => (
		<div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-lg border border-border/40 shadow-lg text-center mt-4 sm:mt-6">
			<div className="rounded-full bg-primary/10 p-4 mb-4">
				<Plus className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
			</div>
			<h3 className="text-lg sm:text-xl font-semibold mb-2">No CRM contacts found</h3>
			<p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
				{searchQuery || filters.status
					? "Try adjusting your search or filters to find what you're looking for."
					: 'Get started by adding your first CRM contact to begin tracking potential clients.'}
			</p>
			<Button
				className="gap-2 bg-primary hover:bg-primary/90 text-sm sm:text-base py-2 px-4"
				onClick={onAddContact}
			>
				<Plus className="h-5 w-5" />
				Add your first CRM contact
			</Button>
		</div>
	)
)

const CRMContactsHeader = React.memo(
	({
		filters,
		onFilterChange,
		onAddContact
	}: {
		filters: Filters
		onFilterChange: (filters: Filters) => void
		onAddContact: () => void
	}) => (
		<div className="flex flex-col space-y-2.5">
			<div className="flex items-start">
				<div className="bg-blue-50 rounded-lg p-1.5 mr-2">
					<div className="text-blue-600">
						<FileText className="h-5 w-5" />
					</div>
				</div>
				<div>
					<h1 className="text-lg font-bold tracking-tight text-primary">CRM Contacts</h1>
					<p className="text-xs text-muted-foreground">Manage and track your CRM contacts</p>
				</div>
			</div>

			<div className="grid grid-cols-5 gap-2">
				<div className="col-span-3">
					<Select
						value={filters.status || 'all'}
						onValueChange={value =>
							onFilterChange(value === 'all' ? {} : { status: value as LeadStatus })
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="New Lead">New Lead</SelectItem>
							<SelectItem value="Qualified">Qualified</SelectItem>
							<SelectItem value="Negotiation">Negotiation</SelectItem>
							<SelectItem value="Won">Won</SelectItem>
							<SelectItem value="Lost">Lost</SelectItem>
							<SelectItem value="Closed">Closed</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					className="col-span-2 bg-primary text-white h-9 text-xs p-0 flex items-center justify-center gap-1"
					onClick={onAddContact}
				>
					<Plus className="h-4 w-4" />
					<span className="truncate">Add New Contact</span>
				</Button>
			</div>
		</div>
	)
)

export default function CRMContacts() {
	const [contacts, setContacts] = useState<CRMContact[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [filters, setFilters] = useState<Filters>({})
	const [isAddContactOpen, setIsAddContactOpen] = useState(false)
	const [editingContact, setEditingContact] = useState<CRMContact | null>(null)
	const [contactToDelete, setContactToDelete] = useState<CRMContact | null>(null)
	const [viewingHistoryContact, setViewingHistoryContact] = useState<CRMContact | null>(null)
	const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
	const [groupBy, setGroupBy] = useState<GroupByOption>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	// Load contacts from API on mount
	useEffect(() => {
		const loadContacts = async () => {
			try {
				setIsLoading(true)
				const data = await crmContactService.getAll()
				setContacts(data)
			} catch (error) {
				console.error('Error loading contacts:', error)
				hotToast.error('Failed to load contacts. Please refresh the page.', {
					position: 'top-right',
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					theme: 'light'
				})
				// Fallback to sample data if API fails
				setContacts(SAMPLE_CRM_CONTACTS)
			} finally {
				setIsLoading(false)
			}
		}
		loadContacts()
	}, [])

	const handleAddContact = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSaving(true)

		try {
			const formData = new FormData(event.currentTarget)

			// Helper function to get form value or return undefined if empty
			const getFormValue = (key: string): string | undefined => {
				const value = formData.get(key) as string
				return value && value.trim() ? value.trim() : undefined
			}

			// Get required fields and validate
			const fullName = getFormValue('fullName')
			const jobTitle = getFormValue('jobTitle')
			const email = getFormValue('email')
			const businessName = getFormValue('businessName')
			const addressFirstLine = getFormValue('addressFirstLine')
			const postCode = getFormValue('postCode')
			const town = getFormValue('town')
			const region = getFormValue('region')
			const industrySector = getFormValue('industrySector')

			// Validate required fields
			if (!fullName || !jobTitle || !email || !businessName || !addressFirstLine || !postCode || !town || !region || !industrySector) {
				hotToast.error('Please fill in all required fields', {
					position: 'top-right',
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					theme: 'light'
				})
				setIsSaving(false)
				return
			}

			const contactData = {
				fullName,
				influence: getFormValue('influence') || '',
				contact1Mobile: getFormValue('contact1Mobile') || '',
				contact2Landline: getFormValue('contact2Landline') || '',
				linkedIn: getFormValue('linkedIn'),
				bdmContactOwner: getFormValue('bdmContactOwner') || '',
				leadStatus: (getFormValue('leadStatus') as string) || 'New Lead',
				jobTitle,
				email,
				connectedOnLinkedIn: (getFormValue('connectedOnLinkedIn') as 'Yes' | 'No') || 'No',
				createDate: getFormValue('createDate') || new Date().toISOString().split('T')[0],
				businessName,
				addressFirstLine,
				addressSecondLine: getFormValue('addressSecondLine'),
				postCode,
				town,
				region,
				website: getFormValue('website'),
				sizeOfBusinessEmployees: Number(formData.get('sizeOfBusinessEmployees')) || 0,
				sizeOfBusinessTurnover: Number(formData.get('sizeOfBusinessTurnover')) || 0,
				industrySector,
				services: JSON.parse((formData.get('services') as string) || '[]'),
				multipleOpportunities: getFormValue('multipleOpportunities'),
				currentRisksConcerns: getFormValue('currentRisksConcerns'),
				contractStatus: (getFormValue('contractStatus') as string) || 'Pending',
				nextSteps: getFormValue('nextSteps'),
				includedOnNewsletter: (getFormValue('includedOnNewsletter') as 'Yes' | 'No') || 'No',
				notes: getFormValue('notes'),
				scopeOfWorks: getFormValue('scopeOfWorks'),
				incumbentSupplier: getFormValue('incumbentSupplier'),
				lengthOfContract: formData.get('lengthOfContract') ? Number(formData.get('lengthOfContract')) : undefined,
				dateOfNextReview: getFormValue('dateOfNextReview'),
				managerReview: getFormValue('managerReview'),
				lastActivityDate: getFormValue('lastActivityDate'),
				nextAppointmentDate: getFormValue('nextAppointmentDate'),
				communicationLogs: JSON.parse((formData.get('communicationLogs') as string) || '[]')
			}

			if (editingContact) {
				// Update existing contact
				const updatedContact = await crmContactService.update(editingContact.id, contactData)
				setContacts(prev => prev.map(c => (c.id === editingContact.id ? updatedContact : c)))
				setEditingContact(null)
				hotToast.success('CRM Contact Updated Successfully', {
					position: 'top-right',
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					theme: 'light'
				})
			} else {
				// Create new contact
				const newContact = await crmContactService.create(contactData)
				setContacts(prev => [newContact, ...prev])
				hotToast.success('CRM Contact Added Successfully', {
					position: 'top-right',
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					theme: 'light'
				})
			}

			setIsAddContactOpen(false)
		} catch (error) {
			console.error('Error saving contact:', error)
			hotToast.error(editingContact ? 'Failed to update contact' : 'Failed to create contact', {
				position: 'top-right',
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				theme: 'light'
			})
		} finally {
			setIsSaving(false)
		}
	}, [editingContact])

	const handleEditContact = useCallback((contact: CRMContact) => {
		setEditingContact(contact)
		setIsAddContactOpen(true)
	}, [])

	const handleDeleteContact = useCallback(async () => {
		if (contactToDelete) {
			try {
				await crmContactService.delete(contactToDelete.id)
				setContacts(prev => prev.filter(c => c.id !== contactToDelete.id))
				setContactToDelete(null)
				hotToast.success('CRM Contact Deleted Successfully', {
					position: 'top-right',
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					theme: 'light'
				})
			} catch (error) {
				console.error('Error deleting contact:', error)
				hotToast.error('Failed to delete contact', {
					position: 'top-right',
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					theme: 'light'
				})
			}
		}
	}, [contactToDelete])

	const handleFilterChange = useCallback((newFilters: Filters) => {
		setFilters(newFilters)
	}, [])

	const filteredContacts = useMemo(() => {
		let result = contacts

		if (filters.status) {
			result = result.filter(contact => contact.leadStatus === filters.status)
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			result = result.filter(
				contact =>
					contact.fullName.toLowerCase().includes(query) ||
					contact.businessName.toLowerCase().includes(query) ||
					contact.email.toLowerCase().includes(query) ||
					contact.jobTitle.toLowerCase().includes(query)
			)
		}

		return result
	}, [contacts, filters.status, searchQuery])

	const groupedContacts = useMemo(() => {
		if (!groupBy) return null

		return filteredContacts.reduce(
			(groups, contact) => {
				const key = groupBy === 'status' ? contact.leadStatus : contact.businessName
				if (!groups[key]) {
					groups[key] = []
				}
				groups[key].push(contact)
				return groups
			},
			{} as Record<string, CRMContact[]>
		)
	}, [filteredContacts, groupBy])

	const stats = useMemo(
		() => [
			{
				label: 'Total Contacts',
				value: contacts.length,
				icon: Users,
				bgColor: 'bg-indigo-900',
				hoverColor: 'hover:bg-indigo-800'
			},
			{
				label: 'New Leads',
				value: contacts.filter(contact => contact.leadStatus === 'New Lead').length,
				icon: Plus,
				bgColor: 'bg-blue-900',
				hoverColor: 'hover:bg-blue-800'
			},
			{
				label: 'Qualified',
				value: contacts.filter(contact => contact.leadStatus === 'Qualified').length,
				icon: CheckCircle2,
				bgColor: 'bg-purple-900',
				hoverColor: 'hover:bg-purple-800'
			},
			{
				label: 'Companies',
				value: new Set(contacts.map(contact => contact.businessName)).size,
				icon: Building,
				bgColor: 'bg-slate-900',
				hoverColor: 'hover:bg-slate-800'
			}
		],
		[contacts]
	)

	return (
		<div className="min-h-screen bg-[#EFF4FF]">
			<div className="container mx-auto px-3 py-3 sm:py-4 max-w-full">
				<div className="space-y-3 sm:space-y-4">
					<CRMContactsHeader
						filters={filters}
						onFilterChange={handleFilterChange}
						onAddContact={() => {
							setEditingContact(null)
							setIsAddContactOpen(true)
						}}
					/>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						{stats.map((stat, index) => (
							<StatCardComponent
								key={stat.label}
								stat={stat}
								isLast={index === stats.length - 1}
								totalStats={stats.length}
							/>
						))}
					</div>

					<div className="mt-3 sm:mt-4">
						<div className="mb-2 sm:mb-3">
							<div className="relative">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search contacts..."
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									className="w-full h-9 pl-8 border-slate-200 rounded-md text-sm"
								/>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
							<div className="p-2.5 border-b border-slate-100 flex justify-between items-center">
								<div className="text-xs text-muted-foreground">
									Showing {filteredContacts.length}{' '}
									{filteredContacts.length === 1 ? 'contact' : 'contacts'}
								</div>
								<Select
									value={groupBy || 'none'}
									onValueChange={value =>
										setGroupBy(value === 'none' ? null : (value as GroupByOption))
									}
								>
									<SelectTrigger className="w-[130px] h-7 text-xs rounded border-slate-200">
										<SelectValue placeholder="No grouping" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">No grouping</SelectItem>
										<SelectItem value="status">Status</SelectItem>
										<SelectItem value="company">Company</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="overflow-x-auto">
								{isLoading ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-xs sm:text-sm">Name</TableHead>
												<TableHead className="text-xs sm:text-sm">Company</TableHead>
												<TableHead className="text-xs sm:text-sm">Job Title</TableHead>
												<TableHead className="text-xs sm:text-sm">Status</TableHead>
												<TableHead className="text-xs sm:text-sm">Email</TableHead>
												<TableHead className="text-xs sm:text-sm">Services</TableHead>
												<TableHead className="text-xs sm:text-sm">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											<TableRow>
												<TableCell colSpan={7} className="text-center py-8">
													<div className="flex flex-col items-center justify-center gap-2">
														<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
														<p className="text-sm text-muted-foreground">Loading contacts...</p>
													</div>
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								) : filteredContacts.length === 0 ? (
									<EmptyState
										searchQuery={searchQuery}
										filters={filters}
										onAddContact={() => {
											setEditingContact(null)
											setIsAddContactOpen(true)
										}}
									/>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-xs sm:text-sm">Name</TableHead>
												<TableHead className="text-xs sm:text-sm">Company</TableHead>
												<TableHead className="text-xs sm:text-sm">Job Title</TableHead>
												<TableHead className="text-xs sm:text-sm">Status</TableHead>
												<TableHead className="text-xs sm:text-sm">Email</TableHead>
												<TableHead className="text-xs sm:text-sm">Services</TableHead>
												<TableHead className="text-xs sm:text-sm">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredContacts.map(contact => (
												<TableRow key={contact.id} className="hover:bg-muted/30">
													<TableCell className="text-xs sm:text-sm font-medium">
														{contact.fullName}
													</TableCell>
													<TableCell className="text-xs sm:text-sm">
														{contact.businessName}
													</TableCell>
													<TableCell className="text-xs sm:text-sm">
														{contact.jobTitle}
													</TableCell>
													<TableCell className="text-xs sm:text-sm">
														<Badge
															variant={
																contact.leadStatus === 'Won' || contact.leadStatus === 'Qualified'
																	? 'default'
																	: contact.leadStatus === 'Lost' || contact.leadStatus === 'Closed'
																		? 'destructive'
																		: 'secondary'
															}
														>
															{contact.leadStatus}
														</Badge>
													</TableCell>
													<TableCell className="text-xs sm:text-sm">
														{contact.email}
													</TableCell>
													<TableCell className="text-xs sm:text-sm">
														<div className="flex flex-wrap gap-1">
															{contact.services.slice(0, 2).map(service => (
																<Badge key={service} variant="outline" className="text-xs">
																	{service.split(' > ').pop()}
																</Badge>
															))}
															{contact.services.length > 2 && (
																<Badge variant="outline" className="text-xs">
																	+{contact.services.length - 2}
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell className="text-xs sm:text-sm">
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleEditContact(contact)}
																className="h-7 text-xs"
															>
																Edit
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setViewingHistoryContact(contact)
																	setIsHistoryDialogOpen(true)
																}}
																className="h-7 text-xs"
																title="View communication history"
															>
																<MessageSquare className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => setContactToDelete(contact)}
																className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Floating Action Button for Mobile */}
			<div className="fixed right-3 bottom-3 z-10">
				<Button
					size="icon"
					className="h-11 w-11 rounded-full shadow-lg bg-primary text-white"
					onClick={() => {
						setEditingContact(null)
						setIsAddContactOpen(true)
					}}
				>
					<Plus className="h-5 w-5" />
				</Button>
			</div>

			{/* Dialog */}
			<Dialog
				open={isAddContactOpen}
				onOpenChange={open => {
					setIsAddContactOpen(open)
					if (!open) setEditingContact(null)
				}}
			>
				<DialogContent className="sm:max-w-[90vw] lg:max-w-[1200px] max-h-[90vh] overflow-y-auto p-0 mx-2 sm:mx-auto rounded-lg">
					<DialogHeader className="p-3 sm:p-4 bg-white border-b sticky top-0 z-10 relative">
						<DialogClose asChild>
							<Button
								variant="ghost"
								size="icon"
								className="absolute right-2 top-2 h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 font-bold text-lg"
								onClick={() => {
									setIsAddContactOpen(false)
									setEditingContact(null)
								}}
							>
								×
								<span className="sr-only">Close</span>
							</Button>
						</DialogClose>
						<DialogTitle className="text-base sm:text-lg font-semibold text-primary pr-8">
							{editingContact ? 'Edit CRM Contact' : 'Add New CRM Contact'}
						</DialogTitle>
						<DialogDescription className="text-xs sm:text-sm mt-1">
							{editingContact
								? 'Update the CRM contact information below.'
								: 'Fill in the details below to add a new CRM contact.'}
						</DialogDescription>
					</DialogHeader>
					<div className="p-3 sm:p-4">
						<CRMContactForm onSubmit={handleAddContact} initialData={editingContact || undefined} isSaving={isSaving} />
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the CRM contact
							{contactToDelete?.fullName && <> "{contactToDelete.fullName}"</>} from
							{contactToDelete?.businessName && <> {contactToDelete.businessName}</>}.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteContact}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Communication History Dialog */}
			<Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
				<DialogContent className="sm:max-w-[90vw] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
					{viewingHistoryContact && (
						<CommunicationHistory
							contactId={viewingHistoryContact.id}
							contactName={`${viewingHistoryContact.fullName} - ${viewingHistoryContact.businessName}`}
							onClose={() => {
								setIsHistoryDialogOpen(false)
								setViewingHistoryContact(null)
							}}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Toast Container */}
			<ToastContainer
				position="bottom-right"
				hideProgressBar={false}
				closeOnClick
				pauseOnHover
				theme="light"
			/>
		</div>
	)
}
