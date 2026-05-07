import { User } from '@/types/user'

/**
 * Extracts customerId from user object
 * Relies on API response data (CustomerId or customerId field)
 * The backend API returns CustomerId (PascalCase) which should be normalized to customerId (camelCase) during login
 */
export const extractCustomerId = (user: User | null): number | null => {
	if (!user) {
		console.warn('⚠️ [extractCustomerId] User is null');
		return null;
	}

	// Check if user is a customer role
	const userRole = (user.role || (user as any).Role || '').toLowerCase();
	const isCustomerRole = userRole === 'customersitemanager' || userRole === 'customerhomanager';
	
	// Only extract customerId for customer roles
	if (!isCustomerRole) {
		return null;
	}

	// Trust the API response: check customerId (camelCase) first (normalized from API)
	// Then check CustomerId (PascalCase) as fallback (direct from API)
	const customerId = user.customerId ?? (user as any).CustomerId ?? null;

	if (!customerId || customerId === 0) {
		console.error('❌ [extractCustomerId] No valid customerId found for customer user:', {
			role: userRole,
			customerId: user.customerId,
			CustomerId: (user as any).CustomerId,
			userId: user.id,
			userKeys: Object.keys(user)
		});
		return null;
	}

	return customerId;
}

/**
 * Async version for future extensibility
 * Currently just uses the synchronous extraction
 */
export const extractCustomerIdAsync = async (user: User | null): Promise<number | null> => {
	// Use the synchronous extraction
	return extractCustomerId(user)
}

