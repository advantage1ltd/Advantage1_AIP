/**
 * Hot Products Dashboard Module
 * 
 * Displays barcode frequency charts, value lost per product,
 * and store-level heatmaps for stolen items.
 */

import { useMemo, useState, useEffect } from 'react'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell,
} from 'recharts'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { HotProductsData } from '@/types/analytics'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, TrendingUp, AlertTriangle, DollarSign, Search, Filter, ChevronDown, ChevronUp, MapPin, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'

interface HotProductsDashboardProps {
	data: HotProductsData
	loading?: boolean
}

const RISK_COLORS = {
	low: '#10b981', // green
	medium: '#f59e0b', // amber
	high: '#ef4444', // red
	critical: '#dc2626', // dark red
}

const CHART_COLORS = [
	'#3b82f6',
	'#10b981',
	'#f59e0b',
	'#ef4444',
	'#8b5cf6',
	'#ec4899',
	'#14b8a6',
	'#f97316',
]

const getRiskColor = (riskLevel: string) => {
	return RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.low
}

export const HotProductsDashboard = ({
	data,
	loading = false,
}: HotProductsDashboardProps) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [riskFilter, setRiskFilter] = useState<string>('all')
	const [expandedStores, setExpandedStores] = useState<Set<number>>(new Set())
	const [viewMode, setViewMode] = useState<'grid' | 'table' | 'heatmap'>('heatmap')
	const [currentPage, setCurrentPage] = useState(1)
	const STORES_PER_PAGE = 12

	const topProductsChartData = useMemo(() => {
		return data.topProducts.slice(0, 10).map((product, index) => ({
			...product,
			fill: CHART_COLORS[index % CHART_COLORS.length],
		}))
	}, [data.topProducts])

	const sortedStores = useMemo(() => {
		return [...data.storeHeatmap].sort(
			(a, b) => b.totalIncidents - a.totalIncidents
		)
	}, [data.storeHeatmap])

	const filteredStores = useMemo(() => {
		let filtered = sortedStores

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter((store) =>
				store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				store.products.some((p) =>
					p.productName.toLowerCase().includes(searchTerm.toLowerCase())
				)
			)
		}

		// Filter by risk level
		if (riskFilter !== 'all') {
			filtered = filtered.filter((store) => store.riskLevel === riskFilter)
		}

		return filtered
	}, [sortedStores, searchTerm, riskFilter])

	// Pagination calculations
	const totalPages = Math.ceil(filteredStores.length / STORES_PER_PAGE)
	const startIndex = (currentPage - 1) * STORES_PER_PAGE
	const endIndex = startIndex + STORES_PER_PAGE
	const paginatedStores = filteredStores.slice(startIndex, endIndex)

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [searchTerm, riskFilter])

	const toggleStoreExpansion = (storeId: number) => {
		const newExpanded = new Set(expandedStores)
		if (newExpanded.has(storeId)) {
			newExpanded.delete(storeId)
		} else {
			newExpanded.add(storeId)
		}
		setExpandedStores(newExpanded)
	}

	// Calculate heatmap intensity (0-100)
	const getHeatmapIntensity = (store: typeof sortedStores[0]) => {
		const maxIncidents = Math.max(...sortedStores.map((s) => s.totalIncidents))
		return maxIncidents > 0 ? (store.totalIncidents / maxIncidents) * 100 : 0
	}

	const getHeatmapColor = (intensity: number, riskLevel: string) => {
		if (riskLevel === 'critical') return `rgba(220, 38, 38, ${Math.max(0.8, intensity / 100)})`
		if (riskLevel === 'high') return `rgba(239, 68, 68, ${Math.max(0.7, intensity / 120)})`
		if (riskLevel === 'medium') return `rgba(245, 158, 11, ${Math.max(0.6, intensity / 140)})`
		return `rgba(16, 185, 129, ${Math.max(0.4, intensity / 160)})`
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Hot Products Dashboard</CardTitle>
					<CardDescription>Loading product analytics...</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card className="w-full shadow-sm border-2">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2">
					<Package className="h-5 w-5" />
					Hot Products Dashboard
				</CardTitle>
				<CardDescription>
					Barcode frequency, value lost per product, and store-level heatmap
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-6 space-y-8">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-500">Total Value Lost</p>
									<p className="text-2xl font-bold">
										£{data.totalValueLost.toLocaleString('en-GB', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</p>
								</div>
								<DollarSign className="h-8 w-8 text-gray-400" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-500">Top Products Tracked</p>
									<p className="text-2xl font-bold">{data.topProducts.length}</p>
								</div>
								<TrendingUp className="h-8 w-8 text-gray-400" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-500">Stores Affected</p>
									<p className="text-2xl font-bold">{data.storeHeatmap.length}</p>
								</div>
								<AlertTriangle className="h-8 w-8 text-gray-400" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Barcode Frequency Chart */}
				<div>
					<h3 className="font-semibold mb-4">Top 10 Products by Frequency</h3>
					<div className="h-[400px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={topProductsChartData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
								<XAxis type="number" className="text-xs" tick={{ fill: '#6b7280' }} />
								<YAxis
									type="category"
									dataKey="productName"
									className="text-xs"
									tick={{ fill: '#6b7280' }}
									width={200}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: '#fff',
										border: '1px solid #e5e7eb',
										borderRadius: '0.5rem',
									}}
								/>
								<Legend />
								<Bar dataKey="frequency" name="Incidents" radius={[0, 8, 8, 0]}>
									{topProductsChartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.fill} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Value Lost Table */}
				<div className="pt-4">
					<h3 className="font-semibold mb-6">Value Lost per Product</h3>
					<div className="border rounded-lg">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Product Name</TableHead>
									<TableHead>Barcode</TableHead>
									<TableHead>Frequency</TableHead>
									<TableHead>Stores Affected</TableHead>
									<TableHead className="text-right">Total Value Lost</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.topProducts
									.sort((a, b) => b.totalValue - a.totalValue)
									.map((product) => (
										<TableRow key={product.barcode}>
											<TableCell className="font-medium">
												{product.productName}
											</TableCell>
											<TableCell className="font-mono text-xs">
												{product.barcode}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{product.frequency}</Badge>
											</TableCell>
											<TableCell>{product.storesAffected}</TableCell>
											<TableCell className="text-right font-semibold">
												£{product.totalValue.toLocaleString('en-GB', {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
					</div>
				</div>

				{/* Store Heatmap */}
				<div className="pt-4 border-t mt-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
						<h3 className="font-semibold flex items-center gap-2">
							<MapPin className="h-5 w-5" />
							Store-Level Heatmap
						</h3>
						<div className="flex flex-col sm:flex-row gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									placeholder="Search stores or products..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 w-full sm:w-64"
								/>
							</div>
							<Select value={riskFilter} onValueChange={setRiskFilter}>
								<SelectTrigger className="w-full sm:w-40">
									<Filter className="h-4 w-4 mr-2" />
									<SelectValue placeholder="All Risk Levels" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Risk Levels</SelectItem>
									<SelectItem value="critical">Critical</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="low">Low</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="heatmap">Heatmap View</TabsTrigger>
							<TabsTrigger value="grid">Grid View</TabsTrigger>
							<TabsTrigger value="table">Table View</TabsTrigger>
						</TabsList>

						<TabsContent value="heatmap" className="space-y-4">
							{/* Visual Heatmap Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{paginatedStores.map((store) => {
									const intensity = getHeatmapIntensity(store)
									const heatmapColor = getHeatmapColor(intensity, store.riskLevel)
									const totalValue = store.products.reduce((sum, p) => sum + p.value, 0)
									const isExpanded = expandedStores.has(store.storeId)

									return (
										<Card
											key={store.storeId}
											className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
											onClick={() => toggleStoreExpansion(store.storeId)}
										>
											<div
												className="relative p-4 text-white"
												style={{
													backgroundColor: heatmapColor,
													backgroundImage: `linear-gradient(135deg, ${heatmapColor} 0%, ${heatmapColor.replace(')', ', 0.9)').replace('rgba', 'rgba')} 100%)`,
												}}
											>
												<div className="relative z-10">
													<div className="flex items-start justify-between mb-2">
														<CardTitle className="text-base text-white">
															{store.storeName}
														</CardTitle>
														<Badge
															variant="secondary"
															className="bg-white/20 text-white border-white/30"
														>
															{store.riskLevel.toUpperCase()}
														</Badge>
													</div>
													<div className="grid grid-cols-2 gap-2 text-sm">
														<div>
															<div className="text-white/80 text-xs">Incidents</div>
															<div className="font-bold">{store.totalIncidents}</div>
														</div>
														<div>
															<div className="text-white/80 text-xs">Value Lost</div>
															<div className="font-bold">£{totalValue.toFixed(0)}</div>
														</div>
														<div>
															<div className="text-white/80 text-xs">Products</div>
															<div className="font-bold">{store.products.length}</div>
														</div>
														<div>
															<div className="text-white/80 text-xs">Intensity</div>
															<div className="font-bold">{intensity.toFixed(0)}%</div>
														</div>
													</div>
												</div>
											</div>
											{isExpanded && (
												<CardContent className="p-4 border-t">
													<div className="space-y-2">
														<div className="text-xs font-semibold text-gray-600 mb-2">
															Top Products:
														</div>
														{store.products
															.sort((a, b) => b.frequency - a.frequency)
															.slice(0, 5)
															.map((product) => (
																<div
																	key={product.barcode}
																	className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
																>
																	<div className="flex-1 min-w-0">
																		<div className="font-medium truncate">
																			{product.productName}
																		</div>
																		<div className="text-gray-500 truncate">
																			{product.barcode}
																		</div>
																	</div>
																	<div className="text-right ml-2">
																		<div className="font-semibold">{product.frequency}×</div>
																		<div className="text-gray-600">£{product.value.toFixed(0)}</div>
																	</div>
																</div>
															))}
													</div>
													<Button
														variant="ghost"
														size="sm"
														className="w-full mt-3"
														onClick={(e) => {
															e.stopPropagation()
															toggleStoreExpansion(store.storeId)
														}}
													>
														<EyeOff className="h-4 w-4 mr-2" />
														Collapse
													</Button>
												</CardContent>
											)}
											{!isExpanded && (
												<div className="p-2 text-center border-t">
													<Button variant="ghost" size="sm" className="text-xs">
														<Eye className="h-4 w-4 mr-1" />
														View Details
													</Button>
												</div>
											)}
										</Card>
									)
								})}
							</div>
							{filteredStores.length === 0 && (
								<div className="text-center py-12 text-gray-500">
									<MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
									<p>No stores found matching your filters</p>
								</div>
							)}
							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
									<div className="text-sm text-gray-600">
										Showing {startIndex + 1} to {Math.min(endIndex, filteredStores.length)} of {filteredStores.length} stores
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage - 1)}
											disabled={currentPage === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											Previous
										</Button>
										<div className="flex items-center gap-1">
											{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
												let pageNumber: number
												if (totalPages <= 5) {
													pageNumber = i + 1
												} else if (currentPage <= 3) {
													pageNumber = i + 1
												} else if (currentPage >= totalPages - 2) {
													pageNumber = totalPages - 4 + i
												} else {
													pageNumber = currentPage - 2 + i
												}
												return (
													<Button
														key={pageNumber}
														variant={currentPage === pageNumber ? "default" : "outline"}
														size="sm"
														onClick={() => setCurrentPage(pageNumber)}
														className="h-8 w-8 p-0"
													>
														{pageNumber}
													</Button>
												)
											})}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage + 1)}
											disabled={currentPage === totalPages}
										>
											Next
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</TabsContent>

						<TabsContent value="grid" className="space-y-4">
							<div className="space-y-4">
								{paginatedStores.map((store) => {
									const isExpanded = expandedStores.has(store.storeId)
									const totalValue = store.products.reduce((sum, p) => sum + p.value, 0)

									return (
										<Card key={store.storeId}>
											<CardHeader className="pb-3">
												<div className="flex items-center justify-between">
													<CardTitle className="text-base">{store.storeName}</CardTitle>
													<div className="flex items-center gap-3">
														<div className="text-right">
															<div className="text-sm font-semibold">{store.totalIncidents} incidents</div>
															<div className="text-xs text-gray-500">£{totalValue.toFixed(2)} lost</div>
														</div>
														<Badge
															variant="outline"
															style={{
																borderColor: getRiskColor(store.riskLevel),
																color: getRiskColor(store.riskLevel),
															}}
														>
															{store.riskLevel.toUpperCase()}
														</Badge>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => toggleStoreExpansion(store.storeId)}
														>
															{isExpanded ? (
																<ChevronUp className="h-4 w-4" />
															) : (
																<ChevronDown className="h-4 w-4" />
															)}
														</Button>
													</div>
												</div>
											</CardHeader>
											{isExpanded && (
												<CardContent>
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
														{store.products
															.sort((a, b) => b.frequency - a.frequency)
															.map((product) => (
																<div
																	key={product.barcode}
																	className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
																>
																	<div className="font-medium text-sm mb-1">
																		{product.productName}
																	</div>
																	<div className="text-xs text-gray-500 mb-2 font-mono">
																		{product.barcode}
																	</div>
																	<div className="flex items-center justify-between">
																		<span className="text-xs text-gray-600">
																			{product.frequency} ×
																		</span>
																		<span className="text-xs font-semibold">
																			£{product.value.toFixed(2)}
																		</span>
																	</div>
																</div>
															))}
													</div>
												</CardContent>
											)}
										</Card>
									)
								})}
							</div>
							{filteredStores.length === 0 && (
								<div className="text-center py-12 text-gray-500">
									<MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
									<p>No stores found matching your filters</p>
								</div>
							)}
							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
									<div className="text-sm text-gray-600">
										Showing {startIndex + 1} to {Math.min(endIndex, filteredStores.length)} of {filteredStores.length} stores
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage - 1)}
											disabled={currentPage === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											Previous
										</Button>
										<div className="flex items-center gap-1">
											{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
												let pageNumber: number
												if (totalPages <= 5) {
													pageNumber = i + 1
												} else if (currentPage <= 3) {
													pageNumber = i + 1
												} else if (currentPage >= totalPages - 2) {
													pageNumber = totalPages - 4 + i
												} else {
													pageNumber = currentPage - 2 + i
												}
												return (
													<Button
														key={pageNumber}
														variant={currentPage === pageNumber ? "default" : "outline"}
														size="sm"
														onClick={() => setCurrentPage(pageNumber)}
														className="h-8 w-8 p-0"
													>
														{pageNumber}
													</Button>
												)
											})}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage + 1)}
											disabled={currentPage === totalPages}
										>
											Next
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</TabsContent>

						<TabsContent value="table" className="space-y-4">
							<div className="border rounded-lg">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Store</TableHead>
											<TableHead>Risk Level</TableHead>
											<TableHead>Incidents</TableHead>
											<TableHead>Products Affected</TableHead>
											<TableHead className="text-right">Total Value Lost</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedStores.map((store) => {
											const totalValue = store.products.reduce((sum, p) => sum + p.value, 0)
											const isExpanded = expandedStores.has(store.storeId)

											return (
												<>
													<TableRow key={store.storeId}>
														<TableCell className="font-medium">{store.storeName}</TableCell>
														<TableCell>
															<Badge
																variant="outline"
																style={{
																	borderColor: getRiskColor(store.riskLevel),
																	color: getRiskColor(store.riskLevel),
																}}
															>
																{store.riskLevel.toUpperCase()}
															</Badge>
														</TableCell>
														<TableCell>{store.totalIncidents}</TableCell>
														<TableCell>{store.products.length}</TableCell>
														<TableCell className="text-right font-semibold">
															£{totalValue.toLocaleString('en-GB', {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => toggleStoreExpansion(store.storeId)}
															>
																{isExpanded ? (
																	<>
																		<EyeOff className="h-4 w-4 mr-2" />
																		Hide
																	</>
																) : (
																	<>
																		<Eye className="h-4 w-4 mr-2" />
																		View Products
																	</>
																)}
															</Button>
														</TableCell>
													</TableRow>
													{isExpanded && (
														<TableRow>
															<TableCell colSpan={6} className="bg-gray-50">
																<div className="p-4">
																	<div className="text-sm font-semibold mb-3">Products:</div>
																	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
																		{store.products
																			.sort((a, b) => b.frequency - a.frequency)
																			.map((product) => (
																				<div
																					key={product.barcode}
																					className="p-3 bg-white border rounded-lg"
																				>
																					<div className="font-medium text-sm mb-1">
																						{product.productName}
																					</div>
																					<div className="text-xs text-gray-500 mb-2 font-mono">
																						{product.barcode}
																					</div>
																					<div className="flex items-center justify-between text-xs">
																						<span className="text-gray-600">
																							{product.frequency} ×
																						</span>
																						<span className="font-semibold">
																							£{product.value.toFixed(2)}
																						</span>
																					</div>
																				</div>
																			))}
																	</div>
																</div>
															</TableCell>
														</TableRow>
													)}
												</>
											)
										})}
									</TableBody>
								</Table>
							</div>
							{filteredStores.length === 0 && (
								<div className="text-center py-12 text-gray-500">
									<MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
									<p>No stores found matching your filters</p>
								</div>
							)}
							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
									<div className="text-sm text-gray-600">
										Showing {startIndex + 1} to {Math.min(endIndex, filteredStores.length)} of {filteredStores.length} stores
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage - 1)}
											disabled={currentPage === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											Previous
										</Button>
										<div className="flex items-center gap-1">
											{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
												let pageNumber: number
												if (totalPages <= 5) {
													pageNumber = i + 1
												} else if (currentPage <= 3) {
													pageNumber = i + 1
												} else if (currentPage >= totalPages - 2) {
													pageNumber = totalPages - 4 + i
												} else {
													pageNumber = currentPage - 2 + i
												}
												return (
													<Button
														key={pageNumber}
														variant={currentPage === pageNumber ? "default" : "outline"}
														size="sm"
														onClick={() => setCurrentPage(pageNumber)}
														className="h-8 w-8 p-0"
													>
														{pageNumber}
													</Button>
												)
											})}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage + 1)}
											disabled={currentPage === totalPages}
										>
											Next
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</CardContent>
		</Card>
	)
}

