import { useState, useEffect, useRef } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useCustomerSelection } from '@/contexts/CustomerSelectionContext'
import { getAvailableCustomers } from '@/hooks/useAvailableCustomers'

export const CustomerSelector: React.FC = () => {
	const { selectedCustomerId, setSelectedCustomerId, isAdmin } = useCustomerSelection()
	const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([])
	const [isLoading, setIsLoading] = useState(true)
	const hasLoadedCustomers = useRef(false)

	// Load customers once - persist across remounts
	useEffect(() => {
		if (!isAdmin) return
		
		// Only load if we haven't loaded yet
		if (hasLoadedCustomers.current && customers.length > 0) {
			return
		}

		let mounted = true

		const loadCustomers = async () => {
			try {
				setIsLoading(true)
				const availableCustomers = await getAvailableCustomers()
				
				if (!mounted) return
				
				setCustomers(availableCustomers)
				hasLoadedCustomers.current = true

				// Auto-select first customer if none is selected
				if (!selectedCustomerId && availableCustomers.length > 0) {
					setSelectedCustomerId(availableCustomers[0].id)
				}
			} catch (error) {
				console.error('Failed to load customers:', error)
				if (mounted) {
					setCustomers([])
				}
			} finally {
				if (mounted) {
					setIsLoading(false)
				}
			}
		}

		loadCustomers()

		return () => {
			mounted = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAdmin])

	if (!isAdmin) {
		return null
	}

	const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
	const selectValue = selectedCustomerId?.toString() || ''

	const handleValueChange = (value: string) => {
		if (!value) {
			setSelectedCustomerId(null)
			return
		}
		const customerId = parseInt(value, 10)
		if (!isNaN(customerId)) {
			setSelectedCustomerId(customerId)
		}
	}

	return (
		<div className="px-3 py-2 mb-2 border-b border-border">
			<label className="block text-xs font-medium text-muted-foreground mb-2">
				Select Customer
			</label>
			<Select
				value={selectValue}
				onValueChange={handleValueChange}
				disabled={isLoading || customers.length === 0}
			>
				<SelectTrigger className="w-full h-9 text-sm">
					<SelectValue placeholder={isLoading ? 'Loading customers...' : 'Select a customer'} />
				</SelectTrigger>
				<SelectContent className="max-h-[300px]">
					{customers.map((customer) => (
						<SelectItem key={customer.id} value={customer.id.toString()}>
							{customer.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{selectedCustomer && (
				<p className="text-xs text-muted-foreground mt-1">
					Viewing as: <span className="font-medium">{selectedCustomer.name}</span>
				</p>
			)}
		</div>
	)
}
