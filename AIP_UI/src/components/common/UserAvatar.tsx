import { useEffect, useMemo, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { USER_DATA } from '@/constants/header'
import { sessionStore } from '@/state/sessionStore'
import { userProfilePhotoCache } from '@/utils/userProfilePhotoCache'
import type { User } from '@/types/user'
import { profilePhotoCache } from '@/utils/profilePhotoCache'
import { api } from '@/config/api'
import type { EmployeeDetailResponse } from '@/services/employeeService'
import type { BackendApiResponse } from '@/types/backend-api'
import { getApiData, getApiSuccess } from '@/types/backend-api'

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBorder?: boolean;
}

/**
 * A reusable component for displaying the user's avatar consistently across the application
 */
export function UserAvatar({ 
  size = 'md', 
  className = '',
  showBorder = false
}: UserAvatarProps) {
	const [user, setUser] = useState<User | null>(() => sessionStore.getUser())

  // Map size names to actual size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };
  
  const borderClass = showBorder ? 'border border-blue-700' : '';

	useEffect(() => {
		return sessionStore.subscribe(setUser)
	}, [])

	const userId = user?.id ? String(user.id) : null
	const employeeId = useMemo<number | null>(() => {
		if (!user) return null
		const legacy = user as User & { EmployeeId?: number | string }
		const raw = user.employeeId ?? legacy.EmployeeId
		if (typeof raw === 'number' && Number.isFinite(raw)) return raw
		if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) return Number(raw)
		return null
	}, [user])

	const displayName = useMemo(() => {
		const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
		return name || user?.username || USER_DATA.name
	}, [user?.firstName, user?.lastName, user?.username])

	const initials = useMemo(() => {
		const first = (user?.firstName ?? '').trim()
		const last = (user?.lastName ?? '').trim()
		const letters = `${first.slice(0, 1)}${last.slice(0, 1)}`.trim()
		if (letters) return letters.toUpperCase()
		const username = (user?.username ?? '').trim()
		if (username) return username.slice(0, 2).toUpperCase()
		return USER_DATA.initials
	}, [user?.firstName, user?.lastName, user?.username])

	const [photoSrc, setPhotoSrc] = useState<string>(() => {
		const serverPhoto = (user?.profilePhotoFile ?? '').trim()
		if (serverPhoto) return serverPhoto
		if (userId) {
			const cached = userProfilePhotoCache.get(userId)
			if (cached) return cached
		}
		if (employeeId) {
			const cachedEmployee = profilePhotoCache.get(employeeId)
			if (cachedEmployee) return cachedEmployee
		}
		return USER_DATA.avatar
	})

	useEffect(() => {
		const serverPhoto = (user?.profilePhotoFile ?? '').trim()
		if (serverPhoto) {
			setPhotoSrc(serverPhoto)
			if (userId) userProfilePhotoCache.set(userId, serverPhoto)
			return
		}
		if (userId) {
			const cached = userProfilePhotoCache.get(userId)
			if (cached) {
				setPhotoSrc(cached)
				return
			}
		}
		if (employeeId) {
			const cachedEmployee = profilePhotoCache.get(employeeId)
			if (cachedEmployee) {
				setPhotoSrc(cachedEmployee)
				return
			}
		}
		setPhotoSrc(USER_DATA.avatar)
	}, [employeeId, user?.profilePhotoFile, userId])

	useEffect(() => {
		const handlePhotoUpdated = (event: Event) => {
			const custom = event as CustomEvent<{ userId?: string }>
			const updatedUserId = custom.detail?.userId
			if (!updatedUserId || updatedUserId !== userId) return
			setPhotoSrc(userProfilePhotoCache.get(updatedUserId) || USER_DATA.avatar)
		}

		window.addEventListener('user-profile-photo-updated', handlePhotoUpdated as EventListener)
		return () => window.removeEventListener('user-profile-photo-updated', handlePhotoUpdated as EventListener)
	}, [userId])

	useEffect(() => {
		let cancelled = false

		const hydrateFromEmployeeApi = async () => {
			if (!employeeId) return
			if (userId && userProfilePhotoCache.get(userId)) return
			if (profilePhotoCache.get(employeeId)) return

			try {
				const response = await api.get<BackendApiResponse<EmployeeDetailResponse>>(`/employee/${employeeId}`)
				const apiResponse = response.data
				if (!getApiSuccess(apiResponse)) return
				const data = getApiData(apiResponse)
				const photoFile = data?.photoFile ?? null
				if (!photoFile) return

				profilePhotoCache.set(employeeId, photoFile)
				if (userId) userProfilePhotoCache.set(userId, photoFile)
				if (!cancelled) setPhotoSrc(photoFile)
			} catch {
				// Silent: header should never hard-fail due to avatar fetch
			}
		}

		void hydrateFromEmployeeApi()
		return () => {
			cancelled = true
		}
	}, [employeeId, userId])

  return (
    <Avatar className={`${sizeClasses[size]} ${borderClass} ${className}`}>
      <AvatarImage 
        src={photoSrc} 
        alt={displayName} 
        className="object-cover"
      />
      <AvatarFallback className="bg-blue-700 text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
} 