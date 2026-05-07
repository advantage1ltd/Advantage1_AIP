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
import { TaskCard } from '@/components/dashboard/TaskCard'
import { IncidentTable } from '@/components/dashboard/IncidentTable'
import { OfficerPerformance } from '@/components/dashboard/OfficerPerformance'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePageAccess } from "@/contexts/PageAccessContext"
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'

// Lazy load the dashboard components
const OfficerDashboard = React.lazy(() => import('@/pages/Dashboard/OfficerDashboard'))
const CustomerDashboard = React.lazy(() => import('@/pages/Dashboard/CustomerDashboard'))
const AdminDashboard = React.lazy(() => import('@/pages/Dashboard/AdminDashboard'))

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
        amount: 1250.00
      },
      {
        id: '2',
        customerName: 'Central England COOP',
        store: 'Store #1235',
        officerName: 'Jane Doe',
        date: '2025-01-29',
        amount: 850.00
      },
      {
        id: '3',
        customerName: 'Central England COOP',
        store: 'Store #1236',
        officerName: 'Mike Johnson',
        date: '2025-01-28',
        amount: 2100.00
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

const customers = [
  { id: 'customer1', name: 'Central England COOP' },
  { id: 'customer2', name: 'Heart of England' },
  { id: 'customer3', name: 'Midcounties COOP' }
] as const;

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

const Index = () => {
  const location = useLocation();
  const { currentRole, isTestMode, testRole, isLoading } = usePageAccess();
  const effectiveRole = isTestMode && testRole ? testRole : currentRole;

  // Debug log to help troubleshoot
  React.useEffect(() => {
    console.log('🏠 [Index] Component state:', {
      currentRole,
      isTestMode,
      testRole,
      effectiveRole,
      isLoading
    });
  }, [currentRole, isTestMode, testRole, effectiveRole, isLoading]);

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
  if (effectiveRole === 'administrator' || effectiveRole === 'advantageonehoofficer') {
    console.log('🏠 [Index] Rendering AdminDashboard for role:', effectiveRole);
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 text-center">
            <div className="text-lg font-medium">Loading Admin Dashboard...</div>
            <div className="text-sm text-gray-500">Please wait</div>
          </div>
        </div>
      }>
        <AdminDashboard />
      </Suspense>
    )
  } else if (effectiveRole === 'advantageoneofficer') {
    console.log('🏠 [Index] Rendering OfficerDashboard for role:', effectiveRole);
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
    console.log('🏠 [Index] Rendering CustomerDashboard for role:', effectiveRole);
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 text-center">
            <div className="text-lg font-medium">Loading Customer Dashboard...</div>
            <div className="text-sm text-gray-500">Please wait</div>
          </div>
        </div>
      }>
        <CustomerDashboard userRole={effectiveRole as 'customersitemanager' | 'customerhomanager'} />
      </Suspense>
    )
  }

  // Fallback to loading state if no role matched
  console.warn('🏠 [Index] No matching role found, showing fallback. Role:', effectiveRole);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 text-center">
        <div className="text-lg font-medium">Loading...</div>
        <div className="text-sm text-gray-500">Please wait while we set up your dashboard</div>
        <div className="text-xs text-gray-400 mt-2">Current role: {effectiveRole || 'Not set'}</div>
      </div>
    </div>
  );
}

export default Index