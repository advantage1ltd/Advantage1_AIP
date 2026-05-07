import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, format, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { 
	incidentGraphService, 
	IncidentGraphData, 
	IncidentTypeData,
	IncidentGraphFilters,
	RegionOption 
} from '@/services/incidentGraphService'
import { BASE_API_URL } from '@/config/api'

// Define types for the data
interface FilteredData {
	location: string
	value: number
	quantity: number
}

// Add incident type interface and data after the mockIncidentData array
interface IncidentTypeDataWithColor extends IncidentTypeData {
	originalCode: string
	fullName: string
}

// Update color palette for better 3D effect with more vibrant colors
const colorPalette = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#facc15', // Yellow
  '#14b8a6', // Teal
]

// Update action code colors for better distinction and vibrancy
const actionCodeColors: Record<string, string> = {
  'A': '#ef4444', // Red for Arrests
  'B': '#3b82f6', // Blue for Deterrent
  'C': '#8b5cf6', // Purple for Theft
  'D': '#f97316', // Orange for Criminal Damage
  'E': '#10b981', // Green for Fraud
  'F': '#f59e0b', // Amber for Suspicious
  'G': '#14b8a6', // Teal for Underage
  'H': '#6366f1', // Indigo for Anti-Social
  'I': '#f43f5e', // Rose for Other
  'J': '#7c3aed', // Violet for Self Scan
  'K': '#dc2626', // Red for Abusive
  'L': '#ec4899', // Pink for Threats
  'M': '#06b6d4', // Cyan for Spitting
  'N': '#7c3aed', // Violet for Bans
  'O': '#b91c1c', // Dark Red for Violent
  'P': '#0d9488', // Teal for Scan and Go
  'Q': '#4f46e5', // Indigo for Police
  'R': '#db2777'  // Pink for Failed Police
}

// Define regions and their stores - these will be fetched from API
const defaultRegionOptions = [
	{ value: 'all', label: 'All Regions' },
	{ value: 'north', label: 'North Region' },
	{ value: 'south', label: 'South Region' },
	{ value: 'east', label: 'East Region' },
	{ value: 'west', label: 'West Region' },
	{ value: 'midlands', label: 'Midlands Region' }
]

// Add type for graph type
type GraphType = 'value' | 'quantity' | 'type'

interface IncidentGraphProps {
	customerId?: string
}

