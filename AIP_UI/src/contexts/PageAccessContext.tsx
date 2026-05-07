import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PageAccess, PageAccessSettings, pageAccessApi } from '@/api/pageAccess';
import { AuthContext } from '@/contexts/AuthContext';
import { customerPageAccessCache } from '@/services/customerPageAccessCache';
import { PAGE_DEFINITIONS } from '@/config/navigation/pageDefinitions';
import { sessionStore } from '@/state/sessionStore';

interface PageAccessContextType {
	hasAccess: (path: string) => boolean;
	currentRole: string | null;
	setCurrentRole: (role: string | null) => Promise<void>;
	pageAccessByRole: Record<string, string[]>;
	setPageAccessByRole: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
	availablePages: PageAccess[];
	isLoading: boolean;
	status: 'idle' | 'loading' | 'ready' | 'offline';
	error: string | null;
	refreshSettings: () => Promise<void>;
	clearCacheAndReload: () => Promise<void>;
	syncPages: () => Promise<void>;
	isTestMode: boolean;
	setIsTestMode: (isTestMode: boolean) => void;
	testRole: string | null;
	setTestRole: (role: string | null) => void;
}

export const PageAccessContext = createContext<PageAccessContextType | undefined>(undefined);

const EMPTY_PAGE_ACCESS_SETTINGS: PageAccessSettings = {
	pageAccessByRole: {},
	availablePages: []
};

export const usePageAccess = () => {
	const context = useContext(PageAccessContext);
	if (context === undefined) {
		throw new Error('usePageAccess must be used within a PageAccessProvider');
	}
	return context;
};

