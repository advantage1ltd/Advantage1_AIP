import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getUser } from '@/services/auth'
import { dashboardService } from '@/services/dashboardService'
import { OfficerDashboardData, Activity, Task, RecentIncident } from '@/types/dashboard'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import {
  FileWarning, FileSearch, Building, Calendar, CalendarRange,
  BadgeCheck, ClipboardCheck, Key, HelpCircle, Wallet, Shirt,
  Bell, Clock, CheckCircle, Target, Award, TrendingUp, Shield,
  Users, Eye, MapPin, AlertTriangle, Activity as ActivityIcon,
  Star, Timer, ChevronRight, ArrowUpRight, ArrowDownRight,
  Zap, ChevronLeft, ChevronRightIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Component Props Types
interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down'
  icon: React.ElementType
  gradient: string
  subtitle?: string
  link?: string
}

interface ProgressCardProps {
  title: string
  current: number
  target: number
  unit: string
  color: string
}

// Components
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  gradient,
  subtitle,
  link
}) => {
  const content = (
    <Card className={`relative overflow-hidden border-0 shadow-lg ${gradient} ${link ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''} h-full`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between h-full">
          <div className="space-y-1.5">
            <p className="text-white/80 text-[11px] sm:text-xs font-medium line-clamp-1">{title}</p>
            <div className="space-y-1">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{value}</p>
              {subtitle && <p className="text-white/70 text-[10px] sm:text-xs line-clamp-1">{subtitle}</p>}
              {change && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-white/80" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-white/80" />
                  )}
                  <span className="text-white/80 text-[10px] sm:text-xs">{change}</span>
                </div>
              )}
            </div>
          </div>
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link} className="block h-full">{content}</Link>;
  }

  return content;
}

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'incident': return AlertTriangle
      case 'patrol': return Shield
      case 'report': return FileWarning
      default: return ActivityIcon
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'incident': return 'bg-red-500'
      case 'patrol': return 'bg-blue-500'
      case 'report': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const Icon = getActivityIcon(activity.type)

  return (
    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-white hover:shadow-md transition-shadow">
      <div className={`rounded-full p-1.5 ${getActivityColor(activity.type)} text-white flex-shrink-0`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-xs sm:text-sm text-gray-900 truncate">{activity.title}</h4>
          <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{activity.location}</span>
        </p>
        {activity.value && (
          <p className="text-[10px] sm:text-xs font-medium text-green-600 mt-1">
            Value: £{activity.value.toFixed(2)}
          </p>
        )}
        <Badge 
          variant={activity.status === 'resolved' ? 'default' : 'secondary'}
          className="text-[10px] sm:text-xs mt-2"
        >
          {activity.status}
        </Badge>
      </div>
    </div>
  )
}

