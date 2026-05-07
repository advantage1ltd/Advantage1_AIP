import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sessionStore } from '@/state/sessionStore'

export const DebugPanel = () => {
	const [isOpen, setIsOpen] = useState(false)
	const [debugData, setDebugData] = useState<any>(null)

	const refreshData = () => {
		const authToken = localStorage.getItem('authToken')
		const currentUser = sessionStore.getUser()

		setDebugData({
			authToken: authToken ? '***' : null,
			user: currentUser ? {
				id: currentUser.id,
				role: currentUser.role,
				customerId: (currentUser as any).customerId,
				assignedCustomerIds: (currentUser as any).assignedCustomerIds
			} : null
		})
	}

	useEffect(() => {
		if (isOpen) {
			refreshData()
		}
	}, [isOpen])

	if (!isOpen) {
		return (
			<Button
				className="fixed bottom-4 right-4 bg-yellow-500 hover:bg-yellow-600"
				onClick={() => setIsOpen(true)}
			>
				Show Debug Panel
			</Button>
		)
	}

	return (
		<Card className="fixed bottom-4 right-4 w-96 h-96 p-4 bg-white dark:bg-gray-800 shadow-lg">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-semibold">Debug Panel</h3>
				<div className="space-x-2">
					<Button size="sm" variant="outline" onClick={refreshData}>
						Refresh
					</Button>
					<Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
						Close
					</Button>
				</div>
			</div>

			<ScrollArea className="h-[calc(100%-4rem)]">
				<div className="space-y-4">
					<div>
						<h4 className="font-medium mb-2">Session Snapshot:</h4>
						<pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
							{JSON.stringify(debugData, null, 2)}
						</pre>
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						User details originate from the API and are cached in memory only.
					</p>
				</div>
			</ScrollArea>
		</Card>
	)
}
