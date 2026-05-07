const getKey = (userId: string) => `userProfilePhotoFile:${userId}`

export const userProfilePhotoCache = {
	get: (userId: string): string | null => {
		try {
			return localStorage.getItem(getKey(userId))
		} catch (error) {
			console.warn('⚠️ [userProfilePhotoCache] Failed to read cached photo:', error)
			return null
		}
	},
	set: (userId: string, photoFile: string): void => {
		try {
			localStorage.setItem(getKey(userId), photoFile)
		} catch (error) {
			console.warn('⚠️ [userProfilePhotoCache] Failed to cache photo:', error)
		}
	},
	clear: (userId: string): void => {
		try {
			localStorage.removeItem(getKey(userId))
		} catch (error) {
			console.warn('⚠️ [userProfilePhotoCache] Failed to clear cached photo:', error)
		}
	},
}

