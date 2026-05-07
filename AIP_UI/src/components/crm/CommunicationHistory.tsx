import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { crmContactService } from '@/services/crmContactService'
import { CommunicationLog } from '@/types/crmContact'
import { Loader2, Calendar, Filter, X, MessageSquare, Phone, Mail, Users, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast as hotToast } from 'react-toastify'

interface CommunicationHistoryProps {
	contactId: string
	contactName: string
	onClose: () => void
}

type CommsType = 'Call' | 'Email' | 'Meeting' | 'Note' | 'Other'

const COMMS_TYPE_ICONS = {
	Call: Phone,
	Email: Mail,
	Meeting: Users,
	Note: FileText,
	Other: MessageSquare
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export function CommunicationHistory({ contactId, contactName, onClose }: CommunicationHistoryProps) {
	const [logs, setLogs] = useState<CommunicationLog[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [dateFilter, setDateFilter] = useState<string>('all')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)

	useEffect(() => {
		loadCommunicationLogs()
	}, [contactId])

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [searchQuery, typeFilter, dateFilter])

	const loadCommunicationLogs = async () => {
		try {
			setIsLoading(true)
			const fetchedLogs = await crmContactService.getCommunicationLogs(contactId)
			// Sort by date descending (most recent first)
			const sortedLogs = fetchedLogs.sort((a, b) => {
				const dateA = new Date(a.callDate).getTime()
				const dateB = new Date(b.callDate).getTime()
				return dateB - dateA
			})
			setLogs(sortedLogs)
		} catch (error) {
			console.error('Error loading communication logs:', error)
			hotToast.error('Failed to load communication history')
		} finally {
			setIsLoading(false)
		}
	}

	const filteredLogs = useMemo(() => {
		let filtered = [...logs]

		// Filter by type
		if (typeFilter !== 'all') {
			filtered = filtered.filter(log => log.commsType === typeFilter)
		}

		// Filter by date range
		if (dateFilter !== 'all') {
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
			
			filtered = filtered.filter(log => {
				const logDate = new Date(log.callDate)
				const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate())
				
				switch (dateFilter) {
					case 'today':
						return logDateOnly.getTime() === today.getTime()
					case 'week':
						const weekAgo = new Date(today)
						weekAgo.setDate(weekAgo.getDate() - 7)
						return logDate >= weekAgo
					case 'month':
						const monthAgo = new Date(today)
						monthAgo.setMonth(monthAgo.getMonth() - 1)
						return logDate >= monthAgo
					case 'year':
						const yearAgo = new Date(today)
						yearAgo.setFullYear(yearAgo.getFullYear() - 1)
						return logDate >= yearAgo
					default:
						return true
				}
			})
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(log =>
				log.personSpokenTo.toLowerCase().includes(query) ||
				log.notes.toLowerCase().includes(query) ||
				log.commsType.toLowerCase().includes(query)
			)
		}

		return filtered
	}, [logs, typeFilter, dateFilter, searchQuery])

	// Pagination calculations
	const paginatedLogs = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		return filteredLogs.slice(startIndex, endIndex)
	}, [filteredLogs, currentPage, itemsPerPage])

	const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
	const startItem = filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
	const endItem = Math.min(currentPage * itemsPerPage, filteredLogs.length)

	const formatDateTime = (dateString: string) => {
		try {
			const date = new Date(dateString)
			if (dateString.includes('T')) {
				return format(date, 'dd/MM/yyyy HH:mm')
			}
			return format(date, 'dd/MM/yyyy')
		} catch {
			return dateString
		}
	}

	const stats = useMemo(() => {
		const total = logs.length
		const byType = logs.reduce((acc, log) => {
			acc[log.commsType] = (acc[log.commsType] || 0) + 1
			return acc
		}, {} as Record<string, number>)
		
		const mostRecent = logs.length > 0 ? logs[0] : null
		
		return { total, byType, mostRecent }
	}, [logs])

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Communication History</h2>
					<p className="text-sm text-muted-foreground">{contactName}</p>
				</div>
				<Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground">Total Communications</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold">{Object.keys(stats.byType).length}</div>
						<p className="text-xs text-muted-foreground">Communication Types</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-sm font-medium">
							{stats.mostRecent ? formatDateTime(stats.mostRecent.callDate) : 'N/A'}
						</div>
						<p className="text-xs text-muted-foreground">Most Recent</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Filter className="h-4 w-4" />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<label htmlFor="search" className="text-sm font-medium">Search</label>
							<Input
								id="search"
								placeholder="Search by person, notes, or type..."
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="type-filter" className="text-sm font-medium">Type</label>
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger id="type-filter">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="Call">Call</SelectItem>
									<SelectItem value="Email">Email</SelectItem>
									<SelectItem value="Meeting">Meeting</SelectItem>
									<SelectItem value="Note">Note</SelectItem>
									<SelectItem value="Other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label htmlFor="date-filter" className="text-sm font-medium">Date Range</label>
							<Select value={dateFilter} onValueChange={setDateFilter}>
								<SelectTrigger id="date-filter">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Time</SelectItem>
									<SelectItem value="today">Today</SelectItem>
									<SelectItem value="week">Last 7 Days</SelectItem>
									<SelectItem value="month">Last Month</SelectItem>
									<SelectItem value="year">Last Year</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Communication Logs List */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-base">
							History ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
						</CardTitle>
						{filteredLogs.length > 0 && (
							<div className="flex items-center gap-2">
								<label htmlFor="items-per-page" className="text-sm text-muted-foreground">
									Items per page:
								</label>
								<Select value={itemsPerPage.toString()} onValueChange={(value) => {
									setItemsPerPage(Number(value))
									setCurrentPage(1)
								}}>
									<SelectTrigger id="items-per-page" className="w-20 h-8">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{ITEMS_PER_PAGE_OPTIONS.map(option => (
											<SelectItem key={option} value={option.toString()}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							<span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
						</div>
					) : filteredLogs.length === 0 ? (
						<div className="text-center py-12">
							<MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-sm text-muted-foreground">
								{logs.length === 0
									? 'No communication history found for this contact.'
									: 'No communications match your filters.'}
							</p>
						</div>
					) : (
						<>
							<div className="space-y-4 min-h-[400px]">
								{paginatedLogs.map((log, index) => {
									const Icon = COMMS_TYPE_ICONS[log.commsType as CommsType] || MessageSquare
									return (
										<div key={log.id}>
											<Card className="border-l-4 border-l-primary">
												<CardContent className="pt-6">
													<div className="flex items-start justify-between gap-4">
														<div className="flex-1 space-y-3">
															<div className="flex items-center gap-3">
																<div className="p-2 rounded-lg bg-primary/10">
																	<Icon className="h-4 w-4 text-primary" />
																</div>
																<div className="flex-1">
																	<div className="flex items-center gap-2 flex-wrap">
																		<Badge variant="outline">{log.commsType}</Badge>
																		<span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
																			<Calendar className="h-3 w-3" />
																			{formatDateTime(log.callDate)}
																		</span>
																	</div>
																	<p className="text-sm font-semibold mt-1">
																		Person: {log.personSpokenTo}
																	</p>
																</div>
															</div>
															<div className="pl-12">
																<p className="text-sm text-muted-foreground whitespace-pre-wrap">
																	{log.notes}
																</p>
																{log.createdAt && (
																	<p className="text-xs text-muted-foreground/70 mt-2">
																		Logged: {formatDateTime(log.createdAt)}
																	</p>
																)}
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
											{index < paginatedLogs.length - 1 && <Separator className="my-2" />}
										</div>
									)
								})}
							</div>

							{/* Pagination Controls */}
							{totalPages > 1 && (
								<div className="mt-6 pt-4 border-t">
									<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
										<div className="text-sm text-muted-foreground">
											Showing {startItem} to {endItem} of {filteredLogs.length} entries
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
												disabled={currentPage === 1}
												aria-label="Previous page"
											>
												<ChevronLeft className="h-4 w-4" />
												<span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
											</Button>
											
											<div className="flex items-center gap-1">
												{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
													let pageNum: number
													if (totalPages <= 5) {
														pageNum = i + 1
													} else if (currentPage <= 3) {
														pageNum = i + 1
													} else if (currentPage >= totalPages - 2) {
														pageNum = totalPages - 4 + i
													} else {
														pageNum = currentPage - 2 + i
													}
													
													return (
														<Button
															key={pageNum}
															variant={currentPage === pageNum ? 'default' : 'outline'}
															size="sm"
															onClick={() => setCurrentPage(pageNum)}
															className="w-8 h-8 p-0"
															aria-label={`Go to page ${pageNum}`}
															aria-current={currentPage === pageNum ? 'page' : undefined}
														>
															{pageNum}
														</Button>
													)
												})}
											</div>

											<Button
												variant="outline"
												size="sm"
												onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
												disabled={currentPage === totalPages}
												aria-label="Next page"
											>
												<span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
