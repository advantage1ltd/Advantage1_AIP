const getKey = (employeeId: number) => `employeePhotoFile:${employeeId}`

export const profilePhotoCache = {
	get: (employeeId: number): string | null => {
		try {
			return localStorage.getItem(getKey(employeeId))
		} catch (error) {
			console.warn('⚠️ [profilePhotoCache] Failed to read cached photo:', error)
			return null
		}
	},
	set: (employeeId: number, photoFile: string): void => {
		try {
			localStorage.setItem(getKey(employeeId), photoFile)
		} catch (error) {
			console.warn('⚠️ [profilePhotoCache] Failed to cache photo:', error)
		}
	},
	clear: (employeeId: number): void => {
		try {
			localStorage.removeItem(getKey(employeeId))
		} catch (error) {
			console.warn('⚠️ [profilePhotoCache] Failed to clear cached photo:', error)
		}
	},
}

