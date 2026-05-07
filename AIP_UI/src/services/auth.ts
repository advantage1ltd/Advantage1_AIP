import { sessionStore } from '@/state/sessionStore'
import { User } from '@/types/user'

const TOKEN_KEY = 'authToken'

export const logout = (): void => {
	try {
		localStorage.removeItem(TOKEN_KEY)
		sessionStore.setUser(null)
		window.dispatchEvent(new Event('session-cleared'))
	} catch (error) {
		console.error('Logout error:', error)
	}
}

export const getToken = (): string | null => {
	try {
		return localStorage.getItem(TOKEN_KEY)
	} catch (error) {
		console.error('Error getting token:', error)
		return null
	}
}

export const getUser = (): User | null => {
	return sessionStore.getUser()
}

export const isAuthenticated = (): boolean => {
	const token = getToken()
	const user = sessionStore.getUser()
	return Boolean(token && user)
}

export const getAuthHeaders = (): HeadersInit => {
	const token = getToken()
	return token
		? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
		: { 'Content-Type': 'application/json' }
}