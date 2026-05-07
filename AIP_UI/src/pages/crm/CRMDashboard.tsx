import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Users,
	UserPlus,
	TrendingUp,
	BarChart3,
	Calendar,
	Activity,
	ArrowRight,
	Clock,
	DollarSign,
	X,
	ChevronLeft,
	ChevronRight,
	CalendarDays,
	Mail,
	FileText,
	GitBranch,
	CheckCircle2,
	Pencil,
	Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
	format,
	addMonths,
	subMonths,
	isSameMonth,
	isSameDay,
	isToday,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval
} from 'date-fns'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { crmEmailService } from '@/services/crmEmailService'
import { crmContactService, RecentActivity } from '@/services/crmContactService'
import { crmDashboardService, ScheduledEvent as ScheduledEventType } from '@/services/crmDashboardService'
import { CRMContact } from '@/types/crmContact'

// Types
interface DashboardStats {
	totalContacts: number
	pipelineValue: number
	avgDealValue: number
	conversionRate: number
	contactGrowth: number
	recentActivities: Activity[]
	upcomingEvents: ScheduledEvent[]
}

interface Activity {
	id: string
	type: 'contact' | 'deal' | 'event' | 'communication'
	title: string
	description: string
	timestamp: Date
	icon: React.ReactNode
}

interface ScheduledEvent {
	id: string
	title: string
	type: 'meeting' | 'call' | 'task' | 'reminder'
	date: Date
	time: string
	duration: string
	description: string
	notificationSent: boolean
	sendEmailNotification?: boolean
	recipientEmail?: string
}

// Helper function to convert RecentActivity to Activity with icon
const convertToActivity = (activity: RecentActivity): Activity => {
	if (activity.type === 'contact') {
		return {
			...activity,
			type: 'contact',
			icon: (
				<div className="rounded-full bg-blue-50 p-1.5 mt-0.5">
					<UserPlus className="h-3.5 w-3.5 text-blue-600" />
				</div>
			)
		}
	} else {
		return {
			...activity,
			type: 'communication',
			icon: (
				<div className="rounded-full bg-green-50 p-1.5 mt-0.5">
					<Activity className="h-3.5 w-3.5 text-green-600" />
				</div>
			)
		}
	}
}

// Helper functions
const calculateStats = (contacts: CRMContact[], deals: any[], recentActivities: Activity[]): DashboardStats => {
	const pipelineValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
	const avgDealValue = deals.length > 0 ? pipelineValue / deals.length : 0
	const closedDeals = deals.filter(d => d.stage === 'closed').length
	const conversionRate = deals.length > 0 ? Math.round((closedDeals / deals.length) * 100) : 0

	return {
		totalContacts: contacts.length,
		pipelineValue,
		avgDealValue,
		conversionRate,
		contactGrowth: 12.4,
		recentActivities,
		upcomingEvents: []
	}
}

