import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Search,
	Laptop,
	Smartphone,
	Monitor,
	Printer,
	AlertCircle,
	Package,
	Pencil,
	Trash2,
	ChevronLeft,
	ChevronRight,
	Plus,
	Loader2,
	Tablet,
	HardDrive,
	Box,
	Wrench,
	CheckCircle2,
	Archive,
	LayoutGrid,
	List
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { AssetForm } from '@/components/compliance/AssetForm'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { assetRegisterService } from '@/services/assetRegisterService'
import type { AssetRegister, AssetStatus, CreateAssetRegisterRequest, UpdateAssetRegisterRequest } from '@/types/assetRegister'

const AssetRegisterPage = () => {
	const queryClient = useQueryClient()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedType, setSelectedType] = useState<string>('all')
	const [selectedStatus, setSelectedStatus] = useState<string>('all')
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [selectedAsset, setSelectedAsset] = useState<AssetRegister | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
	const pageSize = 10

	// Fetch assets using the API service
	const { data: assetsResponse, isLoading, error } = useQuery({
		queryKey: ['assets', currentPage, searchTerm, selectedType, selectedStatus],
		queryFn: () => assetRegisterService.getAssets({
			page: currentPage,
			pageSize,
			searchTerm: searchTerm || undefined,
			assetType: selectedType !== 'all' ? selectedType : undefined,
			status: selectedStatus !== 'all' ? selectedStatus : undefined,
		}),
	})

	// Create asset mutation
	const createMutation = useMutation({
		mutationFn: (data: CreateAssetRegisterRequest) => assetRegisterService.createAsset(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets'] })
			setIsFormOpen(false)
			toast({
				title: 'Asset Created',
				description: 'The asset has been successfully added to the register.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to create asset',
				variant: 'destructive',
			})
		},
	})

	// Update asset mutation
	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateAssetRegisterRequest }) =>
			assetRegisterService.updateAsset(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets'] })
			setIsFormOpen(false)
			setSelectedAsset(null)
			toast({
				title: 'Asset Updated',
				description: 'The asset has been successfully updated.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to update asset',
				variant: 'destructive',
			})
		},
	})

	// Delete asset mutation
	const deleteMutation = useMutation({
		mutationFn: (id: number) => assetRegisterService.deleteAsset(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets'] })
			setIsDeleteDialogOpen(false)
			setSelectedAsset(null)
			toast({
				title: 'Asset Deleted',
				description: 'The asset has been successfully removed from the register.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to delete asset',
				variant: 'destructive',
			})
		},
	})

	const assets = assetsResponse?.items ?? []
	const stats = assetsResponse?.stats ?? { totalAssets: 0, inUse: 0, inStock: 0, inRepair: 0, disposed: 0, totalValue: 0 }
	const pagination = assetsResponse?.pagination ?? { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 10, hasPrevious: false, hasNext: false }

	// Statistics cards configuration
	const statCards = [
		{
			title: 'Total Assets',
			value: stats.totalAssets,
			icon: Package,
			gradient: 'from-violet-600 to-indigo-600',
			iconBg: 'bg-white/20',
			ring: 'ring-violet-500/20'
		},
		{
			title: 'In Use',
			value: stats.inUse,
			icon: CheckCircle2,
			gradient: 'from-emerald-500 to-teal-600',
			iconBg: 'bg-white/20',
			ring: 'ring-emerald-500/20'
		},
		{
			title: 'In Stock',
			value: stats.inStock,
			icon: Box,
			gradient: 'from-sky-500 to-blue-600',
			iconBg: 'bg-white/20',
			ring: 'ring-sky-500/20'
		},
		{
			title: 'In Repair',
			value: stats.inRepair,
			icon: Wrench,
			gradient: 'from-amber-500 to-orange-600',
			iconBg: 'bg-white/20',
			ring: 'ring-amber-500/20'
		}
	]

	const getStatusConfig = (status: AssetStatus) => {
		switch (status) {
			case 'In Use':
				return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 }
			case 'In Stock':
				return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Box }
			case 'In Repair':
				return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Wrench }
			case 'Disposed':
				return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', icon: Archive }
			default:
				return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Package }
		}
	}

	const getAssetTypeIcon = (assetType: string, className = 'h-5 w-5') => {
		const iconProps = { className }
		switch (assetType) {
			case 'Laptop':
				return <Laptop {...iconProps} />
			case 'Phone':
				return <Smartphone {...iconProps} />
			case 'Tablet':
				return <Tablet {...iconProps} />
			case 'Desktop':
				return <HardDrive {...iconProps} />
			case 'Monitor':
				return <Monitor {...iconProps} />
			case 'Printer':
				return <Printer {...iconProps} />
			default:
				return <Package {...iconProps} />
		}
	}

	const getAssetTypeColor = (assetType: string) => {
		switch (assetType) {
			case 'Laptop':
				return 'bg-violet-100 text-violet-700'
			case 'Phone':
				return 'bg-pink-100 text-pink-700'
			case 'Tablet':
				return 'bg-cyan-100 text-cyan-700'
			case 'Desktop':
				return 'bg-indigo-100 text-indigo-700'
			case 'Monitor':
				return 'bg-blue-100 text-blue-700'
			case 'Printer':
				return 'bg-orange-100 text-orange-700'
			default:
				return 'bg-slate-100 text-slate-700'
		}
	}

	const handleAddAsset = useCallback((data: {
		assetTag: string
		assetType: string
		make: string
		model: string
		serialNumber: string
		purchaseDate: Date
		assignedTo?: string
		location: string
		status: string
		notes?: string
	}) => {
		const request: CreateAssetRegisterRequest = {
			assetTag: data.assetTag,
			assetType: data.assetType,
			make: data.make,
			model: data.model,
			serialNumber: data.serialNumber,
			purchaseDate: data.purchaseDate.toISOString(),
			assignedTo: data.assignedTo || undefined,
			location: data.location,
			status: data.status,
			notes: data.notes,
		}
		createMutation.mutate(request)
	}, [createMutation])

	const handleEditAsset = useCallback((data: {
		assetTag: string
		assetType: string
		make: string
		model: string
		serialNumber: string
		purchaseDate: Date
		assignedTo?: string
		location: string
		status: string
		notes?: string
	}) => {
		if (!selectedAsset) return

		const request: UpdateAssetRegisterRequest = {
			assetTag: data.assetTag,
			assetType: data.assetType,
			make: data.make,
			model: data.model,
			serialNumber: data.serialNumber,
			purchaseDate: data.purchaseDate.toISOString(),
			assignedTo: data.assignedTo || undefined,
			location: data.location,
			status: data.status,
			notes: data.notes,
		}
		updateMutation.mutate({ id: selectedAsset.id, data: request })
	}, [selectedAsset, updateMutation])

	const handleDeleteAsset = useCallback(() => {
		if (!selectedAsset) return
		deleteMutation.mutate(selectedAsset.id)
	}, [selectedAsset, deleteMutation])

	const openEditForm = useCallback((asset: AssetRegister) => {
		setSelectedAsset(asset)
		setIsFormOpen(true)
	}, [])

	const openDeleteDialog = useCallback((asset: AssetRegister) => {
		setSelectedAsset(asset)
		setIsDeleteDialogOpen(true)
	}, [])

	// Transform selected asset for form
	const getFormInitialData = useCallback(() => {
		if (!selectedAsset) return undefined
		return {
			assetTag: selectedAsset.assetTag,
			assetType: selectedAsset.assetType as 'Laptop' | 'Phone' | 'Tablet' | 'Desktop' | 'Monitor' | 'Printer' | 'Other',
			make: selectedAsset.make,
			model: selectedAsset.model,
			serialNumber: selectedAsset.serialNumber,
			purchaseDate: parseISO(selectedAsset.purchaseDate),
			assignedTo: selectedAsset.assignedTo || '',
			location: selectedAsset.location,
			status: selectedAsset.status as 'In Use' | 'In Stock' | 'In Repair' | 'Disposed',
			notes: selectedAsset.notes || '',
		}
	}, [selectedAsset])

	if (error) {
		return (
			<div className="min-h-screen bg-[#EFF4FF] p-4 sm:p-6">
				<div className="max-w-2xl mx-auto">
					<Card className="border-red-200 bg-red-50/50 shadow-lg">
						<CardContent className="pt-8 pb-8">
							<div className="flex flex-col items-center text-center gap-4">
								<div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
									<AlertCircle className="h-8 w-8 text-red-600" />
								</div>
								<div>
									<h3 className="font-semibold text-lg text-red-800">Error loading assets</h3>
									<p className="text-sm text-red-600 mt-1">{(error as Error).message}</p>
								</div>
								<Button
									variant="outline"
									className="mt-2 border-red-200 text-red-700 hover:bg-red-100"
									onClick={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
								>
									Try Again
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#EFF4FF]">
			<div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl">

				{/* Header Section */}
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
					<div className="space-y-1">
						<h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 bg-clip-text text-transparent">
							Asset Register
						</h1>
						<p className="text-slate-500 text-sm sm:text-base">
							Track and manage your company's assets inventory
						</p>
					</div>
					<Button
						onClick={() => {
							setSelectedAsset(null)
							setIsFormOpen(true)
						}}
						className="w-full lg:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
					>
						<Plus className="h-5 w-5 mr-2" />
						Add New Asset
					</Button>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{statCards.map((stat, index) => (
						<Card
							key={stat.title}
							className={cn(
								'relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
								`ring-1 ${stat.ring}`
							)}
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<div className={cn('absolute inset-0 bg-gradient-to-br opacity-95', stat.gradient)} />
							<CardContent className="relative pt-5 pb-4 px-5">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="text-xs sm:text-sm font-medium text-white/80">{stat.title}</p>
										<p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stat.value}</p>
									</div>
									<div className={cn('p-3 rounded-xl', stat.iconBg)}>
										<stat.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Filters Section */}
				<Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
					<CardContent className="p-4">
						<div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
							{/* Search */}
							<div className="relative flex-grow">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
								<Input
									type="text"
									placeholder="Search by tag, make, model, or assignee..."
									className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value)
										setCurrentPage(1)
									}}
								/>
							</div>

							{/* Filters */}
							<div className="flex flex-wrap gap-3">
								<Select value={selectedType} onValueChange={(value) => {
									setSelectedType(value)
									setCurrentPage(1)
								}}>
									<SelectTrigger className="w-full sm:w-[160px] h-11 bg-slate-50/50 border-slate-200">
										<SelectValue placeholder="Asset type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Types</SelectItem>
										<SelectItem value="Laptop">Laptop</SelectItem>
										<SelectItem value="Phone">Phone</SelectItem>
										<SelectItem value="Tablet">Tablet</SelectItem>
										<SelectItem value="Desktop">Desktop</SelectItem>
										<SelectItem value="Monitor">Monitor</SelectItem>
										<SelectItem value="Printer">Printer</SelectItem>
										<SelectItem value="Other">Other</SelectItem>
									</SelectContent>
								</Select>
								<Select value={selectedStatus} onValueChange={(value) => {
									setSelectedStatus(value)
									setCurrentPage(1)
								}}>
									<SelectTrigger className="w-full sm:w-[140px] h-11 bg-slate-50/50 border-slate-200">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value="In Use">In Use</SelectItem>
										<SelectItem value="In Stock">In Stock</SelectItem>
										<SelectItem value="In Repair">In Repair</SelectItem>
										<SelectItem value="Disposed">Disposed</SelectItem>
									</SelectContent>
								</Select>

								{/* View Toggle - Desktop only */}
								<div className="hidden lg:flex border rounded-lg p-1 bg-slate-100/50">
									<Button
										variant="ghost"
										size="sm"
										className={cn(
											'h-9 px-3',
											viewMode === 'table' && 'bg-white shadow-sm'
										)}
										onClick={() => setViewMode('table')}
									>
										<List className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className={cn(
											'h-9 px-3',
											viewMode === 'grid' && 'bg-white shadow-sm'
										)}
										onClick={() => setViewMode('grid')}
									>
										<LayoutGrid className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Loading State */}
				{isLoading && (
					<Card className="border-0 shadow-md">
						<CardContent className="py-16">
							<div className="flex flex-col items-center justify-center gap-4">
								<div className="relative">
									<div className="h-16 w-16 rounded-full border-4 border-violet-100 animate-pulse" />
									<Loader2 className="h-8 w-8 text-violet-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
								</div>
								<p className="text-slate-500 font-medium">Loading assets...</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Empty State */}
				{!isLoading && assets.length === 0 && (
					<Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-white">
						<CardContent className="py-16">
							<div className="flex flex-col items-center text-center gap-4 max-w-sm mx-auto">
								<div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
									<Package className="h-10 w-10 text-violet-500" />
								</div>
								<div className="space-y-2">
									<h3 className="text-xl font-semibold text-slate-900">No assets found</h3>
									<p className="text-slate-500">
										{searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
											? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
											: 'Get started by adding your first asset to the register.'}
									</p>
								</div>
								{!searchTerm && selectedType === 'all' && selectedStatus === 'all' && (
									<Button
										onClick={() => {
											setSelectedAsset(null)
											setIsFormOpen(true)
										}}
										className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
									>
										<Plus className="h-5 w-5 mr-2" />
										Add Your First Asset
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Grid View - All Screen Sizes */}
				{!isLoading && assets.length > 0 && (viewMode === 'grid' || window.innerWidth < 640) && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{assets.map((asset) => {
							const statusConfig = getStatusConfig(asset.status)
							return (
								<Card
									key={asset.id}
									className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
								>
									<CardContent className="p-0">
										{/* Header */}
										<div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-3">
													<div className={cn('p-2.5 rounded-xl', getAssetTypeColor(asset.assetType))}>
														{getAssetTypeIcon(asset.assetType, 'h-5 w-5')}
													</div>
													<div>
														<h3 className="font-bold text-slate-900">{asset.assetTag}</h3>
														<p className="text-xs text-slate-500">{asset.assetType}</p>
													</div>
												</div>
												<Badge className={cn('border', statusConfig.bg, statusConfig.text, statusConfig.border)}>
													{asset.status}
												</Badge>
											</div>
										</div>

										{/* Body */}
										<div className="p-4 space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium text-slate-900">{asset.make} {asset.model}</span>
											</div>

											<div className="grid grid-cols-2 gap-3 text-sm">
												<div>
													<p className="text-xs text-slate-400 uppercase tracking-wide">Serial</p>
													<p className="font-mono text-xs text-slate-600 truncate">{asset.serialNumber}</p>
												</div>
												<div>
													<p className="text-xs text-slate-400 uppercase tracking-wide">Location</p>
													<p className="text-slate-600 truncate">{asset.location}</p>
												</div>
											</div>

											{asset.assignedTo && (
												<div className="flex items-center gap-2 pt-2 border-t border-slate-100">
													<div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-medium text-white">
														{asset.assignedTo.charAt(0).toUpperCase()}
													</div>
													<span className="text-sm text-slate-600 truncate">{asset.assignedTo}</span>
												</div>
											)}
										</div>

										{/* Actions */}
										<div className="px-4 pb-4 flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openEditForm(asset)}
												className="flex-1 h-9 border-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors"
											>
												<Pencil className="h-4 w-4 mr-1.5" />
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => openDeleteDialog(asset)}
												className="h-9 px-3 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}

				{/* Table View - Large Screens */}
				{!isLoading && assets.length > 0 && viewMode === 'table' && (
					<Card className="hidden sm:block border-0 shadow-md overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
										<th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Asset</th>
										<th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Make/Model</th>
										<th className="hidden md:table-cell px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Serial</th>
										<th className="hidden lg:table-cell px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
										<th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Assigned</th>
										<th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
										<th className="px-4 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[120px]">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{assets.map((asset, index) => {
										const statusConfig = getStatusConfig(asset.status)
										return (
											<tr
												key={asset.id}
												className="group hover:bg-slate-50/50 transition-colors"
												style={{ animationDelay: `${index * 50}ms` }}
											>
												<td className="px-4 py-4">
													<div className="flex items-center gap-3">
														<div className={cn('p-2 rounded-lg', getAssetTypeColor(asset.assetType))}>
															{getAssetTypeIcon(asset.assetType, 'h-4 w-4')}
														</div>
														<div>
															<p className="font-semibold text-slate-900">{asset.assetTag}</p>
															<p className="text-xs text-slate-500">{asset.assetType}</p>
														</div>
													</div>
												</td>
												<td className="px-4 py-4">
													<p className="text-slate-900">{asset.make} {asset.model}</p>
													<p className="text-xs text-slate-500 lg:hidden">{asset.serialNumber}</p>
												</td>
												<td className="hidden md:table-cell px-4 py-4">
													<code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{asset.serialNumber}</code>
												</td>
												<td className="hidden lg:table-cell px-4 py-4 text-slate-600">{asset.location}</td>
												<td className="px-4 py-4">
													{asset.assignedTo ? (
														<div className="flex items-center gap-2">
															<div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-medium text-white">
																{asset.assignedTo.charAt(0).toUpperCase()}
															</div>
															<span className="text-sm text-slate-700 truncate max-w-[120px]">{asset.assignedTo}</span>
														</div>
													) : (
														<span className="text-slate-400 text-sm">Unassigned</span>
													)}
												</td>
												<td className="px-4 py-4">
													<Badge className={cn('border font-medium', statusConfig.bg, statusConfig.text, statusConfig.border)}>
														<statusConfig.icon className="h-3 w-3 mr-1" />
														{asset.status}
													</Badge>
												</td>
												<td className="px-4 py-4">
													<div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openEditForm(asset)}
															className="h-8 w-8 p-0 hover:bg-violet-100 hover:text-violet-700"
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openDeleteDialog(asset)}
															className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{pagination.totalPages > 1 && (
							<div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
								<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
									<p className="text-sm text-slate-500">
										Showing <span className="font-medium text-slate-700">{((pagination.currentPage - 1) * pagination.pageSize) + 1}</span> to{' '}
										<span className="font-medium text-slate-700">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)}</span> of{' '}
										<span className="font-medium text-slate-700">{pagination.totalCount}</span> assets
									</p>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
											disabled={!pagination.hasPrevious}
											className="h-9 px-3"
										>
											<ChevronLeft className="h-4 w-4 mr-1" />
											Previous
										</Button>
										<div className="hidden sm:flex items-center gap-1">
											{Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
												const page = i + 1
												return (
													<Button
														key={page}
														variant={currentPage === page ? 'default' : 'outline'}
														size="sm"
														onClick={() => setCurrentPage(page)}
														className={cn(
															'h-9 w-9 p-0',
															currentPage === page && 'bg-violet-600 hover:bg-violet-700'
														)}
													>
														{page}
													</Button>
												)
											})}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
											disabled={!pagination.hasNext}
											className="h-9 px-3"
										>
											Next
											<ChevronRight className="h-4 w-4 ml-1" />
										</Button>
									</div>
								</div>
							</div>
						)}
					</Card>
				)}

				{/* Mobile Pagination */}
				{!isLoading && assets.length > 0 && pagination.totalPages > 1 && (
					<div className="sm:hidden flex flex-col items-center gap-3 py-4">
						<p className="text-sm text-slate-500">
							Page {currentPage} of {pagination.totalPages}
						</p>
						<div className="flex items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={!pagination.hasPrevious}
								className="h-10 px-4"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
								disabled={!pagination.hasNext}
								className="h-10 px-4"
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Forms and Dialogs */}
			<AssetForm
				open={isFormOpen}
				onClose={() => {
					setIsFormOpen(false)
					setSelectedAsset(null)
				}}
				onSubmit={selectedAsset ? handleEditAsset : handleAddAsset}
				initialData={getFormInitialData()}
				isLoading={createMutation.isPending || updateMutation.isPending}
			/>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent className="sm:max-w-md">
					<AlertDialogHeader>
						<div className="flex items-center gap-4">
							<div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
								<Trash2 className="h-6 w-6 text-red-600" />
							</div>
							<div>
								<AlertDialogTitle>Delete Asset</AlertDialogTitle>
								<AlertDialogDescription className="mt-1">
									This will permanently remove <span className="font-medium text-slate-700">{selectedAsset?.assetTag}</span> from the register.
								</AlertDialogDescription>
							</div>
						</div>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-4">
						<AlertDialogCancel disabled={deleteMutation.isPending} className="border-slate-200">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteAsset}
							disabled={deleteMutation.isPending}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{deleteMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								'Delete Asset'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export default AssetRegisterPage
