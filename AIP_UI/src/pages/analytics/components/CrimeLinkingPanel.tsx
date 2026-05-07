/**
 * Crime Linking Panel Module
 * 
 * Displays incident clusters linked to same offender/features
 * and chains of incidents showing patterns.
 */

import { useState, useMemo } from 'react'
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
import type { CrimeLinkingData } from '@/types/analytics'
import {
	Link as LinkIcon,
	Network,
	ArrowRight,
	Calendar,
	MapPin,
	DollarSign,
	Eye,
	EyeOff,
} from 'lucide-react'

interface CrimeLinkingPanelProps {
	data: CrimeLinkingData
	loading?: boolean
}

export const CrimeLinkingPanel = ({
	data,
	loading = false,
}: CrimeLinkingPanelProps) => {
	const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set())
	const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set())

	const toggleCluster = (clusterId: string) => {
		const newExpanded = new Set(expandedClusters)
		if (newExpanded.has(clusterId)) {
			newExpanded.delete(clusterId)
		} else {
			newExpanded.add(clusterId)
		}
		setExpandedClusters(newExpanded)
	}

	const toggleChain = (chainId: string) => {
		const newExpanded = new Set(expandedChains)
		if (newExpanded.has(chainId)) {
			newExpanded.delete(chainId)
		} else {
			newExpanded.add(chainId)
		}
		setExpandedChains(newExpanded)
	}

	const sortedClusters = useMemo(() => {
		return [...data.clusters].sort((a, b) => b.incidents.length - a.incidents.length)
	}, [data.clusters])

	const sortedChains = useMemo(() => {
		return [...data.offenderChains].sort((a, b) => b.incidents.length - a.incidents.length)
	}, [data.offenderChains])

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Crime Linking Panel</CardTitle>
					<CardDescription>Loading crime linking data...</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card className="w-full shadow-sm border-2">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2">
					<LinkIcon className="h-5 w-5" />
					Crime Linking Panel
				</CardTitle>
				<CardDescription>
					Cluster incidents linked to same offender/features and see chains of incidents
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-6">
				{/* Summary */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<Card>
						<CardContent className="p-4">
							<div className="text-sm text-gray-500">Total Clusters</div>
							<div className="text-2xl font-bold">{data.clusters.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="text-sm text-gray-500">Offender Chains</div>
							<div className="text-2xl font-bold">{data.offenderChains.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="text-sm text-gray-500">Linked Incidents</div>
							<div className="text-2xl font-bold">{data.totalLinkedIncidents}</div>
						</CardContent>
					</Card>
				</div>

				<Tabs defaultValue="clusters" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="clusters">Incident Clusters</TabsTrigger>
						<TabsTrigger value="chains">Offender Chains</TabsTrigger>
					</TabsList>

					<TabsContent value="clusters" className="space-y-4">
						{sortedClusters.map((cluster) => {
							const isExpanded = expandedClusters.has(cluster.clusterId)

							return (
								<Card key={cluster.clusterId}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<CardTitle className="text-base">{cluster.clusterId}</CardTitle>
												<CardDescription>
													{cluster.incidents.length} linked incidents •{' '}
													{new Date(cluster.dateRange.start).toLocaleDateString()} -{' '}
													{new Date(cluster.dateRange.end).toLocaleDateString()}
												</CardDescription>
											</div>
											<div className="flex items-center gap-2">
												{cluster.suspectedOffender && (
													<Badge variant="outline">
														{cluster.suspectedOffender.name} (
														{(cluster.suspectedOffender.confidence * 100).toFixed(0)}% confidence)
													</Badge>
												)}
												<Badge variant="secondary">
													£{cluster.totalValue.toFixed(2)}
												</Badge>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => toggleCluster(cluster.clusterId)}
												>
													{isExpanded ? (
														<>
															<EyeOff className="h-4 w-4 mr-2" />
															Hide
														</>
													) : (
														<>
															<Eye className="h-4 w-4 mr-2" />
															View Details
														</>
													)}
												</Button>
											</div>
										</div>
									</CardHeader>
									{isExpanded && (
										<CardContent className="space-y-4">
											<div>
												<h4 className="font-semibold mb-2">Common Features</h4>
												<div className="flex flex-wrap gap-2">
													{cluster.commonFeatures.map((feature) => (
														<Badge key={feature} variant="outline">
															{feature}
														</Badge>
													))}
												</div>
											</div>
											<div>
												<h4 className="font-semibold mb-2">Linked Incidents</h4>
												<div className="border rounded-lg">
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Incident ID</TableHead>
																<TableHead>Date</TableHead>
																<TableHead>Store</TableHead>
																<TableHead>Type</TableHead>
																<TableHead>Value</TableHead>
																<TableHead>Similarity</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{cluster.incidents.map((incident) => (
																<TableRow key={incident.incidentId}>
																	<TableCell className="font-mono text-xs">
																		{incident.incidentId}
																	</TableCell>
																	<TableCell>
																		{new Date(incident.date).toLocaleDateString()}
																	</TableCell>
																	<TableCell>{incident.storeName}</TableCell>
																	<TableCell>
																		<Badge variant="secondary" className="text-xs">
																			{incident.incidentType}
																		</Badge>
																	</TableCell>
																	<TableCell>£{incident.value.toFixed(2)}</TableCell>
																	<TableCell>
																		<Badge variant="outline">
																			{(incident.similarityScore * 100).toFixed(0)}%
																		</Badge>
																	</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											</div>
										</CardContent>
									)}
								</Card>
							)
						})}
					</TabsContent>

					<TabsContent value="chains" className="space-y-6 mt-6">
						{sortedChains.map((chain) => {
							const isExpanded = expandedChains.has(chain.chainId)

							return (
								<Card key={chain.chainId}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<CardTitle className="text-base">{chain.offenderName}</CardTitle>
												<CardDescription>
													{chain.chainId} • {chain.incidents.length} incidents • Pattern:{' '}
													{chain.pattern}
												</CardDescription>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="secondary">
													£{chain.totalValue.toFixed(2)}
												</Badge>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => toggleChain(chain.chainId)}
												>
													{isExpanded ? (
														<>
															<EyeOff className="h-4 w-4 mr-2" />
															Hide Timeline
														</>
													) : (
														<>
															<Eye className="h-4 w-4 mr-2" />
															View Timeline
														</>
													)}
												</Button>
											</div>
										</div>
									</CardHeader>
									{isExpanded && (
										<CardContent className="space-y-4">
											{/* Timeline */}
											<div>
												<h4 className="font-semibold mb-3">Incident Timeline</h4>
												<div className="space-y-2">
													{chain.timeline.map((event, index) => (
														<div
															key={index}
															className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
														>
															<div className="flex items-center gap-2 text-sm text-gray-500 min-w-[100px]">
																<Calendar className="h-4 w-4" />
																{new Date(event.date).toLocaleDateString()}
															</div>
															<ArrowRight className="h-4 w-4 text-gray-400" />
															<div className="flex items-center gap-2 flex-1">
																<MapPin className="h-4 w-4 text-gray-400" />
																<span className="font-medium">{event.store}</span>
															</div>
															<Badge variant="outline" className="text-xs">
																{event.incidentType}
															</Badge>
														</div>
													))}
												</div>
											</div>

											{/* Detailed Incidents */}
											<div>
												<h4 className="font-semibold mb-2">All Incidents</h4>
												<div className="border rounded-lg">
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Incident ID</TableHead>
																<TableHead>Date</TableHead>
																<TableHead>Store</TableHead>
																<TableHead>Type</TableHead>
																<TableHead className="text-right">Value</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{chain.incidents.map((incident) => (
																<TableRow key={incident.incidentId}>
																	<TableCell className="font-mono text-xs">
																		{incident.incidentId}
																	</TableCell>
																	<TableCell>
																		{new Date(incident.date).toLocaleDateString()}
																	</TableCell>
																	<TableCell>{incident.storeName}</TableCell>
																	<TableCell>
																		<Badge variant="secondary" className="text-xs">
																			{incident.incidentType}
																		</Badge>
																	</TableCell>
																	<TableCell className="text-right">
																		£{incident.value.toFixed(2)}
																	</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											</div>
										</CardContent>
									)}
								</Card>
							)
						})}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	)
}

