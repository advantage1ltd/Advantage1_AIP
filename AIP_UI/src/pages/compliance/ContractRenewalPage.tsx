import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Search, AlertCircle, FileText, Clock, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ContractForm } from '@/components/compliance/ContractForm'
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
import { contractRenewalService } from '@/services/contractRenewalService'
import type { ContractRenewal, ContractStatus, CreateContractRenewalRequest, UpdateContractRenewalRequest } from '@/types/contractRenewal'

const ContractRenewalPage = () => {
	const queryClient = useQueryClient()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedType, setSelectedType] = useState<string>('all')
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [selectedContract, setSelectedContract] = useState<ContractRenewal | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 10

	// Fetch contracts using the API service
	const { data: contractsResponse, isLoading, error } = useQuery({
		queryKey: ['contracts', currentPage, searchTerm, selectedType],
		queryFn: () => contractRenewalService.getContracts({
			page: currentPage,
			pageSize,
			searchTerm: searchTerm || undefined,
			contractType: selectedType !== 'all' ? selectedType : undefined,
		}),
	})

	// Create contract mutation
	const createMutation = useMutation({
		mutationFn: (data: CreateContractRenewalRequest) => contractRenewalService.createContract(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['contracts'] })
			setIsFormOpen(false)
			toast({
				title: 'Contract Created',
				description: 'The contract has been successfully created.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to create contract',
				variant: 'destructive',
			})
		},
	})

	// Update contract mutation
	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateContractRenewalRequest }) =>
			contractRenewalService.updateContract(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['contracts'] })
			setIsFormOpen(false)
			setSelectedContract(null)
			toast({
				title: 'Contract Updated',
				description: 'The contract has been successfully updated.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to update contract',
				variant: 'destructive',
			})
		},
	})

	// Delete contract mutation
	const deleteMutation = useMutation({
		mutationFn: (id: number) => contractRenewalService.deleteContract(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['contracts'] })
			setIsDeleteDialogOpen(false)
			setSelectedContract(null)
			toast({
				title: 'Contract Deleted',
				description: 'The contract has been successfully deleted.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to delete contract',
				variant: 'destructive',
			})
		},
	})

	const contracts = contractsResponse?.items ?? []
	const stats = contractsResponse?.stats ?? { totalContracts: 0, criticalExpiry: 0, expiringSoon: 0, totalValue: 0 }
	const pagination = contractsResponse?.pagination ?? { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 10, hasPrevious: false, hasNext: false }

	const getStatusColor = (status: ContractStatus) => {
		switch (status) {
			case 'Critical':
				return 'bg-red-100 text-red-800'
			case 'Expiring Soon':
				return 'bg-yellow-100 text-yellow-800'
			case 'Active':
				return 'bg-green-100 text-green-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getProgressColor = (months: number) => {
		if (months <= 2) return 'bg-red-500'
		if (months <= 3) return 'bg-yellow-500'
		return 'bg-green-500'
	}

	const statCards = [
		{
			label: 'Total Contracts',
			value: stats.totalContracts,
			subLabel: 'Active contracts',
			textColorSubtle: 'text-indigo-200',
			bgColor: 'bg-indigo-700',
			iconBgColor: 'bg-indigo-600',
			icon: FileText
		},
		{
			label: 'Critical Expiry',
			value: stats.criticalExpiry,
			subLabel: 'Expires < 2 months',
			textColorSubtle: 'text-red-200',
			bgColor: 'bg-red-700',
			iconBgColor: 'bg-red-600',
			icon: AlertCircle
		},
		{
			label: 'Expiring Soon',
			value: stats.expiringSoon,
			subLabel: 'Expires < 3 months',
			textColorSubtle: 'text-amber-100',
			bgColor: 'bg-amber-600',
			iconBgColor: 'bg-amber-500',
			icon: Clock
		},
		{
			label: 'Total Value',
			value: `£${stats.totalValue.toLocaleString()}`,
			subLabel: 'Annual contract value',
			textColorSubtle: 'text-emerald-200',
			bgColor: 'bg-emerald-700',
			iconBgColor: 'bg-emerald-600',
			icon: FileText
		}
	]

	const handleAddContract = useCallback((data: {
		contractName: string
		contractType: string
		provider: string
		startDate: Date
		expiryDate: Date
		cost: string
		notes?: string
	}) => {
		const request: CreateContractRenewalRequest = {
			contractName: data.contractName,
			contractType: data.contractType,
			provider: data.provider,
			startDate: data.startDate.toISOString(),
			expiryDate: data.expiryDate.toISOString(),
			cost: parseFloat(data.cost),
			notes: data.notes,
		}
		createMutation.mutate(request)
	}, [createMutation])

	const handleEditContract = useCallback((data: {
		contractName: string
		contractType: string
		provider: string
		startDate: Date
		expiryDate: Date
		cost: string
		notes?: string
	}) => {
		if (!selectedContract) return

		const request: UpdateContractRenewalRequest = {
			contractName: data.contractName,
			contractType: data.contractType,
			provider: data.provider,
			startDate: data.startDate.toISOString(),
			expiryDate: data.expiryDate.toISOString(),
			cost: parseFloat(data.cost),
			notes: data.notes,
		}
		updateMutation.mutate({ id: selectedContract.id, data: request })
	}, [selectedContract, updateMutation])

	const handleDeleteContract = useCallback(() => {
		if (!selectedContract) return
		deleteMutation.mutate(selectedContract.id)
	}, [selectedContract, deleteMutation])

	const openEditForm = useCallback((contract: ContractRenewal) => {
		setSelectedContract(contract)
		setIsFormOpen(true)
	}, [])

	const openDeleteDialog = useCallback((contract: ContractRenewal) => {
		setSelectedContract(contract)
		setIsDeleteDialogOpen(true)
	}, [])

	const renderPaginationButtons = (currentPage: number, totalPages: number, setCurrentPage: React.Dispatch<React.SetStateAction<number>>) => {
		const buttons = []
		const start = Math.max(currentPage - 2, 1)
		const end = Math.min(currentPage + 2, totalPages)

		if (start > 1) {
			buttons.push(
				<Button
					key={1}
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage(1)}
					className={`w-8 h-8 ${currentPage === 1 ? 'bg-blue-600 text-white' : ''}`}
				>
					1
				</Button>
			)
		}

		if (start > 2) {
			buttons.push(
				<Button key="ellipsis-start" variant="outline" size="sm" className="w-8 h-8" disabled>
					...
				</Button>
			)
		}

		for (let i = start; i <= end; i++) {
			buttons.push(
				<Button
					key={i}
					variant={currentPage === i ? 'default' : 'outline'}
					size="sm"
					onClick={() => setCurrentPage(i)}
					className={`w-8 h-8 ${currentPage === i ? 'bg-blue-600 text-white' : ''}`}
				>
					{i}
				</Button>
			)
		}

		if (end < totalPages - 1) {
			buttons.push(
				<Button key="ellipsis-end" variant="outline" size="sm" className="w-8 h-8" disabled>
					...
				</Button>
			)
		}

		if (end < totalPages) {
			buttons.push(
				<Button
					key={totalPages}
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage(totalPages)}
					className={`w-8 h-8 ${currentPage === totalPages ? 'bg-blue-600 text-white' : ''}`}
				>
					{totalPages}
				</Button>
			)
		}

		return buttons
	}

	// Transform selected contract for form
	const getFormInitialData = useCallback(() => {
		if (!selectedContract) return undefined
		return {
			contractName: selectedContract.contractName,
			contractType: selectedContract.contractType as 'Antivirus' | 'Cyber Essentials' | 'Software Subscription' | 'Hardware Maintenance' | 'Other',
			provider: selectedContract.provider,
			startDate: parseISO(selectedContract.startDate),
			expiryDate: parseISO(selectedContract.expiryDate),
			cost: selectedContract.cost.toString(),
			notes: selectedContract.notes || '',
		}
	}, [selectedContract])

	if (error) {
		return (
			<div className="container mx-auto p-6">
				<Card className="bg-red-50 border-red-200">
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<AlertCircle className="h-6 w-6 text-red-500" />
							<div>
								<h3 className="font-semibold text-red-800">Error loading contracts</h3>
								<p className="text-sm text-red-600">{(error as Error).message}</p>
							</div>
						</div>
						<Button
							className="mt-4"
							variant="outline"
							onClick={() => queryClient.invalidateQueries({ queryKey: ['contracts'] })}
						>
							Try Again
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-2 sm:p-6">
			<div className="space-y-3 sm:space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
					<div>
						<h1 className="text-lg sm:text-2xl font-bold">Contract Renewal Tracker</h1>
						<p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Track and manage contract renewals</p>
					</div>
					<Button
						onClick={() => {
							setSelectedContract(null)
							setIsFormOpen(true)
						}}
						className="w-full sm:w-auto h-8 sm:h-auto text-xs sm:text-sm"
					>
						Add New Contract
					</Button>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
					{statCards.map((stat, index) => {
						const isLastOddCard = index === statCards.length - 1 && statCards.length % 2 !== 0
						return (
							<Card
								key={stat.label}
								className={cn(
									'text-white hover:shadow-lg transition-shadow rounded-lg',
									stat.bgColor,
									isLastOddCard ? 'col-span-2 lg:col-span-1' : 'lg:col-span-1'
								)}
							>
								<CardContent className="pt-3 sm:pt-5 pb-2 sm:pb-4 px-3 sm:px-5">
									<div className="flex items-center justify-between">
										<div>
											<p className={cn('text-xs font-medium', stat.textColorSubtle)}>{stat.label}</p>
											<p className="text-lg sm:text-2xl font-bold mt-0 sm:mt-1">{stat.value}</p>
											<p className={cn('text-[10px] mt-0 sm:mt-1', stat.textColorSubtle)}>{stat.subLabel}</p>
										</div>
										<div className={cn('p-2 rounded-full', stat.iconBgColor)}>
											<stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
										</div>
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>

				{/* Filters */}
				<Card className="border-none shadow-sm bg-white rounded-lg">
					<CardContent className="pt-3 pb-3 px-3 sm:px-6">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
							<div className="relative flex-grow">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
								<input
									type="text"
									placeholder="Search contracts..."
									className="pl-8 h-8 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm ring-offset-background"
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value)
										setCurrentPage(1)
									}}
								/>
							</div>
							<Select value={selectedType} onValueChange={(value) => {
								setSelectedType(value)
								setCurrentPage(1)
							}}>
								<SelectTrigger className="w-full sm:w-[200px] h-8 sm:h-10 text-xs sm:text-sm">
									<SelectValue placeholder="Filter by type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="Antivirus">Antivirus</SelectItem>
									<SelectItem value="Cyber Essentials">Cyber Essentials</SelectItem>
									<SelectItem value="Software Subscription">Software Subscription</SelectItem>
									<SelectItem value="Hardware Maintenance">Hardware Maintenance</SelectItem>
									<SelectItem value="Other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Contracts Table */}
				<Card className="bg-white rounded-lg shadow-sm overflow-hidden border">
					<CardContent className="p-0">
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
								<span className="ml-3 text-gray-500">Loading contracts...</span>
							</div>
						) : contracts.length === 0 ? (
							<div className="text-center py-12">
								<FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
								<h3 className="text-lg font-medium text-gray-900">No contracts found</h3>
								<p className="text-sm text-gray-500 mt-1">
									{searchTerm || selectedType !== 'all'
										? 'Try adjusting your search or filter criteria'
										: 'Get started by adding your first contract'}
								</p>
								{!searchTerm && selectedType === 'all' && (
									<Button
										className="mt-4"
										onClick={() => {
											setSelectedContract(null)
											setIsFormOpen(true)
										}}
									>
										Add Contract
									</Button>
								)}
							</div>
						) : (
							<>
								<div className="relative overflow-x-auto">
									<table className="w-full text-xs text-left">
										<thead className="bg-gray-50 text-xs">
											<tr className="border-b">
												<th className="px-2 py-2">Contract</th>
												<th className="px-2 py-2 hidden sm:table-cell">Type</th>
												<th className="px-2 py-2 hidden md:table-cell">Provider</th>
												<th className="px-2 py-2 hidden lg:table-cell">Start Date</th>
												<th className="px-2 py-2">Expiry</th>
												<th className="px-2 py-2 hidden md:table-cell">Cost (£)</th>
												<th className="px-2 py-2 hidden lg:table-cell">Remaining</th>
												<th className="px-2 py-2">Status</th>
												<th className="px-2 py-2 text-right">Actions</th>
											</tr>
										</thead>
										<tbody>
											{contracts.map((contract) => (
												<tr key={contract.id} className="border-b hover:bg-gray-50">
													<td className="px-2 py-2 font-medium">
														<div className="flex flex-col">
															<span className="font-semibold line-clamp-2">{contract.contractName}</span>
															<span className="text-gray-500 sm:hidden">{contract.provider}</span>
														</div>
													</td>
													<td className="px-2 py-2 hidden sm:table-cell">{contract.contractType}</td>
													<td className="px-2 py-2 hidden md:table-cell">{contract.provider}</td>
													<td className="px-2 py-2 hidden lg:table-cell">
														{format(parseISO(contract.startDate), 'dd/MM/yy')}
													</td>
													<td className="px-2 py-2 whitespace-nowrap">
														{format(parseISO(contract.expiryDate), 'dd/MM/yy')}
													</td>
													<td className="px-2 py-2 hidden md:table-cell">
														{contract.cost.toLocaleString()}
													</td>
													<td className="px-2 py-2 hidden lg:table-cell">
														<div className="flex items-center gap-1">
															<Progress
																value={contract.monthsRemaining * 33.33}
																className={`h-1.5 w-12 ${getProgressColor(contract.monthsRemaining)}`}
															/>
															<span className="whitespace-nowrap">{contract.monthsRemaining} mo</span>
														</div>
													</td>
													<td className="px-2 py-2">
														<Badge className={`text-[10px] px-1.5 py-0.5 ${getStatusColor(contract.status)}`}>
															{contract.status}
														</Badge>
													</td>
													<td className="px-2 py-2 text-right">
														<div className="flex items-center justify-end gap-0.5 sm:gap-1">
															<Button
																variant="ghost"
																className="inline-flex items-center justify-center h-7 w-7 p-0"
																onClick={() => openEditForm(contract)}
															>
																<Pencil className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																className="inline-flex items-center justify-center h-7 w-7 p-0"
																onClick={() => openDeleteDialog(contract)}
															>
																<Trash2 className="h-4 w-4 text-red-500" />
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Pagination Controls */}
								<div className="border-t border-gray-200 px-2 py-2 sm:px-4 sm:py-3">
									<div className="flex flex-col sm:flex-row items-center justify-between gap-2">
										<div className="text-[10px] sm:text-sm text-gray-500">
											Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1}-
											{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount}
										</div>
										<div className="flex items-center justify-center gap-1">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
												disabled={!pagination.hasPrevious}
												className="h-7 w-7 sm:h-8 sm:w-8 p-0"
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<div className="flex items-center gap-1">
												{renderPaginationButtons(currentPage, pagination.totalPages, setCurrentPage)}
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
												disabled={!pagination.hasNext}
												className="h-7 w-7 sm:h-8 sm:w-8 p-0"
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Add/Edit Form */}
			<ContractForm
				open={isFormOpen}
				onClose={() => {
					setIsFormOpen(false)
					setSelectedContract(null)
				}}
				onSubmit={selectedContract ? handleEditContract : handleAddContract}
				initialData={getFormInitialData()}
				isLoading={createMutation.isPending || updateMutation.isPending}
			/>

			{/* Delete Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the contract record
							{selectedContract && ` "${selectedContract.contractName}"`}.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteContract}
							disabled={deleteMutation.isPending}
							className="bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								'Delete'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export default ContractRenewalPage
