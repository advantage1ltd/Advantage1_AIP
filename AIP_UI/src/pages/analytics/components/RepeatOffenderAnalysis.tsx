/**
 * Repeat Offender Analysis Module
 * 
 * Displays most active offenders, cross-store movement patterns,
 * and offender network map visualization.
 */

import { useMemo, useState } from 'react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RepeatOffenderData } from '@/types/analytics'
import {
	Users,
	MapPin,
	Network,
	ArrowRight,
	AlertTriangle,
	TrendingUp,
} from 'lucide-react'

interface RepeatOffenderAnalysisProps {
	data: RepeatOffenderData
	loading?: boolean
}

const RISK_COLORS = {
	low: '#10b981',
	medium: '#f59e0b',
	high: '#ef4444',
	critical: '#dc2626',
}

const getRiskColor = (riskLevel: string) => {
	return RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.low
}

export const RepeatOffenderAnalysis = ({
	data,
	loading = false,
}: RepeatOffenderAnalysisProps) => {
	const [selectedOffenderId, setSelectedOffenderId] = useState<string | null>(null)

	const selectedOffender = useMemo(() => {
		if (!selectedOffenderId) return null
		return data.mostActive.find((o) => o.offenderId === selectedOffenderId) || null
	}, [selectedOffenderId, data.mostActive])

	const selectedOffenderMovements = useMemo(() => {
		if (!selectedOffenderId) return null
		return data.crossStoreMovements.find((m) => m.offenderId === selectedOffenderId) || null
	}, [selectedOffenderId, data.crossStoreMovements])

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Repeat Offender Analysis</CardTitle>
					<CardDescription>Loading offender data...</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card className="w-full shadow-sm border-2">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					Repeat Offender Analysis
				</CardTitle>
				<CardDescription>
					Track most active offenders, cross-store movements, and network patterns
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-6">
				<Tabs defaultValue="offenders" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="offenders">Most Active</TabsTrigger>
						<TabsTrigger value="movements">Cross-Store Movement</TabsTrigger>
						<TabsTrigger value="network">Network Map</TabsTrigger>
					</TabsList>

					<TabsContent value="offenders" className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
							<Card>
								<CardContent className="p-4">
									<div className="text-sm text-gray-500">Total Offenders</div>
									<div className="text-2xl font-bold">{data.totalOffenders}</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4">
									<div className="text-sm text-gray-500">High Risk</div>
									<div className="text-2xl font-bold text-red-600">
										{data.mostActive.filter((o) => o.riskLevel === 'high' || o.riskLevel === 'critical').length}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4">
									<div className="text-sm text-gray-500">Multi-Store</div>
									<div className="text-2xl font-bold">
										{data.mostActive.filter((o) => o.storesTargeted.length > 2).length}
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Offender ID</TableHead>
										<TableHead>Incidents</TableHead>
										<TableHead>Stores Targeted</TableHead>
										<TableHead>Total Value</TableHead>
										<TableHead>Risk Level</TableHead>
										<TableHead>Last Incident</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.mostActive.map((offender) => (
										<TableRow key={offender.offenderId}>
											<TableCell className="font-medium font-mono">
												{offender.offenderId}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{offender.incidentCount}</Badge>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{offender.storesTargeted.slice(0, 3).map((store) => (
														<Badge key={store} variant="secondary" className="text-xs">
															{store}
														</Badge>
													))}
													{offender.storesTargeted.length > 3 && (
														<Badge variant="secondary" className="text-xs">
															+{offender.storesTargeted.length - 3}
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												£{offender.totalValue.toFixed(2)}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													style={{
														borderColor: getRiskColor(offender.riskLevel),
														color: getRiskColor(offender.riskLevel),
													}}
												>
													{offender.riskLevel.toUpperCase()}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-gray-500">
												{new Date(offender.lastIncident).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setSelectedOffenderId(offender.offenderId)}
												>
													View Details
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{selectedOffender && (
							<Card className="mt-4">
								<CardHeader>
									<CardTitle>{selectedOffender.name}</CardTitle>
									<CardDescription>Detailed offender profile</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div>
											<div className="text-sm text-gray-500">Incident Count</div>
											<div className="text-xl font-bold">{selectedOffender.incidentCount}</div>
										</div>
										<div>
											<div className="text-sm text-gray-500">Stores Targeted</div>
											<div className="text-xl font-bold">{selectedOffender.storesTargeted.length}</div>
										</div>
										<div>
											<div className="text-sm text-gray-500">Total Value</div>
											<div className="text-xl font-bold">
												£{selectedOffender.totalValue.toFixed(2)}
											</div>
										</div>
										<div>
											<div className="text-sm text-gray-500">Risk Level</div>
											<Badge
												variant="outline"
												style={{
													borderColor: getRiskColor(selectedOffender.riskLevel),
													color: getRiskColor(selectedOffender.riskLevel),
												}}
											>
												{selectedOffender.riskLevel.toUpperCase()}
											</Badge>
										</div>
									</div>
									<div>
										<div className="text-sm text-gray-500 mb-2">Stores Targeted</div>
										<div className="flex flex-wrap gap-2">
											{selectedOffender.storesTargeted.map((store) => (
												<Badge key={store} variant="secondary">
													{store}
												</Badge>
											))}
										</div>
									</div>
									<div>
										<div className="text-sm text-gray-500 mb-2">Modus Operandi</div>
										<div className="flex flex-wrap gap-2">
											{selectedOffender.modusOperandi.map((mo) => (
												<Badge key={mo} variant="outline">
													{mo}
												</Badge>
											))}
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<div className="text-sm text-gray-500">First Incident</div>
											<div className="font-medium">
												{new Date(selectedOffender.firstIncident).toLocaleDateString()}
											</div>
										</div>
										<div>
											<div className="text-sm text-gray-500">Last Incident</div>
											<div className="font-medium">
												{new Date(selectedOffender.lastIncident).toLocaleDateString()}
											</div>
										</div>
									</div>
									<Button
										variant="outline"
										onClick={() => setSelectedOffenderId(null)}
									>
										Close Details
									</Button>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="movements" className="space-y-6 mt-6">
						{data.crossStoreMovements.map((movement) => (
							<Card key={movement.offenderId}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div>
											<CardTitle className="text-base">{movement.offenderName}</CardTitle>
											<CardDescription>{movement.offenderId}</CardDescription>
										</div>
										<Badge variant="outline">
											{movement.totalStores} stores
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{movement.movements.map((move, index) => (
											<div
												key={index}
												className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
											>
												<div className="flex items-center gap-2 flex-1">
													<MapPin className="h-4 w-4 text-gray-400" />
													<span className="font-medium">{move.fromStore}</span>
												</div>
												<ArrowRight className="h-4 w-4 text-gray-400" />
												<div className="flex items-center gap-2 flex-1">
													<MapPin className="h-4 w-4 text-gray-400" />
													<span className="font-medium">{move.toStore}</span>
												</div>
												<div className="text-sm text-gray-500">
													{new Date(move.date).toLocaleDateString()}
												</div>
												<Badge variant="secondary" className="text-xs">
													{move.incidentType}
												</Badge>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</TabsContent>

					<TabsContent value="network" className="space-y-6 mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Network className="h-5 w-5" />
									Offender Network Visualization
								</CardTitle>
								<CardDescription>
									Visual representation of connections between offenders and stores
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="relative border rounded-lg bg-gray-50 min-h-[500px] flex items-center justify-center">
									<div className="text-center space-y-2">
										<Network className="h-12 w-12 mx-auto text-gray-400" />
										<p className="text-gray-500">
											Network map visualization
										</p>
										<p className="text-sm text-gray-400">
											{data.networkMap.nodes.length} nodes, {data.networkMap.links.length} connections
										</p>
										<div className="mt-4 space-y-2">
											<div className="flex items-center justify-center gap-4">
												<div className="flex items-center gap-2">
													<div className="w-3 h-3 rounded-full bg-blue-500" />
													<span className="text-sm">Offenders</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-3 h-3 rounded-full bg-green-500" />
													<span className="text-sm">Stores</span>
												</div>
											</div>
											<p className="text-xs text-gray-400 mt-4">
												Interactive network visualization will be implemented with a graph library
											</p>
										</div>
									</div>
								</div>
								<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
									<Card>
										<CardContent className="p-4">
											<div className="text-sm text-gray-500">Total Nodes</div>
											<div className="text-2xl font-bold">{data.networkMap.nodes.length}</div>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="p-4">
											<div className="text-sm text-gray-500">Total Connections</div>
											<div className="text-2xl font-bold">{data.networkMap.links.length}</div>
										</CardContent>
									</Card>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	)
}

