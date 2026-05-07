/**
 * Crime Trend Explorer Module
 * 
 * Displays day of week, time of day, and incident type analytics
 * with interactive drill-downs to store level.
 */

import { useState, useMemo } from 'react'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from 'recharts'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { CrimeTrendData } from '@/types/analytics'
import {
	Calendar,
	Clock,
	TrendingUp,
	MapPin,
	ChevronRight,
	ArrowLeft,
} from 'lucide-react'

interface CrimeTrendExplorerProps {
	data: CrimeTrendData
	loading?: boolean
}

const CHART_COLORS = [
	'#3b82f6', // blue
	'#10b981', // green
	'#f59e0b', // amber
	'#ef4444', // red
	'#8b5cf6', // purple
	'#ec4899', // pink
	'#14b8a6', // teal
]

export const CrimeTrendExplorer = ({ data, loading = false }: CrimeTrendExplorerProps) => {
	const [selectedDay, setSelectedDay] = useState<string | null>(null)
	const [selectedStore, setSelectedStore] = useState<string | null>(null)

	const dayOfWeekData = useMemo(() => {
		return data.dayOfWeek.map((item) => ({
			...item,
			fill: CHART_COLORS[0],
		}))
	}, [data.dayOfWeek])

	const timeOfDayData = useMemo(() => {
		// Filter to only show store operating hours (7 AM - 10 PM)
		return data.timeOfDay
			.filter((item) => item.hour >= 7 && item.hour <= 22)
			.map((item) => ({
				...item,
				fill: CHART_COLORS[1],
			}))
	}, [data.timeOfDay])

	const incidentTypeData = useMemo(() => {
		return data.incidentTypes.map((item, index) => ({
			...item,
			fill: CHART_COLORS[index % CHART_COLORS.length],
		}))
	}, [data.incidentTypes])

	const handleDayClick = (day: string) => {
		if (selectedDay === day) {
			setSelectedDay(null)
			setSelectedStore(null)
		} else {
			setSelectedDay(day)
			setSelectedStore(null)
		}
	}

	const handleStoreClick = (storeName: string) => {
		setSelectedStore(storeName)
	}

	const filteredStores = useMemo(() => {
		if (!selectedDay) return []
		
		return Object.values(data.storeDrilldown).filter((store) => {
			// Filter stores that have incidents on the selected day
			// In a real implementation, this would come from the API
			return true // For now, show all stores
		})
	}, [selectedDay, data.storeDrilldown])

	const selectedStoreData = useMemo(() => {
		if (!selectedStore) return null
		return data.storeDrilldown[selectedStore] || null
	}, [selectedStore, data.storeDrilldown])

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Crime Trend Explorer</CardTitle>
					<CardDescription>Loading analytics data...</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card className="w-full shadow-sm border-2">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							Crime Trend Explorer
						</CardTitle>
						<CardDescription>
							Analyze crime patterns by day, time, and incident type
							{selectedDay && (
								<span className="ml-2">
									• Filtered by: <Badge>{selectedDay}</Badge>
								</span>
							)}
						</CardDescription>
					</div>
					{(selectedDay || selectedStore) && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSelectedDay(null)
								setSelectedStore(null)
							}}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Reset View
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="pt-6">
				{!selectedStore ? (
					<Tabs defaultValue="day-of-week" className="w-full">
						<TabsList className="grid w-full grid-cols-3 mb-6">
							<TabsTrigger value="day-of-week">Day of Week</TabsTrigger>
							<TabsTrigger value="time-of-day">Time of Day</TabsTrigger>
							<TabsTrigger value="incident-types">Incident Types</TabsTrigger>
						</TabsList>

						<TabsContent value="day-of-week" className="space-y-6 mt-6">
							<div className="h-[400px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={dayOfWeekData}>
										<CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
										<XAxis
											dataKey="day"
											className="text-xs"
											tick={{ fill: '#6b7280' }}
										/>
										<YAxis className="text-xs" tick={{ fill: '#6b7280' }} />
										<Tooltip
											contentStyle={{
												backgroundColor: '#fff',
												border: '1px solid #e5e7eb',
												borderRadius: '0.5rem',
											}}
										/>
										<Legend />
										<Bar
											dataKey="incidents"
											fill={CHART_COLORS[0]}
											name="Incidents"
											radius={[8, 8, 0, 0]}
											onClick={(data: any, index: number) => {
												if (data && data.day) {
													handleDayClick(data.day)
												}
											}}
											style={{ cursor: 'pointer' }}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>

							{selectedDay && filteredStores.length > 0 && (
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<MapPin className="h-4 w-4 text-gray-600" />
										<h3 className="font-semibold">
											Stores with incidents on {selectedDay}
										</h3>
									</div>
									<div className="border rounded-lg">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Store</TableHead>
													<TableHead>Incidents</TableHead>
													<TableHead>Peak Day</TableHead>
													<TableHead>Peak Hour</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredStores.map((store) => (
													<TableRow key={store.storeId}>
														<TableCell className="font-medium">
															{store.storeName}
														</TableCell>
														<TableCell>{store.incidents}</TableCell>
														<TableCell>
															<Badge variant="outline">{store.peakDay}</Badge>
														</TableCell>
														<TableCell>
															<Badge variant="outline">{store.peakHour}:00</Badge>
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleStoreClick(store.storeName)}
															>
																View Details
																<ChevronRight className="h-4 w-4 ml-1" />
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>
							)}

							{selectedDay && filteredStores.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									No store-level data available for {selectedDay}
								</div>
							)}
						</TabsContent>

						<TabsContent value="time-of-day" className="space-y-6 mt-6">
							<div className="h-[400px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={timeOfDayData}>
										<CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
										<XAxis
											dataKey="label"
											className="text-xs"
											tick={{ fill: '#6b7280' }}
											angle={-45}
											textAnchor="end"
											height={80}
										/>
										<YAxis className="text-xs" tick={{ fill: '#6b7280' }} />
										<Tooltip
											contentStyle={{
												backgroundColor: '#fff',
												border: '1px solid #e5e7eb',
												borderRadius: '0.5rem',
											}}
										/>
										<Legend />
										<Bar
											dataKey="incidents"
											fill={CHART_COLORS[1]}
											name="Incidents"
											radius={[8, 8, 0, 0]}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{timeOfDayData
									.sort((a, b) => b.incidents - a.incidents)
									.slice(0, 3)
									.map((item) => (
										<Card key={item.hour}>
											<CardHeader className="pb-2">
												<CardTitle className="text-sm font-medium flex items-center gap-2">
													<Clock className="h-4 w-4" />
													{item.label}
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="text-2xl font-bold">{item.incidents}</div>
												<p className="text-xs text-gray-500">
													{item.percentage.toFixed(1)}% of total
												</p>
											</CardContent>
										</Card>
									))}
							</div>
						</TabsContent>

						<TabsContent value="incident-types" className="space-y-6 mt-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<div className="h-[400px] w-full">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={incidentTypeData}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, percentage }) =>
													percentage > 5 ? `${name}: ${percentage.toFixed(1)}%` : ''
												}
												outerRadius={120}
												fill="#8884d8"
												dataKey="count"
											>
												{incidentTypeData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.fill} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													backgroundColor: '#fff',
													border: '1px solid #e5e7eb',
													borderRadius: '0.5rem',
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
								<div className="space-y-2">
									<h3 className="font-semibold mb-4">Incident Type Breakdown</h3>
									{incidentTypeData
										.sort((a, b) => b.count - a.count)
										.map((item, index) => (
											<Card key={item.type}>
												<CardContent className="p-4">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div
																className="w-4 h-4 rounded"
																style={{ backgroundColor: item.fill }}
															/>
															<span className="font-medium">{item.type}</span>
														</div>
														<div className="text-right">
															<div className="font-semibold">{item.count}</div>
															<div className="text-xs text-gray-500">
																{item.percentage.toFixed(1)}%
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
								</div>
							</div>
						</TabsContent>
					</Tabs>
				) : (
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSelectedStore(null)}
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Overview
							</Button>
						</div>
						{selectedStoreData && (
							<>
								<Card>
									<CardHeader>
										<CardTitle>{selectedStoreData.storeName}</CardTitle>
										<CardDescription>
											Detailed incident breakdown for this store
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
											<Card>
												<CardContent className="p-4">
													<div className="text-sm text-gray-500">Total Incidents</div>
													<div className="text-2xl font-bold">
														{selectedStoreData.incidents}
													</div>
												</CardContent>
											</Card>
											<Card>
												<CardContent className="p-4">
													<div className="text-sm text-gray-500">Peak Day</div>
													<div className="text-2xl font-bold">
														{selectedStoreData.peakDay}
													</div>
												</CardContent>
											</Card>
											<Card>
												<CardContent className="p-4">
													<div className="text-sm text-gray-500">Peak Hour</div>
													<div className="text-2xl font-bold">
														{selectedStoreData.peakHour}:00
													</div>
												</CardContent>
											</Card>
										</div>
										<div>
											<h3 className="font-semibold mb-4">Incident Types</h3>
											<div className="border rounded-lg">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Type</TableHead>
															<TableHead>Count</TableHead>
															<TableHead>Percentage</TableHead>
															<TableHead className="text-right">Total Value</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{selectedStoreData.incidentTypes.map((type) => (
															<TableRow key={type.type}>
																<TableCell className="font-medium">{type.type}</TableCell>
																<TableCell>{type.count}</TableCell>
																<TableCell>
																	{type.percentage.toFixed(1)}%
																</TableCell>
																<TableCell className="text-right">
																	£{type.totalValue.toFixed(2)}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>
									</CardContent>
								</Card>
							</>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}

