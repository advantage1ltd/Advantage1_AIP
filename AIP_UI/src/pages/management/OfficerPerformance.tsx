import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Users, AlertCircle, PoundSterling } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { officerPerformanceApi } from '@/services/api/officerPerformance'
import { customerService } from '@/services/customerService'
import type {
  OfficerPerformanceCategory,
  OfficerPerformanceRecordLimit,
  OfficerPerformanceItem,
} from '@/types/officerPerformance'

type StatCardProps = {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
}

const STATUS_STYLES: Record<string, string> = {
  'Top Performer': 'bg-green-100 text-green-800',
  'Needs Improvement': 'bg-yellow-100 text-yellow-800',
  'Non-Reporter': 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-700',
}

const CATEGORY_TABS: OfficerPerformanceCategory[] = ['top-performers', 'needs-improvement', 'non-reporters']
const RECORD_LIMIT_OPTIONS: OfficerPerformanceRecordLimit[] = [10, 20, 100]
const PAGE_SIZE = 10

const subtractMonths = (date: Date, months: number) => {
  const clone = new Date(date)
  clone.setMonth(clone.getMonth() - months)
  return clone
}

const formatCurrency = (value: number) =>
  `£${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBgColor, iconColor }) => (
  <Card className={`${iconBgColor} hover:opacity-95 transition-all h-full`}>
    <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs xs:text-sm sm:text-base font-medium text-white/80 truncate">{title}</p>
          <p className="text-lg xs:text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 xs:mt-1.5 sm:mt-2 text-white truncate">{value}</p>
          <p className="text-[10px] xs:text-xs sm:text-sm text-white/70 mt-1 xs:mt-1.5 truncate">{subtitle}</p>
        </div>
        <div className={`${iconColor} p-2 xs:p-3 sm:p-4 rounded-full bg-white/10 flex-shrink-0`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4 xs:h-6 xs:w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white' })}
        </div>
      </div>
    </CardContent>
  </Card>
)

const defaultEndDate = new Date()
const defaultStartDate = subtractMonths(defaultEndDate, 3)

const OfficerPerformance = () => {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [activeTab, setActiveTab] = useState<OfficerPerformanceCategory>('top-performers')
  const [currentPage, setCurrentPage] = useState(1)
  const [recordLimits, setRecordLimits] = useState<Record<OfficerPerformanceCategory, OfficerPerformanceRecordLimit>>({
    'top-performers': 10,
    'needs-improvement': 10,
    'non-reporters': 10,
  })
  const [appliedFilters, setAppliedFilters] = useState<{
    customerId: string
    startDate?: string
    endDate?: string
  }>({
    customerId: '',
    startDate: defaultStartDate.toISOString(),
    endDate: defaultEndDate.toISOString(),
  })

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', 'officer-performance'],
    queryFn: () => customerService.getAvailableCustomers(),
  })

  useEffect(() => {
    if (!selectedCustomer && customers.length > 0) {
      const firstCustomerId = customers[0].id.toString()
      setSelectedCustomer(firstCustomerId)
      setAppliedFilters((prev) => ({
        ...prev,
        customerId: firstCustomerId,
      }))
    }
  }, [customers, selectedCustomer])

  const activeRecordLimit = recordLimits[activeTab]
  const canQuery = Boolean(appliedFilters.customerId)

  const {
    data: performanceData,
    isLoading: isPerformanceLoading,
    isFetching: isPerformanceFetching,
    error: performanceError,
  } = useQuery({
    queryKey: [
      'officer-performance',
      appliedFilters.customerId,
      appliedFilters.startDate,
      appliedFilters.endDate,
      activeTab,
      currentPage,
      activeRecordLimit,
      PAGE_SIZE,
    ],
    queryFn: () =>
      officerPerformanceApi.getPerformance({
        customerId: Number(appliedFilters.customerId),
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        category: activeTab,
        page: currentPage,
        pageSize: PAGE_SIZE,
        maxRecords: activeRecordLimit,
      }),
    enabled: canQuery,
    keepPreviousData: true,
  })

  const stats = performanceData?.stats ?? {
    totalOfficers: 0,
    activeOfficers: 0,
    totalIncidents: 0,
    totalValueSaved: 0,
    averageResponseRate: 0,
  }

  const statCards = useMemo(
    () => [
      {
        title: 'Total Officers',
        value: stats.totalOfficers,
        subtitle: `${stats.activeOfficers} active officers`,
        icon: <Users />,
        iconBgColor: 'bg-blue-600',
        iconColor: 'bg-blue-500/20',
      },
      {
        title: 'Total Incidents',
        value: stats.totalIncidents,
        subtitle: 'Across selected range',
        icon: <AlertCircle />,
        iconBgColor: 'bg-rose-600',
        iconColor: 'bg-rose-500/20',
      },
      {
        title: 'Value Saved',
        value: formatCurrency(stats.totalValueSaved),
        subtitle: 'Recovered amount',
        icon: <PoundSterling />,
        iconBgColor: 'bg-emerald-600',
        iconColor: 'bg-emerald-500/20',
      },
    ],
    [stats],
  )

  const handleApplyFilters = () => {
    if (!selectedCustomer) {
      toast({
        title: 'Customer Required',
        description: 'Please select a customer before fetching performance metrics.',
        variant: 'destructive',
      })
      return
    }

    if (startDate && endDate && startDate > endDate) {
      toast({
        title: 'Invalid Date Range',
        description: 'Start date must be before the end date.',
        variant: 'destructive',
      })
      return
    }

    setAppliedFilters({
      customerId: selectedCustomer,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    })
    setCurrentPage(1)
  }

  const handleRecordLimitChange = (category: OfficerPerformanceCategory, value: string) => {
    const parsedValue = Number(value) as OfficerPerformanceRecordLimit
    setRecordLimits((prev) => ({
      ...prev,
      [category]: parsedValue,
    }))
    setCurrentPage(1)
  }

  const activePagination = performanceData?.results.pagination
  const totalPages = activePagination?.totalPages ?? 1
  const showingStart =
    activePagination && activePagination.totalCount > 0
      ? (activePagination.currentPage - 1) * activePagination.pageSize + 1
      : 0
  const showingEnd =
    activePagination && activePagination.totalCount > 0
      ? Math.min(activePagination.currentPage * activePagination.pageSize, activePagination.totalCount)
      : 0

  const tableItems = performanceData?.results.items ?? []
  const isLoadingData = isPerformanceLoading || isPerformanceFetching

  const renderTableRows = (items: OfficerPerformanceItem[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-xs sm:text-sm text-gray-500">
            Loading officer performance...
          </td>
        </tr>
      )
    }

    if (!items.length) {
      return (
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-xs sm:text-sm text-gray-500">
            No officers found for the selected filters.
          </td>
        </tr>
      )
    }

    return items.map((officer, index) => {
      const statusClass = STATUS_STYLES[officer.status] ?? STATUS_STYLES.default
      return (
        <tr key={`${officer.officerName}-${index}`} className="bg-white hover:bg-gray-50">
          <td className="px-1 py-1.5 xs:px-3 xs:py-3 sm:px-4 lg:px-6 text-[9px] xs:text-xs sm:text-sm lg:text-base font-medium">
            {officer.officerName}
          </td>
          <td className="px-1 py-1.5 xs:px-3 xs:py-3 sm:px-4 lg:px-6 text-[9px] xs:text-xs sm:text-sm lg:text-base">
            {officer.incidentCount}
          </td>
          <td className="px-1 py-1.5 xs:px-3 xs:py-3 sm:px-4 lg:px-6 text-[9px] xs:text-xs sm:text-sm lg:text-base">
            {formatCurrency(officer.totalValueSaved)}
          </td>
          <td className="px-1 py-1.5 xs:px-3 xs:py-3 sm:px-4 lg:px-6">
            <Badge className={`${statusClass} text-[8px] xs:text-xs sm:text-sm lg:text-base px-1 py-0.5 xs:px-2 lg:px-3`}>
              {officer.status}
            </Badge>
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="container mx-auto px-1 xs:px-3 sm:px-4 py-2 xs:py-4 sm:py-6 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-screen-2xl">
      <div className="space-y-2 xs:space-y-4 sm:space-y-6">
        <div className="flex flex-col xs:flex-row justify-between xs:items-center gap-2">
          <div>
            <h1 className="text-base xs:text-xl sm:text-2xl lg:text-3xl font-bold">Officer Performance</h1>
            <p className="text-[9px] xs:text-xs sm:text-sm lg:text-base text-gray-500 mt-0.5 lg:mt-1">
              Monitor top performers and officers needing improvement across customers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 lg:gap-6">
          {statCards.map((card, index) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-1.5 xs:p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-2 xs:gap-4 lg:gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 xs:gap-4 lg:gap-6 flex-1">
                <div>
                  <label className="block text-[9px] xs:text-xs sm:text-sm lg:text-base font-medium text-gray-600 mb-0.5 xs:mb-1 lg:mb-2">
                    Start Date
                  </label>
                  <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
                </div>
                <div>
                  <label className="block text-[9px] xs:text-xs sm:text-sm lg:text-base font-medium text-gray-600 mb-0.5 xs:mb-1 lg:mb-2">
                    End Date
                  </label>
                  <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[9px] xs:text-xs sm:text-sm lg:text-base font-medium text-gray-600 mb-0.5 xs:mb-1 lg:mb-2">
                    Customer
                  </label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                    disabled={isLoadingCustomers || !customers.length}
                  >
                    <SelectTrigger className="w-full h-7 xs:h-8 sm:h-9 lg:h-10 text-[9px] xs:text-xs sm:text-sm lg:text-base">
                      <SelectValue placeholder={isLoadingCustomers ? 'Loading customers...' : 'Select Customer'} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                          className="text-[9px] xs:text-xs sm:text-sm lg:text-base"
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full sm:w-auto h-7 xs:h-8 sm:h-9 lg:h-10 text-[9px] xs:text-xs sm:text-sm lg:text-base"
                onClick={handleApplyFilters}
                disabled={!selectedCustomer}
              >
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {performanceError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs sm:text-sm text-red-700">
            {(performanceError as Error).message ?? 'Unable to load officer performance data.'}
          </div>
        )}

        <div className="space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as OfficerPerformanceCategory)
              setCurrentPage(1)
            }}
          >
            <TabsList className="w-full xs:w-auto h-7 xs:h-8 sm:h-9 lg:h-10">
              {CATEGORY_TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 xs:flex-none text-[9px] xs:text-xs sm:text-sm lg:text-base h-6 xs:h-7 sm:h-8 lg:h-9 capitalize"
                >
                  {tab === 'top-performers' 
                    ? 'Top Performers' 
                    : tab === 'needs-improvement' 
                    ? 'Needs Improvement' 
                    : 'Non-Reporters'}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORY_TABS.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-2 lg:mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Records to fetch</p>
                        <p className="text-sm font-semibold">
                          {tab === activeTab ? performanceData?.results.recordLimit ?? recordLimits[tab] : recordLimits[tab]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-gray-500">Display</span>
                        <Select
                          value={recordLimits[tab].toString()}
                          onValueChange={(value) => handleRecordLimitChange(tab, value)}
                          disabled={tab !== activeTab}
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue placeholder="10" />
                          </SelectTrigger>
                          <SelectContent>
                            {RECORD_LIMIT_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option.toString()} className="text-xs">
                                {option} records
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="relative overflow-x-auto">
                      <div className="min-w-[360px] xs:min-w-full">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50">
                            <tr className="border-b">
                              {['Officer', 'Incidents', 'Value Saved', 'Status'].map((header) => (
                                <th
                                  key={header}
                                  className="px-1 py-1.5 xs:px-3 xs:py-3 sm:px-4 lg:px-6 text-[9px] xs:text-xs lg:text-sm whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {renderTableRows(tab === activeTab ? tableItems : [], isLoadingData && tab === activeTab)}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="flex flex-col xs:flex-row items-center justify-between gap-2 px-1 xs:px-2 lg:px-4">
          <div className="text-[9px] xs:text-xs sm:text-sm lg:text-base text-gray-500 order-2 xs:order-1">
            {activePagination && activePagination.totalCount > 0 ? (
              <>Showing {showingStart} to {showingEnd} of {activePagination.totalCount} entries</>
            ) : (
              'No entries to display'
            )}
          </div>
          <div className="flex items-center space-x-1 xs:space-x-2 lg:space-x-3 order-1 xs:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={!activePagination || !activePagination.hasPrevious}
              className="h-5 w-5 xs:h-8 xs:w-8 lg:h-10 lg:w-10"
            >
              <ChevronLeft className="h-2.5 w-2.5 xs:h-4 xs:w-4 lg:h-5 lg:w-5" />
            </Button>
            <div className="text-[9px] xs:text-xs sm:text-sm lg:text-base min-w-[60px] xs:min-w-[100px] lg:min-w-[120px] text-center">
              Page {activePagination?.currentPage ?? 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={!activePagination || !activePagination.hasNext}
              className="h-5 w-5 xs:h-8 xs:w-8 lg:h-10 lg:w-10"
            >
              <ChevronRight className="h-2.5 w-2.5 xs:h-4 xs:w-4 lg:h-5 lg:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfficerPerformance