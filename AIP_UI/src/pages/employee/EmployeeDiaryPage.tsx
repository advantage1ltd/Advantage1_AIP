import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Briefcase, CalendarDays, CreditCard, FileText, HardHat, Loader2, RefreshCw, ShieldAlert, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/services/employeeService'
import { employeeDiaryService } from '@/services/employeeDiaryService'
import type { Employee } from '@/types/employee'
import type { EmployeeDiary } from '@/types/employeeDiary'

type UserWithLegacyEmployeeId = { employeeId?: number; EmployeeId?: number | string; role?: string }

const normalizeStatus = (value: string | null | undefined) => String(value ?? '').trim().toLowerCase()
const isPendingStatus = (value: string | null | undefined) => normalizeStatus(value) === 'pending'

const getStatusBadgeVariant = (status: string | null | undefined): 'default' | 'secondary' | 'destructive' => {
	const s = normalizeStatus(status)
	if (s === 'pending') return 'destructive'
	if (s === 'approved' || s === 'completed' || s === 'fulfilled') return 'default'
	return 'secondary'
}

const formatDate = (value?: string | null) => {
	if (!value) return '—'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '—'
	return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }).format(date)
}

const formatMoney = (value?: number | null) => {
	if (value === null || value === undefined) return '—'
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
}

const getEmployeeLabel = (employee: Employee) => {
	const name = employee.fullName || `${employee.firstName} ${employee.surname}`.trim()
	return `${name} • ${employee.employeeNumber}`
}

