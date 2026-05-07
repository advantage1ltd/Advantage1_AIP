import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { actionCalendarService } from '@/services/actionCalendarService'

/**
 * Custom hook to fetch and count tasks assigned to the current user
 * Only counts non-completed tasks (pending, in-progress, blocked)
 */
export const useUserTaskCount = () => {
	const { user } = useAuth()
	const [taskCount, setTaskCount] = useState<number>(0)
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)

	const fetchTaskCount = useCallback(async () => {
		if (!user?.id) {
			setTaskCount(0)
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			const response = await actionCalendarService.getTasks({
				assignee: user.id,
				page: 1,
				pageSize: 1000 // Get all tasks to count them
			})

			if (response.success && response.data) {
				// Count only non-completed tasks
				const nonCompletedTasks = response.data.filter(
					task => task.taskStatus !== 'completed'
				)
				setTaskCount(nonCompletedTasks.length)
			} else {
				setTaskCount(0)
				setError(response.message || 'Failed to fetch tasks')
			}
		} catch (err) {
			console.error('Error fetching user task count:', err)
			setTaskCount(0)
			setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
		} finally {
			setIsLoading(false)
		}
	}, [user?.id])

	// Fetch task count when user changes
	useEffect(() => {
		fetchTaskCount()
	}, [fetchTaskCount])

	// Refresh task count periodically (every 30 seconds)
	useEffect(() => {
		if (!user?.id) return

		const interval = setInterval(() => {
			fetchTaskCount()
		}, 30000) // 30 seconds

		return () => clearInterval(interval)
	}, [user?.id, fetchTaskCount])

	// Listen for task-related events to refresh count
	useEffect(() => {
		const handleTaskEvent = () => {
			fetchTaskCount()
		}

		window.addEventListener('task-created', handleTaskEvent)
		window.addEventListener('task-updated', handleTaskEvent)
		window.addEventListener('task-deleted', handleTaskEvent)
		window.addEventListener('task-status-updated', handleTaskEvent)

		return () => {
			window.removeEventListener('task-created', handleTaskEvent)
			window.removeEventListener('task-updated', handleTaskEvent)
			window.removeEventListener('task-deleted', handleTaskEvent)
			window.removeEventListener('task-status-updated', handleTaskEvent)
		}
	}, [fetchTaskCount])

	return {
		taskCount,
		isLoading,
		error,
		refresh: fetchTaskCount
	}
}