const ProgressCard: React.FC<ProgressCardProps> = ({ title, current, target, unit, color }) => {
  const percentage = Math.min((current / target) * 100, 100)
  
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-xs sm:text-sm md:text-base text-gray-900">{title}</h3>
            <Badge variant={percentage >= 80 ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
              {percentage.toFixed(0)}%
            </Badge>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-[10px] sm:text-xs">
              <span className="text-gray-600">Current: {current.toLocaleString()} {unit}</span>
              <span className="text-gray-600">Target: {target.toLocaleString()} {unit}</span>
            </div>
            <Progress value={percentage} className="h-1.5 sm:h-2" />
          </div>
          
          <div className="text-[10px] sm:text-xs text-gray-600">
            {target - current > 0 ? (
              <>Need {(target - current).toLocaleString()} more {unit} to reach target</>
            ) : (
              <>🎉 Target achieved! {(current - target).toLocaleString()} {unit} ahead</>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const IncidentTable: React.FC<{ incidents: RecentIncident[] }> = ({ incidents }) => {
  const [page, setPage] = React.useState(1)
  const pageSize = 5
  const totalPages = Math.ceil(incidents.length / pageSize)
  
  const paginatedIncidents = React.useMemo(() => 
    incidents.slice((page - 1) * pageSize, page * pageSize),
    [page, incidents]
  )

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] sm:w-[150px]">Officer</TableHead>
                  <TableHead className="w-[80px] sm:w-[100px]">Date</TableHead>
                  <TableHead className="w-[160px] sm:w-[200px]">Site Name</TableHead>
                  <TableHead className="w-[120px] sm:w-[150px]">Type</TableHead>
                  <TableHead className="text-right w-[80px] sm:w-[100px]">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">{incident.officerName}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{new Date(incident.date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[160px] sm:max-w-[200px] truncate text-xs sm:text-sm">{incident.siteName}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{incident.type}</TableCell>
                    <TableCell className="text-right text-xs sm:text-sm">
                      {incident.value > 0 ? `£${incident.value.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-1">
        <div className="text-[10px] sm:text-xs text-gray-500 text-center sm:text-left">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, incidents.length)} of {incidents.length} incidents
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-7 sm:h-8 px-2 sm:px-3"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-7 sm:h-8 px-2 sm:px-3"
          >
            <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
            <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function OfficerDashboard() {
  // Get the logged-in user information
  const loggedInUser = getUser()

  // Fetch dashboard data
  const { 
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError
  } = useQuery({
    queryKey: ['officerDashboard'],
    queryFn: () => dashboardService.getOfficerDashboard()
  })

  // Fetch incidents data
  const {
    data: incidentsData,
    isLoading: isIncidentsLoading,
    error: incidentsError
  } = useQuery({
    queryKey: ['recentIncidents'],
    queryFn: () => dashboardService.getRecentIncidents()
  })

  const isLoading = isDashboardLoading || isIncidentsLoading
  const error = dashboardError || incidentsError

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EFF4FF] p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600 text-base sm:text-lg">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">{error instanceof Error ? error.message : 'An error occurred'}</p>
            <Button 
              className="mt-4 w-full sm:w-auto"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !dashboardData || !incidentsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EFF4FF]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#EFF4FF]">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Section */}
          <header className="space-y-1">
            <DashboardGreeting />
          </header>

          {/* Stats Grid */}
          <section aria-label="Dashboard Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Incidents This Month"
              value={dashboardData.stats.incidentsThisMonth}
              change="+33% from last month"
              trend="up"
              icon={Shield}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              subtitle={`Target: ${dashboardData.monthlyTarget.incidents}`}
              link="/operations/incident-report"
            />
            <StatCard
              title="Value Saved"
              value={`£${(dashboardData.stats.totalValueSaved / 1000).toFixed(1)}k`}
              change="+£12k from last month"
              trend="up"
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              subtitle="This month"
              link="/operations/incident-report"
            />
            <StatCard
              title="Expenses YTD"
              value={`£${dashboardData.stats.expensesYTD.toFixed(2)}`}
              change="+£150 from last month"
              trend="up"
              icon={Wallet}
              gradient="bg-gradient-to-br from-purple-500 to-purple-700"
              subtitle="Year to date"
              link="/operations/officer-expenses"
            />
            <StatCard
              title="Holiday Days Left"
              value={28 - dashboardData.stats.holidayBooked}
              icon={CalendarRange}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              subtitle="Year to date"
              link="/operations/holiday-requests"
            />
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Monthly Progress and Incident Table */}
            <div className="lg:col-span-2 space-y-4">
              {/* Monthly Progress */}
              <section aria-label="Monthly Progress">
                <h2 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Monthly Progress
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ProgressCard
                    title="Incidents Handled"
                    current={dashboardData.stats.incidentsThisMonth}
                    target={dashboardData.monthlyTarget.incidents}
                    unit="incidents"
                    color="blue"
                  />
                  <ProgressCard
                    title="Value Saved"
                    current={dashboardData.stats.totalValueSaved}
                    target={dashboardData.monthlyTarget.valueSaved}
                    unit="£"
                    color="green"
                  />
                </div>
              </section>

              {/* Recent Incidents */}
              <section aria-label="Recent Incidents">
                <h2 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
                  <FileWarning className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  Recent Incidents
                </h2>
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="overflow-x-auto">
                      <IncidentTable incidents={incidentsData} />
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column - Activity & Tasks */}
            <div className="space-y-4">
              {/* Recent Activity */}
              <section aria-label="Recent Activity">
                <Card>
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <ActivityIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    {dashboardData.recentActivities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Upcoming Tasks */}
              <section aria-label="Upcoming Tasks">
                <Card>
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      Upcoming Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    {dashboardData.upcomingTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-2 p-2 sm:p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{task.title}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">{task.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 