/**
 * Resource Deployment Engine Module
 * 
 * Displays best time/day recommendations for officer deployment,
 * officer type suggestions (uniform / store detectives), LPM recommendations, and store risk rankings.
 */

import { useMemo } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DeploymentRecommendation } from '@/types/analytics'
import {
	Shield,
	Clock,
	MapPin,
	TrendingUp,
	TrendingDown,
	Minus,
	AlertTriangle,
	Users,
} from 'lucide-react'

interface ResourceDeploymentEngineProps {
	data: DeploymentRecommendation
	loading?: boolean
}

const PRIORITY_COLORS = {
	low: '#10b981',
	medium: '#f59e0b',
	high: '#ef4444',
	critical: '#dc2626',
}

const RISK_COLORS = {
	low: '#10b981',
	medium: '#f59e0b',
	high: '#ef4444',
	critical: '#dc2626',
}

const OFFICER_TYPE_COLORS = {
	uniform: '#10b981',
	'store detectives': '#8b5cf6',
}

const LPM_COLOR = '#3b82f6'

const getPriorityColor = (priority: string) => {
	return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low
}

const getRiskColor = (riskLevel: string) => {
	return RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.low
}

const getTrendIcon = (trend: string) => {
	switch (trend) {
		case 'increasing':
			return <TrendingUp className="h-4 w-4 text-red-500" />
		case 'decreasing':
			return <TrendingDown className="h-4 w-4 text-green-500" />
		default:
			return <Minus className="h-4 w-4 text-gray-500" />
	}
}

