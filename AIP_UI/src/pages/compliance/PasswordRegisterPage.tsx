import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	Search,
	Eye,
	EyeOff,
	Pencil,
	Trash2,
	Link as LinkIcon,
	ChevronLeft,
	ChevronRight,
	Plus,
	Key,
	Shield,
	FileText,
	Globe,
	Loader2,
	Lock,
	AlertCircle,
	Copy,
	Check
} from 'lucide-react'
import { PasswordForm } from '@/components/compliance/PasswordForm'
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
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { passwordRegisterService } from '@/services/passwordRegisterService'
import type { PasswordRegister, CreatePasswordRegisterRequest, UpdatePasswordRegisterRequest } from '@/types/passwordRegister'

const PasswordRegisterPage = () => {
	const queryClient = useQueryClient()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState('')
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [selectedPassword, setSelectedPassword] = useState<PasswordRegister | null>(null)
	const [visiblePasswords, setVisiblePasswords] = useState<number[]>([])
	const [copiedId, setCopiedId] = useState<number | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 10

	// Fetch passwords using the API service
	const { data: passwordsResponse, isLoading, error } = useQuery({
		queryKey: ['passwords', currentPage, searchTerm],
		queryFn: () => passwordRegisterService.getPasswords({
			page: currentPage,
			pageSize,
			searchTerm: searchTerm || undefined,
		}),
	})

	// Create password mutation
	const createMutation = useMutation({
		mutationFn: (data: CreatePasswordRegisterRequest) => passwordRegisterService.createPassword(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['passwords'] })
			setIsFormOpen(false)
			toast({
				title: 'Password Added',
				description: 'The password has been securely stored.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to add password',
				variant: 'destructive',
			})
		},
	})

	// Update password mutation
	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdatePasswordRegisterRequest }) =>
			passwordRegisterService.updatePassword(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['passwords'] })
			setIsFormOpen(false)
			setSelectedPassword(null)
			toast({
				title: 'Password Updated',
				description: 'The password has been successfully updated.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to update password',
				variant: 'destructive',
			})
		},
	})

	// Delete password mutation
	const deleteMutation = useMutation({
		mutationFn: (id: number) => passwordRegisterService.deletePassword(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['passwords'] })
			setIsDeleteDialogOpen(false)
			setSelectedPassword(null)
			toast({
				title: 'Password Deleted',
				description: 'The password has been permanently removed.',
			})
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message || 'Failed to delete password',
				variant: 'destructive',
			})
		},
	})

	const passwords = passwordsResponse?.items ?? []
	const stats = passwordsResponse?.stats ?? { totalPasswords: 0, passwordsWithUrl: 0, passwordsWithNotes: 0 }
	const pagination = passwordsResponse?.pagination ?? { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 10, hasPrevious: false, hasNext: false }

	const statCards = [
		{
			title: 'Total Passwords',
			value: stats.totalPasswords,
			icon: Key,
			bgColor: 'bg-emerald-600',
			iconBg: 'bg-emerald-500'
		},
		{
			title: 'With URLs',
			value: stats.passwordsWithUrl,
			icon: Globe,
			bgColor: 'bg-teal-600',
			iconBg: 'bg-teal-500'
		},
		{
			title: 'With Notes',
			value: stats.passwordsWithNotes,
			icon: FileText,
			bgColor: 'bg-cyan-600',
			iconBg: 'bg-cyan-500'
		}
	]

	const handleAddPassword = useCallback((data: {
		title: string
		userName: string
		password: string
		url?: string
		notes?: string
	}) => {
		const request: CreatePasswordRegisterRequest = {
			title: data.title,
			userName: data.userName,
			password: data.password,
			url: data.url || undefined,
			notes: data.notes,
		}
		createMutation.mutate(request)
	}, [createMutation])

	const handleEditPassword = useCallback((data: {
		title: string
		userName: string
		password: string
		url?: string
		notes?: string
	}) => {
		if (!selectedPassword) return

		const request: UpdatePasswordRegisterRequest = {
			title: data.title,
			userName: data.userName,
			password: data.password,
			url: data.url || undefined,
			notes: data.notes,
		}
		updateMutation.mutate({ id: selectedPassword.id, data: request })
	}, [selectedPassword, updateMutation])

	const handleDeletePassword = useCallback(() => {
		if (!selectedPassword) return
		deleteMutation.mutate(selectedPassword.id)
	}, [selectedPassword, deleteMutation])

	const togglePasswordVisibility = useCallback((id: number) => {
		setVisiblePasswords((prev) =>
			prev.includes(id)
				? prev.filter((pId) => pId !== id)
				: [...prev, id]
		)
	}, [])

	const copyToClipboard = useCallback(async (text: string, id: number) => {
		try {
			await navigator.clipboard.writeText(text)
			setCopiedId(id)
			toast({
				title: 'Copied',
				description: 'Password copied to clipboard',
			})
			setTimeout(() => setCopiedId(null), 2000)
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to copy password',
				variant: 'destructive',
			})
		}
	}, [toast])

	const openEditForm = useCallback((password: PasswordRegister) => {
		setSelectedPassword(password)
		setIsFormOpen(true)
	}, [])

	const openDeleteDialog = useCallback((password: PasswordRegister) => {
		setSelectedPassword(password)
		setIsDeleteDialogOpen(true)
	}, [])

	const getFormInitialData = useCallback(() => {
		if (!selectedPassword) return undefined
		return {
			title: selectedPassword.title,
			userName: selectedPassword.userName,
			password: selectedPassword.password,
			url: selectedPassword.url || '',
			notes: selectedPassword.notes || '',
		}
	}, [selectedPassword])

	if (error) {
		return (
			<div className="min-h-screen bg-[#EFF4FF] p-4 sm:p-6">
				<div className="max-w-2xl mx-auto">
					<Card className="border-red-200 bg-white shadow-lg">
						<CardContent className="pt-8 pb-8">
							<div className="flex flex-col items-center text-center gap-4">
								<div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
									<AlertCircle className="h-8 w-8 text-red-600" />
								</div>
								<div>
									<h3 className="font-semibold text-lg text-gray-900">Error loading passwords</h3>
									<p className="text-sm text-gray-600 mt-1">{(error as Error).message}</p>
								</div>
								<Button
									variant="outline"
									className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
									onClick={() => queryClient.invalidateQueries({ queryKey: ['passwords'] })}
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
						<div className="flex items-center gap-3">
							<div className="h-11 w-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
								<Shield className="h-6 w-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
									Password Register
								</h1>
								<p className="text-gray-600 text-sm">
									Securely store and manage your credentials
								</p>
							</div>
						</div>
					</div>
					<Button
						onClick={() => {
							setSelectedPassword(null)
							setIsFormOpen(true)
						}}
						className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
					>
						<Plus className="h-5 w-5 mr-2" />
						Add Password
					</Button>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{statCards.map((stat) => (
						<Card
							key={stat.title}
							className={cn('border-0 shadow-md text-white', stat.bgColor)}
						>
							<CardContent className="pt-5 pb-4 px-5">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="text-xs sm:text-sm font-medium text-white/80">{stat.title}</p>
										<p className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</p>
									</div>
									<div className={cn('p-3 rounded-xl', stat.iconBg)}>
										<stat.icon className="h-6 w-6 text-white" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Search Section */}
				<Card className="border border-gray-200 bg-white shadow-sm">
					<CardContent className="p-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
							<Input
								type="text"
								placeholder="Search by title or username..."
								className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value)
									setCurrentPage(1)
								}}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Loading State */}
				{isLoading && (
					<Card className="border border-gray-200 bg-white shadow-sm">
						<CardContent className="py-16">
							<div className="flex flex-col items-center justify-center gap-4">
								<div className="relative">
									<div className="h-16 w-16 rounded-full border-4 border-emerald-200 animate-pulse" />
									<Loader2 className="h-8 w-8 text-emerald-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
								</div>
								<p className="text-gray-600 font-medium">Loading passwords...</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Empty State */}
				{!isLoading && passwords.length === 0 && (
					<Card className="border border-gray-200 bg-white shadow-sm">
						<CardContent className="py-16">
							<div className="flex flex-col items-center text-center gap-4 max-w-sm mx-auto">
								<div className="h-20 w-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
									<Lock className="h-10 w-10 text-emerald-600" />
								</div>
								<div className="space-y-2">
									<h3 className="text-xl font-semibold text-gray-900">No passwords found</h3>
									<p className="text-gray-600">
										{searchTerm
											? 'Try adjusting your search to find what you\'re looking for.'
											: 'Start by adding your first password to the secure register.'}
									</p>
								</div>
								{!searchTerm && (
									<Button
										onClick={() => {
											setSelectedPassword(null)
											setIsFormOpen(true)
										}}
										className="mt-2 bg-emerald-600 hover:bg-emerald-700"
									>
										<Plus className="h-5 w-5 mr-2" />
										Add Your First Password
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Password Cards Grid */}
				{!isLoading && passwords.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{passwords.map((password) => (
							<Card
								key={password.id}
								className="group border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200"
							>
								<CardContent className="p-0">
									{/* Header */}
									<div className="p-4 border-b border-gray-100 bg-gray-50/50">
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-3 min-w-0">
												<div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
													<Key className="h-5 w-5 text-white" />
												</div>
												<div className="min-w-0">
													<h3 className="font-semibold text-gray-900 truncate">{password.title}</h3>
													<p className="text-xs text-gray-500 truncate">{password.userName}</p>
												</div>
											</div>
											<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => openEditForm(password)}
													className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => openDeleteDialog(password)}
													className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>

									{/* Password Field */}
									<div className="p-4 space-y-3">
										<div className="flex items-center gap-2">
											<div className="flex-grow bg-gray-100 rounded-lg px-3 py-2 font-mono text-sm text-gray-700 truncate">
												{visiblePasswords.includes(password.id) ? password.password : '••••••••••••'}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => togglePasswordVisibility(password.id)}
												className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
											>
												{visiblePasswords.includes(password.id) ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => copyToClipboard(password.password, password.id)}
												className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
											>
												{copiedId === password.id ? (
													<Check className="h-4 w-4 text-emerald-600" />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</Button>
										</div>

										{/* URL */}
										{password.url && (
											<a
												href={password.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
											>
												<LinkIcon className="h-4 w-4" />
												<span className="truncate">{password.url}</span>
											</a>
										)}

										{/* Notes Badge */}
										{password.notes && (
											<Badge className="bg-gray-100 text-gray-600 border-0 text-xs hover:bg-gray-100">
												<FileText className="h-3 w-3 mr-1" />
												Has notes
											</Badge>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Pagination */}
				{!isLoading && passwords.length > 0 && pagination.totalPages > 1 && (
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
						<p className="text-sm text-gray-600">
							Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
							{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
							{pagination.totalCount} passwords
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={!pagination.hasPrevious}
								className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>
							<div className="flex items-center gap-1">
								{Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map((page) => (
									<Button
										key={page}
										variant={currentPage === page ? 'default' : 'outline'}
										size="sm"
										onClick={() => setCurrentPage(page)}
										className={cn(
											'h-9 w-9 p-0',
											currentPage === page
												? 'bg-emerald-600 hover:bg-emerald-700 text-white'
												: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
										)}
									>
										{page}
									</Button>
								))}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
								disabled={!pagination.hasNext}
								className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Add/Edit Form */}
			<PasswordForm
				open={isFormOpen}
				onClose={() => {
					setIsFormOpen(false)
					setSelectedPassword(null)
				}}
				onSubmit={selectedPassword ? handleEditPassword : handleAddPassword}
				initialData={getFormInitialData()}
				isLoading={createMutation.isPending || updateMutation.isPending}
			/>

			{/* Delete Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent className="bg-white border-gray-200">
					<AlertDialogHeader>
						<div className="flex items-center gap-4">
							<div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
								<Trash2 className="h-6 w-6 text-red-600" />
							</div>
							<div>
								<AlertDialogTitle className="text-gray-900">Delete Password</AlertDialogTitle>
								<AlertDialogDescription className="text-gray-600 mt-1">
									This will permanently remove <span className="font-medium text-gray-900">{selectedPassword?.title}</span> from the register.
								</AlertDialogDescription>
							</div>
						</div>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-4">
						<AlertDialogCancel disabled={deleteMutation.isPending} className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeletePassword}
							disabled={deleteMutation.isPending}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{deleteMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								'Delete Password'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export default PasswordRegisterPage