// Components
const StatCard: React.FC<{
	title: string
	value: string | number
	change?: number
	icon: React.ReactNode
	bgColor: string
	iconBgColor: string
	onClick?: () => void
}> = React.memo(({ title, value, change, icon, bgColor, iconBgColor, onClick }) => (
	<Card
		className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${bgColor}`}
		onClick={onClick}
	>
		<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
			<CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
			<div className={`rounded-full ${iconBgColor} p-2`}>{icon}</div>
		</CardHeader>
		<CardContent className="px-4 pb-4">
			<div className="text-2xl lg:text-3xl font-bold text-white">{value}</div>
			{change !== undefined && (
				<div className="flex items-center mt-1">
					<span className="text-xs text-white/90 font-medium bg-white/20 px-2 py-0.5 rounded">
						{change > 0 ? '+' : ''}
						{change}%
					</span>
					<span className="text-xs text-white/70 ml-2">from last month</span>
				</div>
			)}
		</CardContent>
	</Card>
))

const ActivityItem: React.FC<{ activity: Activity; isLast: boolean }> = React.memo(
	({ activity, isLast }) => (
		<div key={activity.id}>
			<div className="flex items-start gap-3">
				{activity.icon}
				<div className="flex-1">
					<p className="text-sm font-medium">{activity.title}</p>
					<p className="text-xs text-muted-foreground">{activity.description}</p>
					<p className="text-xs text-muted-foreground mt-1">
						{format(activity.timestamp, 'PPp')}
					</p>
				</div>
			</div>
			{!isLast && <Separator className="my-4" />}
		</div>
	)
)

// Calendar Day Component
const CalendarDay: React.FC<{
	day: Date | null
	currentDate: Date
	selectedDate: Date | null
	events: ScheduledEvent[]
	onSelect: (date: Date) => void
}> = React.memo(({ day, currentDate, selectedDate, events, onSelect }) => {
	if (!day) return <div className="h-20 md:h-24" />

	const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
	const dayEvents = events.filter(event => isSameDay(new Date(event.date), day))
	const isCurrentMonth = isSameMonth(day, currentDate)

	return (
		<button
			type="button"
			onClick={() => onSelect(day)}
			className={cn(
				'h-20 md:h-24 w-full p-1 flex flex-col items-stretch rounded-md relative transition-colors',
				isSelected ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted/50',
				!isCurrentMonth ? 'opacity-50' : '',
				'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
			)}
		>
			<span
				className={cn(
					'text-xs md:text-sm font-medium w-full text-center mb-1 rounded',
					isToday(day) ? 'bg-primary text-primary-foreground' : '',
					isSelected ? 'text-primary-foreground' : ''
				)}
			>
				{format(day, 'd')}
			</span>

			<div className="flex-1 overflow-hidden space-y-0.5">
				{dayEvents.slice(0, 2).map((event, index) => (
					<div
						key={event.id}
						className={cn(
							'text-[9px] md:text-[10px] px-1 py-0.5 rounded truncate',
							event.type === 'meeting'
								? 'bg-blue-100 text-blue-800'
								: event.type === 'call'
									? 'bg-green-100 text-green-800'
									: event.type === 'task'
										? 'bg-amber-100 text-amber-800'
										: 'bg-indigo-100 text-indigo-800'
						)}
					>
						{event.title}
					</div>
				))}
				{dayEvents.length > 2 && (
					<div className="text-[9px] md:text-[10px] px-1 text-muted-foreground">
						+{dayEvents.length - 2} more
					</div>
				)}
			</div>
		</button>
	)
})

// Event Form Component
const EventForm: React.FC<{
	formData: typeof initialEventFormState
	onChange: (field: keyof typeof initialEventFormState, value: string | boolean) => void
}> = React.memo(({ formData, onChange }) => {
	const eventTypeIcons = {
		meeting: '📅',
		call: '📞',
		task: '✓',
		reminder: '🔔'
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Event Title */}
			<div className="space-y-2">
				<Label htmlFor="event-title" className="text-sm sm:text-base font-semibold text-foreground">
					Event Title <span className="text-red-500">*</span>
				</Label>
				<Input
					id="event-title"
					value={formData.title}
					onChange={e => onChange('title', e.target.value)}
					placeholder="e.g., Client Meeting, Follow-up Call"
					className="h-10 sm:h-11 text-sm sm:text-base"
					required
				/>
			</div>

			{/* Event Type */}
			<div className="space-y-2">
				<Label htmlFor="event-type" className="text-sm sm:text-base font-semibold text-foreground">
					Event Type <span className="text-red-500">*</span>
				</Label>
				<Select value={formData.type} onValueChange={value => onChange('type', value)}>
					<SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
						<SelectValue placeholder="Select event type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="meeting" className="text-sm sm:text-base">
							<span className="flex items-center gap-2">
								<span>{eventTypeIcons.meeting}</span>
								<span>Meeting</span>
							</span>
						</SelectItem>
						<SelectItem value="call" className="text-sm sm:text-base">
							<span className="flex items-center gap-2">
								<span>{eventTypeIcons.call}</span>
								<span>Call</span>
							</span>
						</SelectItem>
						<SelectItem value="task" className="text-sm sm:text-base">
							<span className="flex items-center gap-2">
								<span>{eventTypeIcons.task}</span>
								<span>Task</span>
							</span>
						</SelectItem>
						<SelectItem value="reminder" className="text-sm sm:text-base">
							<span className="flex items-center gap-2">
								<span>{eventTypeIcons.reminder}</span>
								<span>Reminder</span>
							</span>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Time and Duration */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
				<div className="space-y-2">
					<Label htmlFor="event-time" className="text-sm sm:text-base font-semibold text-foreground">
						Time <span className="text-red-500">*</span>
					</Label>
					<Select value={formData.time} onValueChange={value => onChange('time', value)}>
						<SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
							<SelectValue placeholder="Select time" />
						</SelectTrigger>
						<SelectContent className="max-h-[200px]">
							{[
								'09:00',
								'09:30',
								'10:00',
								'10:30',
								'11:00',
								'11:30',
								'12:00',
								'12:30',
								'13:00',
								'13:30',
								'14:00',
								'14:30',
								'15:00',
								'15:30',
								'16:00',
								'16:30',
								'17:00',
								'17:30'
							].map(time => (
								<SelectItem key={time} value={time} className="text-sm sm:text-base">
									{time}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="event-duration" className="text-sm sm:text-base font-semibold text-foreground">
						Duration <span className="text-red-500">*</span>
					</Label>
					<Select
						value={formData.duration}
						onValueChange={value => onChange('duration', value)}
					>
						<SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
							<SelectValue placeholder="Select duration" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="15" className="text-sm sm:text-base">15 minutes</SelectItem>
							<SelectItem value="30" className="text-sm sm:text-base">30 minutes</SelectItem>
							<SelectItem value="45" className="text-sm sm:text-base">45 minutes</SelectItem>
							<SelectItem value="60" className="text-sm sm:text-base">1 hour</SelectItem>
							<SelectItem value="90" className="text-sm sm:text-base">1.5 hours</SelectItem>
							<SelectItem value="120" className="text-sm sm:text-base">2 hours</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="event-description" className="text-sm sm:text-base font-semibold text-foreground">
					Description
				</Label>
				<Textarea
					id="event-description"
					value={formData.description}
					onChange={e => onChange('description', e.target.value)}
					placeholder="Add details, agenda items, or notes about this event..."
					rows={4}
					className="resize-none text-sm sm:text-base min-h-[100px]"
				/>
			</div>

			{/* Email Notification Section */}
			<div className="space-y-4 pt-4 border-t border-border/40">
				<div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 space-y-1">
							<div className="flex items-center gap-2">
								<Mail className="h-4 w-4 text-blue-600" />
								<Label htmlFor="send-email" className="text-sm sm:text-base font-semibold text-foreground cursor-pointer">
									Send Email Notification
								</Label>
							</div>
							<p className="text-xs sm:text-sm text-muted-foreground">
								Send notification email from{' '}
								<span className="font-medium text-primary">sales@advantage1.co.uk</span>
							</p>
						</div>
						<Switch
							id="send-email"
							checked={formData.sendEmailNotification}
							onCheckedChange={checked => onChange('sendEmailNotification', checked)}
						/>
					</div>
				</div>

				{formData.sendEmailNotification && (
					<div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
						<Label htmlFor="recipient-email" className="text-sm sm:text-base font-semibold text-foreground">
							Recipient Email <span className="text-red-500">*</span>
						</Label>
						<Input
							id="recipient-email"
							type="email"
							value={formData.recipientEmail}
							onChange={e => onChange('recipientEmail', e.target.value)}
							placeholder="recipient@example.com"
							className="h-10 sm:h-11 text-sm sm:text-base"
							required={formData.sendEmailNotification}
						/>
						<p className="text-xs text-muted-foreground flex items-center gap-1">
							<Mail className="h-3 w-3" />
							Email will be sent from sales@advantage1.co.uk
						</p>
					</div>
				)}
			</div>
		</div>
	)
})

// Initial state
const initialEventFormState = {
	title: '',
	type: 'meeting' as const,
	time: '09:00',
	duration: '30',
	description: '',
	sendEmailNotification: false,
	recipientEmail: ''
}

// Initial sample events
const sampleEvents: ScheduledEvent[] = [
	{
		id: '1',
		title: 'Follow-up call',
		type: 'call',
		date: new Date(),
		time: '10:00',
		duration: '15',
		description: 'Discuss proposal details',
		notificationSent: true
	},
	{
		id: '2',
		title: 'Product demo',
		type: 'meeting',
		date: new Date(Date.now() + 86400000),
		time: '14:00',
		duration: '60',
		description: 'Show new features',
		notificationSent: true
	}
]

// Main Component
export default function CRMDashboard() {
	const navigate = useNavigate()
	const contacts = useSelector((state: RootState) => state.contacts.contacts)

	// Mock deals data - in production, this would come from the Pipeline page
	const [deals] = useState<any[]>([
		{ id: '1', value: 20000, stage: 'lead' },
		{ id: '2', value: 12000, stage: 'contact' },
		{ id: '3', value: 35000, stage: 'negotiation' },
		{ id: '4', value: 4000, stage: 'closed' }
	])

	const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([])
	const [currentDate, setCurrentDate] = useState(new Date())
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [eventFormData, setEventFormData] = useState(initialEventFormState)
	const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
	const [editingEventId, setEditingEventId] = useState<string | null>(null)
	const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
	const [recentActivities, setRecentActivities] = useState<Activity[]>([])
	const [isLoadingActivities, setIsLoadingActivities] = useState(true)
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
	const [isLoadingStats, setIsLoadingStats] = useState(true)
	const [isLoadingEvents, setIsLoadingEvents] = useState(true)

	// Load recent activities from API
	const loadRecentActivities = useCallback(async () => {
		try {
			setIsLoadingActivities(true)
			console.log('[CRM Dashboard] Loading recent activities...')
			const activities = await crmContactService.getRecentActivities(10)
			console.log('[CRM Dashboard] Received activities:', activities)
			const convertedActivities = activities.map(convertToActivity)
			console.log('[CRM Dashboard] Converted activities:', convertedActivities)
			setRecentActivities(convertedActivities)
		} catch (error: any) {
			console.error('[CRM Dashboard] Error loading recent activities:', error)
			// Check if it's a network error (backend might be down)
			if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
				console.warn('[CRM Dashboard] Backend appears to be unavailable. Please ensure the backend is running.')
			}
			// Fallback to empty array on error
			setRecentActivities([])
		} finally {
			setIsLoadingActivities(false)
		}
	}, [])

	useEffect(() => {
		loadRecentActivities()
	}, [loadRecentActivities])

	// Refresh activities when component becomes visible (e.g., when navigating back)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				loadRecentActivities()
			}
		}
		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
	}, [loadRecentActivities])

	// Load dashboard stats from API
	const loadDashboardStats = useCallback(async () => {
		try {
			setIsLoadingStats(true)
			const stats = await crmDashboardService.getDashboardStats()
			const convertedStats = convertStatsToFrontend(stats, recentActivities)
			setDashboardStats(convertedStats)
			setScheduledEvents(convertedStats.upcomingEvents)
		} catch (error) {
			console.error('[CRM Dashboard] Error loading dashboard stats:', error)
			// Fallback to calculated stats
			const fallbackStats = {
				totalContacts: contacts.length,
				pipelineValue: 0,
				avgDealValue: 0,
				conversionRate: 0,
				contactGrowth: 0,
				recentActivities,
				upcomingEvents: []
			}
			setDashboardStats(fallbackStats)
		} finally {
			setIsLoadingStats(false)
		}
	}, [contacts.length, recentActivities])

	// Load scheduled events from API
	const loadScheduledEvents = useCallback(async () => {
		try {
			setIsLoadingEvents(true)
			const events = await crmDashboardService.getScheduledEvents()
			setScheduledEvents(events)
		} catch (error) {
			console.error('[CRM Dashboard] Error loading scheduled events:', error)
			// Keep existing events on error
		} finally {
			setIsLoadingEvents(false)
		}
	}, [])

	// Load dashboard data on mount and when recent activities are loaded
	useEffect(() => {
		if (!isLoadingActivities) {
			loadDashboardStats()
			loadScheduledEvents()
		}
	}, [isLoadingActivities]) // Load after activities are loaded

	// Refresh dashboard when component becomes visible
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && !isLoadingActivities) {
				loadDashboardStats()
				loadScheduledEvents()
			}
		}
		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
	}, [isLoadingActivities])

	// Memoized stats - use dashboardStats if available, otherwise calculate
	const stats = useMemo(() => {
		if (dashboardStats) {
			return dashboardStats
		}
		return {
			totalContacts: contacts.length,
			pipelineValue: 0,
			avgDealValue: 0,
			conversionRate: 0,
			contactGrowth: 0,
			recentActivities,
			upcomingEvents: []
		}
	}, [dashboardStats, contacts.length, recentActivities])

	const upcomingEvents = useMemo(() => {
		if (!stats.upcomingEvents || stats.upcomingEvents.length === 0) {
			return scheduledEvents
				.filter(event => {
					const eventDate = new Date(event.date)
					const today = new Date()
					return eventDate >= today && eventDate <= new Date(today.getTime() + 86400000 * 7)
				})
				.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
				.slice(0, 5)
		}
		return stats.upcomingEvents
			.filter(event => {
				const eventDate = new Date(event.date)
				const today = new Date()
				return eventDate >= today && eventDate <= new Date(today.getTime() + 86400000 * 7)
			})
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.slice(0, 5)
	}, [scheduledEvents, stats.upcomingEvents])

	// Event Handlers
	const handleSchedule = useCallback(() => {
		setIsScheduleDialogOpen(true)
	}, [])

	const handleEventFormChange = useCallback(
		(field: keyof typeof initialEventFormState, value: string | boolean) => {
			setEventFormData(prev => ({ ...prev, [field]: value }))
		},
		[]
	)

	const handleScheduleEvent = useCallback(async () => {
		if (!selectedDate || !eventFormData.title) {
			toast({
				title: 'Missing information',
				description: 'Please provide an event title and select a date.',
				variant: 'destructive'
			})
			return
		}

		if (eventFormData.sendEmailNotification && !eventFormData.recipientEmail) {
			toast({
				title: 'Email required',
				description: 'Please provide a recipient email address for notifications.',
				variant: 'destructive'
			})
			return
		}

		try {
			// Combine date and time for eventDate
			const eventDateTime = new Date(selectedDate)
			const [hours, minutes] = eventFormData.time.split(':').map(Number)
			eventDateTime.setHours(hours, minutes, 0, 0)

			if (editingEventId) {
				// Update existing event
				const updatedEvent = await crmDashboardService.updateScheduledEvent(editingEventId, {
					title: eventFormData.title,
					type: eventFormData.type,
					eventDate: eventDateTime.toISOString(),
					eventTime: eventFormData.time,
					duration: eventFormData.duration,
					description: eventFormData.description,
					sendEmailNotification: eventFormData.sendEmailNotification,
					recipientEmail: eventFormData.recipientEmail
				})

				toast({
					title: 'Event updated',
					description: `Event "${eventFormData.title}" has been successfully updated.`
				})
			} else {
				// Create new event
				const newEvent = await crmDashboardService.createScheduledEvent({
					title: eventFormData.title,
					type: eventFormData.type,
					eventDate: eventDateTime.toISOString(),
					eventTime: eventFormData.time,
					duration: eventFormData.duration,
					description: eventFormData.description,
					sendEmailNotification: eventFormData.sendEmailNotification,
					recipientEmail: eventFormData.recipientEmail
				})

				toast({
					title: newEvent.notificationSent 
						? 'Event scheduled & notification sent'
						: 'Event scheduled successfully',
					description: newEvent.notificationSent
						? `Email sent to ${eventFormData.recipientEmail} from sales@advantage1.co.uk`
						: `${eventFormData.title} on ${format(selectedDate, 'PPP')} at ${eventFormData.time}`
				})
			}

			// Reload events and dashboard stats
			await loadScheduledEvents()
			await loadDashboardStats()

		} catch (error) {
			console.error('Error saving event:', error)
			toast({
				title: 'Error',
				description: editingEventId 
					? 'Failed to update event. Please try again.'
					: 'Failed to schedule event. Please try again.',
				variant: 'destructive'
			})
			return
		}

		setIsScheduleDialogOpen(false)
		setEventFormData(initialEventFormState)
		setSelectedDate(null)
		setEditingEventId(null)
	}, [selectedDate, eventFormData, editingEventId, loadDashboardStats, loadScheduledEvents])

	// Get days in month for calendar
	const getDaysInMonth = () => {
		const year = currentDate.getFullYear()
		const month = currentDate.getMonth()
		const firstDay = new Date(year, month, 1).getDay()
		const daysInMonth = new Date(year, month + 1, 0).getDate()

		const days: (Date | null)[] = []

		for (let i = 0; i < firstDay; i++) {
			days.push(null)
		}

		for (let i = 1; i <= daysInMonth; i++) {
			days.push(new Date(year, month, i))
		}

		return days
	}

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP',
			maximumFractionDigits: 0
		}).format(value)
	}

	return (
		<div className="min-h-screen bg-[#EFF4FF]">
			<div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-full">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border/40 mb-4 sm:mb-6">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<div className="bg-primary/10 rounded-lg p-2">
								<BarChart3 className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary">
									CRM Dashboard
								</h1>
								<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
									Overview of your customer relationships and sales performance
								</p>
							</div>
						</div>
					</div>
					<Button
						variant="outline"
						className="h-9 w-full sm:w-auto"
						onClick={handleSchedule}
					>
						<Calendar className="h-4 w-4 mr-2" />
						Schedule Event
					</Button>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
					{isLoadingStats ? (
						Array.from({ length: 4 }).map((_, i) => (
							<Card key={i} className="border-0 shadow-md">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
									<CardTitle className="text-sm font-medium text-white">
										<div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-white/20 animate-pulse"></div>
								</CardHeader>
								<CardContent className="px-4 pb-4">
									<div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
								</CardContent>
							</Card>
						))
					) : (
						<>
							<StatCard
								title="Total Contacts"
								value={stats.totalContacts}
								change={stats.contactGrowth}
								icon={<Users className="h-4 w-4 text-white" />}
								bgColor="bg-gradient-to-br from-blue-600 to-blue-700"
								iconBgColor="bg-white/20"
								onClick={() => navigate('/crm/contacts')}
							/>
							<StatCard
								title="Pipeline Value"
								value={formatCurrency(stats.pipelineValue)}
								icon={<DollarSign className="h-4 w-4 text-white" />}
								bgColor="bg-gradient-to-br from-indigo-600 to-indigo-700"
								iconBgColor="bg-white/20"
								onClick={() => navigate('/crm/pipeline')}
							/>
							<StatCard
								title="Average Deal"
								value={formatCurrency(stats.avgDealValue)}
								icon={<TrendingUp className="h-4 w-4 text-white" />}
								bgColor="bg-gradient-to-br from-emerald-600 to-emerald-700"
								iconBgColor="bg-white/20"
								onClick={() => navigate('/crm/pipeline')}
							/>
							<StatCard
								title="Conversion Rate"
								value={`${stats.conversionRate}%`}
								icon={<CheckCircle2 className="h-4 w-4 text-white" />}
								bgColor="bg-gradient-to-br from-purple-600 to-purple-700"
								iconBgColor="bg-white/20"
								onClick={() => navigate('/crm/pipeline')}
							/>
						</>
					)}
				</div>

				{/* Main Content */}
				<div className="space-y-4 sm:space-y-6">
					<Tabs defaultValue="overview" className="space-y-4">
						<TabsList className="h-9 w-full justify-start">
							<TabsTrigger value="overview" className="text-sm px-3">
								Overview
							</TabsTrigger>
							<TabsTrigger value="calendar" className="text-sm px-3">
								Calendar
							</TabsTrigger>
						</TabsList>

						{/* Overview Tab */}
						<TabsContent value="overview" className="space-y-4">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<Card className="border border-border/40 shadow-sm">
									<CardHeader className="p-4">
										<div className="flex items-center justify-between">
											<CardTitle className="text-base font-medium">Recent Activities</CardTitle>
											<Button 
												variant="ghost" 
												size="sm" 
												className="h-8 text-xs"
												onClick={loadRecentActivities}
												disabled={isLoadingActivities}
											>
												{isLoadingActivities ? 'Refreshing...' : 'Refresh'}
											</Button>
										</div>
									</CardHeader>
									<CardContent className="p-4">
										<div className="space-y-4">
											{isLoadingActivities ? (
												<div className="flex items-center justify-center py-8">
													<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
													<span className="ml-2 text-sm text-muted-foreground">Loading activities...</span>
												</div>
											) : recentActivities.length > 0 ? (
												recentActivities.map((activity, index) => (
													<ActivityItem
														key={activity.id}
														activity={activity}
														isLast={index === recentActivities.length - 1}
													/>
												))
											) : (
												<div className="flex flex-col items-center justify-center py-8 text-center">
													<Activity className="h-12 w-12 text-muted-foreground/50 mb-2" />
													<p className="text-sm text-muted-foreground">No recent activities</p>
													<p className="text-xs text-muted-foreground mt-1">
														Activities will appear here when contacts are added or communication logs are updated
													</p>
													<p className="text-xs text-muted-foreground/70 mt-2 italic">
														If you just restarted the backend, click Refresh to reload
													</p>
												</div>
											)}
										</div>
									</CardContent>
								</Card>

								<Card className="border border-border/40 shadow-sm">
									<CardHeader className="p-4">
										<div className="flex items-center justify-between">
											<CardTitle className="text-base font-medium">Upcoming Events</CardTitle>
											<Button
												size="sm"
												className="h-8 text-xs"
												onClick={handleSchedule}
											>
												<CalendarDays className="h-3 w-3 mr-1" />
												Schedule
											</Button>
										</div>
									</CardHeader>
									<CardContent className="p-4">
										{isLoadingEvents ? (
											<div className="flex items-center justify-center py-8">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
												<span className="ml-2 text-sm text-muted-foreground">Loading events...</span>
											</div>
										) : upcomingEvents.length > 0 ? (
											<div className="space-y-3">
												{upcomingEvents.map(event => {
													const eventDate = new Date(event.date)
													return (
														<div
															key={event.id}
															className="flex items-start p-3 rounded-md border hover:bg-muted/20 cursor-pointer transition-colors"
														>
															<div
																className={cn(
																	'rounded-full p-2 mr-3 flex-shrink-0',
																	event.type === 'meeting'
																		? 'bg-blue-50'
																		: event.type === 'call'
																	? 'bg-green-50'
																	: event.type === 'task'
																		? 'bg-amber-50'
																		: 'bg-indigo-50'
																)}
															>
																<CalendarDays
																	className={cn(
																		'h-4 w-4',
																		event.type === 'meeting'
																			? 'text-blue-600'
																			: event.type === 'call'
																		? 'text-green-600'
																		: event.type === 'task'
																			? 'text-amber-600'
																			: 'text-indigo-600'
																	)}
																/>
															</div>
															<div className="flex-1 min-w-0">
																<div className="flex justify-between items-start mb-1 gap-2">
																	<h4 className="text-sm font-medium truncate">
																		{event.title}
																	</h4>
																	<div className="flex items-center gap-1 flex-shrink-0">
																		{event.notificationSent && (
																			<Badge
																				variant="outline"
																				className="text-xs border-green-200 text-green-700 bg-green-50"
																			>
																				<Mail className="h-3 w-3 mr-1" />
																				Sent
																			</Badge>
																		)}
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 text-muted-foreground hover:text-primary"
																			onClick={(e) => {
																				e.stopPropagation()
																				handleEditEvent(event)
																			}}
																			title="Edit event"
																		>
																			<Pencil className="h-3.5 w-3.5" />
																		</Button>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 text-muted-foreground hover:text-destructive"
																			onClick={(e) => {
																				e.stopPropagation()
																				setDeletingEventId(event.id)
																			}}
																			title="Delete event"
																		>
																			<Trash2 className="h-3.5 w-3.5" />
																		</Button>
																	</div>
																</div>
																<p className="text-xs text-muted-foreground">
																	{format(eventDate, 'MMM d')} at {event.time} ({event.duration} min)
																</p>
															</div>
														</div>
													)
												})}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center py-8 text-center">
												<CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-2" />
												<p className="text-sm text-muted-foreground mb-3">
													No upcoming events
												</p>
												<Button className="h-8 text-xs" onClick={handleSchedule}>
													Schedule an Event
												</Button>
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Quick Actions */}
							<Card className="border border-border/40 shadow-sm">
								<CardHeader className="p-4">
									<CardTitle className="text-base font-medium">Quick Actions</CardTitle>
								</CardHeader>
								<CardContent className="p-4">
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
										<Button
											variant="outline"
											className="h-auto p-4 flex flex-col items-start gap-2"
											onClick={() => navigate('/crm/contacts')}
										>
											<Users className="h-5 w-5 text-primary" />
											<div className="text-left">
												<div className="font-medium">Manage Contacts</div>
												<div className="text-xs text-muted-foreground">
													View and edit CRM contacts
												</div>
											</div>
										</Button>
										<Button
											variant="outline"
											className="h-auto p-4 flex flex-col items-start gap-2"
											onClick={() => navigate('/crm/pipeline')}
										>
											<GitBranch className="h-5 w-5 text-primary" />
											<div className="text-left">
												<div className="font-medium">Sales Pipeline</div>
												<div className="text-xs text-muted-foreground">
													Track deals and opportunities
												</div>
											</div>
										</Button>
										<Button
											variant="outline"
											className="h-auto p-4 flex flex-col items-start gap-2"
											onClick={handleSchedule}
										>
											<Calendar className="h-5 w-5 text-primary" />
											<div className="text-left">
												<div className="font-medium">Schedule Event</div>
												<div className="text-xs text-muted-foreground">
													Create a new calendar event
												</div>
											</div>
										</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Calendar Tab */}
						<TabsContent value="calendar" className="space-y-4">
							<Card className="border border-border/40 shadow-sm">
								<CardHeader className="p-4">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
										<div>
											<CardTitle className="text-base font-medium">Calendar</CardTitle>
											<p className="text-xs text-muted-foreground mt-0.5">
												Manage your schedule and events
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setCurrentDate(subMonths(currentDate, 1))}
												className="h-8 px-2 text-xs"
											>
												<ChevronLeft className="h-4 w-4" />
												<span className="ml-1 hidden sm:inline">Prev</span>
											</Button>
											<div className="text-sm font-medium min-w-[120px] text-center">
												{format(currentDate, 'MMMM yyyy')}
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setCurrentDate(addMonths(currentDate, 1))}
												className="h-8 px-2 text-xs"
											>
												<span className="mr-1 hidden sm:inline">Next</span>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<div className="border-t">
										<div className="grid grid-cols-7">
											{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
												<div
													key={day}
													className="p-2 text-center text-sm font-medium border-b border-r last:border-r-0 bg-muted"
												>
													{day}
												</div>
											))}
										</div>
										<div className="grid grid-cols-7 border-b border-l">
											{getDaysInMonth().map((day, index) => (
												<div
													key={day ? format(day, 'yyyy-MM-dd') : `empty-${index}`}
													className="border-r last:border-r-0"
												>
													<CalendarDay
														day={day}
														currentDate={currentDate}
														selectedDate={selectedDate}
														events={scheduledEvents}
														onSelect={setSelectedDate}
													/>
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			{/* Schedule Dialog */}
			<Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[95vh] flex flex-col p-0 overflow-hidden">
					<DialogHeader className="p-3 sm:p-4 lg:p-6 border-b flex-shrink-0">
						<div className="flex items-center justify-between relative pr-8">
							<div>
								<DialogTitle className="text-base sm:text-lg font-semibold">
									Schedule Event
								</DialogTitle>
								<DialogDescription className="text-xs sm:text-sm mt-1">
									Create a new event in your calendar
								</DialogDescription>
							</div>
							<DialogClose asChild>
								<Button
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200"
									onClick={() => {
										setIsScheduleDialogOpen(false)
										setEventFormData(initialEventFormState)
										setSelectedDate(null)
										setEditingEventId(null)
									}}
								>
									×
									<span className="sr-only">Close</span>
								</Button>
							</DialogClose>
						</div>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
						{/* Calendar */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="text-sm sm:text-base font-semibold text-foreground">
									Select Date <span className="text-red-500">*</span>
								</h3>
								{selectedDate && (
									<Badge variant="outline" className="text-xs">
										{format(selectedDate, 'MMM d, yyyy')}
									</Badge>
								)}
							</div>
							<div className="flex items-center justify-between mb-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentDate(subMonths(currentDate, 1))}
									className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
								>
									<ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
									<span className="ml-1 hidden sm:inline">Prev</span>
								</Button>
								<span className="text-xs sm:text-sm font-semibold">
									{format(currentDate, 'MMMM yyyy')}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentDate(addMonths(currentDate, 1))}
									className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
								>
									<span className="mr-1 hidden sm:inline">Next</span>
									<ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
								</Button>
							</div>

							<div className="grid grid-cols-7 gap-1 sm:gap-1.5 border rounded-lg p-1 sm:p-2 bg-muted/30">
								{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
									<div
										key={day}
										className="text-[10px] sm:text-xs font-semibold text-center text-muted-foreground py-1.5 sm:py-2"
									>
										{day}
									</div>
								))}

								{getDaysInMonth().map((day, index) => (
									<CalendarDay
										key={day ? format(day, 'yyyy-MM-dd') : `empty-${index}`}
										day={day}
										currentDate={currentDate}
										selectedDate={selectedDate}
										events={scheduledEvents}
										onSelect={setSelectedDate}
									/>
								))}
							</div>
						</div>

						{/* Divider */}
						<div className="border-t border-border/40"></div>

						{/* Event Form */}
						<div>
							<h3 className="text-sm sm:text-base font-semibold text-foreground mb-4">
								Event Details
							</h3>
						<EventForm
							formData={eventFormData}
							onChange={handleEventFormChange}
						/>
						</div>
					</div>

					<DialogFooter className="p-3 sm:p-4 lg:p-6 bg-white border-t flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
						<Button
							variant="outline"
							className="text-sm h-11 sm:h-10 w-full sm:w-auto order-2 sm:order-1"
							onClick={() => {
								setIsScheduleDialogOpen(false)
								setEventFormData(initialEventFormState)
								setSelectedDate(null)
								setEditingEventId(null)
							}}
						>
							Cancel
						</Button>
						<Button
							className="text-sm h-11 sm:h-10 w-full sm:w-auto order-1 sm:order-2 bg-primary hover:bg-primary/90 font-semibold shadow-sm"
							onClick={handleScheduleEvent}
							disabled={!selectedDate || !eventFormData.title}
						>
							<CalendarDays className="h-4 w-4 mr-2" />
							{editingEventId ? 'Update Event' : 'Schedule Event'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deletingEventId !== null} onOpenChange={(open) => !open && setDeletingEventId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Scheduled Event</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this event? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingEventId && handleDeleteEvent(deletingEventId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
