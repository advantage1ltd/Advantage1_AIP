import React, { Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  AlertCircle, 
  Calendar,
  Clock,
  Users,
  Shield,
  TrendingUp,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Home,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Plus,
  Currency,
  Star,
  CheckCircle,
  FileText,
  Briefcase,
  MapPin,
  MessageSquare
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IncidentTable } from '@/components/dashboard/IncidentTable'
import { OfficerPerformance } from '@/components/dashboard/OfficerPerformance'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePageAccess } from "@/contexts/PageAccessContext"
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { actionCalendarService } from '@/services/actionCalendarService'
import { customerService } from '@/services/customerService'
import { employeeService } from '@/services/employeeService'
import { assetRegisterService } from '@/services/assetRegisterService'
import { customerSatisfactionService } from '@/services/customerSatisfactionService'
import { siteVisitService } from '@/services/siteVisitService'
import { holidayRequestService } from '@/services/holidayRequestService'
import { api } from '@/config/api'
import { extractApiResponseData } from '@/utils/apiResponseHelper'

// Lazy load the dashboard components
const OfficerDashboard = React.lazy(() => import('@/pages/Dashboard/OfficerDashboard'))
const CustomerDashboard = React.lazy(() => import('@/pages/Dashboard/CustomerDashboard'))

