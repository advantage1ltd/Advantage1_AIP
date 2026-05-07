import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RefreshCcw, Target, TrendingUp, AlertTriangle, Activity, BarChart3, Clock, MapPin, Package, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend
} from 'recharts'

import { useAuth } from '@/contexts/AuthContext'
import { useCustomerSelection } from '@/contexts/CustomerSelectionContext'
import { findCustomerById } from '@/hooks/useAvailableCustomers'
import { siteService } from '@/services/siteService'
import { incidentGraphService, type RegionOption } from '@/services/incidentGraphService'
import { crimeIntelligenceService } from '@/services/crimeIntelligenceService'
import type { Site } from '@/types/customer'
import { CrimeInsightListItem, CrimeInsightTimeBucket, CrimeIntelligenceResponse } from '@/types/crimeIntelligence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

// Modern gradient color palette
const chartColors = [
	'url(#gradient1)',
	'url(#gradient2)',
	'url(#gradient3)',
	'url(#gradient4)',
	'url(#gradient5)',
	'url(#gradient6)'
]

const solidColors = ['#6366f1', '#f97316', '#22c55e', '#0ea5e9', '#ec4899', '#facc15']

const gradientColors = [
	{ start: '#6366f1', end: '#8b5cf6' }, // Indigo to purple
	{ start: '#f97316', end: '#fb923c' }, // Orange gradient
	{ start: '#22c55e', end: '#4ade80' }, // Green gradient
	{ start: '#0ea5e9', end: '#38bdf8' }, // Blue gradient
	{ start: '#ec4899', end: '#f472b6' }, // Pink gradient
	{ start: '#facc15', end: '#fde047' }  // Yellow gradient
]

const heroMetricIcons = [Activity, BarChart3, Shield, Target]

const defaultRangeDays = 90

const getIsoDate = (date?: Date | null) => {
	if (!date) return undefined
	return date.toISOString().split('T')[0]
}

const buildAnalystNotes = (insights: CrimeIntelligenceResponse): string[] => {
	const notes: string[] = []

	if (insights.topStores?.length) {
		const top = insights.topStores[0]
		notes.push(`${top.name} accounts for ${top.percentage.toFixed(1)}% of all incidents in this period.`)
	}

	if (insights.topProducts?.length) {
		const hot = insights.topProducts[0]
		notes.push(`"${hot.name}" is the most frequently stolen item with ${hot.count} units recorded.`)
	}

	if (insights.timeBuckets?.length) {
		const peak = [...insights.timeBuckets].sort((a, b) => b.count - a.count)[0]
		if (peak) {
			notes.push(`Incident activity peaks during ${peak.bucket.toLowerCase()} (${peak.percentage.toFixed(1)}% of cases).`)
		}
	}

	if (!notes.length) {
		notes.push('No significant trends detected for the selected filters.')
	}

	return notes
}

