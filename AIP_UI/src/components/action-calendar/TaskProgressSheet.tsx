import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Task, TaskStatusUpdate } from '@/pages/ActionCalendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

const STATUS_OPTIONS: Task['status'][] = ['pending', 'in-progress', 'completed', 'blocked']

interface TaskProgressSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	task: Task | null
	statusUpdates: TaskStatusUpdate[]
	isLoading: boolean
	error?: string | null
	onRefresh: () => void
	onSubmitProgress: (taskId: string, payload: { status: Task['status']; comment?: string }) => Promise<void> | void
	canUpdate: boolean
	isAdmin: boolean
}

export const TaskProgressSheet = ({
	open,
	onOpenChange,
	task,
	statusUpdates,
	isLoading,
	error,
	onRefresh,
	onSubmitProgress,
	canUpdate,
	isAdmin
}: TaskProgressSheetProps) => {
	const [status, setStatus] = useState<Task['status']>('pending')
	const [comment, setComment] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (task) {
			setStatus(task.status)
			setComment('')
		}
	}, [task])

	const statusBadgeClass = (value: Task['status']) => {
		switch (value) {
			case 'completed':
				return 'bg-emerald-100 text-emerald-700 border-emerald-200'
			case 'in-progress':
				return 'bg-blue-100 text-blue-700 border-blue-200'
			case 'blocked':
				return 'bg-red-100 text-red-700 border-red-200'
			default:
				return 'bg-slate-100 text-slate-700 border-slate-200'
		}
	}

	const timeline = useMemo(
		() => [...statusUpdates].sort((a, b) => b.updateDate.getTime() - a.updateDate.getTime()),
		[statusUpdates]
	)

	const handleSubmit = async () => {
		if (!task || !canUpdate || isSubmitting) {
			return
		}

		try {
			setIsSubmitting(true)
			await onSubmitProgress(task.id, { status, comment: comment.trim() || undefined })
			setComment('')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-full max-w-[560px] max-h-[85vh] overflow-y-auto rounded-2xl px-4 sm:px-6 py-5">
				<DialogHeader className="space-y-1">
					<DialogTitle>Task Progress</DialogTitle>
					<DialogDescription>
						{task ? `Update the progress for "${task.title}".` : 'Select a task to view its progress history.'}
					</DialogDescription>
				</DialogHeader>

				{task ? (
					<div className="mt-4 flex flex-col gap-5">
						<div className="rounded-xl border bg-muted/20 p-4">
							<p className="text-sm font-semibold text-foreground">{task.title}</p>
							<p className="text-xs text-muted-foreground line-clamp-3 mt-1">{task.description}</p>
							<div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
								<div>
									<p className="font-medium text-foreground">Assignee</p>
									<p>{task.assigneeName || 'Unassigned'}</p>
								</div>
								<div>
									<p className="font-medium text-foreground">Due Date</p>
									<p>{format(task.date, 'dd MMM yyyy')}</p>
								</div>
								<div>
									<p className="font-medium text-foreground">Priority</p>
									<p className="capitalize">{task.priority}</p>
								</div>
								<div>
									<p className="font-medium text-foreground">Created By</p>
									<p>{task.createdByName ?? 'System'}</p>
								</div>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm font-semibold text-foreground">Progress History</p>
								<Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
									{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
									<span className="sr-only">Refresh updates</span>
								</Button>
							</div>
							<div className="rounded-xl border bg-background">
								{isLoading ? (
									<div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
										<Loader2 className="h-5 w-5 animate-spin" />
										<p className="text-sm">Fetching status updates...</p>
									</div>
								) : timeline.length === 0 ? (
									<div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
										<AlertCircle className="h-5 w-5" />
										<p className="text-sm">No progress has been recorded for this task yet.</p>
									</div>
								) : (
									<ScrollArea className="max-h-[280px]">
										<ul className="space-y-3 p-4 pr-2">
											{timeline.map((update) => (
												<li key={update.id} className="rounded-lg border bg-muted/30 p-3">
													<div className="flex items-center justify-between gap-2">
														<Badge variant="outline" className={cn('capitalize', statusBadgeClass(update.status))}>
															{update.status}
														</Badge>
														<span className="text-xs text-muted-foreground">{format(update.updateDate, 'dd MMM yyyy • HH:mm')}</span>
													</div>
													{update.comment && (
														<p className="mt-2 text-sm text-foreground leading-snug">{update.comment}</p>
													)}
													<p className="mt-2 text-xs text-muted-foreground">Updated by {update.updatedByName}</p>
												</li>
											))}
										</ul>
									</ScrollArea>
								)}
								{error && (
									<p className="px-4 pb-3 text-xs text-red-600">{error}</p>
								)}
							</div>
						</div>

						<div className="space-y-4 rounded-xl border bg-background p-4">
							<div className="flex items-center justify-between">
								<p className="text-sm font-semibold text-foreground">Report Progress</p>
								{!canUpdate && (
									<Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
										Read only
									</Badge>
								)}
							</div>
							<div className="space-y-2">
								<label htmlFor="status-select" className="text-xs font-medium text-muted-foreground">Status</label>
								<Select value={status} onValueChange={(value: Task['status']) => setStatus(value)} disabled={!canUpdate}>
									<SelectTrigger id="status-select">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										{STATUS_OPTIONS.map(option => (
											<SelectItem key={option} value={option} className="capitalize">
												{option.replace('-', ' ')}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-3 gap-2">
								{['in-progress', 'blocked', 'completed'].map(option => (
									<Button
										key={option}
										type="button"
										variant="secondary"
										className="capitalize"
										onClick={() => setStatus(option as Task['status'])}
										disabled={!canUpdate}
									>
										{option.replace('-', ' ')}
									</Button>
								))}
							</div>
							<div className="space-y-2">
								<label htmlFor="status-comment" className="text-xs font-medium text-muted-foreground">Comment</label>
								<Textarea
									id="status-comment"
									placeholder="Provide additional context about this update..."
									value={comment}
									onChange={(event) => setComment(event.target.value)}
									className="min-h-[120px]"
									disabled={!canUpdate}
								/>
								<p className="text-[11px] text-muted-foreground">
									Comments are shared with both the task creator and the assignee.
								</p>
							</div>
							<Button
								onClick={handleSubmit}
								disabled={!canUpdate || isSubmitting}
								className="w-full"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Updating Progress...
									</>
								) : (
									<>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										Submit Update
									</>
								)}
							</Button>
							{isAdmin && (
								<p className="text-[11px] text-muted-foreground">
									Admins can update progress on behalf of the assignee. Notifications automatically keep both parties informed.
								</p>
							)}
						</div>
					</div>
				) : (
					<div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
						Select a task from the calendar to view detailed progress and submit updates.
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}