// Customer-specific data
const customerData = {
  'customer1': {
    metrics: [
      { title: 'Total Saved YTD', value: '£196K', change: '+15%', trend: 'up', icon: Currency, color: 'green' },
      { title: 'Customer Satisfaction', value: '4.8/5', change: '+0.3', trend: 'up', icon: Star, color: 'yellow' },
      { title: 'Incidents Today', value: '8', change: '-3%', trend: 'down', icon: AlertCircle, color: 'red' },
      { title: 'Active Guards', value: '342', change: '+12%', trend: 'up', icon: Users, color: 'blue' }
    ],
    dailyIncidents: [
      { date: 'Mon', uniformOfficers: 12, storeDetectives: 8 },
      { date: 'Tue', uniformOfficers: 19, storeDetectives: 14 },
      { date: 'Wed', uniformOfficers: 15, storeDetectives: 11 },
      { date: 'Thu', uniformOfficers: 20, storeDetectives: 17 },
      { date: 'Fri', uniformOfficers: 25, storeDetectives: 20 },
      { date: 'Sat', uniformOfficers: 22, storeDetectives: 19 },
      { date: 'Sun', uniformOfficers: 18, storeDetectives: 15 }
    ],
    weeklyIncidents: [
      { week: 'Week 1', uniformOfficers: 42, storeDetectives: 35 },
      { week: 'Week 2', uniformOfficers: 38, storeDetectives: 30 },
      { week: 'Week 3', uniformOfficers: 45, storeDetectives: 36 },
      { week: 'Week 4', uniformOfficers: 40, storeDetectives: 32 }
    ],
    monthlyIncidents: [
      { month: 'Jan', uniformOfficers: 40, storeDetectives: 32 },
      { month: 'Feb', uniformOfficers: 30, storeDetectives: 24 },
      { month: 'Mar', uniformOfficers: 45, storeDetectives: 36 },
      { month: 'Apr', uniformOfficers: 25, storeDetectives: 20 },
      { month: 'May', uniformOfficers: 35, storeDetectives: 28 },
      { month: 'Jun', uniformOfficers: 20, storeDetectives: 16 },
      { month: 'Jul', uniformOfficers: 28, storeDetectives: 22 },
      { month: 'Aug', uniformOfficers: 32, storeDetectives: 26 },
      { month: 'Sep', uniformOfficers: 38, storeDetectives: 30 },
      { month: 'Oct', uniformOfficers: 42, storeDetectives: 34 },
      { month: 'Nov', uniformOfficers: 36, storeDetectives: 29 },
      { month: 'Dec', uniformOfficers: 30, storeDetectives: 24 }
    ],
    yearlyIncidents: [
      { year: '2020', uniformOfficers: 280, storeDetectives: 224 },
      { year: '2021', uniformOfficers: 320, storeDetectives: 256 },
      { year: '2022', uniformOfficers: 350, storeDetectives: 280 },
      { year: '2023', uniformOfficers: 375, storeDetectives: 300 },
      { year: '2024', uniformOfficers: 401, storeDetectives: 321 }
    ],
    incidentReports: [
      {
        id: '1',
        customerName: 'Central England COOP',
        store: 'Store #1234',
        officerName: 'John Smith',
        date: '2025-01-30',
        amount: 1250.00,
        incidentType: 'Theft - Loss?'
      },
      {
        id: '2',
        customerName: 'Central England COOP',
        store: 'Store #1235',
        officerName: 'Jane Doe',
        date: '2025-01-29',
        amount: 850.00,
        incidentType: 'Suspicious Behaviour?'
      },
      {
        id: '3',
        customerName: 'Central England COOP',
        store: 'Store #1236',
        officerName: 'Mike Johnson',
        date: '2025-01-28',
        amount: 2100.00,
        incidentType: 'Theft - Loss?'
      }
    ]
  },
  'customer2': {
    metrics: [
      { title: 'Total Saved YTD', value: '£250K', change: '+20%', trend: 'up', icon: Currency, color: 'green' },
      { title: 'Customer Satisfaction', value: '4.5/5', change: '+0.2', trend: 'up', icon: Star, color: 'yellow' },
      { title: 'Incidents Today', value: '5', change: '-10%', trend: 'down', icon: AlertCircle, color: 'red' },
      { title: 'Active Guards', value: '420', change: '+15%', trend: 'up', icon: Users, color: 'blue' }
    ],
    dailyIncidents: [
      { date: 'Mon', uniformOfficers: 10, storeDetectives: 8 },
      { date: 'Tue', uniformOfficers: 15, storeDetectives: 12 },
      { date: 'Wed', uniformOfficers: 13, storeDetectives: 10 },
      { date: 'Thu', uniformOfficers: 18, storeDetectives: 14 },
      { date: 'Fri', uniformOfficers: 22, storeDetectives: 18 },
      { date: 'Sat', uniformOfficers: 20, storeDetectives: 16 },
      { date: 'Sun', uniformOfficers: 16, storeDetectives: 13 }
    ],
    weeklyIncidents: [
      { week: 'Week 1', uniformOfficers: 38, storeDetectives: 30 },
      { week: 'Week 2', uniformOfficers: 35, storeDetectives: 28 },
      { week: 'Week 3', uniformOfficers: 40, storeDetectives: 32 },
      { week: 'Week 4', uniformOfficers: 37, storeDetectives: 30 }
    ],
    monthlyIncidents: [
      { month: 'Jan', uniformOfficers: 35, storeDetectives: 28 },
      { month: 'Feb', uniformOfficers: 28, storeDetectives: 22 },
      { month: 'Mar', uniformOfficers: 40, storeDetectives: 32 },
      { month: 'Apr', uniformOfficers: 22, storeDetectives: 18 },
      { month: 'May', uniformOfficers: 30, storeDetectives: 24 },
      { month: 'Jun', uniformOfficers: 18, storeDetectives: 14 },
      { month: 'Jul', uniformOfficers: 25, storeDetectives: 20 },
      { month: 'Aug', uniformOfficers: 30, storeDetectives: 24 },
      { month: 'Sep', uniformOfficers: 35, storeDetectives: 28 },
      { month: 'Oct', uniformOfficers: 38, storeDetectives: 30 },
      { month: 'Nov', uniformOfficers: 32, storeDetectives: 26 },
      { month: 'Dec', uniformOfficers: 28, storeDetectives: 22 }
    ],
    yearlyIncidents: [
      { year: '2020', uniformOfficers: 260, storeDetectives: 208 },
      { year: '2021', uniformOfficers: 290, storeDetectives: 232 },
      { year: '2022', uniformOfficers: 320, storeDetectives: 256 },
      { year: '2023', uniformOfficers: 345, storeDetectives: 276 },
      { year: '2024', uniformOfficers: 361, storeDetectives: 289 }
    ],
    incidentReports: [
      {
        id: '1',
        customerName: 'Heart of England',
        store: 'Store #5678',
        officerName: 'Sarah Wilson',
        date: '2025-01-30',
        amount: 1500.00,
        incidentType: 'Theft - Loss?'
      },
      {
        id: '2',
        customerName: 'Heart of England',
        store: 'Store #5679',
        officerName: 'Tom Brown',
        date: '2025-01-29',
        amount: 950.00,
        incidentType: 'Credit Card Fraud?'
      },
      {
        id: '3',
        customerName: 'Heart of England',
        store: 'Store #5680',
        officerName: 'Lisa Chen',
        date: '2025-01-28',
        amount: 1800.00,
        incidentType: 'Theft - Loss?'
      }
    ]
  },
  'customer3': {
    metrics: [
      { title: 'Total Saved YTD', value: '£175K', change: '+12%', trend: 'up', icon: Currency, color: 'green' },
      { title: 'Customer Satisfaction', value: '4.9/5', change: '+0.4', trend: 'up', icon: Star, color: 'yellow' },
      { title: 'Incidents Today', value: '3', change: '-15%', trend: 'down', icon: AlertCircle, color: 'red' },
      { title: 'Active Guards', value: '280', change: '+8%', trend: 'up', icon: Users, color: 'blue' }
    ],
    dailyIncidents: [
      { date: 'Mon', uniformOfficers: 8, storeDetectives: 6 },
      { date: 'Tue', uniformOfficers: 12, storeDetectives: 10 },
      { date: 'Wed', uniformOfficers: 10, storeDetectives: 8 },
      { date: 'Thu', uniformOfficers: 14, storeDetectives: 11 },
      { date: 'Fri', uniformOfficers: 18, storeDetectives: 14 },
      { date: 'Sat', uniformOfficers: 16, storeDetectives: 13 },
      { date: 'Sun', uniformOfficers: 13, storeDetectives: 10 }
    ],
    weeklyIncidents: [
      { week: 'Week 1', uniformOfficers: 32, storeDetectives: 26 },
      { week: 'Week 2', uniformOfficers: 30, storeDetectives: 24 },
      { week: 'Week 3', uniformOfficers: 35, storeDetectives: 28 },
      { week: 'Week 4', uniformOfficers: 33, storeDetectives: 26 }
    ],
    monthlyIncidents: [
      { month: 'Jan', uniformOfficers: 30, storeDetectives: 24 },
      { month: 'Feb', uniformOfficers: 25, storeDetectives: 20 },
      { month: 'Mar', uniformOfficers: 35, storeDetectives: 28 },
      { month: 'Apr', uniformOfficers: 20, storeDetectives: 16 },
      { month: 'May', uniformOfficers: 28, storeDetectives: 22 },
      { month: 'Jun', uniformOfficers: 15, storeDetectives: 12 },
      { month: 'Jul', uniformOfficers: 22, storeDetectives: 18 },
      { month: 'Aug', uniformOfficers: 26, storeDetectives: 21 },
      { month: 'Sep', uniformOfficers: 32, storeDetectives: 26 },
      { month: 'Oct', uniformOfficers: 36, storeDetectives: 29 },
      { month: 'Nov', uniformOfficers: 30, storeDetectives: 24 },
      { month: 'Dec', uniformOfficers: 25, storeDetectives: 20 }
    ],
    yearlyIncidents: [
      { year: '2020', uniformOfficers: 220, storeDetectives: 176 },
      { year: '2021', uniformOfficers: 250, storeDetectives: 200 },
      { year: '2022', uniformOfficers: 280, storeDetectives: 224 },
      { year: '2023', uniformOfficers: 300, storeDetectives: 240 },
      { year: '2024', uniformOfficers: 324, storeDetectives: 259 }
    ],
    incidentReports: [
      {
        id: '1',
        customerName: 'Midcounties COOP',
        store: 'Store #9012',
        officerName: 'David Lee',
        date: '2025-01-30',
        amount: 1750.00,
        incidentType: 'Theft - Loss?'
      },
      {
        id: '2',
        customerName: 'Midcounties COOP',
        store: 'Store #9013',
        officerName: 'Emma White',
        date: '2025-01-29',
        amount: 1100.00,
        incidentType: 'Suspicious Behaviour?'
      },
      {
        id: '3',
        customerName: 'Midcounties COOP',
        store: 'Store #9014',
        officerName: 'Chris Taylor',
        date: '2025-01-28',
        amount: 2300.00,
        incidentType: 'Theft - Loss?'
      },
      {
        id: '4',
        customerName: 'Midcounties COOP',
        store: 'Store #9015',
        officerName: 'Rachel Parker',
        date: '2025-01-27',
        amount: 1850.00,
        incidentType: 'Deter - Saved?'
      },
      {
        id: '5',
        customerName: 'Midcounties COOP',
        store: 'Store #9016',
        officerName: 'Mark Thompson',
        date: '2025-01-26',
        amount: 2100.00,
        incidentType: 'Theft - Loss?'
      },
      {
        id: '6',
        customerName: 'Midcounties COOP',
        store: 'Store #9017',
        officerName: 'Sophie Anderson',
        date: '2025-01-25',
        amount: 1950.00,
        incidentType: 'Credit Card Fraud?'
      }
    ]
  }
};

