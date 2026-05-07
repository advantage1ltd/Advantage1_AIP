import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useCustomerSelection } from '@/contexts/CustomerSelectionContext'

/**
 * Component that syncs URL search params with CustomerSelectionContext
 * Must be rendered inside Router context
 * Only syncs FROM URL to context on navigation, not continuously
 */
export const CustomerSelectionUrlSync: React.FC = () => {
	const location = useLocation()
	const { isAdmin, selectedCustomerId, setSelectedCustomerId } = useCustomerSelection()
	const lastPathnameRef = useRef<string>(location.pathname)

	useEffect(() => {
		// Only sync when pathname changes (navigation), not on every search param change
		const pathnameChanged = lastPathnameRef.current !== location.pathname
		lastPathnameRef.current = location.pathname

		if (isAdmin && location.search && pathnameChanged) {
			const params = new URLSearchParams(location.search)
			const urlCustomerId = params.get('customerId')
			if (urlCustomerId) {
				const customerId = parseInt(urlCustomerId, 10)
				if (!isNaN(customerId) && customerId !== selectedCustomerId) {
					setSelectedCustomerId(customerId)
				}
			}
		}
		// Only depend on pathname changes, not search params or selectedCustomerId
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname, isAdmin, setSelectedCustomerId])

	return null // This component doesn't render anything
}