export default function CustomerCrimeIntelligence() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { toast } = useToast()
	const { user, isLoading: authLoading } = useAuth()
	const { isAdmin } = useCustomerSelection()

	const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null)
	const [sites, setSites] = useState<Site[]>([])
	const [regions, setRegions] = useState<RegionOption[]>([])
	const [selectedSiteId, setSelectedSiteId] = useState<string>('all')
	const [selectedRegionId, setSelectedRegionId] = useState<string>('all')
	const [startDate, setStartDate] = useState<Date | undefined>(() => {
		const date = new Date()
		date.setDate(date.getDate() - defaultRangeDays)
		return date
	})
	const [endDate, setEndDate] = useState<Date | undefined>(new Date())

	const [insights, setInsights] = useState<CrimeIntelligenceResponse | null>(null)
	const [loadingInsights, setLoadingInsights] = useState(false)
	const [pageError, setPageError] = useState<string | null>(null)
	const [isResolvingCustomer, setIsResolvingCustomer] = useState(true)
	
	// Pagination state for charts
	const [storesPage, setStoresPage] = useState(1)
	const [regionsPage, setRegionsPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(6)

	useEffect(() => {
		const handleResize = () => {
			setItemsPerPage(window.innerWidth < 640 ? 4 : 6)
		}
		handleResize()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const urlCustomerId = searchParams.get('customerId')
	const urlSiteId = searchParams.get('siteId')

	const resolvedCustomerId = useMemo(() => {
		if (urlCustomerId) return parseInt(urlCustomerId, 10)
		if (user && 'customerId' in user) {
			return (user as any).customerId ?? null
		}
		return null
	}, [urlCustomerId, user])

	const customerFiltersReady = !!customer && !!resolvedCustomerId

	const loadCustomer = useCallback(async () => {
		if (authLoading) return
		if (!resolvedCustomerId) {
			if (isAdmin) {
				setPageError('Please select a customer from the sidebar to view insights.')
			} else {
				setPageError('No customer ID detected for your profile.')
			}
			setIsResolvingCustomer(false)
			return
		}

		try {
			const customerData = await findCustomerById(resolvedCustomerId)
			if (!customerData) {
				setPageError('Customer not found.')
			} else {
				setCustomer(customerData)
				if (urlSiteId) {
					setSelectedSiteId(urlSiteId)
				}
			}
		} catch (error) {
			console.error('CrimeIntelligence:Failed to load customer', error)
			setPageError('Unable to load customer context.')
		} finally {
			setIsResolvingCustomer(false)
		}
	}, [authLoading, resolvedCustomerId, isAdmin, urlSiteId])

	useEffect(() => {
		loadCustomer()
	}, [loadCustomer])

	const loadSites = useCallback(async () => {
		if (!resolvedCustomerId) return
		try {
			const response = await siteService.getSitesByCustomer(resolvedCustomerId)
			if (response.success) {
				setSites(response.data)
			}
		} catch (error) {
			console.error('CrimeIntelligence:Failed to fetch sites', error)
		}
	}, [resolvedCustomerId])

	const loadRegions = useCallback(async () => {
		if (!resolvedCustomerId) return
		try {
			const response = await incidentGraphService.fetchRegions(resolvedCustomerId)
			if (response.success) {
				setRegions(response.data)
			}
		} catch (error) {
			console.error('CrimeIntelligence:Failed to fetch regions', error)
		}
	}, [resolvedCustomerId])

	useEffect(() => {
		if (customerFiltersReady) {
			loadSites()
			loadRegions()
		}
	}, [customerFiltersReady, loadSites, loadRegions])

	const fetchInsights = useCallback(async () => {
		if (!resolvedCustomerId) return
		setLoadingInsights(true)
		setPageError(null)
		try {
			const response = await crimeIntelligenceService.getInsights({
				customerId: resolvedCustomerId,
				siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
				regionId: selectedRegionId !== 'all' ? selectedRegionId : undefined,
				startDate: getIsoDate(startDate),
				endDate: getIsoDate(endDate)
			})

			if (!response.success) {
				 throw new Error(response.message || 'Failed to fetch insights')
			}

			setInsights(response)
			// Reset pagination when new data is loaded
			setStoresPage(1)
			setRegionsPage(1)
		} catch (error) {
			console.error('CrimeIntelligence:Failed to fetch insights', error)
			const message = error instanceof Error ? error.message : 'Unable to load insights'
			setPageError(message)
			toast({
				variant: 'destructive',
				title: 'Unable to load data',
				description: message
			})
		} finally {
			setLoadingInsights(false)
		}
	}, [resolvedCustomerId, selectedSiteId, selectedRegionId, startDate, endDate, toast])

	useEffect(() => {
		if (customerFiltersReady) {
			fetchInsights()
		}
	}, [customerFiltersReady, fetchInsights])

	const filteredSites = useMemo(() => {
		if (!sites.length) return []
		return sites
	}, [sites])

	const analystNotes = useMemo(() => (insights ? buildAnalystNotes(insights) : []), [insights])

	const renderHeroMetrics = () => {
		if (loadingInsights || !insights) {
			return (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, idx) => (
						<Card key={`hero-skeleton-${idx}`} className="p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
							<Skeleton className="h-12 w-12 mb-4 rounded-lg" />
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-8 w-32" />
						</Card>
					))}
				</div>
			)
		}

		if (!insights.heroMetrics.length) return null

		const gradientClasses = [
			'from-indigo-500 via-purple-500 to-pink-500',
			'from-orange-500 via-red-500 to-pink-500',
			'from-emerald-500 via-teal-500 to-cyan-500',
			'from-blue-500 via-indigo-500 to-purple-500'
		]

		return (
			<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
				{insights.heroMetrics.map((metric, idx) => {
					const Icon = heroMetricIcons[idx % heroMetricIcons.length]
					const gradientClass = gradientClasses[idx % gradientClasses.length]
					return (
						<Card 
							key={metric.title} 
							className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 group"
						>
							<div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
							<CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6 relative z-10">
								<div className="flex items-center justify-between mb-2">
									<div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${gradientClass} bg-opacity-10`}>
										<Icon className={`h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-br ${gradientClass} bg-clip-text text-transparent`} />
									</div>
								</div>
								<CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">{metric.title}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 p-4 sm:p-6 pt-0 relative z-10">
								<p className={`text-3xl sm:text-4xl font-bold bg-gradient-to-br ${gradientClass} bg-clip-text text-transparent`}>
									{metric.value}
								</p>
								{metric.subtext && (
									<p className="text-xs text-slate-500 font-medium">{metric.subtext}</p>
								)}
								{metric.trend && (
									<div className="flex items-center gap-1 mt-2">
										<TrendingUp className={`h-3 w-3 ${metric.trendIsPositive ? 'text-emerald-600' : 'text-rose-600 rotate-180'}`} />
										<p className={`text-xs font-semibold ${metric.trendIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
											{metric.trend}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>
		)
	}

	const renderBarChart = (
		title: string, 
		data: CrimeInsightListItem[], 
		emptyLabel: string, 
		colorIndex = 0,
		currentPage: number,
		setCurrentPage: (page: number) => void
	) => {
		const gradientId = `barGradient${colorIndex}`
		const gradient = gradientColors[colorIndex % gradientColors.length]
		
		// Calculate pagination
		const totalPages = Math.ceil(data.length / itemsPerPage)
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		const paginatedData = data.slice(startIndex, endIndex)
		
		const handlePreviousPage = () => {
			if (currentPage > 1) {
				setCurrentPage(currentPage - 1)
			}
		}
		
		const handleNextPage = () => {
			if (currentPage < totalPages) {
				setCurrentPage(currentPage + 1)
			}
		}
		
		return (
			<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 overflow-hidden w-full max-w-full">
				<CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 md:p-6">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
							<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
							<span className="truncate">{title}</span>
						</CardTitle>
						{data.length > itemsPerPage && (
							<div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
								<span className="font-medium whitespace-nowrap">
									Page {currentPage} of {totalPages}
								</span>
								<span className="hidden sm:inline font-medium text-slate-500">
									({data.length} total)
								</span>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-3 sm:p-4 md:p-6">
					{loadingInsights ? (
						<Skeleton className="h-[250px] sm:h-[280px] w-full rounded-lg" />
					) : paginatedData.length ? (
						<>
							<div className="h-[250px] sm:h-[300px] w-full overflow-x-auto">
								<ResponsiveContainer width="99%" height="100%" minWidth={300}>
									<BarChart 
										data={paginatedData} 
										margin={{ 
											top: 10, 
											right: 10, 
											left: 0, 
											bottom: 60 
										}}
									>
										<defs>
											<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
												<stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
												<stop offset="100%" stopColor={gradient.end} stopOpacity={0.6} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
										<XAxis 
											dataKey="name" 
											tick={{ 
												fontSize: 10, 
												fill: '#64748b', 
												fontWeight: 500 
											}}
											axisLine={{ stroke: '#cbd5e1' }}
											angle={-45}
											textAnchor="end"
											height={60}
											interval={0}
										/>
										<YAxis 
											tick={{ 
												fontSize: 10, 
												fill: '#64748b', 
												fontWeight: 500 
											}}
											axisLine={{ stroke: '#cbd5e1' }}
											width={40}
										/>
										<Tooltip 
											contentStyle={{
												backgroundColor: 'rgba(255, 255, 255, 0.95)',
												border: '1px solid #e2e8f0',
												borderRadius: '8px',
												boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
												padding: '8px 12px',
												fontSize: '12px'
											}}
											cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
										/>
										<Bar 
											dataKey="count" 
											fill={`url(#${gradientId})`}
											radius={[6, 6, 0, 0]}
											stroke={gradient.start}
											strokeWidth={1}
										>
											{paginatedData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={`url(#${gradientId})`} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
							{data.length > itemsPerPage && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200 px-0">
									<Button
										variant="outline"
										size="sm"
										onClick={handlePreviousPage}
										disabled={currentPage === 1}
										className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 h-9 sm:h-10"
									>
										<ChevronLeft className="h-4 w-4" />
										<span className="hidden sm:inline">Previous</span>
										<span className="sm:hidden">Prev</span>
									</Button>
									<span className="text-xs sm:text-sm text-slate-600 font-medium text-center whitespace-nowrap">
										Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={handleNextPage}
										disabled={currentPage >= totalPages}
										className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 h-9 sm:h-10"
									>
										<span className="hidden sm:inline">Next</span>
										<span className="sm:hidden">Next</span>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							)}
						</>
					) : (
						<div className="h-[250px] sm:h-[300px] flex items-center justify-center">
							<p className="text-xs sm:text-sm text-slate-500 font-medium text-center px-4">{emptyLabel}</p>
						</div>
					)}
				</CardContent>
			</Card>
		)
	}

	const renderPieChart = (title: string, data: CrimeInsightListItem[]) => (
		<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 overflow-hidden w-full max-w-full">
			<CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 md:p-6">
				<CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
					<Target className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 flex-shrink-0" />
					<span className="truncate">{title}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 sm:p-4 md:p-6">
				{loadingInsights ? (
					<Skeleton className="h-[250px] sm:h-[300px] w-full rounded-lg" />
				) : data.length ? (
					<div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
						<div className="h-[250px] sm:h-[300px] flex items-center justify-center">
							<ResponsiveContainer width="99%" height="100%">
								<PieChart>
									<defs>
										{gradientColors.map((grad, index) => (
											<linearGradient key={`pieGradient${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
												<stop offset="0%" stopColor={grad.start} stopOpacity={0.9} />
												<stop offset="100%" stopColor={grad.end} stopOpacity={0.7} />
											</linearGradient>
										))}
									</defs>
									<Pie
										data={data}
										dataKey="count"
										nameKey="name"
										innerRadius={50}
										outerRadius={80}
										paddingAngle={5}
										stroke="white"
										strokeWidth={2}
									>
										{data.map((_, index) => (
											<Cell 
												key={`cell-${index}`} 
												fill={`url(#pieGradient${index % gradientColors.length})`}
											/>
										))}
									</Pie>
									<Tooltip 
										contentStyle={{
											backgroundColor: 'rgba(255, 255, 255, 0.95)',
											border: '1px solid #e2e8f0',
											borderRadius: '8px',
											boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
											padding: '8px 12px',
											fontSize: '12px'
										}}
									/>
									<Legend 
										wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
										iconType="circle"
										layout="horizontal"
										verticalAlign="bottom"
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
						<ul className="space-y-2 sm:space-y-3 flex flex-col justify-center">
							{data.map((item, index) => {
								const color = solidColors[index % solidColors.length]
								return (
									<li 
										key={item.name} 
										className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-all duration-200 border border-slate-100"
									>
										<span className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
											<span
												className="inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full shadow-sm flex-shrink-0"
												style={{ backgroundColor: color }}
											/>
											<span className="font-medium text-slate-700 text-xs sm:text-sm truncate">{item.name}</span>
										</span>
										<div className="text-right flex-shrink-0 ml-2">
											<span className="text-xs sm:text-sm font-bold text-slate-900">{item.count.toLocaleString()}</span>
											<span className="text-xs text-slate-500 ml-1 sm:ml-2">({item.percentage.toFixed(1)}%)</span>
										</div>
									</li>
								)
							})}
						</ul>
					</div>
				) : (
					<div className="h-[250px] sm:h-[300px] flex items-center justify-center">
						<p className="text-xs sm:text-sm text-slate-500 font-medium text-center px-4">No incident type distribution available.</p>
					</div>
				)}
			</CardContent>
		</Card>
	)

	const renderTimeChart = (title: string, data: CrimeInsightTimeBucket[]) => {
		const gradient = gradientColors[2] // Green gradient for time chart
		
		return (
			<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 overflow-hidden w-full max-w-full">
				<CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 md:p-6">
					<CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
						<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
						<span className="truncate">{title}</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3 sm:p-4 md:p-6">
					{loadingInsights ? (
						<Skeleton className="h-[250px] sm:h-[280px] w-full rounded-lg" />
					) : data.length ? (
							<div className="h-[250px] sm:h-[300px] w-full overflow-x-auto">
								<ResponsiveContainer width="99%" height="100%" minWidth={300}>
								<BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
									<defs>
										<linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
											<stop offset="100%" stopColor={gradient.end} stopOpacity={0.6} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
									<XAxis 
										dataKey="bucket" 
										tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
										axisLine={{ stroke: '#cbd5e1' }}
										angle={-45}
										textAnchor="end"
										height={50}
									/>
									<YAxis 
										tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
										axisLine={{ stroke: '#cbd5e1' }}
										width={40}
									/>
									<Tooltip 
										contentStyle={{
											backgroundColor: 'rgba(255, 255, 255, 0.95)',
											border: '1px solid #e2e8f0',
											borderRadius: '8px',
											boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
											padding: '8px 12px',
											fontSize: '12px'
										}}
										cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
									/>
									<Bar 
										dataKey="count" 
										fill="url(#timeGradient)"
										radius={[6, 6, 0, 0]}
										stroke={gradient.start}
										strokeWidth={1}
									>
										{data.map((entry, index) => (
											<Cell key={`cell-${index}`} fill="url(#timeGradient)" />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="h-[250px] sm:h-[300px] flex items-center justify-center">
							<p className="text-xs sm:text-sm text-slate-500 font-medium text-center px-4">No time-of-day data available.</p>
						</div>
					)}
				</CardContent>
			</Card>
		)
	}

	const renderProductsTable = () => (
		<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 overflow-hidden w-full max-w-full">
			<CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 md:p-6">
				<CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
					<Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
					<span className="truncate">Most Stolen Products</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 sm:p-4 md:p-6">
				{loadingInsights ? (
					<Skeleton className="h-[200px] w-full rounded-lg" />
				) : insights?.topProducts?.length ? (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[300px]">
							<thead>
								<tr className="border-b-2 border-slate-200">
									<th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Product</th>
									<th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Qty</th>
									<th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Value (£)</th>
									<th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">% of total</th>
								</tr>
							</thead>
							<tbody>
								{insights.topProducts.map((item, index) => (
									<tr 
										key={item.name} 
										className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-colors duration-150"
									>
										<td className="py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-800">
											<div className="flex items-center gap-2 sm:gap-3">
												<span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold flex-shrink-0">
													{index + 1}
												</span>
												<span className="truncate text-xs sm:text-sm">{item.name}</span>
											</div>
										</td>
										<td className="py-3 sm:py-4 px-2 sm:px-4 text-right font-bold text-slate-700 text-xs sm:text-sm whitespace-nowrap">{item.count.toLocaleString()}</td>
										<td className="py-3 sm:py-4 px-2 sm:px-4 text-right font-bold text-emerald-600 text-xs sm:text-sm whitespace-nowrap">£{(item.value || 0).toLocaleString()}</td>
										<td className="py-3 sm:py-4 px-2 sm:px-4 text-right whitespace-nowrap">
											<span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
												{item.percentage.toFixed(1)}%
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="h-[200px] flex items-center justify-center">
						<p className="text-xs sm:text-sm text-slate-500 font-medium text-center px-4">No stolen product data available.</p>
					</div>
				)}
			</CardContent>
		</Card>
	)

	const renderHotProduct = () => (
		<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 overflow-hidden relative w-full max-w-full">
			<div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-red-400/10" />
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10 bg-gradient-to-r from-amber-100/50 to-orange-100/50 border-b border-amber-200/50 p-4 md:p-6">
				<CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-amber-900">
					<div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg flex-shrink-0">
						<Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
					</div>
					<span className="truncate">Hot Product Spotlight</span>
				</CardTitle>
				{insights?.hotProduct && (
					<Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 shadow-md px-2 sm:px-3 py-1 text-xs flex-shrink-0">
						High Risk
					</Badge>
				)}
			</CardHeader>
			<CardContent className="p-4 sm:p-6 relative z-10">
				{loadingInsights ? (
					<div className="space-y-3">
						<Skeleton className="h-5 w-2/3 rounded" />
						<Skeleton className="h-4 w-1/2 rounded" />
						<Skeleton className="h-4 w-3/4 rounded" />
					</div>
				) : insights?.hotProduct ? (
					<div className="space-y-3 sm:space-y-4">
						<div>
							<p className="text-lg sm:text-2xl font-bold text-amber-900 mb-2 break-words">{insights.hotProduct.productName}</p>
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
								<span className="px-2 sm:px-3 py-1 rounded-full bg-white/80 text-amber-900 font-semibold shadow-sm whitespace-nowrap">
									{insights.hotProduct.quantity.toLocaleString()} units
								</span>
								<span className="px-2 sm:px-3 py-1 rounded-full bg-white/80 text-red-700 font-bold shadow-sm whitespace-nowrap">
									£{insights.hotProduct.totalValue.toLocaleString()}
								</span>
							</div>
						</div>
						<ul className="space-y-2 text-xs sm:text-sm">
							{insights.hotProduct.category && (
								<li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 p-2 rounded-lg bg-white/60">
									<span className="font-semibold text-amber-900">Category:</span>
									<span className="text-amber-800 break-words">{insights.hotProduct.category}</span>
								</li>
							)}
							{insights.hotProduct.mostTargetedStore && (
								<li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 p-2 rounded-lg bg-white/60">
									<div className="flex items-center gap-2">
										<MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
										<span className="font-semibold text-amber-900">Hot store:</span>
									</div>
									<span className="text-amber-800 break-words sm:ml-0 ml-5">{insights.hotProduct.mostTargetedStore}</span>
								</li>
							)}
							{insights.hotProduct.typicalTime && (
								<li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 p-2 rounded-lg bg-white/60">
									<div className="flex items-center gap-2">
										<Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
										<span className="font-semibold text-amber-900">Peak time:</span>
									</div>
									<span className="text-amber-800 break-words sm:ml-0 ml-5">{insights.hotProduct.typicalTime}</span>
								</li>
							)}
						</ul>
					</div>
				) : (
					<p className="text-xs sm:text-sm text-amber-800 font-medium text-center px-4">Insufficient product data to highlight a trend.</p>
				)}
			</CardContent>
		</Card>
	)

	if (isResolvingCustomer || authLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="space-y-4 text-center">
					<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
					<p className="text-sm text-slate-500">Loading customer context...</p>
				</div>
			</div>
		)
	}

	if (pageError) {
		return (
			<div className="container mx-auto p-4 space-y-4">
				<Button variant="ghost" onClick={() => navigate(-1)} className="w-fit">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<Card className="border border-rose-200 bg-rose-50">
					<CardContent className="flex items-center gap-3 py-6">
						<AlertTriangle className="h-5 w-5 text-rose-500" />
						<div>
							<p className="text-rose-600 font-medium">{pageError}</p>
							{isAdmin && (
								<p className="text-sm text-rose-500 mt-1">Select a customer from the sidebar to unlock crime intelligence insights.</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#EFF4FF] overflow-x-hidden">
			<div className="container mx-auto py-3 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 max-w-full">
				<div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
					<div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0 pr-0 md:pr-4">
						<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
							<Button 
								variant="ghost" 
								onClick={() => navigate(-1)} 
								className="w-fit px-2 sm:px-3 hover:bg-slate-100 transition-colors h-10 flex-shrink-0"
							>
								<ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
								<span className="text-xs sm:text-sm">Back</span>
							</Button>
							<Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-md text-xs px-2 py-0.5 flex-shrink-0">
								Customer Insight
							</Badge>
						</div>
						<h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent break-words leading-tight pr-0">
							{customer?.name} - Crime Intelligence
						</h1>
						<p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed break-words">
							Live incident telemetry across stores, products, and time-of-day patterns.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchInsights}
						disabled={loadingInsights}
						className="w-full md:w-auto border-2 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 shadow-md h-10 text-xs sm:text-sm flex-shrink-0 mt-2 md:mt-0"
					>
						<RefreshCcw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${loadingInsights ? 'animate-spin' : ''}`} />
						Refresh data
					</Button>
				</div>

				<Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm w-full max-w-full transition-all duration-300">
					<CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 p-3 sm:p-4 md:p-6">
						<CardTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
							<Activity className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-indigo-600 flex-shrink-0" />
							<span>Filters</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 sm:p-4 md:p-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
						<div className="space-y-1.5 sm:space-y-2">
							<p className="text-xs sm:text-sm font-medium text-slate-600">Start Date</p>
							<DatePicker date={startDate} setDate={setStartDate} />
						</div>
						<div className="space-y-1.5 sm:space-y-2">
							<p className="text-xs sm:text-sm font-medium text-slate-600">End Date</p>
							<DatePicker date={endDate} setDate={setEndDate} />
						</div>
						<div className="space-y-1.5 sm:space-y-2">
							<p className="text-xs sm:text-sm font-medium text-slate-600">Region</p>
							<Select value={selectedRegionId} onValueChange={value => setSelectedRegionId(value)}>
								<SelectTrigger className="h-10 text-xs sm:text-sm">
									<SelectValue placeholder="All regions" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Regions</SelectItem>
									{regions.map(region => (
										<SelectItem key={region.id} value={region.id}>
											{region.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5 sm:space-y-2">
							<p className="text-xs sm:text-sm font-medium text-slate-600">Site</p>
							<Select value={selectedSiteId} onValueChange={value => setSelectedSiteId(value)}>
								<SelectTrigger className="h-10 text-xs sm:text-sm">
									<SelectValue placeholder="All sites" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Sites</SelectItem>
									{filteredSites.map(site => (
										<SelectItem key={site.siteID} value={site.siteID?.toString() || ''}>
											{site.locationName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

			{renderHeroMetrics()}

			<div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
				{renderBarChart('Hot Stores', insights?.topStores || [], 'No store-level crime data available.', 0, storesPage, setStoresPage)}
				{renderPieChart('Incident Mix', insights?.topIncidentTypes || [])}
			</div>

			<div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
				{renderTimeChart('Time-of-Day Activity', insights?.timeBuckets || [])}
				{renderBarChart('Regional Exposure', insights?.topRegions || [], 'No regional breakdown available.', 3, regionsPage, setRegionsPage)}
			</div>

			<div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2 space-y-4 sm:space-y-6">
					{renderProductsTable()}
					<Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 overflow-hidden w-full max-w-full">
						<CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-3 sm:p-4 md:p-6">
							<CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
								<div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
									<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
								</div>
								<span className="truncate">Analyst Notes</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 sm:p-6">
							{loadingInsights ? (
								<div className="space-y-3">
									<Skeleton className="h-4 w-full rounded" />
									<Skeleton className="h-4 w-3/4 rounded" />
									<Skeleton className="h-4 w-2/3 rounded" />
								</div>
							) : (
								<ul className="space-y-2 sm:space-y-3">
									{analystNotes.map((note, idx) => (
										<li 
											key={`note-${idx}`}
											className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-l-4 border-indigo-500 hover:shadow-md transition-all duration-200"
										>
											<div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mt-0.5">
												{idx + 1}
											</div>
											<p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed break-words">{note}</p>
										</li>
									))}
								</ul>
							)}
						</CardContent>
					</Card>
				</div>
				{renderHotProduct()}
			</div>

			{insights?.generatedAt && (
				<div className="flex justify-end">
					<p className="text-xs text-slate-500 font-medium px-4 py-2 rounded-full bg-slate-100/50">
						Last generated {format(new Date(insights.generatedAt), 'dd MMM yyyy HH:mm')}
					</p>
				</div>
			)}
		</div>
		</div>
	)
}