const tasks = [
  {
    id: '1',
    title: 'Review Security Protocols',
    description: 'Conduct a comprehensive review of current security protocols and identify areas for improvement.',
    assignee: 'John Smith',
    dueDate: new Date(2025, 1, 15),
    priority: 'high',
    status: 'in-progress'
  },
  {
    id: '2',
    title: 'Staff Training Session',
    description: 'Organize and conduct quarterly security training session for new staff members.',
    assignee: 'Sarah Johnson',
    dueDate: new Date(2025, 1, 20),
    priority: 'medium',
    status: 'pending'
  }
] as const;

const equipmentData = [
  { name: 'Laptops', value: 245, color: '#0ea5e9' },  // sky-500
  { name: 'Phones', value: 180, color: '#22c55e' },   // green-500
  { name: 'iPads', value: 120, color: '#f59e0b' },    // amber-500
  { name: 'Radios', value: 95, color: '#ef4444' },    // red-500
  { name: 'Other', value: 75, color: '#8b5cf6' }      // violet-500
];

const notifications = [
  {
    id: '1',
    title: 'New Incident Report',
    description: 'Location B reported unauthorized access attempt',
    time: '10 minutes ago',
    type: 'alert'
  },
  {
    id: '2',
    title: 'Guard Schedule Updated',
    description: 'Changes to night shift rotation for next week',
    time: '1 hour ago',
    type: 'info'
  }
]

const officerStats = [
  // Top Performers
  {
    id: '1',
    name: 'John Smith',
    incidents: 85,
    valueSaved: 145000,
    responseRate: 98,
    status: 'excellent'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    incidents: 78,
    valueSaved: 132000,
    responseRate: 97,
    status: 'excellent'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    incidents: 72,
    valueSaved: 128000,
    responseRate: 95,
    status: 'excellent'
  },
  {
    id: '4',
    name: 'Lisa Anderson',
    incidents: 65,
    valueSaved: 115000,
    responseRate: 94,
    status: 'good'
  },
  {
    id: '5',
    name: 'David Chen',
    incidents: 62,
    valueSaved: 108000,
    responseRate: 92,
    status: 'good'
  },
  // Non-Reporters and Needs Improvement
  {
    id: '6',
    name: 'Emily Davis',
    incidents: 25,
    valueSaved: 42000,
    responseRate: 75,
    status: 'needs-improvement'
  },
  {
    id: '7',
    name: 'Chris Brown',
    incidents: 18,
    valueSaved: 28000,
    responseRate: 45,
    status: 'non-reporter'
  },
  {
    id: '8',
    name: 'Alex Turner',
    incidents: 15,
    valueSaved: 22000,
    responseRate: 65,
    status: 'non-reporter'
  },
  {
    id: '9',
    name: 'Maria Garcia',
    incidents: 22,
    valueSaved: 35000,
    responseRate: 72,
    status: 'needs-improvement'
  },
  {
    id: '10',
    name: 'Tom Wilson',
    incidents: 12,
    valueSaved: 18000,
    responseRate: 40,
    status: 'non-reporter'
  }
] as const;

type MetricCard = {
	title: string
	value: string
	change: string
	trend: 'up' | 'down'
	icon: React.ElementType
	color: 'green' | 'yellow' | 'red' | 'blue'
}

type ChartPoint = {
	date?: string
	week?: string
	month?: string
	year?: string
	uniformOfficers: number
	storeDetectives: number
}

type EquipmentSlice = {
	name: string
	value: number
	color: string
}

type RecentActivity = {
	id: string
	title: string
	subtitle: string
	timeLabel: string
	status: 'pending' | 'in-progress' | 'completed' | 'blocked'
	priority: 'low' | 'medium' | 'high'
}