const IncidentGraph: React.FC<IncidentGraphProps> = ({ customerId }) => {
	// Get user and customer info from auth context
	const { user } = useAuth()
	const [searchParams] = useSearchParams()
	
	// Get customer ID from URL parameter, prop, or user's customerId
	const urlCustomerId = searchParams.get('customerId')
	const userCustomerId = user && ('customerId' in user) ? (user as any).customerId : undefined
	const currentCustomerId = customerId 
		? parseInt(customerId) 
		: urlCustomerId 
			? parseInt(urlCustomerId) 
			: userCustomerId || 21 // Default to customer 21

	// State management
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedRegionId, setSelectedRegionId] = useState('all')
  const [graphType, setGraphType] = useState<GraphType>('value')
  const [officerType, setOfficerType] = useState('all')
  const [timeFilter, setTimeFilter] = useState('ytd')
	
	// Data state
	const [graphData, setGraphData] = useState<IncidentGraphData[]>([])
	const [incidentTypeData, setIncidentTypeData] = useState<IncidentTypeData[]>([])
	const [availableRegions, setAvailableRegions] = useState<RegionOption[]>([])
	const [customerName, setCustomerName] = useState<string>('')
  const [totalSaved, setTotalSaved] = useState(0)
  const [filteredTotal, setFilteredTotal] = useState(0)

	// Loading and error states
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1)
	const [storesPerPage, setStoresPerPage] = useState(20)

	// Memoize filters
	const filters = useMemo((): IncidentGraphFilters => ({
		customerId: currentCustomerId,
		startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
		endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
		regionId: selectedRegionId === 'all' ? undefined : selectedRegionId,
		officerType: officerType,
		graphType: graphType
	}), [currentCustomerId, startDate, endDate, selectedRegionId, officerType, graphType])

	const selectedRegionLabel = useMemo(() => {
		if (selectedRegionId === 'all') {
			return 'All Regions'
		}
		return availableRegions.find(region => region.id === selectedRegionId)?.name ?? 'Selected Region'
	}, [selectedRegionId, availableRegions])

	// Fetch data from API
	const fetchData = useCallback(async () => {
		console.log('🔍 [IncidentGraph] fetchData called with:', { currentCustomerId, filters })
		
		if (!currentCustomerId) {
			console.warn('🔍 [IncidentGraph] No customer ID available')
			return
		}

		setLoading(true)
		setError(null)

		try {
			console.log('🔍 [IncidentGraph] Making API calls...')
			
			// Fetch graph data and incident types in parallel
			const [graphResponse, typesResponse] = await Promise.all([
				incidentGraphService.fetchGraphData(filters),
				graphType === 'type' 
					? incidentGraphService.fetchTypesData({
						customerId: filters.customerId,
						startDate: filters.startDate,
						endDate: filters.endDate,
						regionId: filters.regionId,
						officerType: filters.officerType
					})
					: Promise.resolve(null)
			])

			console.log('🔍 [IncidentGraph] Graph response:', graphResponse)
			console.log('🔍 [IncidentGraph] Types response:', typesResponse)

			if (graphResponse.success) {
				console.log('🔍 [IncidentGraph] Setting graph data:', graphResponse.data.incidents)
				setGraphData(graphResponse.data.incidents)
				setTotalSaved(graphResponse.data.totals.totalValue)
				
				// Set filtered total based on graph type
				if (graphType === 'quantity') {
					setFilteredTotal(graphResponse.data.totals.totalQuantity)
				} else {
					setFilteredTotal(graphResponse.data.totals.totalValue)
				}
			} else {
				console.error('🔍 [IncidentGraph] Graph response not successful:', graphResponse)
				// Set error message for failed responses
				if (!graphResponse.data?.incidents || graphResponse.data.incidents.length === 0) {
					const errorMsg = 'Unable to load incident data. Please ensure the backend server is running on http://localhost:5128'
					setError(errorMsg)
				}
			}

			if (typesResponse?.success) {
				console.log('🔍 [IncidentGraph] Setting types data:', typesResponse.data)
				setIncidentTypeData(typesResponse.data)
				// Calculate total incidents for type view
				const totalIncidents = typesResponse.data.reduce((sum, item) => sum + item.count, 0)
				setFilteredTotal(totalIncidents)
			}

		} catch (err: any) {
			console.error('🔍 [IncidentGraph] Error fetching incident data:', err)
			
			// Provide user-friendly error message for network errors
			if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
				setError('Unable to connect to the backend API. Please ensure the backend server is running on http://localhost:5128')
			} else {
				setError(err instanceof Error ? err.message : 'Failed to fetch incident data')
			}
		} finally {
			setLoading(false)
		}
	}, [filters, graphType, currentCustomerId])

	// Fetch available regions for customer
	const fetchRegions = useCallback(async () => {
		if (!currentCustomerId) return

		try {
			const response = await incidentGraphService.fetchRegions(currentCustomerId)
			if (response.success) {
				setAvailableRegions(response.data)
			}
		} catch (err) {
			console.error('Error fetching regions:', err)
		}
	}, [currentCustomerId])

	// Fetch customer name
	const fetchCustomerName = useCallback(async () => {
		if (!currentCustomerId) return

		try {
			const response = await fetch(`${BASE_API_URL}/customers/${currentCustomerId}`, {
				headers: {
					'Content-Type': 'application/json',
					'X-Customer-Id': currentCustomerId.toString()
				}
			})
			
			if (response.ok) {
				const result = await response.json()
				if (result.success) {
					setCustomerName(result.data.name)
				}
			}
		} catch (err) {
			console.error('Error fetching customer name:', err)
		}
	}, [currentCustomerId])

	// Initialize component
	useEffect(() => {
		// Set responsive storesPerPage based on screen size
		const handleResize = () => {
			if (window.innerWidth < 640) { // Mobile
				setStoresPerPage(5)
			} else if (window.innerWidth < 1024) { // Tablet/iPad
				setStoresPerPage(10)
			} else { // Desktop
				setStoresPerPage(20)
			}
		}
		
		handleResize()
		window.addEventListener('resize', handleResize)
		
		// Set default time range to year to date
		const now = new Date()
		const yearStart = startOfYear(now)
		setStartDate(yearStart)
		setEndDate(now)
		fetchRegions()
		fetchCustomerName()
		
		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [fetchRegions, fetchCustomerName])

	// Fetch data when filters change
	useEffect(() => {
		fetchData()
	}, [fetchData])

	// Memoize filtered and paginated data
	const { filteredData, paginatedData } = useMemo(() => {
		let result: FilteredData[]

    if (graphType === 'type') {
			// Use incident type data for type view
			result = incidentTypeData.map(item => ({
				location: item.type,
				value: item.count,
				quantity: item.count
			}))
    } else {
					// Transform graph data for value/quantity views
		result = graphData.map(item => ({
			location: item.location || item.siteName || 'Unknown Location',
			value: graphType === 'value' 
				? (item.valueRecovered || item.totalValueRecovered || item.value || 0)
				: (item.value || 0), // For value graph type, use value from API
			quantity: item.quantity || item.quantityRecovered || 0 // For quantity graph type, use quantity from API
		}))
		}

		// Sort data
		const sortedData = result.sort((a, b) => 
			graphType === 'value' || graphType === 'type' 
				? (b.value - a.value)
				: (b.quantity - a.quantity)
		)

		// Calculate pagination
		const totalItems = sortedData.length
		const totalPages = Math.ceil(totalItems / storesPerPage)
		const startIndex = (currentPage - 1) * storesPerPage
		const endIndex = startIndex + storesPerPage
		const paginated = sortedData.slice(startIndex, endIndex)

		return {
			filteredData: sortedData,
			paginatedData: paginated
		}
	}, [graphData, incidentTypeData, graphType, officerType, currentPage, storesPerPage])

	// Helper functions
	const handleTimeFilterChange = (filterType: string) => {
		setTimeFilter(filterType)
		const now = new Date()

		switch (filterType) {
			case 'today':
				setStartDate(now)
				setEndDate(now)
				break
			case 'week':
				setStartDate(startOfWeek(now))
				setEndDate(endOfWeek(now))
				break
			case 'month':
				setStartDate(startOfMonth(now))
				setEndDate(endOfMonth(now))
				break
			case 'ytd':
				setStartDate(startOfYear(now))
				setEndDate(now)
				break
			case 'last30':
				setStartDate(subDays(now, 30))
				setEndDate(now)
				break
			default:
				break
		}
	}

	const getTotalSavedTitle = () => {
		const officerTypeText = officerType === 'all' 
			? 'All Officers'
			: officerType === 'uniform'
				? 'Uniform Officers'
				: 'Store Detectives'

		const periodText = timeFilter === 'ytd'
			? 'Year to Date'
			: timeFilter === 'month'
				? 'Current Month'
				: timeFilter === 'week'
					? 'Current Week'
					: 'Selected Period'

		if (graphType === 'type') {
			return `Total Incidents by ${officerTypeText} (${selectedRegionLabel}) - ${periodText}`
		} else if (graphType === 'quantity') {
			return `Total Items Recovered by ${officerTypeText} (${selectedRegionLabel}) - ${periodText}`
		}
		return `Total Value Recovered by ${officerTypeText} (${selectedRegionLabel}) - ${periodText}`
	}

	const handlePreviousPage = () => {
		setCurrentPage(prev => Math.max(prev - 1, 1))
	}

	const handleNextPage = () => {
		const totalPages = Math.ceil(filteredData.length / storesPerPage)
		setCurrentPage(prev => Math.min(prev + 1, totalPages))
	}

	const regionOptions = [
		{ value: 'all', label: 'All Regions' },
		...availableRegions.map(region => ({ value: region.id, label: region.name }))
	]

	const renderGraph = () => {
		if (loading) {
			return (
				<div className="h-[400px] flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-slate-300" />
					<span className="ml-2 text-slate-300">Loading incident data...</span>
				</div>
			)
		}

		if (error) {
			return (
				<Alert className="bg-red-900/20 border-red-700 text-red-300">
					<AlertDescription>
						{error}
					</AlertDescription>
				</Alert>
			)
		}

		if (paginatedData.length === 0) {
			return (
				<div className="h-[400px] flex items-center justify-center text-slate-400">
					No incident data available for the selected filters.
				</div>
			)
		}

		let chartData
		let barName
		
		if (graphType === 'type') {
			// For incident types, use the original naming and transform data
			chartData = paginatedData.map(item => ({
				name: item.location.length > 12 ? item.location.substring(0, 10) + '...' : item.location,
				code: item.location,
				count: item.value,
				originalCode: item.location,
				fullName: item.location
			}))
			barName = 'Incident Count'
		} else {
			// For location-based charts, truncate location names for better display on mobile
			chartData = paginatedData.map(item => ({
				location: window.innerWidth < 640 ? 
					(item.location.split(' - ')[0]) : // Just show store number on mobile
					(item.location.length > 20 ? item.location.substring(0, 18) + '...' : item.location),
				value: item.value,
				quantity: item.quantity,
				fullLocation: item.location // Keep the full location for tooltips
			}))
			barName = graphType === 'quantity' ? 'Items Recovered' :
					  officerType === 'uniform' ? 'Uniform Officer' :
					  officerType === 'detective' ? 'Store Detective' :
					  'Total Value'
		}

		// Debug logging for quantity issues
		if (graphType === 'quantity') {
			console.log('🔍 [IncidentGraph] Chart data for quantity:', chartData)
			console.log('🔍 [IncidentGraph] Paginated data:', paginatedData)
			console.log('🔍 [IncidentGraph] Graph data from API:', graphData)
		}

		const getBarFill = (entry: any, index: number) => {
			if (graphType === 'type' && entry.originalCode) {
				return actionCodeColors[entry.originalCode] || colorPalette[index % colorPalette.length]
			}
			return colorPalette[index % colorPalette.length]
		}

		const formatValue = (value: number) => {
			if (graphType === 'value') {
				// Format currency values more compactly on mobile
				if (window.innerWidth < 640) {
					if (value >= 1000) {
						return `£${(value / 1000).toFixed(1)}k`
					}
					return `£${Number(value).toFixed(0)}`
				}
				return `£${Number(value).toFixed(0)}`
			}
			return value.toString()
		}

		const formatTooltipValue = (val: any, name: string, props: any) => {
			if (graphType === 'type') {
				// Show full name in tooltip
				const fullName = props.payload.fullName || props.payload.name
				return [`${val} incidents`, fullName]
			}
			// Show full location in tooltip
			const fullLocation = props.payload.fullLocation || props.payload.location
			return [formatValue(val), fullLocation]
		}

		return (
			<div className="space-y-4 sm:space-y-6">
				<div className="bg-slate-900/90 dark:bg-slate-950/90 rounded-xl p-2 sm:p-4 md:p-6 lg:p-8 shadow-2xl border border-slate-800/50 relative overflow-hidden">
					{/* Add subtle background pattern for depth */}
					<div className="absolute inset-0 bg-grid-slate-800/20 [mask-image:linear-gradient(0deg,rgba(0,0,0,0.7),rgba(0,0,0,0.5))]"></div>
					
					{/* Add subtle glow effect */}
					<div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur-sm"></div>
					
					<div className="relative">
						{/* Add horizontal scrolling container for mobile */}
						<div className={cn(
							"w-full overflow-hidden",
							graphType !== 'type' && chartData.length > 5 && window.innerWidth < 640 ? 'overflow-x-auto pb-4' : ''
						)}>
							<div className={cn(
								"w-full",
								graphType !== 'type' && chartData.length > 5 && window.innerWidth < 640 ? 'min-w-[400px]' : ''
							)}>
								<ResponsiveContainer 
									width="100%" 
									height={window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 400 : 500}
									className="mt-4"
								>
									<BarChart
										data={chartData}
										margin={{
											top: window.innerWidth < 640 ? 15 : 20,
											right: window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 20 : 30,
											left: window.innerWidth < 640 ? 35 : window.innerWidth < 1024 ? 50 : 60,
											bottom: window.innerWidth < 640 ? 60 : window.innerWidth < 1024 ? 80 : 100
										}}
										barSize={window.innerWidth < 640 ? 25 : window.innerWidth < 1024 ? 35 : 40}
										barGap={0}
										barCategoryGap={window.innerWidth < 640 ? 15 : window.innerWidth < 1024 ? 25 : 30}
									>
										<defs>
											{chartData.map((entry, index) => {
												const baseColor = getBarFill(entry, index)
												// Create unique gradient IDs for each bar
												return (
													<React.Fragment key={index}>
														{/* Front face gradient - more vibrant with enhanced shading */}
														<linearGradient id={`frontGradient${index}`} x1="0" y1="0" x2="0" y2="1">
															<stop offset="0%" stopColor={baseColor} stopOpacity={1} />
															<stop offset="45%" stopColor={baseColor} stopOpacity={0.95} />
															<stop offset="100%" stopColor={baseColor} stopOpacity={0.85} />
														</linearGradient>
														
														{/* Right side face gradient - darker with enhanced depth */}
														<linearGradient id={`sideGradient${index}`} x1="0" y1="0" x2="1" y2="0">
															<stop offset="0%" stopColor={baseColor} stopOpacity={0.7} />
															<stop offset="40%" stopColor={baseColor} stopOpacity={0.5} />
															<stop offset="100%" stopColor={baseColor} stopOpacity={0.3} />
														</linearGradient>
														
														{/* Top face gradient - lighter with enhanced highlight */}
														<linearGradient id={`topGradient${index}`} x1="0" y1="1" x2="1" y2="0">
															<stop offset="0%" stopColor={baseColor} stopOpacity={1} />
															<stop offset="40%" stopColor={baseColor} stopOpacity={0.95} />
															<stop offset="100%" stopColor={baseColor} stopOpacity={1} />
														</linearGradient>
														
														{/* Reflection gradient that uses the bar's own color instead of white */}
														<linearGradient id={`reflectionGradient${index}`} x1="0" y1="0" x2="0" y2="1">
															<stop offset="0%" stopColor={baseColor} stopOpacity={0.2} />
															<stop offset="20%" stopColor={baseColor} stopOpacity={0.1} />
															<stop offset="100%" stopColor={baseColor} stopOpacity={0} />
														</linearGradient>
													</React.Fragment>
												)
											})}
											
											{/* Enhanced shadow filter */}
											<filter id="shadow" filterUnits="userSpaceOnUse">
												<feDropShadow dx="4" dy="6" stdDeviation="5" floodOpacity="0.3" floodColor="#000000" />
											</filter>
											
											{/* Glow filter for hover effect - using blue instead of white */}
											<filter id="glow" filterUnits="userSpaceOnUse">
												<feGaussianBlur stdDeviation="3" result="blur" />
												<feFlood floodColor="#3b82f6" floodOpacity="0.3" result="color" />
												<feComposite in="color" in2="blur" operator="in" result="glow" />
												<feMerge>
													<feMergeNode in="glow" />
													<feMergeNode in="SourceGraphic" />
												</feMerge>
											</filter>
										</defs>
										
										{/* Enhanced grid with subtle animation */}
										<CartesianGrid 
											strokeDasharray="3 3" 
											stroke="rgba(255,255,255,0.1)"
											vertical={false}
										/>
										
										<XAxis 
											dataKey={graphType === 'type' ? 'name' : 'location'}
											angle={window.innerWidth < 640 ? -45 : window.innerWidth < 1024 ? -30 : -20}
											textAnchor="end"
											height={window.innerWidth < 640 ? 50 : window.innerWidth < 1024 ? 60 : 80}
											interval={0}
											tick={{ 
												fontSize: window.innerWidth < 640 ? 8 : 
														 window.innerWidth < 1024 ? 10 : 12,
												fill: '#E2E8F0',
												fontWeight: 500,
												dy: window.innerWidth < 640 ? 2 : 3
											}}
											axisLine={{ stroke: '#475569' }}
											tickLine={{ stroke: '#475569' }}
										/>
										
										<YAxis 
											label={{ 
												value: graphType === 'type' ? 'Number of Incidents' : 
													   graphType === 'value' ? 'Amount Recovered (£)' : 
													   'Number of Items',
												angle: -90,
												position: 'insideLeft',
												offset: window.innerWidth < 640 ? -25 : 
														window.innerWidth < 1024 ? -35 : -45,
												fill: '#94A3B8',
												fontSize: window.innerWidth < 640 ? 8 : 
														 window.innerWidth < 1024 ? 10 : 12,
												fontWeight: 500
											}}
											tickFormatter={formatValue}
											tick={{ 
												fontSize: window.innerWidth < 640 ? 8 : 
														 window.innerWidth < 1024 ? 10 : 12,
												fill: '#94A3B8',
												fontWeight: 500
											}}
											axisLine={{ stroke: '#475569' }}
											tickLine={{ stroke: '#475569' }}
										/>
										
										{/* Enhanced tooltip with glass effect */}
										<Tooltip 
											formatter={formatTooltipValue}
											contentStyle={{
												backgroundColor: 'rgba(15, 23, 42, 0.85)',
												backdropFilter: 'blur(8px)',
												border: '1px solid rgba(148, 163, 184, 0.2)',
												borderRadius: '8px',
												padding: '12px',
												color: '#E2E8F0',
												boxShadow: '0 4px 20px -1px rgba(0, 0, 0, 0.4), 0 2px 10px -1px rgba(0, 0, 0, 0.3)'
											}}
											itemStyle={{
												padding: '4px 0',
												color: '#E2E8F0'
											}}
											labelStyle={{
												fontWeight: 600,
												marginBottom: '6px',
												color: '#F8FAFC'
											}}
										/>
										
										<Legend 
											wrapperStyle={{
												paddingTop: window.innerWidth < 640 ? '10px' : '20px',
												fontSize: window.innerWidth < 640 ? '10px' : 'inherit'
											}}
											formatter={(value) => <span style={{ 
												color: '#94A3B8', 
												fontWeight: 500,
												fontSize: window.innerWidth < 640 ? '10px' : 'inherit'
											}}>{value}</span>}
											iconSize={window.innerWidth < 640 ? 8 : 10}
											iconType="circle"
										/>
										
										<Bar 
											dataKey={graphType === 'type' ? 'count' : graphType === 'value' ? 'value' : 'quantity'}
											name={barName}
											radius={[0, 0, 0, 0]}
											style={{
												transform: 'perspective(1500px) rotateY(0deg) rotateX(0deg)',
												transformOrigin: 'center',
												filter: 'url(#shadow)',
												transition: 'all 0.3s ease'
											}}
											minPointSize={0}
											shape={(props) => {
												const { x, y, width, height, index } = props
												// Adjust depth for mobile screens
												const depth = width * (window.innerWidth < 640 ? 0.15 : 0.2)
												const topHeight = depth * 0.5
												
												return (
													<g className="bar-group" style={{ transition: 'all 0.3s ease' }}>
														{/* Right side face */}
														<path 
															d={`
																M ${x + width} ${y}
																l ${depth} ${-topHeight}
																l 0 ${height}
																l ${-depth} ${depth * 0.3}
																Z
															`}
															fill={`url(#sideGradient${index})`}
															className="side-face"
															style={{ transition: 'all 0.3s ease' }}
														/>
														
														{/* Top face */}
														<path 
															d={`
																M ${x} ${y}
																l ${width} 0
																l ${depth} ${-topHeight}
																l ${-width} 0
																Z
															`}
															fill={`url(#topGradient${index})`}
															className="top-face"
															style={{ transition: 'all 0.3s ease' }}
														/>
														
														{/* Front face */}
														<path 
															d={`
																M ${x} ${y}
																l ${width} 0
																l 0 ${height}
																l ${-width} 0
																Z
															`}
															fill={`url(#frontGradient${index})`}
															className="front-face"
															style={{ transition: 'all 0.3s ease' }}
														/>
														
														{/* Reflection overlay */}
														<path 
															d={`
																M ${x} ${y}
																l ${width} 0
																l 0 ${height * 0.3}
																l ${-width} 0
																Z
															`}
															fill={`url(#reflectionGradient${index})`}
															className="reflection"
															style={{ transition: 'all 0.3s ease' }}
														/>
													</g>
												)
											}}
											onMouseOver={(data, index) => {
												// Add hover effect using CSS but without the white glow
												document.querySelectorAll('.bar-group').forEach((el, i) => {
													if (i === index) {
														// Just scale the bar slightly without adding the glow filter
														el.setAttribute('transform', 'scale(1.03)')
														
														// Add a subtle shadow effect instead of the white glow
														const paths = el.querySelectorAll('path')
														paths.forEach(path => {
															path.style.filter = 'brightness(1.2)'
														})
													}
												})
											}}
											onMouseOut={(data, index) => {
												// Remove hover effect
												document.querySelectorAll('.bar-group').forEach((el) => {
													el.setAttribute('transform', 'scale(1)')
													
													// Reset the brightness
													const paths = el.querySelectorAll('path')
													paths.forEach(path => {
														path.style.filter = 'none'
													})
												})
											}}
										>
											<LabelList 
												dataKey={graphType === 'type' ? 'count' : graphType === 'value' ? 'value' : 'quantity'}
												position="top"
												offset={window.innerWidth < 640 ? 5 : 
														window.innerWidth < 1024 ? 8 : 12}
												formatter={formatValue}
												style={{ 
													fontSize: window.innerWidth < 640 ? '8px' : 
															 window.innerWidth < 1024 ? '10px' : '12px',
													fill: '#FFFFFF',
													fontWeight: 600,
													textShadow: '0 1px 2px rgba(0,0,0,0.6)',
												}}
											/>
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>
				</div>

				{/* Action Codes Legend - Enhanced with better styling */}
				{graphType === 'type' && (
					<Card className="relative overflow-hidden bg-slate-800/80 border-slate-700/50">
						<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
						<CardContent className="relative p-3 sm:p-6">
							<h3 className="text-base sm:text-lg font-medium text-slate-100 mb-2 sm:mb-4 text-center">
								Action Codes Reference
							</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-3 bg-slate-700/50 rounded-lg p-2 sm:p-4 border border-slate-600/50 overflow-x-auto">
								{incidentTypeData.map((item) => (
									<div 
										key={item.code}
										className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-md bg-slate-800/60 border border-slate-600/30 hover:bg-slate-700/60 transition-colors"
									>
										<div 
											className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm shadow-sm flex-shrink-0"
											style={{ backgroundColor: actionCodeColors[item.code] }}
										/>
										<div className="min-w-0">
											<span className="text-[10px] sm:text-xs font-medium text-slate-100">
												{item.code}
											</span>
											<span className="text-[8px] sm:text-[10px] text-slate-300 block truncate max-w-[80px] sm:max-w-[100px]">
												{item.type}
											</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#EFF4FF]">
			<div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
				<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-3 sm:p-4 md:p-8 backdrop-blur-sm border border-white/10">
					<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
						<div>
							<h1 className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
								Incident Analytics Dashboard
							</h1>
							<p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg">
								Track and analyze security incidents across locations
							</p>
							{customerName && (
								<div className="flex items-center gap-2 mt-2 sm:mt-3">
									<div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
										<span className="text-indigo-300 text-sm sm:text-base font-medium">
											Customer: {customerName}
										</span>
									</div>
									<div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
										<span className="text-emerald-300 text-sm sm:text-base font-medium">
											ID: {currentCustomerId}
										</span>
									</div>
								</div>
							)}
						</div>
						<div className="bg-slate-800/80 p-3 sm:p-4 md:p-6 rounded-xl border border-white/10 w-full lg:w-auto">
							<h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-200">
								{getTotalSavedTitle()}
							</h2>
							<p className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent mt-1 sm:mt-2">
								{graphType === 'type' 
									? `${filteredTotal} Incidents` 
									: graphType === 'quantity' 
										? `${filteredTotal} Items`
										: `£${filteredTotal.toFixed(2)}`
								}
							</p>
						</div>
					</div>
				</div>

				{/* Filters Card */}
				<Card className="relative overflow-hidden bg-slate-900/90 border-slate-800">
					<CardHeader className="py-2 px-3 sm:px-4">
						<CardTitle className="text-base sm:text-lg md:text-xl font-semibold text-slate-200">
							Filters & Controls
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-0 px-3 sm:px-4 md:px-6">
						<div className="grid gap-3 sm:gap-4 md:gap-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6">
								<div className="sm:col-span-1 lg:col-span-4 space-y-2 sm:space-y-3">
									<div>
										<Label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Region</Label>
										<Select value={selectedRegionId} onValueChange={(value) => {
											setSelectedRegionId(value)
											setCurrentPage(1)
										}}>
											<SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 h-8 sm:h-10 text-xs sm:text-sm">
												<SelectValue placeholder="Select region" />
											</SelectTrigger>
											<SelectContent className="bg-slate-800 border-slate-700 text-xs sm:text-sm">
												{regionOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Graph Type</Label>
										<RadioGroup
											value={graphType}
											onValueChange={(value: GraphType) => setGraphType(value)}
											className="flex flex-wrap gap-2 sm:gap-3"
										>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="value" id="value" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="value" className="text-xs sm:text-sm text-slate-300">Value Recovered</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="quantity" id="quantity" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="quantity" className="text-xs sm:text-sm text-slate-300">Items Recovered</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="type" id="type" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="type" className="text-xs sm:text-sm text-slate-300">Action Types</Label>
											</div>
										</RadioGroup>
									</div>
								</div>
								<div className="sm:col-span-1 lg:col-span-5 space-y-2 sm:space-y-3">
									<div>
										<Label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Time Period</Label>
										<RadioGroup
											value={timeFilter}
											onValueChange={handleTimeFilterChange}
											className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2"
										>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="ytd" id="ytd" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="ytd" className="text-xs sm:text-sm text-slate-300">Year to Date</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="month" id="month" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="month" className="text-xs sm:text-sm text-slate-300">Current Month</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="week" id="week" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="week" className="text-xs sm:text-sm text-slate-300">Current Week</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="today" id="today" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="today" className="text-xs sm:text-sm text-slate-300">Today</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="last30" id="last30" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="last30" className="text-xs sm:text-sm text-slate-300">Last 30 Days</Label>
											</div>
										</RadioGroup>
									</div>
									{(startDate || endDate) && (
										<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
											<DatePicker
												date={startDate}
												setDate={setStartDate}
											/>
											<DatePicker
												date={endDate}
												setDate={setEndDate}
											/>
										</div>
									)}
								</div>
								<div className="sm:col-span-2 lg:col-span-3 space-y-2 sm:space-y-3">
									<div>
										<Label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Officer Role</Label>
										<RadioGroup
											value={officerType}
											onValueChange={setOfficerType}
											className="flex flex-col gap-1 sm:gap-2"
										>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="all" id="all" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="all" className="text-xs sm:text-sm text-slate-300">All Officers</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="uniform" id="uniform" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="uniform" className="text-xs sm:text-sm text-slate-300">Uniform Officers</Label>
											</div>
											<div className="flex items-center space-x-1 sm:space-x-2">
												<RadioGroupItem value="detective" id="detective" className="h-3 w-3 sm:h-4 sm:w-4 border-slate-700 text-indigo-500" />
												<Label htmlFor="detective" className="text-xs sm:text-sm text-slate-300">Store Detectives</Label>
											</div>
										</RadioGroup>
									</div>
									<div>
										<Label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2 block">Items per Page</Label>
										<Select 
											value={storesPerPage.toString()} 
											onValueChange={(value) => {
												setStoresPerPage(parseInt(value))
												setCurrentPage(1)
											}}
										>
											<SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 h-8 sm:h-10 text-xs sm:text-sm">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="bg-slate-800 border-slate-700 text-xs sm:text-sm">
												<SelectItem value="5">5 items</SelectItem>
												<SelectItem value="10">10 items</SelectItem>
												<SelectItem value="20">20 items</SelectItem>
												<SelectItem value="50">50 items</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Graph Card */}
				<Card className="relative overflow-hidden bg-slate-900/90 border-slate-800">
					<CardHeader className="py-2 px-3 sm:px-4">
						<CardTitle className="text-base sm:text-lg md:text-xl font-semibold text-slate-200">
							{graphType === 'type' ? (
								`${selectedRegionLabel} - Incident Types Distribution`
							) : (
								`${selectedRegionLabel} - ${
									officerType === 'all'
										? 'Total Incidents by Location'
										: officerType === 'uniform'
											? 'Uniform Officer Incidents'
											: 'Store Detective Incidents'
								}`
							)}
						</CardTitle>
						{startDate && endDate && (
							<p className="text-xs sm:text-sm text-slate-400 mt-1">
								Period: {format(startDate, 'PP')} - {format(endDate, 'PP')}
							</p>
						)}
					</CardHeader>
					<CardContent className="relative px-2 sm:px-4">
						<div className="bg-slate-800/50 rounded-lg p-2 sm:p-4 md:p-6 border border-slate-700/50">
							{renderGraph()}
						</div>
					</CardContent>
				</Card>

				{/* Pagination - Make more responsive */}
				{graphType !== 'type' && filteredData.length > storesPerPage && (
					<div className="flex flex-col sm:flex-row justify-between items-center px-2 sm:px-4 text-slate-300 gap-2 sm:gap-0">
						<div className="text-xs sm:text-sm text-center sm:text-left">
							Showing stores {((currentPage - 1) * storesPerPage) + 1} to {Math.min(currentPage * storesPerPage, filteredData.length)} of {filteredData.length}
							{window.innerWidth < 768 && <span className="ml-1">(per page on mobile)</span>}
						</div>
						<div className="flex gap-1 sm:gap-2">
							<Button
								variant="outline"
								onClick={handlePreviousPage}
								disabled={currentPage === 1}
								className="text-xs sm:text-sm border-slate-700 hover:bg-slate-800 text-slate-300 h-8 px-2 sm:px-3"
							>
								Previous
							</Button>
							<div className="flex items-center gap-1 sm:gap-2">
								{Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, Math.ceil(filteredData.length / storesPerPage)) }, (_, i) => {
									const pageNum = i + 1
									const totalPages = Math.ceil(filteredData.length / storesPerPage)
									return (
										<Button
											key={pageNum}
											variant={currentPage === pageNum ? "default" : "outline"}
											onClick={() => setCurrentPage(pageNum)}
											className={cn(
												"w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
												currentPage === pageNum 
													? "bg-indigo-500 hover:bg-indigo-600 text-white" 
													: "border-slate-700 hover:bg-slate-800 text-slate-300"
											)}
										>
											{pageNum}
										</Button>
									)
								})}
								{Math.ceil(filteredData.length / storesPerPage) > (window.innerWidth < 640 ? 3 : 5) && (
									<>
										<span className="text-slate-500">...</span>
										<Button
											variant={currentPage === Math.ceil(filteredData.length / storesPerPage) ? "default" : "outline"}
											onClick={() => setCurrentPage(Math.ceil(filteredData.length / storesPerPage))}
											className={cn(
												"w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
												currentPage === Math.ceil(filteredData.length / storesPerPage)
													? "bg-indigo-500 hover:bg-indigo-600 text-white" 
													: "border-slate-700 hover:bg-slate-800 text-slate-300"
											)}
										>
											{Math.ceil(filteredData.length / storesPerPage)}
										</Button>
									</>
								)}
							</div>
							<Button
								variant="outline"
								onClick={handleNextPage}
								disabled={currentPage === Math.ceil(filteredData.length / storesPerPage)}
								className="text-xs sm:text-sm border-slate-700 hover:bg-slate-800 text-slate-300 h-8 px-2 sm:px-3"
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default IncidentGraph 