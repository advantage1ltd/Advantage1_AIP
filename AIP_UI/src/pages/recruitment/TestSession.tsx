import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from '@/components/ui/use-toast'
import { recruitmentTestService } from '@/services/recruitmentTestService'
import type { RecruitmentAttemptDetail, RecruitmentQuestionType, RecruitmentTestTake } from '@/types/recruitment-tests'

type AnswerValue = string | string[]

const normalizeQuestionType = (value: string): RecruitmentQuestionType | 'unknown' => {
	const v = value.trim().toLowerCase()
	if (v === 'multiple-choice') return 'multiple-choice'
	if (v === 'multiple-answer') return 'multiple-answer'
	if (v === 'true-false') return 'true-false'
	if (v === 'text') return 'text'
	if (v === 'essay') return 'essay'
	return 'unknown'
}

export const TestSession = () => {
	const navigate = useNavigate()
	const { testId } = useParams()

	const [test, setTest] = useState<RecruitmentTestTake | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [attemptId, setAttemptId] = useState<number | null>(null)
	const [testStarted, setTestStarted] = useState(false)
	const [testSubmitted, setTestSubmitted] = useState(false)
	const [confirmSubmit, setConfirmSubmit] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
	const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
	const [timeRemaining, setTimeRemaining] = useState<number>(0)

	const [showResults, setShowResults] = useState(false)
	const [result, setResult] = useState<RecruitmentAttemptDetail | null>(null)

	const timerIntervalRef = useRef<number | null>(null)

	useEffect(() => {
		let isMounted = true

		const load = async () => {
			if (!testId) {
				setError('Missing test id')
				setLoading(false)
				return
			}

			setLoading(true)
			setError(null)

			try {
				const data = await recruitmentTestService.getTestForTaking(testId)
				if (!isMounted) return
				setTest(data)
				setTimeRemaining(data.durationMinutes * 60)
			} catch (err) {
				console.error('❌ [TestSession] Failed to load test:', err)
				if (!isMounted) return
				setError(err instanceof Error ? err.message : 'Failed to load test')
			} finally {
				if (!isMounted) return
				setLoading(false)
			}
		}

		load()
		return () => {
			isMounted = false
		}
	}, [testId])

	// Timer
	useEffect(() => {
		if (!testStarted || testSubmitted) return
		if (timeRemaining <= 0) return

		timerIntervalRef.current = window.setInterval(() => {
			setTimeRemaining(prev => {
				if (prev <= 1) {
					if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current)
					timerIntervalRef.current = null
					void handleSubmitTest()
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => {
			if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current)
			timerIntervalRef.current = null
		}
	}, [testStarted, testSubmitted, timeRemaining])

	const handleBackToTests = () => navigate('/recruitment/take-test')

	const handleStartTest = async () => {
		if (!test) return
		if (!testId) return
		setSubmitting(true)
		try {
			const started = await recruitmentTestService.startAttempt(testId)
			setAttemptId(started.attemptId)
			setTestStarted(true)
			setTimeRemaining(started.durationMinutes * 60)
		} catch (err) {
			console.error('❌ [TestSession] Failed to start attempt:', err)
			const message = err instanceof Error ? err.message : 'Failed to start test'
			toast({ title: 'Failed to start test', description: message, variant: 'destructive' })
		} finally {
			setSubmitting(false)
		}
	}

	const handleAnswerChange = (questionId: string, answer: AnswerValue) => {
		setAnswers(prev => ({ ...prev, [questionId]: answer }))
	}

	const answeredCount = useMemo(() => {
		if (!test) return 0
		return test.questions.reduce((acc, q) => {
			const val = answers[q.questionId]
			const type = normalizeQuestionType(q.type)
			if (type === 'multiple-answer') {
				return acc + (Array.isArray(val) && val.length > 0 ? 1 : 0)
			}
			return acc + (typeof val === 'string' && val.trim() !== '' ? 1 : 0)
		}, 0)
	}, [answers, test])

	const answeredById = useMemo(() => {
		if (!test) return {}
		return test.questions.reduce<Record<string, boolean>>((acc, q) => {
			const val = answers[q.questionId]
			const type = normalizeQuestionType(q.type)
			if (type === 'multiple-answer') {
				acc[q.questionId] = Array.isArray(val) && val.length > 0
				return acc
			}
			acc[q.questionId] = typeof val === 'string' && val.trim() !== ''
			return acc
		}, {})
	}, [answers, test])

	const progressValue = useMemo(() => {
		if (!test || test.questions.length === 0) return 0
		return (answeredCount / test.questions.length) * 100
	}, [answeredCount, test])

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	const timeElapsedPercentage = useMemo(() => {
		if (!test) return 0
		const total = test.durationMinutes * 60
		if (total <= 0) return 0
		return 100 - (timeRemaining / total) * 100
	}, [test, timeRemaining])

	const handleSubmitTest = async () => {
		if (!test) return
		if (!attemptId) {
			toast({ title: 'Cannot submit', description: 'Attempt was not started. Please restart the test.', variant: 'destructive' })
			return
		}
		if (submitting) return

		setSubmitting(true)
		setTestSubmitted(true)

		try {
			if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current)
			timerIntervalRef.current = null

			const payload = {
				answers: test.questions.map(q => {
					const type = normalizeQuestionType(q.type)
					const val = answers[q.questionId]
					if (type === 'multiple-answer') {
						return {
							questionId: q.questionId,
							answers: Array.isArray(val) ? val : [],
						}
					}
					return {
						questionId: q.questionId,
						answer: typeof val === 'string' ? val : '',
					}
				}),
			}

			const submitted = await recruitmentTestService.submitAttempt(attemptId, payload)
			setResult(submitted)
			setShowResults(true)
		} catch (err) {
			console.error('❌ [TestSession] Failed to submit attempt:', err)
			const message = err instanceof Error ? err.message : 'Failed to submit test'
			toast({ title: 'Failed to submit test', description: message, variant: 'destructive' })
			setTestSubmitted(false)
		} finally {
			setSubmitting(false)
		}
	}

	const goToNextQuestion = () => {
		if (!test) return
		if (currentQuestionIndex < test.questions.length - 1) setCurrentQuestionIndex(prev => prev + 1)
	}

	const goToPreviousQuestion = () => {
		if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1)
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
					<p className="mt-4 text-slate-600">Loading test…</p>
				</div>
			</div>
		)
	}

	if (!test || error) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<Card className="w-full max-w-md border-slate-200/70 bg-white/90 shadow-sm">
					<CardContent className="pt-6 pb-4 px-6">
						<div className="text-center">
							<AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
							<CardTitle className="text-xl mb-2">Test Not Found</CardTitle>
							<p className="text-slate-500 mb-6">{error || "The test you're looking for doesn't exist or has been removed."}</p>
							<Button onClick={handleBackToTests}>Back to Tests</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	const passThreshold = Number.isFinite(test.passThresholdPercentage) ? test.passThresholdPercentage : 80

	if (showResults && result) {
		const answerByQuestionId = new Map(result.answers.map(a => [a.questionId, a]))
		return (
			<div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
				<Card className="w-full max-w-4xl mx-auto border-slate-200/70 bg-white/90 shadow-sm">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-xl sm:text-2xl">Test Results</CardTitle>
								<CardDescription>{result.testTitle}</CardDescription>
							</div>
							<Badge className={cn(
								result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
								'text-base px-4 py-1'
							)}>
								{result.status === 'passed' ? 'PASSED' : 'FAILED'}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Officer</div>
								<div className="font-medium">{result.officerName}</div>
							</div>
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Completion Time</div>
								<div className="font-medium">{result.completedAt ? new Date(result.completedAt).toLocaleString() : '—'}</div>
							</div>
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Score</div>
								<div className="font-medium">{result.score} / {result.totalPoints} points</div>
							</div>
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Percentage</div>
								<div className="font-medium">{result.percentageScore.toFixed(1)}%</div>
							</div>
						</div>

						<div className="pt-4">
							<div className="text-base font-medium mb-4">Score Details</div>
							<div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
								<div
									className={cn(
										'h-full rounded-full',
										result.percentageScore >= passThreshold
											? 'bg-green-500'
											: result.percentageScore >= passThreshold - 20
												? 'bg-amber-500'
												: 'bg-red-500'
									)}
									style={{ width: `${Math.min(100, result.percentageScore)}%` }}
								/>
							</div>
							<div className="flex justify-between mt-1 text-sm text-muted-foreground">
								<span>0%</span>
								<span>{passThreshold}% (Pass Threshold)</span>
								<span>100%</span>
							</div>
						</div>

						<div className="border-t pt-4 mt-4">
							<div className="text-base font-medium mb-4">Question Summary</div>
							<div className="space-y-2">
								{test.questions.map((q, index) => {
									const a = answerByQuestionId.get(q.questionId)
									const correct = a?.isCorrect === true
									return (
										<div
											key={q.questionId}
											className={cn(
												'p-3 border rounded-md flex items-center',
												correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
											)}
										>
											<div className="mr-4">
												<div className={cn(
													'rounded-full w-8 h-8 flex items-center justify-center text-white',
													correct ? 'bg-green-500' : 'bg-red-500'
												)}>
													{correct ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
												</div>
											</div>
											<div className="flex-grow">
												<div className="font-medium text-sm">{`Question ${index + 1}`}</div>
												<div className="text-xs text-muted-foreground mt-1">Points: {a?.pointsEarned ?? 0} / {q.points}</div>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between border-t pt-6">
						<Button variant="outline" onClick={handleBackToTests}>Back to Tests</Button>
					</CardFooter>
				</Card>
			</div>
		)
	}

	// Intro
	if (!testStarted) {
		return (
			<div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
				<Card className="w-full max-w-3xl mx-auto border-slate-200/70 bg-white/90 shadow-sm">
					<CardHeader>
						<CardTitle className="text-xl sm:text-2xl">{test.title}</CardTitle>
						<CardDescription>{test.description}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="p-4 bg-slate-50 rounded-md border border-slate-200/60">
							<h3 className="font-medium text-slate-900 mb-2">Test Instructions</h3>
							<ul className="space-y-2 text-sm text-slate-600">
								<li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span>This test has {test.questions.length} questions worth a total of {test.totalPoints} points.</span></li>
								<li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span>You have {test.durationMinutes} minutes to complete the test.</span></li>
								<li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span>You can navigate between questions using the previous and next buttons.</span></li>
								<li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span>Your answers are saved as you go.</span></li>
								<li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span>You must score at least {passThreshold}% to pass this assessment.</span></li>
							</ul>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b py-4">
							<div className="space-y-1"><div className="text-sm text-muted-foreground">Duration</div><div className="text-lg font-medium">{test.durationMinutes} minutes</div></div>
							<div className="space-y-1"><div className="text-sm text-muted-foreground">Questions</div><div className="text-lg font-medium">{test.questions.length} questions</div></div>
							<div className="space-y-1"><div className="text-sm text-muted-foreground">Total Points</div><div className="text-lg font-medium">{test.totalPoints} points</div></div>
							<div className="space-y-1"><div className="text-sm text-muted-foreground">Pass Threshold</div><div className="text-lg font-medium">{passThreshold}%</div></div>
						</div>

						<div className="bg-amber-50 rounded-md border border-amber-100 p-4">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
								<div className="text-sm text-amber-800">
									<p className="font-medium">Important:</p>
									<p>Once you start the test, the timer will begin. You cannot pause the test. Make sure you have enough time to complete it before starting.</p>
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between border-t pt-6">
						<Button variant="outline" onClick={handleBackToTests}>Back to Tests</Button>
						<Button onClick={handleStartTest} disabled={submitting}>
							{submitting ? 'Starting…' : 'Start Test'}
						</Button>
					</CardFooter>
				</Card>
			</div>
		)
	}

	const q = test.questions[currentQuestionIndex]
	const qType = normalizeQuestionType(q.type)
	const qAnswer = answers[q.questionId]

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
				<div className="container mx-auto flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-slate-400">CBT Test Session</p>
						<p className="text-lg font-semibold text-slate-900">{test.title}</p>
					</div>
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<Timer className="h-4 w-4 text-slate-500" />
							<span className={cn(
								'text-sm font-medium',
								timeRemaining < 300 ? 'text-red-600' : timeRemaining < 600 ? 'text-amber-600' : 'text-slate-700'
							)}>
								{formatTime(timeRemaining)}
							</span>
						</div>
						<div className="flex items-center gap-2 text-xs text-slate-500">
							<span>{answeredCount} / {test.questions.length} answered</span>
							<div className="h-2 w-40 rounded-full bg-slate-100">
								<div
									className="h-2 rounded-full bg-emerald-500 transition-all"
									style={{ width: `${progressValue}%` }}
								/>
							</div>
						</div>
						<Button size="sm" variant="destructive" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
							Submit Test
						</Button>
					</div>
				</div>
			</div>

			<div className="container mx-auto grid gap-6 px-4 pb-8 pt-6 lg:grid-cols-[260px_1fr]">
				<Card className="hidden h-fit border-slate-200/70 bg-white/90 shadow-sm lg:block">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Question Navigator</CardTitle>
						<CardDescription className="text-xs">Jump to any question.</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-5 gap-2">
						{test.questions.map((question, index) => {
							const isActive = index === currentQuestionIndex
							const answered = answeredById[question.questionId]
							return (
								<Button
									key={question.questionId}
									type="button"
									variant={isActive ? 'default' : 'outline'}
									size="sm"
									className={cn(
										'h-9 w-9 rounded-lg p-0 text-xs',
										answered && !isActive && 'border-emerald-200 text-emerald-700'
									)}
									onClick={() => setCurrentQuestionIndex(index)}
									aria-label={`Go to question ${index + 1}`}
								>
									{index + 1}
								</Button>
							)
						})}
					</CardContent>
				</Card>

				<Card className="border-slate-200/70 bg-white/90 shadow-sm">
					<CardHeader className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-1">
								<CardTitle className="text-lg">Question {currentQuestionIndex + 1} of {test.questions.length}</CardTitle>
								<CardDescription className="text-slate-600">{q.text}</CardDescription>
							</div>
							<Badge variant="outline">{q.points} {q.points === 1 ? 'point' : 'points'}</Badge>
						</div>
						<div className="flex items-center gap-2 text-xs text-slate-500">
							<Badge variant="outline" className="border-slate-200 text-slate-500">{q.type}</Badge>
							<span>{answeredById[q.questionId] ? 'Answered' : 'Unanswered'}</span>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						{qType === 'multiple-choice' && q.options.length > 0 && (
							<RadioGroup
								value={typeof qAnswer === 'string' ? qAnswer : ''}
								onValueChange={(value) => handleAnswerChange(q.questionId, value)}
								className="space-y-3"
							>
								{q.options.map((opt) => (
									<div key={opt.optionId} className="flex items-center space-x-2 rounded-lg border border-slate-200/70 p-3 hover:bg-slate-50">
										<RadioGroupItem value={String(opt.optionId)} id={`option-${opt.optionId}`} />
										<Label htmlFor={`option-${opt.optionId}`} className="flex-grow cursor-pointer text-sm">{opt.text}</Label>
									</div>
								))}
							</RadioGroup>
						)}

						{qType === 'true-false' && (
							<RadioGroup
								value={typeof qAnswer === 'string' ? qAnswer : ''}
								onValueChange={(value) => handleAnswerChange(q.questionId, value)}
								className="space-y-3"
							>
								<div className="flex items-center space-x-2 rounded-lg border border-slate-200/70 p-3 hover:bg-slate-50">
									<RadioGroupItem value="true" id="true" />
									<Label htmlFor="true" className="flex-grow cursor-pointer text-sm">True</Label>
								</div>
								<div className="flex items-center space-x-2 rounded-lg border border-slate-200/70 p-3 hover:bg-slate-50">
									<RadioGroupItem value="false" id="false" />
									<Label htmlFor="false" className="flex-grow cursor-pointer text-sm">False</Label>
								</div>
							</RadioGroup>
						)}

						{qType === 'text' && (
							<Input
								value={typeof qAnswer === 'string' ? qAnswer : ''}
								onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
								placeholder="Enter your answer"
								className="w-full"
							/>
						)}

						{qType === 'essay' && (
							<Textarea
								value={typeof qAnswer === 'string' ? qAnswer : ''}
								onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
								placeholder="Write your answer here…"
								className="w-full min-h-[200px]"
							/>
						)}

						{qType === 'multiple-answer' && q.options.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center gap-2 mb-2">
									<Badge variant="outline">Multiple Answers Allowed</Badge>
									<span className="text-sm text-muted-foreground">Select all that apply</span>
								</div>
								{q.options.map((opt) => {
									const current = Array.isArray(qAnswer) ? qAnswer : []
									const key = String(opt.optionId)
									const checked = current.includes(key)
									return (
										<div key={opt.optionId} className="flex items-center space-x-2 rounded-lg border border-slate-200/70 p-3 hover:bg-slate-50">
											<Checkbox
												id={`option-${opt.optionId}`}
												checked={checked}
												onCheckedChange={(isChecked) => {
													const next = isChecked ? [...current, key] : current.filter(v => v !== key)
													handleAnswerChange(q.questionId, next)
												}}
											/>
											<Label htmlFor={`option-${opt.optionId}`} className="flex-grow cursor-pointer text-sm">{opt.text}</Label>
										</div>
									)
								})}
							</div>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-sm text-slate-500">{answeredCount} of {test.questions.length} questions answered</div>
						<div className="flex gap-3">
							<Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0 || submitting}>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>
							{currentQuestionIndex === test.questions.length - 1 ? (
								<Button variant="default" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
									Finish Test
								</Button>
							) : (
								<Button variant="default" onClick={goToNextQuestion} disabled={submitting}>
									Next
									<ChevronRight className="h-4 w-4 ml-1" />
								</Button>
							)}
						</div>
					</CardFooter>
				</Card>
			</div>

			<AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Submit Test?</AlertDialogTitle>
						<AlertDialogDescription>
							{answeredCount === test.questions.length
								? 'You have answered all questions. Once submitted, you cannot change your answers.'
								: `You have answered ${answeredCount} out of ${test.questions.length} questions. Unanswered questions will be marked as incorrect.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={submitting}>Continue Test</AlertDialogCancel>
						<AlertDialogAction onClick={handleSubmitTest} disabled={submitting}>
							{submitting ? 'Submitting…' : 'Submit Test'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export default TestSession