export const ResourceDeploymentEngine = ({
	data,
	loading = false,
}: ResourceDeploymentEngineProps) => {
	const criticalRecommendations = useMemo(() => {
		return data.bestTimes
			.filter((r) => r.priority === 'critical')
			.sort((a, b) => b.expectedIncidents - a.expectedIncidents)
	}, [data.bestTimes])

	const highPriorityRecommendations = useMemo(() => {
		return data.bestTimes
			.filter((r) => r.priority === 'high')
			.sort((a, b) => b.expectedIncidents - a.expectedIncidents)
	}, [data.bestTimes])

	const recommendationsByDay = useMemo(() => {
		const grouped: Record<string, typeof data.bestTimes> = {}
		data.bestTimes.forEach((rec) => {
			if (!grouped[rec.day]) {
				grouped[rec.day] = []
			}
			grouped[rec.day].push(rec)
		})
		return grouped
	}, [data.bestTimes])

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Resource Deployment Engine</CardTitle>
					<CardDescription>Loading deployment recommendations...</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card className="w-full shadow-sm border-2">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2">
					<Shield className="h-5 w-5" />
					Resource Deployment Engine
				</CardTitle>
				<CardDescription>
					AI-powered recommendations for optimal officer deployment
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-6">
				{/* Strategy Summary */}
				<Card className="mb-6 bg-blue-50 border-blue-200">
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<AlertTriangle className="h-4 w-4 text-blue-600" />
							Overall Strategy
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-700">{data.overallStrategy}</p>
						<p className="text-xs text-gray-500 mt-2">
							Last updated: {new Date(data.lastUpdated).toLocaleString()}
						</p>
					</CardContent>
				</Card>

				<Tabs defaultValue="recommendations" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="recommendations">Time Recommendations</TabsTrigger>
						<TabsTrigger value="risk-ranking">Store Risk Ranking</TabsTrigger>
						<TabsTrigger value="by-day">Recommendations by Day</TabsTrigger>
					</TabsList>

					<TabsContent value="recommendations" className="space-y-4">
						{/* Critical Priority */}
						{criticalRecommendations.length > 0 && (
							<div>
								<h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
									<AlertTriangle className="h-4 w-4" />
									Critical Priority Deployments
								</h3>
								<div className="space-y-2">
									{criticalRecommendations.slice(0, 5).map((rec, index) => (
										<Card key={index} className="border-red-200 bg-red-50">
											<CardContent className="p-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4">
													<div>
														<div className="font-semibold">{rec.day}</div>
														<div className="text-sm text-gray-600">{rec.hourLabel}</div>
													</div>
													<div className="flex gap-2">
														<Badge
															style={{
																backgroundColor: OFFICER_TYPE_COLORS[rec.officerType],
																color: 'white',
															}}
														>
															{rec.officerType}
														</Badge>
														{rec.recommendedLPM && (
															<Badge
																style={{
																	backgroundColor: LPM_COLOR,
																	color: 'white',
																}}
															>
																LPM
															</Badge>
														)}
													</div>
													<div className="text-sm">
														<span className="font-medium">{rec.recommendedOfficers}</span>{' '}
														officers
													</div>
													<div className="text-sm text-gray-600">{rec.reason}</div>
													</div>
													<div className="text-right">
														<div className="text-sm font-semibold text-red-600">
															~{rec.expectedIncidents} incidents expected
														</div>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)}

						{/* High Priority */}
						{highPriorityRecommendations.length > 0 && (
							<div>
								<h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
									<Clock className="h-4 w-4" />
									High Priority Deployments
								</h3>
								<div className="border rounded-lg">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Day</TableHead>
												<TableHead>Time</TableHead>
												<TableHead>Officer Type</TableHead>
												<TableHead>Recommended</TableHead>
												<TableHead>Expected Incidents</TableHead>
												<TableHead>Reason</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{highPriorityRecommendations.slice(0, 10).map((rec, index) => (
												<TableRow key={index}>
													<TableCell className="font-medium">{rec.day}</TableCell>
													<TableCell>{rec.hourLabel}</TableCell>
													<TableCell>
														<div className="flex gap-2 flex-wrap">
															<Badge
																variant="outline"
																style={{
																	borderColor: OFFICER_TYPE_COLORS[rec.officerType],
																	color: OFFICER_TYPE_COLORS[rec.officerType],
																}}
															>
																{rec.officerType}
															</Badge>
															{rec.recommendedLPM && (
																<Badge
																	variant="outline"
																	style={{
																		borderColor: LPM_COLOR,
																		color: LPM_COLOR,
																	}}
																>
																	LPM
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-1">
															<Users className="h-4 w-4" />
															{rec.recommendedOfficers}
														</div>
													</TableCell>
													<TableCell>{rec.expectedIncidents}</TableCell>
													<TableCell className="text-sm text-gray-600">
														{rec.reason}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						)}
					</TabsContent>

					<TabsContent value="risk-ranking" className="space-y-6 mt-6">
						<div className="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Rank</TableHead>
										<TableHead>Store</TableHead>
										<TableHead>Risk Score</TableHead>
										<TableHead>Risk Level</TableHead>
										<TableHead>Incidents</TableHead>
										<TableHead>Trend</TableHead>
										<TableHead>Officer Type</TableHead>
										<TableHead>Recommended Hours</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.storeRankings.map((store, index) => (
										<TableRow key={store.storeId}>
											<TableCell className="font-bold">#{index + 1}</TableCell>
											<TableCell className="font-medium">{store.storeName}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<div className="w-24 bg-gray-200 rounded-full h-2">
														<div
															className="h-2 rounded-full"
															style={{
																width: `${store.riskScore}%`,
																backgroundColor: getRiskColor(store.riskLevel),
															}}
														/>
													</div>
													<span className="text-sm font-medium">{store.riskScore.toFixed(0)}</span>
												</div>
											</TableCell>
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
											<TableCell>{store.incidentCount}</TableCell>
											<TableCell>{getTrendIcon(store.trend)}</TableCell>
											<TableCell>
												<div className="flex gap-2 flex-wrap">
													<Badge
														variant="outline"
														style={{
															borderColor: OFFICER_TYPE_COLORS[store.recommendedOfficerType],
															color: OFFICER_TYPE_COLORS[store.recommendedOfficerType],
														}}
													>
														{store.recommendedOfficerType}
													</Badge>
													{store.recommendedLPM && (
														<Badge
															variant="outline"
															style={{
																borderColor: LPM_COLOR,
																color: LPM_COLOR,
															}}
														>
															LPM
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{store.recommendedHours.slice(0, 3).map((hour) => (
														<Badge key={hour} variant="secondary" className="text-xs">
															{hour}:00
														</Badge>
													))}
													{store.recommendedHours.length > 3 && (
														<Badge variant="secondary" className="text-xs">
															+{store.recommendedHours.length - 3}
														</Badge>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</TabsContent>

					<TabsContent value="by-day" className="space-y-6 mt-6">
						{Object.entries(recommendationsByDay).map(([day, recommendations]) => (
							<Card key={day}>
								<CardHeader>
									<CardTitle className="text-base">{day}</CardTitle>
									<CardDescription>
										{recommendations.length} deployment recommendations
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{recommendations
											.sort((a, b) => b.priority.localeCompare(a.priority))
											.map((rec, index) => (
												<div
													key={index}
													className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
												>
													<div className="flex items-center gap-4">
														<div className="text-sm font-medium">{rec.hourLabel}</div>
														<div className="flex gap-2">
															<Badge
																style={{
																	backgroundColor: OFFICER_TYPE_COLORS[rec.officerType],
																	color: 'white',
																}}
															>
																{rec.officerType}
															</Badge>
															{rec.recommendedLPM && (
																<Badge
																	style={{
																		backgroundColor: LPM_COLOR,
																		color: 'white',
																	}}
																>
																	LPM
																</Badge>
															)}
														</div>
														<div className="text-sm">
															{rec.recommendedOfficers} officers
														</div>
														<div className="text-xs text-gray-600">{rec.reason}</div>
													</div>
													<Badge
														variant="outline"
														style={{
															borderColor: getPriorityColor(rec.priority),
															color: getPriorityColor(rec.priority),
														}}
													>
														{rec.priority}
													</Badge>
												</div>
											))}
									</div>
								</CardContent>
							</Card>
						))}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	)
}