const EmployeeDiaryPage = () => {
	const { user } = useAuth()
	const isAdmin = user?.role === 'administrator'
	const linkedEmployeeId = useMemo<number | null>(() => {
		if (!user) return null
		const legacy = user as unknown as UserWithLegacyEmployeeId
		const raw = legacy.employeeId ?? legacy.EmployeeId
		if (typeof raw === 'number' && Number.isFinite(raw)) return raw
		if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) return Number(raw)
		return null
	}, [user])

	const [employees, setEmployees] = useState<Employee[]>([])
	const [employeesLoading, setEmployeesLoading] = useState(false)
	const [employeesError, setEmployeesError] = useState<string | null>(null)

	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)

	const [diary, setDiary] = useState<EmployeeDiary | null>(null)
	const [diaryLoading, setDiaryLoading] = useState(false)
	const [diaryError, setDiaryError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true
		const loadEmployees = async () => {
			setEmployeesLoading(true)
			setEmployeesError(null)
			try {
				if (!isAdmin) {
					if (!linkedEmployeeId) {
						if (!isMounted) return
						setEmployees([])
						setEmployeesError('Your account is not linked to an employee record.')
						return
					}

					const employee = await employeeService.getEmployeeByIdAsFrontendInterface(linkedEmployeeId)
					if (!isMounted) return
					setEmployees([employee])
					setSelectedEmployeeId(employee.id)
					return
				}

				const result = await employeeService.getEmployeesAsFrontendInterface({ page: 1, pageSize: 200 })
				if (!isMounted) return
				setEmployees(result.employees)
			} catch (err) {
				console.error('❌ [EmployeeDiary] Failed to load employees:', err)
				if (!isMounted) return
				setEmployeesError(err instanceof Error ? err.message : 'Failed to load employees')
			} finally {
				if (!isMounted) return
				setEmployeesLoading(false)
			}
		}

		loadEmployees()
		return () => {
			isMounted = false
		}
	}, [isAdmin, linkedEmployeeId])

	useEffect(() => {
		if (!selectedEmployeeId) {
			setDiary(null)
			setDiaryError(null)
			return
		}

		let isMounted = true
		const loadDiary = async () => {
			setDiaryLoading(true)
			setDiaryError(null)
			try {
				const result = await employeeDiaryService.getEmployeeDiary(selectedEmployeeId)
				if (!isMounted) return
				setDiary(result)
			} catch (err) {
				console.error('❌ [EmployeeDiary] Failed to load diary:', err)
				if (!isMounted) return
				const message = err instanceof Error ? err.message : 'Failed to load employee diary'
				setDiaryError(message)
				toast({ title: 'Failed to load diary', description: message, variant: 'destructive' })
			} finally {
				if (!isMounted) return
				setDiaryLoading(false)
			}
		}

		loadDiary()
		return () => {
			isMounted = false
		}
	}, [selectedEmployeeId])

	const selectedEmployee = useMemo(() => {
		if (!selectedEmployeeId) return null
		return employees.find(e => e.id === selectedEmployeeId) || null
	}, [employees, selectedEmployeeId])

	const pending = useMemo(() => {
		if (!diary) {
			return {
				holiday: [] as EmployeeDiary['holidays'],
				expenses: [] as EmployeeDiary['expenses'],
				equipmentRequests: [] as EmployeeDiary['equipment']['requests'],
			}
		}

		return {
			holiday: diary.holidays.filter(h => isPendingStatus(h.status)),
			expenses: diary.expenses.filter(e => isPendingStatus(e.status)),
			equipmentRequests: diary.equipment.requests.filter(r => isPendingStatus(r.status)),
		}
	}, [diary])

	const pendingTotal = pending.holiday.length + pending.expenses.length + pending.equipmentRequests.length

	return (
		<div className="h-full bg-gradient-to-b from-muted/30 to-background">
			<div className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="px-4 md:px-6 py-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="space-y-1">
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem>Employee</BreadcrumbItem>
									<BreadcrumbSeparator />
									<BreadcrumbItem>
										<BreadcrumbPage>Diary</BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
							<div className="flex items-center gap-2">
								<h1 className="text-xl md:text-2xl font-semibold tracking-tight">Employee Diary</h1>
								<Badge variant="secondary" className="hidden sm:inline-flex">Aggregated</Badge>
							</div>
							<p className="text-sm text-muted-foreground">
								A unified view of holidays, incidents, expenses, licenses, equipment and training.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={() => selectedEmployeeId && setSelectedEmployeeId(selectedEmployeeId)}
								disabled={!selectedEmployeeId || diaryLoading}
								aria-label="Refresh employee diary"
							>
								{diaryLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Refreshing…
									</>
								) : (
									<>
										<RefreshCw className="mr-2 h-4 w-4" />
										Refresh
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="p-4 md:p-6 space-y-6">
				<Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
					<CardHeader className="border-b bg-muted/20">
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5 text-muted-foreground" />
							Select employee
						</CardTitle>
						<CardDescription>Admins can switch employees; officers only see their own diary.</CardDescription>
					</CardHeader>
					<CardContent className="p-4 md:p-6">
						<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
							<div className="w-full md:max-w-lg space-y-2">
								{employeesLoading ? (
									<div className="space-y-2">
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-4 w-2/3" />
									</div>
								) : (
									<>
										<Select
											value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
											onValueChange={(value) => setSelectedEmployeeId(value ? Number(value) : null)}
											disabled={!isAdmin}
										>
											<SelectTrigger className={cn('w-full', !isAdmin && 'opacity-100')}>
												<SelectValue placeholder={isAdmin ? 'Select an employee' : 'Your employee diary'} />
											</SelectTrigger>
											<SelectContent>
												{employees.map(employee => (
													<SelectItem key={employee.id} value={String(employee.id)}>
														{getEmployeeLabel(employee)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{employeesError && (
											<p className="text-sm text-red-600">{employeesError}</p>
										)}
									</>
								)}
							</div>

							{selectedEmployeeId && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Sparkles className="h-4 w-4" />
									<span>Tip: check the Pending tab for approvals</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{!selectedEmployeeId && (
					<Card>
						<CardContent className="p-6 text-sm text-muted-foreground">
							Select an employee to view diary details.
						</CardContent>
					</Card>
				)}

				{selectedEmployeeId && diaryLoading && (
					<Card className="border-border/60">
						<CardContent className="p-4 md:p-6 space-y-4">
							<div className="flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
								<p className="text-sm text-muted-foreground">Loading diary…</p>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-6 gap-3">
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton key={i} className="h-20 w-full" />
								))}
							</div>
							<Skeleton className="h-28 w-full" />
							<Skeleton className="h-10 w-80" />
							<Skeleton className="h-64 w-full" />
						</CardContent>
					</Card>
				)}

				{selectedEmployeeId && diaryError && !diaryLoading && (
					<Alert variant="destructive" className="py-3">
						<div className="flex items-start gap-2">
							<AlertCircle className="h-4 w-4 mt-0.5" />
							<div>
								<p className="text-sm font-medium">Unable to load employee diary</p>
								<p className="text-sm">{diaryError}</p>
							</div>
						</div>
					</Alert>
				)}

				{diary && (
					<>
						{pendingTotal > 0 && (
							<Card className="border-amber-200">
								<CardHeader>
									<CardTitle className="text-base">Pending approvals</CardTitle>
									<CardDescription>
										You have <span className="font-medium text-foreground">{pendingTotal}</span> pending item(s) across holidays, expenses, and equipment requests.
									</CardDescription>
								</CardHeader>
								<CardContent className="text-sm">
									<div className="flex flex-wrap gap-2">
										{pending.holiday.length > 0 && (
											<Badge variant="secondary">Holidays: {pending.holiday.length}</Badge>
										)}
										{pending.expenses.length > 0 && (
											<Badge variant="secondary">Expenses: {pending.expenses.length}</Badge>
										)}
										{pending.equipmentRequests.length > 0 && (
											<Badge variant="secondary">Equipment: {pending.equipmentRequests.length}</Badge>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						<div className="grid grid-cols-2 md:grid-cols-6 gap-3">
							<Card className="border-white/10 bg-gradient-to-br from-blue-950 to-blue-900 text-white shadow-sm">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs text-white/70">Holidays</p>
											<p className="text-lg font-semibold text-white">{diary.stats.holidayCount}</p>
										</div>
										<CalendarDays className="h-5 w-5 text-white/90" />
									</div>
								</CardContent>
							</Card>
							<Card className="border-white/10 bg-gradient-to-br from-rose-950 to-rose-900 text-white shadow-sm">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs text-white/70">Incidents</p>
											<p className="text-lg font-semibold text-white">{diary.stats.incidentCount}</p>
										</div>
										<ShieldAlert className="h-5 w-5 text-white/90" />
									</div>
								</CardContent>
							</Card>
							<Card className="border-white/10 bg-gradient-to-br from-emerald-950 to-emerald-900 text-white shadow-sm">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs text-white/70">Expenses</p>
											<p className="text-lg font-semibold text-white">{diary.stats.expenseCount}</p>
										</div>
										<CreditCard className="h-5 w-5 text-white/90" />
									</div>
								</CardContent>
							</Card>
							<Card className="border-white/10 bg-gradient-to-br from-amber-950 to-amber-900 text-white shadow-sm">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs text-white/70">Equipment requests</p>
											<p className="text-lg font-semibold text-white">{diary.stats.equipmentRequestCount}</p>
										</div>
										<HardHat className="h-5 w-5 text-white/90" />
									</div>
								</CardContent>
							</Card>
							<Card className="border-white/10 bg-gradient-to-br from-indigo-950 to-indigo-900 text-white shadow-sm">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs text-white/70">Equipment issued</p>
											<p className="text-lg font-semibold text-white">{diary.stats.equipmentIssuedCount}</p>
										</div>
										<Briefcase className="h-5 w-5 text-white/90" />
									</div>
								</CardContent>
							</Card>
							<Card className="border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 text-white shadow-sm">
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs text-white/70">Training tests</p>
											<p className="text-lg font-semibold text-white">{diary.stats.trainingTestCount}</p>
										</div>
										<FileText className="h-5 w-5 text-white/90" />
									</div>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>{diary.employee.fullName || selectedEmployee?.fullName || getEmployeeLabel(selectedEmployee || employees[0])}</CardTitle>
								<CardDescription>
									{diary.employee.position} • {diary.employee.employeeStatus} • {diary.employee.employeeNumber}
								</CardDescription>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<div><span className="font-medium text-foreground">Email:</span> {diary.employee.email || '—'}</div>
									<div><span className="font-medium text-foreground">Phone:</span> {diary.employee.contactNumber || '—'}</div>
									<div><span className="font-medium text-foreground">Region:</span> {diary.employee.region || '—'}</div>
								</div>
							</CardContent>
						</Card>

						<Tabs defaultValue={pendingTotal > 0 ? 'pending' : 'holidays'} className="w-full">
							<TabsList className="flex flex-wrap h-auto">
								<TabsTrigger value="pending">
									Pending
									{pendingTotal > 0 && (
										<span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-medium text-amber-800">
											{pendingTotal}
										</span>
									)}
								</TabsTrigger>
								<TabsTrigger value="holidays">Holidays</TabsTrigger>
								<TabsTrigger value="incidents">Incidents</TabsTrigger>
								<TabsTrigger value="expenses">Expenses</TabsTrigger>
								<TabsTrigger value="license">License</TabsTrigger>
								<TabsTrigger value="equipment">Equipment</TabsTrigger>
								<TabsTrigger value="training">Training</TabsTrigger>
							</TabsList>

							<TabsContent value="pending" className="mt-4">
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
									<Card>
										<CardHeader>
											<CardTitle className="text-base">Pending holidays</CardTitle>
											<CardDescription>Status = Pending</CardDescription>
										</CardHeader>
										<CardContent>
											{pending.holiday.length === 0 ? (
												<p className="text-sm text-muted-foreground">No pending holidays.</p>
											) : (
												<ul className="space-y-2">
													{pending.holiday.slice(0, 10).map(h => (
														<li key={h.id} className="text-sm">
															<div className="flex items-center justify-between">
																<span>{formatDate(h.startDate)} – {formatDate(h.endDate)}</span>
																<Badge variant="secondary">Pending</Badge>
															</div>
															<div className="text-xs text-muted-foreground">{h.totalDays} day(s)</div>
														</li>
													))}
												</ul>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle className="text-base">Pending expenses</CardTitle>
											<CardDescription>Status = Pending</CardDescription>
										</CardHeader>
										<CardContent>
											{pending.expenses.length === 0 ? (
												<p className="text-sm text-muted-foreground">No pending expenses.</p>
											) : (
												<ul className="space-y-2">
													{pending.expenses.slice(0, 10).map(e => (
														<li key={e.id} className="text-sm">
															<div className="flex items-center justify-between">
																<span>{formatDate(e.weekStartDate)} – {formatDate(e.weekEndDate)}</span>
																<Badge variant="secondary">Pending</Badge>
															</div>
															<div className="text-xs text-muted-foreground">Total: {formatMoney(e.weekTotal)}</div>
														</li>
													))}
												</ul>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle className="text-base">Pending equipment</CardTitle>
											<CardDescription>Status = Pending</CardDescription>
										</CardHeader>
										<CardContent>
											{pending.equipmentRequests.length === 0 ? (
												<p className="text-sm text-muted-foreground">No pending equipment requests.</p>
											) : (
												<ul className="space-y-2">
													{pending.equipmentRequests.slice(0, 10).map(r => (
														<li key={r.id} className="text-sm">
															<div className="flex items-center justify-between">
																<span>{r.equipmentType}{r.size ? ` (${r.size})` : ''}</span>
																<Badge variant="secondary">Pending</Badge>
															</div>
															<div className="text-xs text-muted-foreground">Qty {r.quantity} • {formatDate(r.createdAt)}</div>
														</li>
													))}
												</ul>
											)}
										</CardContent>
									</Card>
								</div>
							</TabsContent>

							<TabsContent value="holidays" className="mt-4">
								<Card>
									<CardHeader>
										<CardTitle>Booked holidays</CardTitle>
										<CardDescription>Holiday requests from the HolidayRequest table.</CardDescription>
									</CardHeader>
									<CardContent>
										{diary.holidays.length === 0 ? (
											<p className="text-sm text-muted-foreground">No holiday requests found.</p>
										) : (
											<div className="overflow-x-auto">
												<Table>
													<TableHeader className="border-b">
														<TableRow>
															<TableHead>Dates</TableHead>
															<TableHead>Days</TableHead>
															<TableHead>Status</TableHead>
															<TableHead>Requested</TableHead>
															<TableHead>Return</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{diary.holidays.map(h => (
															<TableRow key={h.id}>
																<TableCell className="font-medium">{formatDate(h.startDate)} – {formatDate(h.endDate)}</TableCell>
																<TableCell>{h.totalDays}</TableCell>
																<TableCell>
																	<Badge variant={getStatusBadgeVariant(h.status)}>{h.status}</Badge>
																</TableCell>
																<TableCell>{formatDate(h.dateOfRequest)}</TableCell>
																<TableCell>{formatDate(h.returnToWorkDate)}</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="incidents" className="mt-4">
								<Card>
									<CardHeader>
										<CardTitle>Incident reporting</CardTitle>
										<CardDescription>Incidents created by the linked user or matching officer name.</CardDescription>
									</CardHeader>
									<CardContent>
										{diary.incidents.length === 0 ? (
											<p className="text-sm text-muted-foreground">No incidents found.</p>
										) : (
											<div className="overflow-x-auto">
												<Table>
													<TableHeader className="border-b">
														<TableRow>
															<TableHead>Date</TableHead>
															<TableHead>Store/Site</TableHead>
															<TableHead>Customer</TableHead>
															<TableHead>Type</TableHead>
															<TableHead>Value recovered</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{diary.incidents.map(i => (
															<TableRow key={i.incidentId}>
																<TableCell className="font-medium">{formatDate(i.dateOfIncident)}</TableCell>
																<TableCell>{i.siteName}</TableCell>
																<TableCell>{i.customerName || '—'}</TableCell>
																<TableCell>{i.incidentType}</TableCell>
																<TableCell>{formatMoney(i.valueRecovered ?? i.totalValueRecovered ?? null)}</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="expenses" className="mt-4">
								<Card>
									<CardHeader>
										<CardTitle>Expenses</CardTitle>
										<CardDescription>Officer expense claims linked via the user ID.</CardDescription>
									</CardHeader>
									<CardContent>
										{diary.expenses.length === 0 ? (
											<p className="text-sm text-muted-foreground">No expense claims found.</p>
										) : (
											<div className="overflow-x-auto">
												<Table>
													<TableHeader className="border-b">
														<TableRow>
															<TableHead>Week</TableHead>
															<TableHead>Status</TableHead>
															<TableHead>Total</TableHead>
															<TableHead>Approved</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{diary.expenses.map(c => (
															<TableRow key={c.id}>
																<TableCell className="font-medium">{formatDate(c.weekStartDate)} – {formatDate(c.weekEndDate)}</TableCell>
																<TableCell><Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge></TableCell>
																<TableCell>{formatMoney(c.weekTotal)}</TableCell>
																<TableCell>{c.approvedAt ? `${formatDate(c.approvedAt)} (${c.approvedByName || '—'})` : '—'}</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="license" className="mt-4">
								<Card>
									<CardHeader>
										<CardTitle>License</CardTitle>
										<CardDescription>License info extracted from the Employee table.</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<Card>
												<CardHeader>
													<CardTitle className="text-base">SIA license</CardTitle>
												</CardHeader>
												<CardContent className="text-sm">
													<div className="flex items-center justify-between">
														<span className="text-muted-foreground">Type</span>
														<span className="font-medium">{diary.license.siaLicenceType || '—'}</span>
													</div>
													<div className="flex items-center justify-between mt-2">
														<span className="text-muted-foreground">Expiry</span>
														<div className="flex items-center gap-2">
															<span className="font-medium">{formatDate(diary.license.siaLicenceExpiry)}</span>
															{diary.license.isSiaLicenceExpired ? (
																<Badge variant="destructive">Expired</Badge>
															) : diary.license.isSiaLicenceExpiringSoon ? (
																<Badge variant="secondary">Expiring soon</Badge>
															) : (
																<Badge variant="secondary">Valid</Badge>
															)}
														</div>
													</div>
												</CardContent>
											</Card>

											<Card>
												<CardHeader>
													<CardTitle className="text-base">Driving license</CardTitle>
												</CardHeader>
												<CardContent className="text-sm">
													<div className="flex items-center justify-between">
														<span className="text-muted-foreground">Type</span>
														<span className="font-medium">{diary.license.drivingLicenceType || '—'}</span>
													</div>
													<div className="flex items-center justify-between mt-2">
														<span className="text-muted-foreground">Last checked</span>
														<span className="font-medium">{formatDate(diary.license.dateDLChecked)}</span>
													</div>
													<div className="flex items-center justify-between mt-2">
														<span className="text-muted-foreground">Copy taken</span>
														<span className="font-medium">{diary.license.drivingLicenceCopyTaken ? 'Yes' : 'No'}</span>
													</div>
												</CardContent>
											</Card>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="equipment" className="mt-4">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
									<Card>
										<CardHeader>
											<CardTitle>Equipment requests</CardTitle>
											<CardDescription>Requests from the Uniform &amp; Equipment Request table.</CardDescription>
										</CardHeader>
										<CardContent>
											{diary.equipment.requests.length === 0 ? (
												<p className="text-sm text-muted-foreground">No requests found.</p>
											) : (
												<div className="overflow-x-auto">
													<Table>
														<TableHeader className="border-b">
															<TableRow>
																<TableHead>Item</TableHead>
																<TableHead>Qty</TableHead>
																<TableHead>Priority</TableHead>
																<TableHead>Status</TableHead>
																<TableHead>Requested</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{diary.equipment.requests.map(r => (
																<TableRow key={r.id}>
																	<TableCell className="font-medium">{r.equipmentType}{r.size ? ` (${r.size})` : ''}</TableCell>
																	<TableCell>{r.quantity}</TableCell>
																	<TableCell><Badge variant="secondary">{r.priority}</Badge></TableCell>
																	<TableCell><Badge variant={getStatusBadgeVariant(r.status)}>{r.status}</Badge></TableCell>
																	<TableCell>{formatDate(r.createdAt)}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Equipment issued</CardTitle>
											<CardDescription>Issued items from the Uniform &amp; Equipment Issued table.</CardDescription>
										</CardHeader>
										<CardContent>
											{diary.equipment.issued.length === 0 ? (
												<p className="text-sm text-muted-foreground">No issued items found.</p>
											) : (
												<div className="overflow-x-auto">
													<Table>
														<TableHeader className="border-b">
															<TableRow>
																<TableHead>Item</TableHead>
																<TableHead>Qty</TableHead>
																<TableHead>Condition</TableHead>
																<TableHead>Issued</TableHead>
																<TableHead>Returned</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{diary.equipment.issued.map(i => (
																<TableRow key={i.id}>
																	<TableCell className="font-medium">{i.equipmentType}{i.size ? ` (${i.size})` : ''}</TableCell>
																	<TableCell>{i.quantity}</TableCell>
																	<TableCell><Badge variant="secondary">{i.condition}</Badge></TableCell>
																	<TableCell>{formatDate(i.dateIssued)}</TableCell>
																	<TableCell>{formatDate(i.dateReturned)}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}
										</CardContent>
									</Card>
								</div>
							</TabsContent>

							<TabsContent value="training" className="mt-4">
								<div className="space-y-4">
									<Card>
										<CardHeader>
											<CardTitle>Training &amp; induction</CardTitle>
											<CardDescription>Training fields and test attempts.</CardDescription>
										</CardHeader>
										<CardContent className="text-sm">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												<div><span className="font-medium text-foreground">Induction booked:</span> {formatDate(diary.training.inductionAndTrainingBooked)}</div>
												<div><span className="font-medium text-foreground">Full rotas issued:</span> {formatDate(diary.training.fullRotasIssued)}</div>
												<div><span className="font-medium text-foreground">Trainer:</span> {diary.training.trainer || '—'}</div>
												<div><span className="font-medium text-foreground">Location:</span> {diary.training.location || '—'}</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Tests</CardTitle>
											<CardDescription>Attempts from the Take Test table.</CardDescription>
										</CardHeader>
										<CardContent>
											{diary.training.tests.length === 0 ? (
												<p className="text-sm text-muted-foreground">No test attempts found.</p>
											) : (
												<div className="overflow-x-auto">
													<Table>
														<TableHeader className="border-b">
															<TableRow>
																<TableHead>Test</TableHead>
																<TableHead>Completed</TableHead>
																<TableHead>Score</TableHead>
																<TableHead>Status</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{diary.training.tests.map(t => (
																<TableRow key={t.id}>
																	<TableCell className="font-medium">{t.testTitle}</TableCell>
																	<TableCell>{formatDate(t.completedAt)}</TableCell>
																	<TableCell>{Math.round(t.percentageScore)}%</TableCell>
																	<TableCell><Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge></TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}
										</CardContent>
									</Card>
								</div>
							</TabsContent>
						</Tabs>
					</>
				)}
			</div>
		</div>
	)
}

export default EmployeeDiaryPage
