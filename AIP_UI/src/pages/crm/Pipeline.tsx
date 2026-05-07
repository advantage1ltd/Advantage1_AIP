import { useState, useMemo, useEffect } from 'react'
import {
	Plus,
	DollarSign,
	ArrowRight,
	Filter,
	Search,
	BarChart3,
	TrendingUp,
	FileText,
	X,
	Loader2
} from 'lucide-react'
import { DealCard } from '@/components/crm/DealCard'
import { DealDialog } from '@/components/crm/DealDialog'
import { Button } from '@/components/ui/button'
import { PIPELINE_STAGES, Deal, PipelineStage } from '@/data/pipeline'
import { dealService } from '@/services/dealService'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

const STAGE_COLORS = {
	lead: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', header: 'bg-blue-100' },
	contact: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', header: 'bg-purple-100' },
	proposal: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', header: 'bg-amber-100' },
	negotiation: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', header: 'bg-orange-100' },
	closed: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', header: 'bg-emerald-100' }
}

export default function Pipeline() {
	const [deals, setDeals] = useState<Deal[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>()
	const [dealToDelete, setDealToDelete] = useState<string | undefined>()
	const [searchQuery, setSearchQuery] = useState('')
	const [priorityFilter, setPriorityFilter] = useState<string>('all')
	const [draggedDeal, setDraggedDeal] = useState<string | null>(null)
	const { toast } = useToast()

	// Load deals from API on mount
	useEffect(() => {
		const loadDeals = async () => {
			try {
				setIsLoading(true)
				const loadedDeals = await dealService.getAll(1, 1000)
				setDeals(loadedDeals)
			} catch (error) {
				console.error('Error loading deals:', error)
				toast({
					title: 'Error',
					description: 'Failed to load deals. Please try again.',
					variant: 'destructive'
				})
			} finally {
				setIsLoading(false)
			}
		}

		loadDeals()
	}, [toast])

	// Filter deals based on search and priority
	const filteredDeals = useMemo(() => {
		return deals.filter(deal => {
			const matchesSearch =
				deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
				deal.contact.toLowerCase().includes(searchQuery.toLowerCase())

			const matchesPriority = priorityFilter === 'all' || deal.priority === priorityFilter

			return matchesSearch && matchesPriority
		})
	}, [deals, searchQuery, priorityFilter])

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>, deal: Deal) => {
		e.dataTransfer.setData('dealId', deal.id)
		e.dataTransfer.effectAllowed = 'move'
		setDraggedDeal(deal.id)
	}

	const handleDragEnd = () => {
		setDraggedDeal(null)
	}

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
	}

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>, stage: PipelineStage) => {
		e.preventDefault()
		const dealId = e.dataTransfer.getData('dealId')

		try {
			await dealService.update(dealId, { stage })
			// Reload all deals to ensure we have the latest data
			const allDeals = await dealService.getAll(1, 1000)
			setDeals(allDeals)

			setDraggedDeal(null)
			toast({
				title: 'Deal Updated',
				description: 'Deal stage has been updated successfully'
			})
		} catch (error) {
			console.error('Error updating deal stage:', error)
			toast({
				title: 'Error',
				description: 'Failed to update deal stage. Please try again.',
				variant: 'destructive'
			})
		}
	}

	const handleCreateDeal = async (data: Partial<Deal>) => {
		try {
			const newDeal = await dealService.create(data)
			if (newDeal) {
				// Reload all deals to ensure we have the latest data
				const allDeals = await dealService.getAll(1, 1000)
				setDeals(allDeals)
				setIsDialogOpen(false)
				toast({
					title: 'Deal Created',
					description: 'New deal has been created successfully'
				})
			}
		} catch (error) {
			console.error('Error creating deal:', error)
			toast({
				title: 'Error',
				description: 'Failed to create deal. Please try again.',
				variant: 'destructive'
			})
		}
	}

	const handleUpdateDeal = async (data: Partial<Deal>) => {
		if (!selectedDeal) return

		try {
			const updatedDeal = await dealService.update(selectedDeal.id, data)
			if (updatedDeal) {
				// Reload all deals to ensure we have the latest data
				const allDeals = await dealService.getAll(1, 1000)
				setDeals(allDeals)
				setIsDialogOpen(false)
				setSelectedDeal(undefined)
				toast({
					title: 'Deal Updated',
					description: 'Deal has been updated successfully'
				})
			}
		} catch (error) {
			console.error('Error updating deal:', error)
			toast({
				title: 'Error',
				description: 'Failed to update deal. Please try again.',
				variant: 'destructive'
			})
		}
	}

	const handleDeleteDeal = async () => {
		if (!dealToDelete) return

		try {
			const success = await dealService.delete(dealToDelete)
			if (success) {
				// Reload all deals to ensure we have the latest data
				const allDeals = await dealService.getAll(1, 1000)
				setDeals(allDeals)
				setDealToDelete(undefined)
				toast({
					title: 'Deal Deleted',
					description: 'Deal has been deleted successfully',
					variant: 'destructive'
				})
			}
		} catch (error) {
			console.error('Error deleting deal:', error)
			toast({
				title: 'Error',
				description: 'Failed to delete deal. Please try again.',
				variant: 'destructive'
			})
		}
	}

	const handleEditDeal = (deal: Deal) => {
		setSelectedDeal(deal)
		setIsDialogOpen(true)
	}

	// Calculate summary stats
	const stats = useMemo(() => {
		const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0)
		const totalDeals = filteredDeals.length
		const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0
		const closedDeals = filteredDeals.filter(d => d.stage === 'closed').length
		const conversionRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0

		return { totalValue, totalDeals, avgDealValue, closedDeals, conversionRate }
	}, [filteredDeals])

	// Format currency
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP',
			maximumFractionDigits: 0
		}).format(value)
	}

	return (
		<div className="min-h-screen bg-[#EFF4FF]">
			<div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-full">
				<div className="space-y-4 sm:space-y-6">
					{/* Header */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border/40">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<div className="bg-primary/10 rounded-lg p-2">
									<TrendingUp className="h-5 w-5 text-primary" />
								</div>
								<div>
									<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary">
										Sales Pipeline
									</h1>
									<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
										Manage and track your deals through the sales process
									</p>
								</div>
							</div>
						</div>
						<Button
							onClick={() => {
								setSelectedDeal(undefined)
								setIsDialogOpen(true)
							}}
							className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
						>
							<Plus className="h-4 w-4" />
							<span className="hidden sm:inline">Add New Deal</span>
							<span className="sm:hidden">Add Deal</span>
						</Button>
					</div>

					{/* Summary Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
						<Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-blue-600 to-blue-700">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
								<CardTitle className="text-xs sm:text-sm font-medium text-white">
									Pipeline Value
								</CardTitle>
								<div className="rounded-full bg-white/20 p-2">
									<DollarSign className="h-4 w-4 text-white" />
								</div>
							</CardHeader>
							<CardContent className="px-4 pb-4">
								<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
									{formatCurrency(stats.totalValue)}
								</div>
								<p className="text-xs text-blue-100 mt-1">
									{stats.totalDeals} {stats.totalDeals === 1 ? 'deal' : 'deals'} in pipeline
								</p>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-indigo-600 to-indigo-700">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
								<CardTitle className="text-xs sm:text-sm font-medium text-white">
									Average Deal
								</CardTitle>
								<div className="rounded-full bg-white/20 p-2">
									<BarChart3 className="h-4 w-4 text-white" />
								</div>
							</CardHeader>
							<CardContent className="px-4 pb-4">
								<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
									{formatCurrency(stats.avgDealValue)}
								</div>
								<p className="text-xs text-indigo-100 mt-1">Average deal value</p>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-emerald-600 to-emerald-700">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
								<CardTitle className="text-xs sm:text-sm font-medium text-white">
									Conversion Rate
								</CardTitle>
								<div className="rounded-full bg-white/20 p-2">
									<ArrowRight className="h-4 w-4 text-white" />
								</div>
							</CardHeader>
							<CardContent className="px-4 pb-4">
								<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
									{stats.conversionRate}%
								</div>
								<p className="text-xs text-emerald-100 mt-1">
									{stats.closedDeals} {stats.closedDeals === 1 ? 'deal' : 'deals'} closed
								</p>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-purple-600 to-purple-700">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
								<CardTitle className="text-xs sm:text-sm font-medium text-white">
									Active Deals
								</CardTitle>
								<div className="rounded-full bg-white/20 p-2">
									<FileText className="h-4 w-4 text-white" />
								</div>
							</CardHeader>
							<CardContent className="px-4 pb-4">
								<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
									{stats.totalDeals}
								</div>
								<p className="text-xs text-purple-100 mt-1">Total active deals</p>
							</CardContent>
						</Card>
					</div>

					{/* Search and Filter */}
					<Card className="border border-border/40 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								<div className="relative flex-1">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<Search className="h-4 w-4 text-muted-foreground" />
									</div>
									<Input
										placeholder="Search deals by title, company, or contact..."
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className="w-full pl-10 h-10"
									/>
								</div>
								<Select value={priorityFilter} onValueChange={setPriorityFilter}>
									<SelectTrigger className="w-full sm:w-[180px] h-10">
										<SelectValue placeholder="Filter by priority" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Priorities</SelectItem>
										<SelectItem value="low">Low Priority</SelectItem>
										<SelectItem value="medium">Medium Priority</SelectItem>
										<SelectItem value="high">High Priority</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Results Summary */}
					<div className="flex items-center justify-between text-sm text-muted-foreground px-1">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-primary"></div>
							<span>
								Showing {filteredDeals.length} {filteredDeals.length === 1 ? 'deal' : 'deals'}
								{priorityFilter !== 'all' && (
									<>
										{' '}
										with{' '}
										<Badge variant="outline" className="ml-1 font-normal capitalize">
											{priorityFilter}
										</Badge>{' '}
										priority
									</>
								)}
								{searchQuery && <> matching "{searchQuery}"</>}
							</span>
						</div>
						{(searchQuery || priorityFilter !== 'all') && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearchQuery('')
									setPriorityFilter('all')
								}}
								className="h-7 text-xs gap-1"
							>
								<X className="h-3 w-3" />
								Clear filters
							</Button>
						)}
					</div>

					{/* Loading State */}
					{isLoading && (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<span className="ml-2 text-muted-foreground">Loading deals...</span>
						</div>
					)}

					{/* Pipeline Stages - Kanban Board */}
					{!isLoading && (
						<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[600px]">
						{PIPELINE_STAGES.map(stage => {
							const stageDeals = filteredDeals.filter(deal => deal.stage === stage.id)
							const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)
							const stageColors = STAGE_COLORS[stage.id]

							return (
								<div
									key={stage.id}
									className={`flex flex-col rounded-lg border-2 ${stageColors.border} ${stageColors.bg} shadow-sm overflow-hidden transition-all hover:shadow-md`}
									onDragOver={handleDragOver}
									onDrop={e => handleDrop(e, stage.id)}
								>
									{/* Stage Header */}
									<div
										className={`p-3 sm:p-4 border-b ${stageColors.border} ${stageColors.header} backdrop-blur-sm`}
									>
										<div className="flex items-center justify-between mb-2">
											<h3 className={`font-semibold text-sm sm:text-base ${stageColors.text}`}>
												{stage.label}
											</h3>
											<Badge
												variant="secondary"
												className={`${stageColors.text} bg-white/50 border-0 font-semibold`}
											>
												{stageDeals.length}
											</Badge>
										</div>
										<div className={`text-sm font-bold ${stageColors.text}`}>
											{formatCurrency(stageValue)}
										</div>
									</div>

									{/* Stage Content */}
									<ScrollArea className="flex-1 p-3 sm:p-4">
										<div className="space-y-3">
											{stageDeals.length > 0 ? (
												stageDeals.map(deal => (
													<div
														key={deal.id}
														draggable
														onDragStart={e => handleDragStart(e, deal)}
														onDragEnd={handleDragEnd}
														className={`cursor-grab active:cursor-grabbing transition-transform ${
															draggedDeal === deal.id ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'
														}`}
													>
														<DealCard
															deal={deal}
															onEdit={() => handleEditDeal(deal)}
															onDelete={() => setDealToDelete(deal.id)}
														/>
													</div>
												))
											) : (
												<div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
													<div className="rounded-full bg-white/50 p-3 mb-3">
														<FileText className="h-5 w-5 text-muted-foreground" />
													</div>
													<p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">
														No deals in this stage
													</p>
													<p className="text-xs text-muted-foreground/80">
														Drag deals here or add a new one
													</p>
												</div>
											)}
										</div>
									</ScrollArea>
								</div>
							)
						})}
						</div>
					)}
				</div>
			</div>

			{/* Deal Dialog */}
			<DealDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				deal={selectedDeal}
				onSubmit={selectedDeal ? handleUpdateDeal : handleCreateDeal}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!dealToDelete} onOpenChange={() => setDealToDelete(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the deal
							{deals.find(d => d.id === dealToDelete)?.title && (
								<> "{deals.find(d => d.id === dealToDelete)?.title}"</>
							)}
							.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteDeal}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