export const PageAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Safely get user from auth context, fallback to sessionStore if context not available
	const authContext = useContext(AuthContext);
	const user = authContext?.user || sessionStore.getUser();
	
	const [currentRole, setCurrentRoleState] = useState<string | null>(() => {
		// Initialize from sessionStore if available
		const initialUser = sessionStore.getUser();
		if (initialUser?.pageAccessRole) return initialUser.pageAccessRole.trim().toLowerCase();
		if (initialUser?.role) return initialUser.role.trim().toLowerCase();
		return null;
	});
	
	useEffect(() => {
		if (user?.pageAccessRole) {
			setCurrentRoleState(user.pageAccessRole.trim().toLowerCase());
		} else if (user?.role) {
			setCurrentRoleState(user.role.trim().toLowerCase());
		} else {
			setCurrentRoleState(null);
		}
	}, [user]);

	const [pageAccessByRole, setPageAccessByRole] = useState<Record<string, string[]>>({});
	const [availablePages, setAvailablePages] = useState<PageAccess[]>([]);
	const [customerAssignedPageIds, setCustomerAssignedPageIds] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'offline'>('idle');
	const [error, setError] = useState<string | null>(null);
	const [isTestMode, setIsTestMode] = useState(false);
	const [testRole, setTestRole] = useState<string | null>(null);
	
	const initializationRef = useRef(false);
	const lastCustomerContextId = useRef<number | null>(null);
	const settingsLoadAttempted = useRef(false);

	// Stable check for auth token
	const hasAuthToken = useCallback((): boolean => {
		try {
			return Boolean(sessionStore.getToken());
		} catch {
			return false;
		}
	}, []);

	// Normalize role name to lowercase (backend stores roles in lowercase)
	const normalizeRoleName = useCallback((role: string | null): string | null => {
		if (!role) return null;
		// Backend returns roles in lowercase, just ensure it's lowercase
		return role.trim().toLowerCase();
	}, []);

	// Resolve role key from available roles (case-insensitive)
	const resolveRoleKey = useCallback((roleName: string | null): string | null => {
		if (!roleName) return null;
		
		const normalized = normalizeRoleName(roleName);
		if (!normalized) return null;

		// Check exact match first
		if (pageAccessByRole[normalized]) {
			return normalized;
		}

		// Check case-insensitive match
		const match = Object.keys(pageAccessByRole).find(key => 
			key.toLowerCase() === normalized.toLowerCase()
		);

		return match || normalized;
	}, [pageAccessByRole, normalizeRoleName]);

	// Load page access settings from API
	const loadPageAccessSettings = useCallback(async (): Promise<PageAccessSettings> => {
		if (!hasAuthToken()) {
			return EMPTY_PAGE_ACCESS_SETTINGS;
		}

		try {
			const data = await pageAccessApi.getSettings();
			
			// Log loaded settings for debugging
			if (import.meta.env.DEV) {
				console.group('📥 [PageAccess] Settings Loaded from API');
				console.log('📊 Settings Summary:', {
					availablePagesCount: data.availablePages.length,
					rolesCount: Object.keys(data.pageAccessByRole).length,
					roleKeys: Object.keys(data.pageAccessByRole)
				});
				
				// Log AdvantageOneOfficer specifically
				const officerPages = data.pageAccessByRole['advantageoneofficer'] || [];
				const customerPagesInList = officerPages.filter(p => String(p).toLowerCase().includes('customer')).map(p => String(p));
				
				// Check if this looks like default settings (has all default customer pages)
				const defaultCustomerPages = [
					'customer-daily-activity-report',
					'customer-incident-graph',
					'customer-incident-report',
					'customer-satisfaction-report',
					'customer-be-safe-be-secure',
					'daily-occurrence-book',
					'customer-officer-support',
					'customer-views-config',
					'customer-crime-intelligence',
					'customer-site-visit-reports',
					'customer-mystery-shopper-report'
				];
				const hasAllDefaultCustomerPages = defaultCustomerPages.every(pageId => 
					officerPages.some(p => String(p).toLowerCase().trim() === pageId.toLowerCase().trim())
				);
				
				if (hasAllDefaultCustomerPages && customerPagesInList.length > 0) {
					console.warn('⚠️ [PageAccess] WARNING: Settings appear to be DEFAULTS, not from database!');
					console.warn('⚠️ [PageAccess] Officer has all default customer pages. This suggests defaults are being used instead of database settings.');
					console.warn('⚠️ [PageAccess] If you disabled customer pages in settings, they should NOT appear here.');
				}
				
				console.log('👤 AdvantageOneOfficer Pages:', {
					count: officerPages.length,
					hasCustomerIncidentReport: officerPages.includes('customer-incident-report'),
					customerPagesCount: customerPagesInList.length,
					hasAllDefaultCustomerPages,
					allPages: officerPages,
					pageTypes: officerPages.map(p => typeof p)
				});
				console.log('👤 AdvantageOneOfficer Pages (as strings):', officerPages.map(p => String(p)).join(', '));
				console.log('👤 Has customer-incident-report?', officerPages.map(p => String(p).toLowerCase().trim()).includes('customer-incident-report'));
				console.log('👤 Customer pages in list:', customerPagesInList);
				
				// Check available pages for customer-incident-report
				const incidentReportPage = data.availablePages.find(p => 
					p.path === '/customer/incident-report' || p.id === 'customer-incident-report'
				);
				console.log('📄 customer-incident-report Page in Available Pages:', {
					found: !!incidentReportPage,
					page: incidentReportPage ? {
						id: incidentReportPage.id,
						dbId: incidentReportPage.dbId,
						path: incidentReportPage.path
					} : null
				});
				
				console.groupEnd();
			}
			
			setPageAccessByRole(data.pageAccessByRole);
			setAvailablePages(data.availablePages);
			setStatus('ready');
			setError(null);
			return data;
		} catch (error) {
			console.error('❌ [PageAccess] Error loading settings:', error);
			setError(error instanceof Error ? error.message : 'Failed to load page access settings');
			setStatus('offline');
			// Return defaults on error
			return EMPTY_PAGE_ACCESS_SETTINGS;
		}
	}, [hasAuthToken]);

	// Load customer page assignments
	const loadCustomerPageAssignments = useCallback(async (customerId: number | null) => {
		if (!hasAuthToken() || !customerId) {
			setCustomerAssignedPageIds(new Set());
			lastCustomerContextId.current = null;
			return;
		}

		// Skip if already loaded for this customer
		if (lastCustomerContextId.current === customerId) {
			return;
		}

		try {
			const response = await customerPageAccessCache.get(customerId);
			setCustomerAssignedPageIds(new Set(response.assignedPageIds));
			lastCustomerContextId.current = customerId;
		} catch (error: any) {
			const status = error?.response?.status || error?.status;
			const isExpectedError = status === 403 || status === 404;
			
			if (!isExpectedError && import.meta.env.DEV) {
				console.warn('⚠️ [PageAccess] Error loading customer page assignments:', error);
			}
			
			setCustomerAssignedPageIds(new Set());
			lastCustomerContextId.current = null;
		}
	}, [hasAuthToken]);

	// Check if user has access to a path
	const hasAccess = useCallback((path: string): boolean => {
		const startTime = performance.now();
		try {
			// Allow access during loading or if no data loaded yet (prevents redirect loops)
			// This check must come before the currentRole check to prevent redirect loops
			if (status === 'loading' || Object.keys(pageAccessByRole).length === 0 || availablePages.length === 0) {
				if (import.meta.env.DEV && path !== '/dashboard' && path !== '/') {
					console.log('✅ [PageAccess] Allowing access during initialization:', {
						path,
						status,
						pageAccessByRoleCount: Object.keys(pageAccessByRole).length,
						availablePagesCount: availablePages.length,
						reason: 'System still loading'
					});
				}
				return true;
			}

			// No role = no access (except during initialization which is handled above)
			if (!currentRole) {
				if (import.meta.env.DEV && path !== '/dashboard' && path !== '/') {
					console.log('❌ [PageAccess] Access denied: No currentRole', {
						path,
						status,
						reason: 'No role assigned'
					});
				}
				return false;
			}

			// Normalize path - strip query parameters and hash
			let normalizedPath = path.split('?')[0].split('#')[0];
			normalizedPath = normalizedPath.endsWith('/') && normalizedPath !== '/' ? normalizedPath.slice(0, -1) : normalizedPath;

			// Dashboard and root are always accessible
			if (normalizedPath === '/dashboard' || normalizedPath === '/') {
				return true;
			}

			// Find page by path (exact match first, then try without leading slash)
			let page = availablePages.find(p => p.path === normalizedPath);
			if (!page) {
				// Try without leading slash
				const pathWithoutSlash = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
				page = availablePages.find(p => p.path === `/${pathWithoutSlash}` || p.path === pathWithoutSlash);
			}
			
			if (!page) {
				// Page not in available pages - deny access
				if (import.meta.env.DEV) {
					console.warn('🔒 [PageAccess] Page not found in availablePages:', {
						originalPath: path,
						normalizedPath,
						availablePaths: availablePages.slice(0, 20).map(p => ({ path: p.path, id: p.id })),
						totalPages: availablePages.length,
						searchingFor: normalizedPath
					});
				}
				return false;
			}
			
			if (import.meta.env.DEV) {
				console.log('🔍 [PageAccess] Found page:', {
					path: normalizedPath,
					pageId: page.id,
					pageIdType: typeof page.id,
					pageDbId: page.dbId,
					pageDbIdType: typeof page.dbId,
					pagePath: page.path,
					pageCategory: page.category,
					pageTitle: page.title
				});
				
				// Check if there are other pages with similar paths or IDs
				const similarPages = availablePages.filter(ap => 
					ap.path === page.path || 
					ap.id === page.id ||
					(ap.dbId && page.dbId && ap.dbId === page.dbId)
				);
				if (similarPages.length > 1) {
					console.log('⚠️ [PageAccess] Found multiple pages with same path/ID:', similarPages.map(p => ({
						id: p.id,
						dbId: p.dbId,
						path: p.path
					})));
				}
			}

			// Administrators have full access
			if (currentRole.toLowerCase() === 'administrator') {
				return true;
			}

			// Get role permissions
			const roleKey = resolveRoleKey(currentRole);
			if (!roleKey) {
				if (import.meta.env.DEV) {
					console.warn('🔒 [PageAccess] No role key resolved for role:', currentRole, 'Available keys:', Object.keys(pageAccessByRole));
				}
				return false;
			}

			const allowedPageIds = pageAccessByRole[roleKey];
			if (!allowedPageIds || allowedPageIds.length === 0) {
				if (import.meta.env.DEV) {
					console.warn('🔒 [PageAccess] No page IDs found for role:', roleKey, 'Resolved from:', currentRole);
				}
				return false;
			}

			// Check if role has access to this page
			// Access logic (prioritized):
			// 1. Administrators: Full access (bypassed above)
			// 2. Path-based matching: Check if ANY page with same path is in allowedPageIds (MOST RELIABLE)
			// 3. Page ID matching: Direct ID match (case-insensitive)
			// 4. Officers + Customer pages: Allow if page exists (customer assignment checked at API level)
			// 5. Customer roles + Customer pages: Check customer page assignments
			// 
			// Note: Officers can access customer pages even if not in allowedPageIds because:
			// - Customer assignment is verified at the API/data level when accessing customer data
			// - Route-level access should allow officers to reach customer pages
			// - The actual customer assignment check happens in the backend API
			// 
			// Path-based matching is more reliable because:
			// - Paths are what we're actually checking (the URL)
			// - Paths are stable and predictable
			// - Less prone to ID format mismatches
			
			const pagePathLower = page.path?.toLowerCase().trim();
			const pageIdLower = page.id?.toLowerCase().trim();
			let hasRoleAccess = false;
			
			// PRIMARY: Path-based matching (most reliable)
			// Check if any page with the same path has an ID in the allowed list
			if (pagePathLower) {
				// Find all pages with the same path
				const pagesWithSamePath = availablePages.filter(ap => {
					const apPath = ap.path?.toLowerCase().trim();
					return apPath === pagePathLower;
				});
				
				// Check if any of these pages have an ID in the allowed list
				hasRoleAccess = pagesWithSamePath.some(pageWithPath => {
					const pageId = pageWithPath.id?.toLowerCase().trim();
					const pageDbId = pageWithPath.dbId ? String(pageWithPath.dbId).toLowerCase().trim() : null;
					
					return allowedPageIds.some(allowedId => {
						const allowedIdStr = String(allowedId).toLowerCase().trim();
						// Match by page ID
						if (pageId && allowedIdStr === pageId) {
							return true;
						}
						// Match by dbId
						if (pageDbId && allowedIdStr === pageDbId) {
							return true;
						}
						return false;
					});
				});
				
				if (import.meta.env.DEV && hasRoleAccess) {
					console.log('✅ [PageAccess] Access granted via PATH-based matching:', {
						path: pagePathLower,
						matchingPages: pagesWithSamePath.map(p => ({ id: p.id, dbId: p.dbId }))
					});
				}
			}
			
			// SECONDARY: Direct page ID matching (if path-based didn't work)
			if (!hasRoleAccess && pageIdLower) {
				// Try exact match first (fastest)
				if (allowedPageIds.includes(page.id)) {
					hasRoleAccess = true;
				} else {
					// Try case-insensitive match
					hasRoleAccess = allowedPageIds.some(allowedId => {
						const allowedIdStr = String(allowedId).toLowerCase().trim();
						return allowedIdStr === pageIdLower;
					});
				}
				
				// Also try dbId match
				if (!hasRoleAccess && page.dbId !== undefined) {
					const dbIdStr = String(page.dbId).toLowerCase().trim();
					hasRoleAccess = allowedPageIds.some(allowedId => {
						const allowedIdStr = String(allowedId).toLowerCase().trim();
						return allowedIdStr === dbIdStr;
					});
				}
				
				if (import.meta.env.DEV && hasRoleAccess) {
					console.log('✅ [PageAccess] Access granted via ID-based matching:', {
						pageId: page.id,
						pageDbId: page.dbId
					});
				}
			}
			
			// TERTIARY: For officers, allow access to specific pages they should always have
			// (This happens BEFORE the debug logging so we can see if it worked)
			const isOfficer = currentRole === 'advantageoneofficer' || currentRole === 'advantageonehoofficer';
			const isCustomerPage = page.path?.startsWith('/customer') || page.category === 'Customer';
			const isManagementCustomerReporting = page.path === '/management/customer-reporting' || page.id === 'management-customer-reporting';
			
			if (!hasRoleAccess && isOfficer) {
				// Officers can access customer pages (customer assignment checked at API level)
				if (isCustomerPage) {
					if (import.meta.env.DEV) {
						console.log('✅ [PageAccess] Allowing customer page access for officer (customer assignment checked at API level):', {
							path,
							pageId: page.id,
							pagePath: page.path,
							reason: 'Officers can access customer pages - customer assignment verified at data access level'
						});
					}
					hasRoleAccess = true;
				}
				// Officers should always have access to management customer reporting
				else if (isManagementCustomerReporting) {
					if (import.meta.env.DEV) {
						console.log('✅ [PageAccess] Allowing management customer reporting for officer:', {
							path,
							pageId: page.id,
							reason: 'Officers should always have access to customer reporting management page'
						});
					}
					hasRoleAccess = true;
				}
			}
			
			if (import.meta.env.DEV && !hasRoleAccess) {
				const debugInfo = {
					originalPath: path,
					normalizedPath,
					pageId: page.id,
					pageDbId: page.dbId,
					currentRole,
					roleKey,
					allowedPageIdsCount: allowedPageIds.length,
					allowedPageIds: allowedPageIds.slice(0, 30), // Show first 30
					pageIdInAllowed: allowedPageIds.includes(page.id),
					pageDbIdInAllowed: page.dbId ? allowedPageIds.includes(page.dbId.toString()) : false,
					hasAccess: false,
					pagePath: page.path,
					pageCategory: page.category
				};
				
				// Log as separate lines for better readability
				console.group('🔒 [PageAccess] Access denied for:', normalizedPath);
				
				// Explicit string logging for debugging
				console.log('🔍 ACTUAL VALUES:');
				console.log('  Page ID:', page.id, '(type:', typeof page.id + ')');
				console.log('  Page DB ID:', page.dbId, '(type:', typeof page.dbId + ')');
				console.log('  Page Path:', page.path);
				console.log('  Page ID (normalized):', page.id?.toLowerCase().trim());
				console.log('  Allowed IDs count:', allowedPageIds.length);
				console.log('  Allowed IDs (as strings):', allowedPageIds.map(id => String(id)).join(', '));
				console.log('  Looking for "customer-incident-report":', allowedPageIds.map(id => String(id).toLowerCase().trim()).includes('customer-incident-report'));
				
				// Check path-based matching
				const pagesWithSamePath = availablePages.filter(ap => {
					const apPath = ap.path?.toLowerCase().trim();
					return apPath === pagePathLower;
				});
				const pathBasedMatch = pagesWithSamePath.some(pageWithPath => {
					const pageId = pageWithPath.id?.toLowerCase().trim();
					const pageDbId = pageWithPath.dbId ? String(pageWithPath.dbId).toLowerCase().trim() : null;
					return allowedPageIds.some(allowedId => {
						const allowedIdStr = String(allowedId).toLowerCase().trim();
						return (pageId && allowedIdStr === pageId) || (pageDbId && allowedIdStr === pageDbId);
					});
				});
				
				console.log('📄 Page Info:', {
					id: page.id,
					dbId: page.dbId,
					path: page.path,
					category: page.category,
					pagesWithSamePath: pagesWithSamePath.length,
					pathBasedMatchAvailable: pathBasedMatch
				});
				console.log('👤 User Role:', {
					currentRole,
					roleKey,
					resolved: roleKey ? '✅' : '❌'
				});
				console.log('📋 Allowed Page IDs (Full List):', allowedPageIds);
				console.log('📋 Allowed Page IDs (Full List - Strings):', allowedPageIds.map(id => String(id)));
				console.log('📋 Allowed Page IDs (First 30):', allowedPageIds.slice(0, 30));
				console.log('📋 Allowed Page IDs (Types):', allowedPageIds.map(id => ({ id, type: typeof id, stringValue: String(id) })));
				// Enhanced search with case-insensitive comparison
				const exactMatch = allowedPageIds.find(id => String(id).toLowerCase().trim() === pageIdLower);
				const dbIdMatch = page.dbId ? allowedPageIds.find(id => String(id).toLowerCase().trim() === String(page.dbId).toLowerCase().trim()) : null;
				
				console.log('🔍 Search Results:', {
					'path-based match': pathBasedMatch,
					'page.id in allowed? (exact)': allowedPageIds.includes(page.id),
					'page.id in allowed? (case-insensitive)': !!exactMatch,
					'page.dbId in allowed?': page.dbId ? allowedPageIds.includes(page.dbId.toString()) : 'N/A',
					'page.dbId match (case-insensitive)': !!dbIdMatch,
					'page.id type': typeof page.id,
					'page.dbId type': typeof page.dbId,
					'exact match found': exactMatch || null,
					'dbId match found': dbIdMatch || null,
					'pageId normalized': pageIdLower,
					'allowedIds sample (normalized)': allowedPageIds.slice(0, 5).map(id => String(id).toLowerCase().trim())
				});
				console.log('🔎 Looking for:', {
					pageId: page.id,
					pageIdNormalized: pageIdLower,
					pageDbId: page.dbId?.toString(),
					pageIdType: typeof page.id,
					pageDbIdType: typeof page.dbId,
					pagePath: page.path
				});
				// Check all customer pages to see which ones are in the allowed list
				const customerPageIds = ['customer-incident-report', 'customer-incident-graph', 'customer-satisfaction-report', 'customer-daily-activity-report'];
				const customerPageMatches = customerPageIds.map(customerPageId => {
					const exactMatch = allowedPageIds.includes(customerPageId);
					const caseInsensitiveMatch = allowedPageIds.some(id => String(id).toLowerCase().trim() === customerPageId.toLowerCase().trim());
					const foundId = allowedPageIds.find(id => String(id).toLowerCase().trim() === customerPageId.toLowerCase().trim());
					return {
						pageId: customerPageId,
						exactMatch,
						caseInsensitiveMatch,
						foundId: foundId || null,
						foundIdType: foundId ? typeof foundId : null
					};
				});
				
				const allowedPagesWithSamePath = pagesWithSamePath.filter(ap => {
					const apIdLower = ap.id?.toLowerCase().trim();
					const apDbIdStr = ap.dbId ? String(ap.dbId).toLowerCase().trim() : null;
					return allowedPageIds.some(allowedId => {
						const allowedIdStr = String(allowedId).toLowerCase().trim();
						return allowedIdStr === apIdLower || allowedIdStr === apDbIdStr;
					});
				});
				
				console.log('🔍 Direct Comparison:', {
					'customer-incident-report in array (exact)': allowedPageIds.includes('customer-incident-report'),
					'customer-incident-report in array (case-insensitive)': allowedPageIds.some(id => String(id).toLowerCase().trim() === 'customer-incident-report'),
					'dbId in array': page.dbId ? allowedPageIds.includes(String(page.dbId)) : false,
					'dbId in array (case-insensitive)': page.dbId ? allowedPageIds.some(id => String(id).toLowerCase().trim() === String(page.dbId).toLowerCase().trim()) : false,
					'customer pages matches': customerPageMatches,
					'pages with same path': pagesWithSamePath.map(p => ({ id: p.id, dbId: p.dbId, path: p.path })),
					'allowed pages with same path': allowedPagesWithSamePath.map(p => ({ id: p.id, dbId: p.dbId, path: p.path })),
					'path-based match would work': pathBasedMatch
				});
				
				// Show all allowed IDs that contain "incident" or "customer"
				const relevantIds = allowedPageIds.filter(id => {
					const idStr = String(id).toLowerCase();
					return idStr.includes('incident') || idStr.includes('customer');
				});
				console.log('🔍 Relevant Allowed IDs (containing "incident" or "customer"):', relevantIds);
				console.log('🔍 All Allowed IDs:', allowedPageIds.map(id => String(id)).join(', '));
				console.groupEnd();
			}


			if (!hasRoleAccess) {
				return false;
			}

			// For customer roles accessing customer pages, check customer assignments
			const isCustomerRole = currentRole === 'customersitemanager' || currentRole === 'customerhomanager';

			if (isCustomerRole && isCustomerPage && customerAssignedPageIds.size > 0) {
				const hasCustomerAssignment = customerAssignedPageIds.has(page.id);
				if (import.meta.env.DEV) {
					console.log('🔍 [PageAccess] Customer assignment check:', {
						path,
						pageId: page.id,
						isCustomerRole,
						isCustomerPage,
						customerAssignedPageIdsCount: customerAssignedPageIds.size,
						hasCustomerAssignment,
						decision: hasCustomerAssignment ? '✅ ALLOWED' : '❌ DENIED'
					});
				}
				return hasCustomerAssignment;
			}

			// Success - access granted
			if (import.meta.env.DEV) {
				const endTime = performance.now();
				const duration = endTime - startTime;
				console.log('✅ [PageAccess] Access GRANTED:', {
					path,
					pageId: page.id,
					pagePath: page.path,
					currentRole,
					roleKey,
					duration: `${duration.toFixed(2)}ms`,
					reason: isCustomerRole && isCustomerPage 
						? 'Customer role with customer page (no assignment check needed)' 
						: 'Role has access to page'
				});
			}
			return true;
		} catch (error) {
			console.error('🔒 [PageAccess] Error checking access:', error);
			console.error('📋 Error Context:', {
				path,
				currentRole,
				errorMessage: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			});
			return false;
		}
	}, [currentRole, pageAccessByRole, availablePages, customerAssignedPageIds, status, resolveRoleKey]);

	// Refresh settings
	const refreshSettings = useCallback(async (): Promise<void> => {
		if (!hasAuthToken()) {
			setStatus('idle');
			setError(null);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			await loadPageAccessSettings();
		} catch (error) {
			console.error('❌ [PageAccess] Error refreshing settings:', error);
		} finally {
			setIsLoading(false);
		}
	}, [hasAuthToken, loadPageAccessSettings]);

	// Clear cache and reload
	const clearCacheAndReload = useCallback(async (): Promise<void> => {
		settingsLoadAttempted.current = false;
		await refreshSettings();
	}, [refreshSettings]);

	// Sync pages (admin only)
	const syncPages = useCallback(async (): Promise<void> => {
		if (!hasAuthToken() || currentRole !== 'administrator') {
			return;
		}

		try {
			await pageAccessApi.syncPages(PAGE_DEFINITIONS);
			await refreshSettings();
		} catch (error) {
			console.error('❌ [PageAccess] Error syncing pages:', error);
		}
	}, [hasAuthToken, currentRole, refreshSettings]);

	// Set current role with data loading
	const setCurrentRole = useCallback(async (role: string | null) => {
		const normalizedRole = normalizeRoleName(role);
		setCurrentRoleState(normalizedRole);

		if (!normalizedRole || !hasAuthToken()) {
			setCustomerAssignedPageIds(new Set());
			lastCustomerContextId.current = null;
			return;
		}

		// Load customer assignments if needed
		const isCustomerRole = normalizedRole === 'customersitemanager' || normalizedRole === 'customerhomanager';
		if (isCustomerRole && user) {
			const customerId = 'customerId' in user ? user.customerId : null;
			await loadCustomerPageAssignments(customerId);
		} else {
			setCustomerAssignedPageIds(new Set());
			lastCustomerContextId.current = null;
		}
	}, [normalizeRoleName, hasAuthToken, user, loadCustomerPageAssignments]);

	// Set role immediately when user exists (before loading settings)
	// This runs synchronously on mount and whenever user changes
	useEffect(() => {
		if (user) {
			const userRole = (user as any).pageAccessRole || user.role || null;
			const normalizedRole = normalizeRoleName(userRole);
			if (normalizedRole && normalizedRole !== currentRole) {
				setCurrentRoleState(normalizedRole);
			}
		} else if (!user && currentRole) {
			// Clear role when user logs out
			setCurrentRoleState(null);
		}
	}, [user?.id, user?.role, normalizeRoleName]); // Only depend on user.id and user.role, not currentRole

	// Initialize on mount and when user/auth token changes
	useEffect(() => {
		// Prevent multiple initializations
		if (initializationRef.current) {
			return;
		}

		const initialize = async () => {
			// Skip if no auth token
			if (!hasAuthToken()) {
				setStatus('idle');
				setIsLoading(false);
				return;
			}

			// Skip if already attempted
			if (settingsLoadAttempted.current) {
				return;
			}

			settingsLoadAttempted.current = true;
			initializationRef.current = true;

			try {
				setIsLoading(true);
				setStatus('loading');

				// Load settings
				await loadPageAccessSettings();

				// Set role from user (in case it wasn't set yet)
				if (user) {
					const userRole = (user as any).pageAccessRole || user.role || null;
					const normalizedRole = normalizeRoleName(userRole);
					
					if (normalizedRole) {
						setCurrentRoleState(normalizedRole);
						
						// Load customer assignments if needed
						const isCustomerRole = normalizedRole === 'customersitemanager' || normalizedRole === 'customerhomanager';
						if (isCustomerRole && 'customerId' in user) {
							await loadCustomerPageAssignments(user.customerId);
						}
					}
				}
			} catch (error) {
				console.error('❌ [PageAccess] Initialization error:', error);
				setStatus('offline');
				
				// Set role from user even on error
				if (user) {
					const userRole = (user as any).pageAccessRole || user.role || null;
					const normalizedRole = normalizeRoleName(userRole);
					if (normalizedRole) {
						setCurrentRoleState(normalizedRole);
					}
				}
			} finally {
				setIsLoading(false);
			}
		};

		initialize();
	}, [hasAuthToken, user?.id, loadPageAccessSettings, normalizeRoleName, loadCustomerPageAssignments]);

	// Reset when user logs out
	useEffect(() => {
		if (!hasAuthToken()) {
			setCurrentRoleState(null);
			setPageAccessByRole({});
			setAvailablePages([]);
			setCustomerAssignedPageIds(new Set());
			setStatus('idle');
			setError(null);
			initializationRef.current = false;
			settingsLoadAttempted.current = false;
			lastCustomerContextId.current = null;
		}
	}, [hasAuthToken]);

	return (
		<PageAccessContext.Provider value={{
			hasAccess,
			currentRole,
			setCurrentRole,
			pageAccessByRole,
			setPageAccessByRole,
			availablePages,
			isLoading,
			status,
			error,
			refreshSettings,
			clearCacheAndReload,
			syncPages,
			isTestMode,
			setIsTestMode,
			testRole,
			setTestRole
		}}>
			{children}
		</PageAccessContext.Provider>
	);
};
