import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Calendar, CheckCircle, Clock, FileText, Search, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { recruitmentTestService } from '@/services/recruitmentTestService'
import type { RecruitmentAttemptDetail, RecruitmentAttemptSummary, RecruitmentTestSummary } from '@/types/recruitment-tests'

export const TakeTest = () => {
	const navigate = useNavigate()
	const { user } = useAuth()

	const [searchTerm, setSearchTerm] = useState('')
	const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available')

	const [availableLoading, setAvailableLoading] = useState(false)
	const [availableError, setAvailableError] = useState<string | null>(null)
	const [availableTests, setAvailableTests] = useState<RecruitmentTestSummary[]>([])

	const [attemptsLoading, setAttemptsLoading] = useState(false)
	const [attemptsError, setAttemptsError] = useState<string | null>(null)
	const [completedTests, setCompletedTests] = useState<RecruitmentAttemptSummary[]>([])

	const [selectedAttempt, setSelectedAttempt] = useState<RecruitmentAttemptDetail | null>(null)
	const [resultDialogOpen, setResultDialogOpen] = useState(false)
	const [resultLoading, setResultLoading] = useState(false)

	const officerName = useMemo(() => {
		if (!user) return '—'
		const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
		return name || user.username || '—'
	}, [user])

	const officerRoleLabel = useMemo(() => user?.jobTitle || user?.role || '—', [user])

	useEffect(() => {
		let isMounted = true

		const load = async () => {
			setAvailableLoading(true)
			setAvailableError(null)
			try {
				const data = await recruitmentTestService.getAvailableTests()
				if (!isMounted) return
				setAvailableTests(data)
			} catch (err) {
				console.error('❌ [TakeTest] Failed to load available tests:', err)
				if (!isMounted) return
				const message = err instanceof Error ? err.message : 'Failed to load available tests'
				setAvailableError(message)
				toast({ title: 'Failed to load tests', description: message, variant: 'destructive' })
			} finally {
				if (!isMounted) return
				setAvailableLoading(false)
			}
		}

		load()
		return () => {
			isMounted = false
		}
	}, [])

	useEffect(() => {
		let isMounted = true

		const load = async () => {
			setAttemptsLoading(true)
			setAttemptsError(null)
			try {
				const data = await recruitmentTestService.getMyAttempts()
				if (!isMounted) return
				setCompletedTests(data)
			} catch (err) {
				console.error('❌ [TakeTest] Failed to load attempts:', err)
				if (!isMounted) return
				const message = err instanceof Error ? err.message : 'Failed to load completed tests'
				setAttemptsError(message)
				toast({ title: 'Failed to load results', description: message, variant: 'destructive' })
			} finally {
				if (!isMounted) return
				setAttemptsLoading(false)
			}
		}

		load()
		return () => {
			isMounted = false
		}
	}, [])

	const filteredAvailableTests = useMemo(() => {
		const term = searchTerm.trim().toLowerCase()
		if (!term) return availableTests
		return availableTests.filter(test => {
			const title = test.title.toLowerCase()
			const desc = (test.description ?? '').toLowerCase()
			return title.includes(term) || desc.includes(term)
		})
	}, [availableTests, searchTerm])

	const avgScoreLabel = useMemo(() => {
		if (completedTests.length === 0) return 'N/A'
		const avg = completedTests.reduce((acc, t) => acc + t.percentageScore, 0) / completedTests.length
		return `${Math.round(avg)}%`
	}, [completedTests])

	const startTest = (testId: string) => navigate(`/recruitment/test-session/${testId}`)

	const formatDate = (value: string | Date) => {
		const date = value instanceof Date ? value : new Date(value)
		if (Number.isNaN(date.getTime())) return '—'
		return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
	}

	const viewTestDetails = async (attemptId: number) => {
		setResultDialogOpen(true)
		setSelectedAttempt(null)
		setResultLoading(true)
		try {
			const detail = await recruitmentTestService.getMyAttemptById(attemptId)
			setSelectedAttempt(detail)
		} catch (err) {
			console.error('❌ [TakeTest] Failed to load attempt detail:', err)
			const message = err instanceof Error ? err.message : 'Failed to load attempt details'
			toast({ title: 'Failed to load details', description: message, variant: 'destructive' })
		} finally {
			setResultLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
			<div className="container mx-auto max-w-full space-y-5 px-3 py-3 sm:p-4 md:max-w-[96%] md:p-6 lg:max-w-7xl lg:p-8">
				<div className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur">
					<div className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="space-y-2">
							<Badge variant="outline" className="border-slate-200/80 text-xs uppercase tracking-wide text-slate-500">CBT exam center</Badge>
							<div>
								<h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Assessment Tests</h1>
								<p className="text-sm text-slate-500">Start your assigned CBT tests and review completed results.</p>
							</div>
						</div>
						<div className="text-sm text-right">
							<div className="font-medium text-slate-900">{officerName}</div>
							<div className="text-xs text-slate-500">{officerRoleLabel}</div>
						</div>
					</div>
				</div>

				<div className="grid gap-5 lg:grid-cols-[280px_1fr]">
					<div className="space-y-4">
						<Card className="border-slate-200/70 bg-white/90 shadow-sm">
							<CardHeader className="pb-2">
								<CardTitle className="text-base">Your Overview</CardTitle>
								<CardDescription className="text-xs">Progress snapshot for CBT assessments.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="rounded-xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950/70 via-slate-950/70 to-slate-950/60 px-4 py-3">
									<div className="text-xs uppercase tracking-wide text-slate-300">Available</div>
									<div className="text-2xl font-semibold text-white">{availableTests.length}</div>
								</div>
								<div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/65 via-slate-950/70 to-slate-950/60 px-4 py-3">
									<div className="text-xs uppercase tracking-wide text-slate-300">Completed</div>
									<div className="text-2xl font-semibold text-white">{completedTests.length}</div>
								</div>
								<div className="rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-950/60 via-slate-950/70 to-slate-950/60 px-4 py-3">
									<div className="text-xs uppercase tracking-wide text-slate-300">Average Score</div>
									<div className="text-2xl font-semibold text-white">{avgScoreLabel}</div>
								</div>
								<div className="rounded-xl border border-rose-400/20 bg-gradient-to-br from-rose-950/65 via-slate-950/70 to-slate-950/60 px-4 py-3">
									<div className="text-xs uppercase tracking-wide text-slate-300">Next Due</div>
									<div className="text-sm font-medium text-slate-100">
										{availableTests.length > 0 ? formatDate(new Date()) : 'No upcoming tests'}
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-slate-200/70 bg-white/90 shadow-sm">
							<CardHeader className="pb-2">
								<CardTitle className="text-base">Exam Tips</CardTitle>
								<CardDescription className="text-xs">Stay focused during your assessment.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-xs text-slate-500">
								<div className="flex items-start gap-2">
									<CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
									<span>Review instructions before starting your test.</span>
								</div>
								<div className="flex items-start gap-2">
									<Clock className="mt-0.5 h-4 w-4 text-amber-500" />
									<span>Keep an eye on the timer and pace yourself.</span>
								</div>
								<div className="flex items-start gap-2">
									<FileText className="mt-0.5 h-4 w-4 text-indigo-500" />
									<span>Submit answers carefully before finishing.</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card className="border-slate-200/70 bg-white/90 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<Tabs defaultValue="available" value={activeTab} onValueChange={(v) => setActiveTab(v as 'available' | 'completed')}>
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<TabsList className="rounded-full bg-slate-100 p-1">
										<TabsTrigger value="available">Available Tests</TabsTrigger>
										<TabsTrigger value="completed">Completed Tests</TabsTrigger>
									</TabsList>
									<div className="relative w-full sm:w-[260px]">
										<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
										<Input
											type="text"
											placeholder="Search tests..."
											className="h-10 pl-8"
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
									</div>
								</div>

								<TabsContent value="available" className="space-y-4 pt-4">
									{availableLoading ? (
										<div className="text-center py-12 text-sm text-slate-500">Loading available tests…</div>
									) : availableError ? (
										<div className="text-center py-12 text-sm text-slate-500">{availableError}</div>
									) : filteredAvailableTests.length > 0 ? (
										<div className="space-y-4">
											{filteredAvailableTests.map((test) => (
												<div key={test.testId} className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
													<div className="flex items-start justify-between gap-3">
														<div>
															<h3 className="text-base font-semibold text-slate-900">{test.title}</h3>
															<p className="text-xs text-slate-500">{test.description || 'No description available.'}</p>
														</div>
														<Badge className="bg-emerald-100 text-emerald-800">Available</Badge>
													</div>

													<div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
														<div className="flex items-center gap-2">
															<Timer className="h-4 w-4" />
															<span>{test.durationMinutes} mins</span>
														</div>
														<div className="flex items-center gap-2">
															<FileText className="h-4 w-4" />
															<span>{test.questionCount} questions</span>
														</div>
														<div className="flex items-center gap-2">
															<Clock className="h-4 w-4" />
															<span>{test.totalPoints} points</span>
														</div>
													</div>

													<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
														<div className="text-xs text-slate-400">
															{test.scheduledDate ? `Scheduled ${formatDate(test.scheduledDate)}` : 'Start anytime'}
														</div>
														<Button onClick={() => startTest(test.testId)}>Start Test</Button>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="text-center py-12">
											<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
												<FileText className="h-6 w-6 text-slate-500" />
											</div>
											<h3 className="mt-3 text-lg font-medium text-slate-900">No tests available</h3>
											<p className="text-sm text-slate-500">
												{searchTerm ? 'Try adjusting your search term.' : 'There are no tests assigned to you right now.'}
											</p>
										</div>
									)}
								</TabsContent>

								<TabsContent value="completed" className="pt-4">
									{attemptsLoading ? (
										<div className="text-center py-12 text-sm text-slate-500">Loading completed tests…</div>
									) : attemptsError ? (
										<div className="text-center py-12 text-sm text-slate-500">{attemptsError}</div>
									) : completedTests.length > 0 ? (
										<div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
											<div className="overflow-x-auto">
												<table className="w-full text-sm">
													<thead className="sticky top-0 bg-slate-50 text-slate-500">
														<tr>
															<th className="px-4 py-3 text-left font-medium">Test Name</th>
															<th className="px-4 py-3 text-left font-medium">Date Completed</th>
															<th className="px-4 py-3 text-left font-medium">Score</th>
															<th className="px-4 py-3 text-left font-medium">Status</th>
															<th className="px-4 py-3 text-right font-medium">Actions</th>
														</tr>
													</thead>
													<tbody className="divide-y">
														{completedTests.map(result => (
															<tr key={result.attemptId} className="hover:bg-slate-50">
																<td className="px-4 py-3">{result.testTitle}</td>
																<td className="px-4 py-3">{result.completedAt ? formatDate(result.completedAt) : '—'}</td>
																<td className="px-4 py-3">
																	<div className="flex items-center gap-2">
																		<span>{result.score}/{result.totalPoints}</span>
																		<span className="text-xs text-slate-400">({result.percentageScore.toFixed(1)}%)</span>
																	</div>
																	<Progress value={result.percentageScore} className="h-1.5 w-24" />
																</td>
																<td className="px-4 py-3">
																	<Badge className={result.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
																		{result.status === 'passed' ? 'Passed' : 'Failed'}
																	</Badge>
																</td>
																<td className="px-4 py-3 text-right">
																	<Button variant="outline" size="sm" onClick={() => viewTestDetails(result.attemptId)}>
																		View Details
																	</Button>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									) : (
										<div className="text-center py-12">
											<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
												<CheckCircle className="h-6 w-6 text-slate-500" />
											</div>
											<h3 className="mt-3 text-lg font-medium text-slate-900">No completed tests</h3>
											<p className="text-sm text-slate-500">You haven't completed any tests yet.</p>
										</div>
									)}
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>

      {/* Test Result Details Dialog */}
			<Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Test Result Details</span>
							{selectedAttempt && (
								<Badge className={cn(
									selectedAttempt.status === 'passed'
										? 'bg-green-100 text-green-800'
										: 'bg-red-100 text-red-800',
									'text-base px-4 py-1'
								)}>
									{selectedAttempt.status === 'passed' ? 'PASSED' : 'FAILED'}
								</Badge>
							)}
            </DialogTitle>
            <DialogDescription>
							{selectedAttempt?.testTitle || '—'}
            </DialogDescription>
          </DialogHeader>
          
					{resultLoading ? (
						<div className="py-10 text-center text-sm text-muted-foreground">Loading details…</div>
					) : selectedAttempt && (
            <div className="space-y-6 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Officer</div>
									<div className="font-medium">{selectedAttempt.officerName}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Completion Time</div>
									<div className="font-medium">{selectedAttempt.completedAt ? new Date(selectedAttempt.completedAt).toLocaleString() : '—'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Score</div>
									<div className="font-medium">{selectedAttempt.score} / {selectedAttempt.totalPoints} points</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Percentage</div>
									<div className="font-medium">{selectedAttempt.percentageScore.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="text-base font-medium mb-4">Score Details</div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
											selectedAttempt.percentageScore >= 80 ? "bg-green-500" :
											selectedAttempt.percentageScore >= 60 ? "bg-amber-500" :
                      "bg-red-500"
                    )}
										style={{ width: `${Math.min(100, selectedAttempt.percentageScore)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                  <span>0%</span>
                  <span>60% (Pass Threshold)</span>
                  <span>100%</span>
                </div>
              </div>
              
							{selectedAttempt.answers && selectedAttempt.answers.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="text-base font-medium mb-4">Question Summary</div>
                  <div className="space-y-2">
										{selectedAttempt.answers.map((answer, index: number) => (
                      <div 
                        key={answer.questionId} 
												className={cn(
													"p-3 border rounded-md flex items-center",
													answer.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
												)}
                      >
                        <div className="mr-4">
                          <div className={cn(
                            "rounded-full w-8 h-8 flex items-center justify-center text-white",
													answer.isCorrect ? "bg-green-500" : "bg-red-500"
                          )}>
														{answer.isCorrect ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-sm">Question {index + 1}</div>
                          <div className="text-xs text-muted-foreground mt-1">
														Points: {answer.pointsEarned} {answer.pointsEarned === 1 ? 'point' : 'points'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setResultDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
	)
}

export default TakeTest