const formatCurrencyShort = (value: number) => {
	const absValue = Math.abs(value)
	if (absValue >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`
	if (absValue >= 1_000) return `£${(value / 1_000).toFixed(0)}K`
	return `£${value.toFixed(0)}`
}

const getIncidentDate = (incident: any) => {
	const dateValue = incident.DateOfIncident || incident.dateOfIncident || incident.Date || incident.date || incident.incidentDate
	const parsed = dateValue ? new Date(dateValue) : null
	return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null
}

const getOfficerBucket = (incident: any) => {
	const roleValue = String(incident.officerRole || incident.OfficerRole || incident.officerType || incident.OfficerType || '')
		.toLowerCase()
	if (roleValue.includes('detective')) return 'storeDetectives'
	return 'uniformOfficers'
}

const parseActivityDate = (value?: string | Date | null) => {
	if (!value) return null
	const date = value instanceof Date ? value : new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

const buildIncidentTimeSeries = (incidents: any[]) => {
	const now = new Date()
	const daily: ChartPoint[] = []
	const weekly: ChartPoint[] = []
	const monthly: ChartPoint[] = []
	const yearly: ChartPoint[] = []
	const dailyIndexByDate = new Map<string, number>()

	for (let i = 6; i >= 0; i -= 1) {
		const date = new Date(now)
		date.setDate(now.getDate() - i)
		const dateKey = date.toISOString().split('T')[0]
		const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
		dailyIndexByDate.set(dateKey, daily.length)
		daily.push({ date: label, uniformOfficers: 0, storeDetectives: 0 })
	}

	for (let i = 3; i >= 0; i -= 1) {
		weekly.push({ week: `Week ${4 - i}`, uniformOfficers: 0, storeDetectives: 0 })
	}

	for (let i = 11; i >= 0; i -= 1) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
		const label = date.toLocaleDateString('en-US', { month: 'short' })
		monthly.push({ month: label, uniformOfficers: 0, storeDetectives: 0 })
	}

	for (let i = 4; i >= 0; i -= 1) {
		const year = now.getFullYear() - i
		yearly.push({ year: String(year), uniformOfficers: 0, storeDetectives: 0 })
	}

	incidents.forEach((incident) => {
		const incidentDate = getIncidentDate(incident)
		if (!incidentDate) return
		const bucket = getOfficerBucket(incident)

		const dailyKey = incidentDate.toISOString().split('T')[0]
		const dailyIndex = dailyIndexByDate.get(dailyKey)
		if (dailyIndex !== undefined) {
			daily[dailyIndex][bucket] += 1
		}

		const weeksAgo = Math.floor((now.getTime() - incidentDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
		if (weeksAgo >= 0 && weeksAgo < 4) {
			const weeklyPoint = weekly[3 - weeksAgo]
			if (weeklyPoint) weeklyPoint[bucket] += 1
		}

		const monthLabel = incidentDate.toLocaleDateString('en-US', { month: 'short' })
		const monthlyPoint = monthly.find(point => point.month === monthLabel)
		if (monthlyPoint) monthlyPoint[bucket] += 1

		const yearlyPoint = yearly.find(point => point.year === String(incidentDate.getFullYear()))
		if (yearlyPoint) yearlyPoint[bucket] += 1
	})

	return { daily, weekly, monthly, yearly }
}

const filterIncidentsByPeriod = (incidents: Array<{ date: string }>, period: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly') => {
	const now = new Date()
	const start = new Date(now)
	if (period === 'Daily') {
		start.setDate(now.getDate() - 6)
	} else if (period === 'Weekly') {
		start.setDate(now.getDate() - 27)
	} else if (period === 'Monthly') {
		start.setMonth(now.getMonth() - 11)
		start.setDate(1)
	} else {
		start.setFullYear(now.getFullYear() - 4)
		start.setMonth(0, 1)
	}

	return incidents.filter(incident => {
		if (!incident.date) return false
		const date = new Date(incident.date)
		if (Number.isNaN(date.getTime())) return false
		return date >= start
	})
}

const formatDateRangeLabel = (period: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly') => {
	const now = new Date()
	const start = new Date(now)
	if (period === 'Daily') {
		start.setDate(now.getDate() - 6)
	} else if (period === 'Weekly') {
		start.setDate(now.getDate() - 27)
	} else if (period === 'Monthly') {
		start.setMonth(now.getMonth() - 11)
		start.setDate(1)
	} else {
		start.setFullYear(now.getFullYear() - 4, 0, 1)
	}

	const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' })
	const startLabel = formatter.format(start)
	const endLabel = formatter.format(now)
	return `${startLabel} - ${endLabel}`
}

const TestComponents = () => {
  return (
    <div className="space-y-6 p-4 border border-gray-200 rounded-md my-4">
      <h2 className="text-xl font-bold">Test Components</h2>
      
      <div>
        <h3 className="font-medium mb-2">Accordion Test</h3>
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is this working?</AccordionTrigger>
            <AccordionContent>
              Yes. This is our custom accordion component.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Dropdown Test</h3>
        <DropdownMenu>
          <DropdownMenuTrigger className="border rounded-md px-4 py-2">
            Click me
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Item 1
            </DropdownMenuItem>
            <DropdownMenuItem>
              Item 2
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">ScrollArea Test</h3>
        <ScrollArea className="h-32 w-full border rounded-md">
          <div className="p-4">
            <h4>Scrollable Content</h4>
            <p>This is a test of the ScrollArea component.</p>
            <p>Scroll down to see more content.</p>
            <div className="h-64 bg-gray-100 mt-2 p-4">
              Tall content to enable scrolling
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

const AdminDashboard = () => {
  const location = useLocation();
  const { currentRole, isTestMode, testRole, isLoading } = usePageAccess();
  const effectiveRole = isTestMode && testRole ? testRole : currentRole;

  // Show loading state while page access data is being loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="text-lg font-medium">Loading Dashboard...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  // Show appropriate dashboard based on role
  if (effectiveRole === 'advantageoneofficer' || effectiveRole === 'advantageonehoofficer') {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 text-center">
            <div className="text-lg font-medium">Loading Officer Dashboard...</div>
            <div className="text-sm text-gray-500">Please wait</div>
          </div>
        </div>
      }>
        <OfficerDashboard />
      </Suspense>
    )
  } else if (effectiveRole === 'customersitemanager' || effectiveRole === 'customerhomanager') {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 text-center">
            <div className="text-lg font-medium">Loading Customer Dashboard...</div>
            <div className="text-sm text-gray-500">Please wait</div>
          </div>
        </div>
      }>
        <CustomerDashboard userRole={effectiveRole === 'customersitemanager' ? 'customersitemanager' : 'customerhomanager'} />
      </Suspense>
    )
  }

  const [customersOptions, setCustomersOptions] = React.useState<Array<{ id: string; name: string }>>([])
  const [selectedCustomer, setSelectedCustomer] = React.useState<string>('all')
  const [activePeriod, setActivePeriod] = React.useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly')

  const [metrics, setMetrics] = React.useState<MetricCard[]>([])
  const [incidentReports, setIncidentReports] = React.useState<Array<{
    id: string
    customerName: string
    store?: string
    siteName?: string
    officerName: string
    date: string
    amount: number
    incidentType: string
  }>>([])
  const [equipmentData, setEquipmentData] = React.useState<EquipmentSlice[]>([])
  const [recentActivities, setRecentActivities] = React.useState<RecentActivity[]>([])
  const [chartSeries, setChartSeries] = React.useState<{ daily: ChartPoint[]; weekly: ChartPoint[]; monthly: ChartPoint[]; yearly: ChartPoint[] }>({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  })
  const [dashboardLoading, setDashboardLoading] = React.useState(false)
  const [dashboardError, setDashboardError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const loadCustomers = async () => {
      try {
        const customers = await customerService.getAvailableCustomers()
        if (!isMounted) return
        const normalized = customers.map(c => ({ id: c.id.toString(), name: c.name }))
        setCustomersOptions(normalized)
        if (normalized.length > 0 && selectedCustomer === 'all') {
          setSelectedCustomer(normalized[0].id)
        }
      } catch (error) {
        console.error('❌ [AdminDashboard] Failed to load customers:', error)
      }
    }

    void loadCustomers()
    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setDashboardLoading(true)
      setDashboardError(null)
      try {
        const customerFilter = selectedCustomer && selectedCustomer !== 'all' ? `&customerId=${selectedCustomer}` : ''
        const incidentHeaders = selectedCustomer && selectedCustomer !== 'all'
          ? { 'X-Customer-Id': selectedCustomer }
          : undefined
        const incidentsResponse = await api.get(
          `/incidents?page=1&pageSize=1000${customerFilter}`,
          incidentHeaders ? { headers: incidentHeaders } : undefined
        )
        const incidentsRaw = extractApiResponseData<any>(incidentsResponse.data)

        const normalizedIncidents = incidentsRaw.map((inc: any) => ({
          id: inc.Id?.toString() || inc.id?.toString() || crypto.randomUUID(),
          customerName: inc.CustomerName || inc.customerName || '—',
          store: inc.SiteName || inc.siteName || inc.store || '',
          siteName: inc.SiteName || inc.siteName || '',
          officerName: inc.OfficerName || inc.officerName || '—',
          date: inc.DateOfIncident || inc.dateOfIncident || inc.Date || inc.date || inc.incidentDate || '',
          amount: inc.TotalValueRecovered || inc.totalValueRecovered || inc.Amount || inc.amount || inc.value || 0,
          incidentType: inc.IncidentType || inc.incidentType || inc.type || '—',
          officerRole: inc.OfficerRole || inc.officerRole || inc.officerType || inc.OfficerType || ''
        }))

        const sortedIncidents = normalizedIncidents
          .filter(inc => inc.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const chartBuckets = buildIncidentTimeSeries(normalizedIncidents)

        const incidentStats = sortedIncidents.reduce((acc, inc) => {
          const amount = typeof inc.amount === 'number' ? inc.amount : 0
          acc.totalValue += amount
          const incidentDate = inc.date ? new Date(inc.date) : null
          if (incidentDate && incidentDate.getFullYear() === new Date().getFullYear()) {
            acc.totalValueYtd += amount
          }
          return acc
        }, { totalValue: 0, totalValueYtd: 0 })

        const today = new Date()
        const todayCount = sortedIncidents.filter(inc => {
          if (!inc.date) return false
          const date = new Date(inc.date)
          return date.toDateString() === today.toDateString()
        }).length

        const yesterday = new Date()
        yesterday.setDate(today.getDate() - 1)
        const yesterdayCount = sortedIncidents.filter(inc => {
          if (!inc.date) return false
          const date = new Date(inc.date)
          return date.toDateString() === yesterday.toDateString()
        }).length

        const last30Days = sortedIncidents.filter(inc => {
          if (!inc.date) return false
          const date = new Date(inc.date)
          return date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        })
        const prev30Days = sortedIncidents.filter(inc => {
          if (!inc.date) return false
          const date = new Date(inc.date)
          return date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && date >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        })
        const last30Value = last30Days.reduce((sum, inc) => sum + (inc.amount || 0), 0)
        const prev30Value = prev30Days.reduce((sum, inc) => sum + (inc.amount || 0), 0)
        const valueDelta = prev30Value === 0 ? 0 : ((last30Value - prev30Value) / prev30Value) * 100

        const employeeStats = await employeeService.getEmployeeStatistics()

        const surveysResponse = await customerSatisfactionService.getSurveys(1, 200, selectedCustomer && selectedCustomer !== 'all'
          ? { search: '', customerId: selectedCustomer, regionId: '', siteId: '' }
          : { search: '', customerId: '', regionId: '', siteId: '' })
        const surveys = surveysResponse.data || []
        const averageRating = surveys.length > 0
          ? surveys.reduce((sum, survey) => {
            const ratings = Object.values(survey.ratings || {})
            const avg = ratings.length > 0 ? ratings.reduce((acc, val) => acc + Number(val || 0), 0) / ratings.length : 0
            return sum + avg
          }, 0) / surveys.length
          : 0

        const currentMonth = new Date()
        const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        const currentMonthRatings = surveys.filter(s => new Date(s.date).getMonth() === currentMonth.getMonth())
        const previousMonthRatings = surveys.filter(s => new Date(s.date).getMonth() === previousMonth.getMonth())
        const currentMonthAvg = currentMonthRatings.length > 0
          ? currentMonthRatings.reduce((sum, survey) => {
            const ratings = Object.values(survey.ratings || {})
            const avg = ratings.length > 0 ? ratings.reduce((acc, val) => acc + Number(val || 0), 0) / ratings.length : 0
            return sum + avg
          }, 0) / currentMonthRatings.length
          : averageRating
        const previousMonthAvg = previousMonthRatings.length > 0
          ? previousMonthRatings.reduce((sum, survey) => {
            const ratings = Object.values(survey.ratings || {})
            const avg = ratings.length > 0 ? ratings.reduce((acc, val) => acc + Number(val || 0), 0) / ratings.length : 0
            return sum + avg
          }, 0) / previousMonthRatings.length
          : averageRating
        const ratingScale = surveys.some(survey =>
          Object.values(survey.ratings || {}).some(value => Number(value || 0) > 5)
        ) ? 10 : 5
        const averageRatingScaled = averageRating
        const currentMonthAvgScaled = currentMonthAvg
        const previousMonthAvgScaled = previousMonthAvg
        const satisfactionDelta = Number.isFinite(currentMonthAvgScaled - previousMonthAvgScaled)
          ? currentMonthAvgScaled - previousMonthAvgScaled
          : 0

        const assetsResponse = await assetRegisterService.getAssets({ page: 1, pageSize: 1000 })
        const categoryTotals = assetsResponse.items.reduce<Record<string, number>>((acc, item) => {
          const key = item.assetType || 'Other'
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
        const palette = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
        const mappedEquipment = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value], index) => ({
            name,
            value,
            color: palette[index % palette.length]
          }))

        const [tasksResponse, siteVisitResponse, holidayResponse] = await Promise.all([
          actionCalendarService.getTasks({ page: 1, pageSize: 6 }),
          selectedCustomer && selectedCustomer !== 'all'
            ? siteVisitService.getSiteVisits({ page: 1, pageSize: 6, customerId: selectedCustomer })
            : Promise.resolve({ data: [] as any[] }),
          holidayRequestService.getHolidayRequests({ page: 1, limit: 6 })
        ])

        const tasks = tasksResponse.data || []
        const siteVisits = siteVisitResponse.data || []
        const holidayRequests = holidayResponse.data || []

        const combinedActivities: Array<{ date: Date; activity: RecentActivity }> = []

        tasks.forEach(task => {
          const date = parseActivityDate(task.dateCreated || task.dateModified || task.dueDate)
          if (!date) return
          combinedActivities.push({
            date,
            activity: {
              id: `task-${task.actionCalendarId}`,
              title: task.taskTitle,
              subtitle: task.assignedUserName || task.assignTo,
              timeLabel: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
              status: task.taskStatus,
              priority: task.priorityLevel
            }
          })
        })

        sortedIncidents.slice(0, 10).forEach(incident => {
          const date = parseActivityDate(incident.date)
          if (!date) return
          combinedActivities.push({
            date,
            activity: {
              id: `incident-${incident.id}`,
              title: 'Incident Report',
              subtitle: `${incident.customerName} · ${incident.store || incident.siteName || '—'} · ${incident.incidentType || 'Incident'}`,
              timeLabel: new Date(incident.date).toLocaleDateString(),
              status: 'completed',
              priority: 'medium'
            }
          })
        })

        siteVisits.forEach(visit => {
          const date = parseActivityDate(visit.date || visit.createdAt)
          if (!date) return
          combinedActivities.push({
            date,
            activity: {
              id: `site-visit-${visit.id || visit.siteVisitId}`,
              title: 'Site Visit',
              subtitle: `${visit.customerName || visit.customer} · ${visit.locationName || visit.location}`,
              timeLabel: date.toLocaleDateString(),
              status: visit.status === 'Completed' ? 'completed' : 'in-progress',
              priority: 'medium'
            }
          })
        })

        surveys.slice(0, 10).forEach((survey) => {
          const date = parseActivityDate(survey.date || survey.createdAt)
          if (!date) return
          combinedActivities.push({
            date,
            activity: {
              id: `survey-${survey.id}`,
              title: 'Satisfaction Survey',
              subtitle: `${survey.customer} · ${survey.siteName}`,
              timeLabel: date.toLocaleDateString(),
              status: 'completed',
              priority: 'low'
            }
          })
        })

        holidayRequests.forEach(request => {
          const date = parseActivityDate(request.dateOfRequest)
          if (!date) return
          const status = request.status === 'approved'
            ? 'completed'
            : request.status === 'denied'
              ? 'blocked'
              : 'in-progress'
          combinedActivities.push({
            date,
            activity: {
              id: `holiday-${request.id}`,
              title: 'Holiday Booking',
              subtitle: `${request.officerName} · ${request.totalDays} days`,
              timeLabel: date.toLocaleDateString(),
              status,
              priority: request.status === 'pending' ? 'high' : 'medium'
            }
          })
        })

        const activities = combinedActivities
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 8)
          .map(entry => entry.activity)

        if (!isMounted) return
        const filteredIncidents = filterIncidentsByPeriod(sortedIncidents, activePeriod)
        setIncidentReports(filteredIncidents)
        setChartSeries(chartBuckets)
        setEquipmentData(mappedEquipment)
        setRecentActivities(activities)
        setMetrics([
          {
            title: 'Total Saved YTD',
            value: formatCurrencyShort(incidentStats.totalValueYtd),
            change: `${valueDelta >= 0 ? '+' : ''}${valueDelta.toFixed(1)}%`,
            trend: valueDelta >= 0 ? 'up' : 'down',
            icon: Currency,
            color: 'green'
          },
          {
            title: 'Customer Satisfaction',
            value: `${averageRatingScaled.toFixed(1)}/${ratingScale}`,
            change: `${satisfactionDelta >= 0 ? '+' : ''}${satisfactionDelta.toFixed(1)}`,
            trend: satisfactionDelta >= 0 ? 'up' : 'down',
            icon: Star,
            color: 'yellow'
          },
          {
            title: 'Incidents Today',
            value: `${todayCount}`,
            change: `${todayCount - yesterdayCount >= 0 ? '+' : ''}${todayCount - yesterdayCount}`,
            trend: todayCount <= yesterdayCount ? 'down' : 'up',
            icon: AlertCircle,
            color: 'red'
          },
          {
            title: 'Active Guards',
            value: `${employeeStats.activeEmployees}`,
            change: `${employeeStats.activeEmployees}/${employeeStats.totalEmployees} active`,
            trend: employeeStats.activeEmployees >= Math.round(employeeStats.totalEmployees * 0.9) ? 'up' : 'down',
            icon: Users,
            color: 'blue'
          }
        ])
      } catch (error) {
        console.error('❌ [AdminDashboard] Failed to load dashboard data:', error)
        if (!isMounted) return
        setDashboardError('Unable to load dashboard data. Please try again.')
      } finally {
        if (isMounted) setDashboardLoading(false)
      }
    }

    void loadDashboardData()
    const refreshInterval = window.setInterval(() => {
      void loadDashboardData()
    }, 5 * 60 * 1000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [selectedCustomer, activePeriod])

  const rawChartData = chartSeries[activePeriod.toLowerCase() as keyof typeof chartSeries] || []
  const chartData = activePeriod === 'Yearly'
    ? (rawChartData.filter(point => point.uniformOfficers + point.storeDetectives > 0).length > 0
        ? rawChartData.filter(point => point.uniformOfficers + point.storeDetectives > 0)
        : rawChartData)
    : rawChartData
  const dataKey = activePeriod === 'Daily' ? 'date' : activePeriod === 'Weekly' ? 'week' : activePeriod === 'Monthly' ? 'month' : 'year'
  
  // In a real app, we would fetch user-specific tasks from an API or context
  // This simulates loading user-specific tasks, which could be empty
  const [userTasks, setUserTasks] = React.useState<typeof tasks | []>([]);
  
  // Simulate loading tasks (in a real app, this would be an API call)
  React.useEffect(() => {
    // Simulate API call to get tasks
    const loadTasks = () => {
      // For demo purposes: randomly decide if the user has tasks
      const hasAssignedTasks = Math.random() > 0.3; // 70% chance to have tasks
      
      if (hasAssignedTasks) {
        setUserTasks(tasks);
      } else {
        setUserTasks([]);
      }
    };
    
    loadTasks();
    
    // In a real app, we would include dependencies like user ID
  }, []);
  
  // Officer stats for the table
  const officerStats = [
    {
      id: '1',
      name: 'John Smith',
      incidents: 45,
      valueSaved: 25600,
      responseRate: 92,
      status: 'excellent'
    },
    {
      id: '2',
      name: 'Jane Doe',
      incidents: 38,
      valueSaved: 19200,
      responseRate: 85,
      status: 'good'
    },
    {
      id: '3',
      name: 'David Johnson',
      incidents: 12,
      valueSaved: 5300,
      responseRate: 45,
      status: 'needs-improvement'
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      incidents: 5,
      valueSaved: 2100,
      responseRate: 20,
      status: 'non-reporter'
    }
  ] as const;

  // Define background colors for each stat card based on type
  const getStatCardColor = (color: string) => {
    switch(color) {
      case 'green': return 'bg-emerald-800';
      case 'yellow': return 'bg-amber-800';
      case 'red': return 'bg-rose-800';
      case 'blue': return 'bg-blue-800';
      default: return 'bg-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#EFF4FF] p-6">
      <div className="space-y-6">
        <DashboardGreeting />
        {dashboardError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {dashboardError}
          </div>
        )}
        
        {/* Customer Selection */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Overview</h2>
            <Badge variant="secondary" className="text-xs">Admin View</Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-full text-sm md:w-[200px]">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customersOptions.length === 0 ? (
                  <SelectItem value="all">All Customers</SelectItem>
                ) : (
                  customersOptions.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {metrics.length === 0 ? (
            <Card className="col-span-2 md:col-span-4 border-dashed border-slate-200 bg-white/70">
              <CardContent className="p-6 text-center text-sm text-slate-500">
                {dashboardLoading ? 'Loading metrics…' : 'No metrics available.'}
              </CardContent>
            </Card>
          ) : metrics.map((metric, index) => {
            // Define gradient backgrounds based on color
            const getGradientClass = (color: string) => {
              switch(color) {
                case 'green': return 'bg-[#198754]';
                case 'yellow': return 'bg-[#FFC107]';
                case 'red': return 'bg-[#DC3545]';
                case 'blue': return 'bg-[#0D6EFD]';
                default: return 'bg-[#423A8E]';
              }
            };
            
            // Define visualization element based on metric type
            const renderVisualization = (color: string) => {
              switch(color) {
                case 'green': 
                  return (
                    <div className="absolute bottom-3 right-3 opacity-30">
                      <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 24L8 12L16 18L32 6L40 12L48 0" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                  );
                case 'yellow': 
                  return (
                    <div className="absolute bottom-3 right-3 opacity-30">
                      <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 18L8 12L16 16L24 4L32 8L40 2L48 12" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                  );
                case 'red': 
                  return (
                    <div className="absolute bottom-3 right-3 opacity-30">
                      <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="6" width="6" height="18" rx="1" fill="white" opacity="0.3" />
                        <rect x="10" y="12" width="6" height="12" rx="1" fill="white" opacity="0.4" />
                        <rect x="20" y="0" width="6" height="24" rx="1" fill="white" opacity="0.6" />
                        <rect x="30" y="8" width="6" height="16" rx="1" fill="white" opacity="0.3" />
                        <rect x="40" y="4" width="6" height="20" rx="1" fill="white" opacity="0.4" />
                      </svg>
                    </div>
                  );
                case 'blue': 
                  return (
                    <div className="absolute bottom-3 right-3 opacity-30">
                      <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 13C8.66667 7.66667 13 8.33333 16 9C19 9.66667 20.6667 12.3333 24 13C27.3333 13.6667 31.6667 13 38 5" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                  );
                default:
                  return null;
              }
            };
            
            return (
              <Card 
                key={index} 
                className={`min-w-[140px] ${getGradientClass(metric.color)} text-white border-0 shadow-md overflow-hidden relative`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2 md:pb-3">
                  <CardTitle className="text-xs font-medium md:text-sm text-white">
                    {metric.title}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <metric.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-1 md:pt-2 z-10 relative">
                  <div className="text-xl font-bold md:text-2xl lg:text-3xl text-white">{metric.value}</div>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs flex items-center px-2 py-0.5 rounded-full ${
                      metric.trend === 'up' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {metric.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {metric.change}
                    </span>
                    <span className="ml-2 text-xs text-white/70">{metric.trend === 'up' ? 'increase' : 'decrease'}</span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">{formatDateRangeLabel(activePeriod)}</div>
                  {renderVisualization(metric.color)}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          {/* Tasks and Incidents Section */}
          <div className="lg:col-span-5 space-y-4">
            {/* Monthly Incidents Chart - Improved to Incident Reports with time toggles */}
            <Card>
              <CardHeader className="p-2 md:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <CardTitle className="text-base font-medium md:text-lg lg:text-xl">Incident Reports</CardTitle>
                <div className="flex items-center space-x-1">
                  <div className="bg-gray-100 rounded-lg p-0.5 flex text-xs md:text-sm">
                    {["Daily", "Weekly", "Monthly", "Yearly"].map((period, index) => (
                      <button
                        key={period}
                        className={`px-3 py-1 rounded-md transition-colors ${
                          period === activePeriod 
                            ? "bg-white shadow-sm text-emerald-500 font-medium" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActivePeriod(period as 'Daily' | 'Weekly' | 'Monthly' | 'Yearly')}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[200px] md:h-[280px] lg:h-[320px] p-2 md:p-4">
                <div className="flex items-center justify-end mb-2 space-x-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block mr-1"></span>
                    <span className="text-xs text-gray-500">Uniform Officers</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block mr-1"></span>
                    <span className="text-xs text-gray-500">Store Detectives</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData} 
                    margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorUniformOfficers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStoreDetectives" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey={dataKey} 
                      tick={{ fontSize: 10, fill: '#6B7280' }} 
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '0.5rem', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                        border: 'none', 
                        fontSize: '0.75rem' 
                      }}
                      itemStyle={{ padding: '2px 0' }}
                      formatter={(value) => [`${value}`, '']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Area
                      type="monotone"
                      name="Uniform Officers"
                      dataKey="uniformOfficers"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorUniformOfficers)"
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      name="Store Detectives"
                      dataKey="storeDetectives"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#colorStoreDetectives)"
                      activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, fill: 'white' }}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card>
              <CardHeader className="p-2 md:p-4">
                <CardTitle className="text-base font-medium md:text-lg lg:text-xl">Recent Incidents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-2 pb-4 md:px-4">
                  {dashboardLoading && incidentReports.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">Loading incidents…</div>
                  ) : incidentReports.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">No incidents found.</div>
                  ) : (
                    <IncidentTable data={incidentReports.slice()} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Recent Events - Replaces Tasks */}
            <Card>
              <CardHeader className="p-2 md:p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-medium md:text-lg lg:text-xl">Recent Events</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="text-xs h-8 px-2"
                >
                  <Link to="/action-calendar">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {dashboardLoading && recentActivities.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Loading activities…</div>
                ) : recentActivities.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">No recent activities.</div>
                ) : (
                  <div className="divide-y">
                    {recentActivities.map(activity => {
                      const isCompleted = activity.status === 'completed'
                      const isBlocked = activity.status === 'blocked'
                      const colorClass = isCompleted ? 'bg-emerald-500' : isBlocked ? 'bg-rose-500' : activity.priority === 'high' ? 'bg-amber-500' : 'bg-slate-500'
                      const Icon = isCompleted ? CheckCircle : isBlocked ? AlertCircle : activity.priority === 'high' ? MapPin : Briefcase
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-[#EFF4FF]">
                          <div className={cn('flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-white', colorClass)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                              <span className="text-xs text-slate-500 whitespace-nowrap">{activity.timeLabel}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">{activity.subtitle}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment Distribution - Modernized */}
            <Card className="overflow-hidden">
              <CardHeader className="p-2 md:p-4 flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-white border-b">
                <CardTitle className="text-base font-medium md:text-lg lg:text-xl">Equipment Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 px-2 pb-2 md:pt-6 md:px-4 md:pb-4">
                {dashboardLoading && equipmentData.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-500">Loading equipment…</div>
                ) : equipmentData.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-500">No equipment data available.</div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-full md:w-1/2 h-[180px] sm:h-[200px] md:h-[230px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={equipmentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                            cornerRadius={4}
                            stroke="transparent"
                          >
                            {equipmentData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                className="drop-shadow-sm hover:opacity-90 transition-opacity"
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} units`, name]} 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              borderRadius: '0.5rem', 
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                              border: 'none', 
                              fontSize: '0.75rem',
                              padding: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2">
                      <div className="divide-y">
                        {equipmentData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded mr-2" 
                                style={{ backgroundColor: item.color }} 
                              />
                              <span className="text-sm text-slate-700">{item.name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-slate-900">{item.value}</span>
                              <span className="text-xs text-slate-500 ml-1">units</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Total Devices</span>
                          <span className="text-base font-semibold text-slate-900">
                            {equipmentData.reduce((sum, item) => sum + item.value, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard