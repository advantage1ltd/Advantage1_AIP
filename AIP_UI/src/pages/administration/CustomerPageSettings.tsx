import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/components/ui/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/ui/loading-state'
import { Search, Save, Building2, AlertCircle, CheckCircle2, CheckSquare, Square, Filter, X } from 'lucide-react'
import { customerPageAccessApi, type CustomerPageAccessPage } from '@/api/customerPageAccess'
import { customerService } from '@/services/customerService'
import { customerPageAccessCache } from '@/services/customerPageAccessCache'
import type { Customer } from '@/types/customer'

const CustomerPageSettings: React.FC = () => {
	const [customers, setCustomers] = useState<Customer[]>([])
	const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
	const selectedCustomer = customers.find(c => c.id === selectedCustomerId?.toString() || parseInt(c.id) === selectedCustomerId)
	const [availablePages, setAvailablePages] = useState<CustomerPageAccessPage[]>([])
	const [assignedPageIds, setAssignedPageIds] = useState<Set<string>>(new Set())
	const [isLoading, setIsLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
	const [hasChanges, setHasChanges] = useState(false)
	const [originalAssignedPageIds, setOriginalAssignedPageIds] = useState<Set<string>>(new Set())

	useEffect(() => {
		loadCustomers()
	}, [])

	useEffect(() => {
		if (selectedCustomerId && selectedCustomerId > 0) {
			loadCustomerPageAccess(selectedCustomerId)
		} else {
			setAvailablePages([])
			setAssignedPageIds(new Set())
			setOriginalAssignedPageIds(new Set())
			setHasChanges(false)
		}
	}, [selectedCustomerId])

	const loadCustomers = async () => {
		try {
			setIsLoading(true)
			const data = await customerService.getAllCustomers()
			setCustomers(data)
		} catch (error) {
			console.error('Error loading customers:', error)
			toast({
				title: 'Error',
				description: 'Failed to load customers. Please try again.',
				variant: 'destructive'
			})
		} finally {
			setIsLoading(false)
		}
	}

	const loadCustomerPageAccess = async (customerId: number) => {
		try {
			setIsLoading(true)
			console.log('🔍 [CustomerPageSettings] Loading page access for customer:', customerId)
			const response = await customerPageAccessApi.getCustomerPageAccess(customerId)
			console.log('✅ [CustomerPageSettings] Page access loaded:', {
				customerId: response.customerId,
				customerName: response.customerName,
				availablePagesCount: response.availablePages.length,
				assignedPageIdsCount: response.assignedPageIds.length,
				availablePages: response.availablePages.map(p => ({ id: p.pageId, title: p.title, category: p.category, path: p.path }))
			})
			
			if (response.availablePages.length === 0) {
				console.warn('⚠️ [CustomerPageSettings] No pages available for assignment. This may indicate:')
				console.warn('   1. Pages with category "Customer" or path starting with "/customer" are not in the database')
				console.warn('   2. Pages need to be synced from PAGE_DEFINITIONS to the database')
				console.warn('   3. Pages exist but are marked as inactive (IsActive = false)')
			}
			
			setAvailablePages(response.availablePages)
			const assignedSet = new Set(response.assignedPageIds)
			setAssignedPageIds(assignedSet)
			setOriginalAssignedPageIds(new Set(assignedSet))
			setHasChanges(false)
			
			if (response.availablePages.length === 0) {
				toast({
					title: 'No Pages Available',
					description: 'No customer pages found in the database. Please ensure pages are synced from the page definitions.',
					variant: 'default'
				})
			}
		} catch (error: any) {
			console.error('❌ [CustomerPageSettings] Error loading customer page access:', error)
			const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load customer page access. Please try again.'
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive'
			})
			// Reset state on error
			setAvailablePages([])
			setAssignedPageIds(new Set())
			setOriginalAssignedPageIds(new Set())
			setHasChanges(false)
		} finally {
			setIsLoading(false)
		}
	}

	const handleTogglePage = (pageId: string) => {
		const newAssigned = new Set(assignedPageIds)
		if (newAssigned.has(pageId)) {
			newAssigned.delete(pageId)
		} else {
			newAssigned.add(pageId)
		}
		setAssignedPageIds(newAssigned)
		setHasChanges(!setsEqual(newAssigned, originalAssignedPageIds))
	}

	const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
		if (a.size !== b.size) return false
		for (const item of a) {
			if (!b.has(item)) return false
		}
		return true
	}

	const handleSave = async () => {
		if (!selectedCustomerId) return

		try {
			setIsSaving(true)
			const response = await customerPageAccessApi.updateCustomerPageAccess(
				selectedCustomerId,
				Array.from(assignedPageIds)
			)
			
			// Clear the cache for this customer so Customer Reporting will fetch fresh data
			customerPageAccessCache.clear(selectedCustomerId)
			
			// Update the cache with the new data immediately
			customerPageAccessCache.set(selectedCustomerId, response)
			
			// Dispatch event to notify other components (like Customer Reporting) that page access was updated
			window.dispatchEvent(new CustomEvent('customer-page-access-updated', {
				detail: {
					customerId: selectedCustomerId,
					customerName: selectedCustomer?.companyName || 'Unknown',
					assignedPageIds: response.assignedPageIds,
					assignedCount: response.assignedPageIds.length
				}
			}))
			
			// Update local state
			setAvailablePages(response.availablePages)
			const assignedSet = new Set(response.assignedPageIds)
			setAssignedPageIds(assignedSet)
			setOriginalAssignedPageIds(new Set(assignedSet))
			setHasChanges(false)
			
			console.log('✅ [CustomerPageSettings] Saved and cleared cache for customer:', selectedCustomerId)
			
			toast({
				title: 'Success',
				description: 'Customer page access updated successfully.',
				variant: 'default'
			})
		} catch (error) {
			console.error('Error saving customer page access:', error)
			toast({
				title: 'Error',
				description: 'Failed to save customer page access. Please try again.',
				variant: 'destructive'
			})
		} finally {
			setIsSaving(false)
		}
	}

	const handleReset = () => {
		setAssignedPageIds(new Set(originalAssignedPageIds))
		setHasChanges(false)
	}

	// Get unique categories for filter (must be before filteredPages)
	const availableCategories = Array.from(new Set(availablePages.map(p => p.category).filter(Boolean))) as string[]
	
	// Filter pages based on search, category, and assignment filters
	const filteredPages = availablePages.filter(page => {
		// Search filter
		const searchLower = searchQuery.toLowerCase()
		const matchesSearch = (
			page.title.toLowerCase().includes(searchLower) ||
			page.path.toLowerCase().includes(searchLower) ||
			page.category?.toLowerCase().includes(searchLower) ||
			page.description?.toLowerCase().includes(searchLower)
		)
		
		// Category filter
		const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory
		
		// Assignment filter
		const isAssigned = assignedPageIds.has(page.pageId)
		const matchesAssignment = 
			assignmentFilter === 'all' ||
			(assignmentFilter === 'assigned' && isAssigned) ||
			(assignmentFilter === 'unassigned' && !isAssigned)
		
		return matchesSearch && matchesCategory && matchesAssignment
	})

	// Check if all filtered pages are assigned (must be after filteredPages)
	const allFilteredAssigned = filteredPages.length > 0 && filteredPages.every(p => assignedPageIds.has(p.pageId))
	const someFilteredAssigned = filteredPages.some(p => assignedPageIds.has(p.pageId))

	// Bulk operations (must be after filteredPages)
	const handleSelectAll = () => {
		const allPageIds = new Set(filteredPages.map(p => p.pageId))
		setAssignedPageIds(new Set([...assignedPageIds, ...allPageIds]))
		setHasChanges(!setsEqual(new Set([...assignedPageIds, ...allPageIds]), originalAssignedPageIds))
	}

	const handleDeselectAll = () => {
		const filteredPageIds = new Set(filteredPages.map(p => p.pageId))
		const newAssigned = new Set(assignedPageIds)
		filteredPageIds.forEach(id => newAssigned.delete(id))
		setAssignedPageIds(newAssigned)
		setHasChanges(!setsEqual(newAssigned, originalAssignedPageIds))
	}

	const handleSelectByCategory = (category: string) => {
		const categoryPages = availablePages.filter(p => p.category === category)
		const categoryPageIds = new Set(categoryPages.map(p => p.pageId))
		const newAssigned = new Set([...assignedPageIds, ...categoryPageIds])
		setAssignedPageIds(newAssigned)
		setHasChanges(!setsEqual(newAssigned, originalAssignedPageIds))
	}

	const handleDeselectByCategory = (category: string) => {
		const categoryPages = availablePages.filter(p => p.category === category)
		const categoryPageIds = new Set(categoryPages.map(p => p.pageId))
		const newAssigned = new Set(assignedPageIds)
		categoryPageIds.forEach(id => newAssigned.delete(id))
		setAssignedPageIds(newAssigned)
		setHasChanges(!setsEqual(newAssigned, originalAssignedPageIds))
	}

	const pagesByCategory = filteredPages.reduce((acc, page) => {
		const category = page.category || 'Other'
		if (!acc[category]) {
			acc[category] = []
		}
		acc[category].push(page)
		return acc
	}, {} as Record<string, CustomerPageAccessPage[]>)


	return (
		<div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 2xl:px-8 py-2 sm:py-3 md:py-4 lg:py-6 space-y-2 sm:space-y-3 md:space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5 text-primary" />
						Customer Page Settings
					</CardTitle>
					<CardDescription>
						Assign customer-specific pages that will be visible to each customer when they log in.
						Dashboard is always available.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Customer Selection */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Select Customer</label>
						<Select
							value={selectedCustomerId?.toString() || ''}
							onValueChange={(value) => setSelectedCustomerId(value ? parseInt(value) : null)}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Choose a customer..." />
							</SelectTrigger>
							<SelectContent>
								{customers.map((customer) => {
									const customerIdNum = typeof customer.id === 'string' ? parseInt(customer.id) : customer.id
									return (
										<SelectItem key={customer.id} value={customerIdNum.toString()}>
											{customer.companyName}
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
					</div>

					{selectedCustomer && (
						<>
							{/* Customer Info and Statistics */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Alert>
									<Building2 className="h-4 w-4" />
									<AlertTitle>Configuring pages for: {selectedCustomer.companyName}</AlertTitle>
									<AlertDescription>
										Only assigned pages (plus Dashboard) will be visible to this customer.
									</AlertDescription>
								</Alert>
								
								{/* Statistics Card */}
								<Card>
									<CardContent className="pt-6">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="text-2xl font-bold">{availablePages.length}</div>
												<div className="text-xs text-muted-foreground">Total Pages</div>
											</div>
											<div>
												<div className="text-2xl font-bold text-primary">{assignedPageIds.size}</div>
												<div className="text-xs text-muted-foreground">Assigned</div>
											</div>
											<div>
												<div className="text-2xl font-bold">{availablePages.length - assignedPageIds.size}</div>
												<div className="text-xs text-muted-foreground">Unassigned</div>
											</div>
											<div>
												<div className="text-2xl font-bold">
													{availablePages.length > 0 
														? Math.round((assignedPageIds.size / availablePages.length) * 100)
														: 0}%
												</div>
												<div className="text-xs text-muted-foreground">Coverage</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Search and Filters */}
							<div className="space-y-3">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search pages by title, path, category, or description..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-9"
									/>
									{searchQuery && (
										<button
											onClick={() => setSearchQuery('')}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											aria-label="Clear search"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</div>
								
								<div className="flex flex-wrap gap-2">
									{/* Category Filter */}
									<Select value={selectedCategory} onValueChange={setSelectedCategory}>
										<SelectTrigger className="w-[180px]">
											<Filter className="h-4 w-4 mr-2" />
											<SelectValue placeholder="All Categories" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Categories</SelectItem>
											{availableCategories.map(category => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									{/* Assignment Filter */}
									<Select value={assignmentFilter} onValueChange={(value: 'all' | 'assigned' | 'unassigned') => setAssignmentFilter(value)}>
										<SelectTrigger className="w-[160px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Pages</SelectItem>
											<SelectItem value="assigned">Assigned Only</SelectItem>
											<SelectItem value="unassigned">Unassigned Only</SelectItem>
										</SelectContent>
									</Select>

									{/* Clear Filters */}
									{(selectedCategory !== 'all' || assignmentFilter !== 'all' || searchQuery) && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setSelectedCategory('all')
												setAssignmentFilter('all')
												setSearchQuery('')
											}}
										>
											<X className="h-4 w-4 mr-2" />
											Clear Filters
										</Button>
									)}
								</div>
							</div>

							{/* Statistics and Action Buttons */}
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
									<div className="text-sm">
										<span className="font-medium">{filteredPages.length}</span>{' '}
										{filteredPages.length === 1 ? 'page' : 'pages'} found
										{assignedPageIds.size > 0 && (
											<span className="ml-2 text-muted-foreground">
												• <span className="font-medium text-foreground">{assignedPageIds.size}</span> assigned
											</span>
										)}
									</div>
									{filteredPages.length > 0 && (
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={allFilteredAssigned ? handleDeselectAll : handleSelectAll}
												disabled={isSaving}
											>
												{allFilteredAssigned ? (
													<>
														<Square className="h-4 w-4 mr-2" />
														Deselect All
													</>
												) : (
													<>
														<CheckSquare className="h-4 w-4 mr-2" />
														Select All
													</>
												)}
											</Button>
										</div>
									)}
								</div>
								<div className="flex gap-2">
									{hasChanges && (
										<Button variant="outline" onClick={handleReset} disabled={isSaving}>
											Reset
										</Button>
									)}
									<Button onClick={handleSave} disabled={!hasChanges || isSaving}>
										{isSaving ? (
											<>
												<LoadingSpinner size="sm" className="mr-2" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</div>
							</div>

							{/* Pages Table */}
							{isLoading ? (
								<div className="flex items-center justify-center py-12">
									<LoadingSpinner size="lg" />
								</div>
							) : (
								<div className="border rounded-md overflow-hidden">
									<ScrollArea className="h-[600px]">
										<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">Assign</TableHead>
												<TableHead>Page</TableHead>
												<TableHead className="hidden md:table-cell">Description</TableHead>
												<TableHead className="hidden lg:table-cell">Path</TableHead>
												<TableHead className="hidden sm:table-cell">Category</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{Object.entries(pagesByCategory).map(([category, pages]) => {
												const categoryAssignedCount = pages.filter(p => assignedPageIds.has(p.pageId)).length
												const allCategoryAssigned = categoryAssignedCount === pages.length
												const someCategoryAssigned = categoryAssignedCount > 0
												
												return (
													<React.Fragment key={category}>
														<TableRow className="bg-muted/50 hover:bg-muted/70">
															<TableCell>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => allCategoryAssigned 
																		? handleDeselectByCategory(category)
																		: handleSelectByCategory(category)
																	}
																	className="h-6 w-6 p-0"
																	disabled={isSaving}
																	title={allCategoryAssigned ? 'Deselect all in category' : 'Select all in category'}
																>
																	{allCategoryAssigned ? (
																		<CheckSquare className="h-4 w-4" />
																	) : someCategoryAssigned ? (
																		<Square className="h-4 w-4 opacity-50" />
																	) : (
																		<Square className="h-4 w-4" />
																	)}
																</Button>
															</TableCell>
															<TableCell colSpan={5} className="font-semibold">
																<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
																	<span>{category}</span>
																	<Badge variant="secondary">
																		{categoryAssignedCount} / {pages.length}
																	</Badge>
																</div>
															</TableCell>
														</TableRow>
														{pages.map((page) => {
															const isAssigned = assignedPageIds.has(page.pageId)
															return (
																<TableRow 
																	key={page.id}
																	className={isAssigned ? 'bg-primary/5' : ''}
																>
																	<TableCell>
																		<Switch
																			checked={isAssigned}
																			onCheckedChange={() => handleTogglePage(page.pageId)}
																			disabled={isSaving}
																		/>
																	</TableCell>
																	<TableCell className="font-medium">
																		<div className="flex flex-col gap-1">
																			<div className="flex items-center gap-2">
																				{page.title}
																				{isAssigned && (
																					<CheckCircle2 className="h-4 w-4 text-primary" />
																				)}
																			</div>
																			{/* Show description on mobile when hidden */}
																			<div className="md:hidden text-xs text-muted-foreground">
																				{page.description || 'No description'}
																			</div>
																			{/* Show path on mobile when hidden */}
																			<div className="lg:hidden text-xs text-muted-foreground font-mono">
																				{page.path}
																			</div>
																		</div>
																	</TableCell>
																	<TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[300px]">
																		<div className="truncate" title={page.description || 'No description'}>
																			{page.description || (
																				<span className="italic text-muted-foreground/60">No description</span>
																			)}
																		</div>
																	</TableCell>
																	<TableCell className="hidden lg:table-cell text-muted-foreground text-sm font-mono">
																		{page.path}
																	</TableCell>
																	<TableCell className="hidden sm:table-cell">
																		<Badge variant="outline">{page.category || 'Other'}</Badge>
																	</TableCell>
																</TableRow>
															)
														})}
													</React.Fragment>
												)
											})}
										</TableBody>
									</Table>
									</ScrollArea>
								</div>
							)}

							{filteredPages.length === 0 && !isLoading && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>No pages found</AlertTitle>
									<AlertDescription>
										{searchQuery || selectedCategory !== 'all' || assignmentFilter !== 'all' ? (
											<>
												No customer pages match your current filters. Try adjusting your search or filter criteria.
												<Button
													variant="link"
													className="p-0 h-auto ml-1"
													onClick={() => {
														setSearchQuery('')
														setSelectedCategory('all')
														setAssignmentFilter('all')
													}}
												>
													Clear all filters
												</Button>
											</>
										) : availablePages.length === 0 ? (
											<>
												No customer pages are available in the database. This usually means:
												<ul className="list-disc list-inside mt-2 space-y-1 text-sm">
													<li>Pages with category "Customer" or path starting with "/customer" need to be synced to the database</li>
													<li>Go to Settings page and use the "Sync Pages" feature to sync pages from definitions</li>
													<li>Or ensure pages in the database have category "Customer" or paths starting with "/customer"</li>
												</ul>
											</>
										) : (
											'No pages match the current filters. Try adjusting your search or filter criteria.'
										)}
									</AlertDescription>
								</Alert>
							)}
						</>
					)}

					{!selectedCustomer && !isLoading && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>No customer selected</AlertTitle>
							<AlertDescription>
								Please select a customer from the dropdown above to configure their page access.
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

export default CustomerPageSettings

