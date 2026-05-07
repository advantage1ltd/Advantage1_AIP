import React, { useContext, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageAccessContext } from '@/contexts/PageAccessContext';
import { UserRole } from '@/types/user';

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles?: UserRole[];
	accessPath?: string;
	enforcePageAccess?: boolean;
}

const normalizePath = (path: string): string => {
	if (!path) return '/';
	const trimmed = path.trim();
	const hasLeadingSlash = trimmed.startsWith('/');
	const normalized = trimmed.replace(/\/+/g, '/');
	return hasLeadingSlash ? normalized : `/${normalized}`;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	allowedRoles,
	accessPath,
	enforcePageAccess = true,
}) => {
	const { user, isLoading: authLoading } = useAuth();
	const pageAccess = useContext(PageAccessContext);
	const location = useLocation();
	const previousPathRef = useRef<string>('');
	const mountTimeRef = useRef<number>(Date.now());

	const pathToCheck = normalizePath(accessPath ?? location.pathname);
	
	// Track route changes and access checks
	useEffect(() => {
		const timestamp = Date.now();
		const elapsed = timestamp - mountTimeRef.current;
		
		// Log route entry
		console.group(`🛡️ [ProtectedRoute] Route Protection Check - ${pathToCheck}`);
		console.log('📍 Route Info:', {
			path: pathToCheck,
			fullPath: location.pathname + location.search,
			accessPath: accessPath,
			enforcePageAccess,
			elapsedFromMount: `${elapsed}ms`
		});
		console.log('👤 Auth State:', {
			hasUser: !!user,
			userRole: user?.role,
			authLoading,
			userId: user?.id
		});
		console.log('🔐 Page Access State:', {
			hasContext: !!pageAccess,
			currentRole: pageAccess?.currentRole,
			status: pageAccess?.status,
			isLoading: pageAccess?.isLoading,
			availablePagesCount: pageAccess?.availablePages?.length || 0
		});
		console.log('✅ Route Config:', {
			allowedRoles: allowedRoles || 'none specified',
			enforcePageAccess
		});
		
		// Track path changes
		if (previousPathRef.current && previousPathRef.current !== pathToCheck) {
			console.log('🔄 Path Changed:', {
				from: previousPathRef.current,
				to: pathToCheck,
				reason: 'location update'
			});
		}
		previousPathRef.current = pathToCheck;
		
		console.groupEnd();
		
		return () => {
			// Cleanup logging on unmount
			if (import.meta.env.DEV) {
				const unmountTime = Date.now();
				const totalTime = unmountTime - mountTimeRef.current;
				console.log(`🛡️ [ProtectedRoute] Unmounting ${pathToCheck} after ${totalTime}ms`);
			}
		};
	}, [pathToCheck, location.pathname, location.search, user, authLoading, pageAccess, allowedRoles, accessPath, enforcePageAccess]);
	
	// Show loading only during initial auth check (not page access loading to prevent loops)
	if (authLoading) {
		return (
			<div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
				Checking permissions…
			</div>
		);
	}

	// Redirect to login if not authenticated
	if (!user) {
		console.group('🚫 [ProtectedRoute] REDIRECT: Not Authenticated');
		console.log('📋 Redirect Details:', {
			from: pathToCheck,
			to: '/login',
			reason: 'User not authenticated',
			timestamp: new Date().toISOString()
		});
		console.groupEnd();
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// Check role-based access (from user object)
	if (allowedRoles && !allowedRoles.includes(user.role)) {
		console.group('🚫 [ProtectedRoute] REDIRECT: Role Blocked');
		console.log('📋 Redirect Details:', {
			from: pathToCheck,
			to: '/dashboard',
			reason: 'Role not in allowedRoles',
			userRole: user.role,
			requiredRoles: allowedRoles,
			timestamp: new Date().toISOString()
		});
		console.log('🔍 Role Check:', {
			userRole: user.role,
			allowedRoles,
			isIncluded: allowedRoles.includes(user.role),
			matchDetails: allowedRoles.map(role => ({
				role,
				matches: role === user.role,
				userRoleType: typeof user.role,
				allowedRoleType: typeof role
			}))
		});
		console.groupEnd();
		return <Navigate to="/dashboard" replace />;
	}

	// Check page access settings (only if enforcePageAccess is true)
	if (enforcePageAccess && pageAccess) {
		// If still loading settings, allow access temporarily to prevent redirect loops
		// The hasAccess function already handles this case
		if (pageAccess.status === 'loading') {
			console.log('⏳ [ProtectedRoute] Allowing access during loading:', pathToCheck);
			return <>{children}</>;
		}

		// If offline, still allow access but log warning
		if (pageAccess.status === 'offline') {
			if (import.meta.env.DEV) {
				console.warn('⚠️ [ProtectedRoute] Backend offline, allowing access:', pathToCheck);
			}
			return <>{children}</>;
		}

		// Check access using page access settings
		const hasAccessResult = pageAccess.hasAccess(pathToCheck);
		
		if (!hasAccessResult) {
			console.group('🚫 [ProtectedRoute] REDIRECT: Access Denied by Page Access');
			console.log('📋 Redirect Details:', {
				from: pathToCheck,
				to: '/dashboard',
				reason: 'PageAccess.hasAccess() returned false',
				userRole: user.role,
				currentRole: pageAccess.currentRole,
				pageAccessStatus: pageAccess.status,
				timestamp: new Date().toISOString()
			});
			console.log('🔍 Access Check Context:', {
				enforcePageAccess,
				pageAccessContextAvailable: !!pageAccess,
				hasAccessResult: false,
				availablePagesCount: pageAccess?.availablePages?.length || 0,
				pageAccessByRoleKeys: Object.keys(pageAccess?.pageAccessByRole || {})
			});
			console.groupEnd();
			return <Navigate to="/dashboard" replace />;
		} else {
			console.log('✅ [ProtectedRoute] Access granted:', {
				path: pathToCheck,
				userRole: user.role,
				currentRole: pageAccess.currentRole
			});
		}
	}

	console.log('✅ [ProtectedRoute] Rendering children for:', pathToCheck);
	return <>{children}</>;
};

export default ProtectedRoute;