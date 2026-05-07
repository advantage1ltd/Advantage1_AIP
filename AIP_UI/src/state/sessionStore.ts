import { User } from '@/types/user'

type Listener = (user: User | null) => void

const TOKEN_KEY = 'authToken'
const USER_KEY = 'user'

let currentUser: User | null = null
const listeners = new Set<Listener>()

export const sessionStore = {
	// Token management
	getToken: (): string | null => {
		try {
			return localStorage.getItem(TOKEN_KEY)
		} catch (error) {
			console.error('Error getting token from session storage:', error)
			return null
		}
	},

	setToken: (token: string): void => {
		try {
			localStorage.setItem(TOKEN_KEY, token)
		} catch (error) {
			console.error('Error setting token in session storage:', error)
		}
	},

	clearToken: (): void => {
		try {
			localStorage.removeItem(TOKEN_KEY)
		} catch (error) {
			console.error('Error clearing token from session storage:', error)
		}
	},

	// User management
	getUser: (): User | null => {
		try {
			// First check in-memory cache
			if (currentUser) {
				return currentUser
			}
			// Fallback to localStorage (for backward compatibility during transition)
			const userStr = localStorage.getItem(USER_KEY)
			return userStr ? JSON.parse(userStr) : null
		} catch (error) {
			console.error('Error getting user from session storage:', error)
			return null
		}
	},

	setUser: (user: User | null) => {
		currentUser = user
		listeners.forEach(listener => listener(user))
		// Also store in localStorage for backward compatibility during transition
		try {
			if (user) {
				localStorage.setItem(USER_KEY, JSON.stringify(user))
			} else {
				localStorage.removeItem(USER_KEY)
			}
		} catch (error) {
			console.error('Error setting user in session storage:', error)
		}
	},

	clearUser: (): void => {
		currentUser = null
		listeners.forEach(listener => listener(null))
		try {
			localStorage.removeItem(USER_KEY)
		} catch (error) {
			console.error('Error clearing user from session storage:', error)
		}
	},

	clearAll: (): void => {
		sessionStore.clearToken()
		sessionStore.clearUser()
	},

	// Subscription for user changes
	subscribe: (listener: Listener) => {
		listeners.add(listener)
		return () => listeners.delete(listener)
	}
}

