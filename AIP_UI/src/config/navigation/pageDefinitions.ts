/**
 * Page Definitions - Canonical list of all pages in the application
 * 
 * This file extracts page definitions from sidebar.ts to ensure consistency
 * between frontend navigation and backend database.
 * 
 * When adding a new page:
 * 1. Add it to sidebar.ts
 * 2. Add it here with proper pageId, category, and description
 * 3. The backend will auto-sync on next API call
 */

import { SIDEBAR_TOP_LINKS, SIDEBAR_SECTIONS } from './sidebar'

export interface PageDefinition {
	pageId: string // Unique identifier (kebab-case, matches backend PageId)
	title: string // Display name
	path: string // Route path (must match sidebar.ts)
	category: string // Category for grouping (Administration, Customer, etc.)
	description?: string // Optional description
	sortOrder: number // Sort order within category
}

/**
 * Helper function to convert path to pageId
 * Example: "/administration/user-setup" -> "user-setup"
 */
const pathToPageId = (path: string): string => {
	return path
		.replace(/^\//, '') // Remove leading slash
		.replace(/\//g, '-') // Replace slashes with hyphens
		.toLowerCase()
}

/**
 * Helper function to determine category from section
 */
const sectionToCategory = (sectionId: string): string => {
	const categoryMap: Record<string, string> = {
		'administration': 'Administration',
		'crm': 'CRM',
		'operations': 'Operations',
		'employee': 'Employee',
		'management': 'Management',
		'compliance': 'Compliance',
		'recruitment': 'Recruitment',
		'customer': 'Customer',
	}
	return categoryMap[sectionId] || 'Other'
}

/**
 * Extract all pages from sidebar configuration
 */
const extractPagesFromSidebar = (): PageDefinition[] => {
	const pages: PageDefinition[] = []
	let sortOrder = 1

	// Add top-level links (Action Calendar, Customer Reporting)
	SIDEBAR_TOP_LINKS.forEach((link, index) => {
		const pageId = pathToPageId(link.path)
		const category = link.path.includes('/management/') ? 'Management' : 'Main'
		
		pages.push({
			pageId,
			title: link.label,
			path: link.path,
			category,
			description: `${link.label} page`,
			sortOrder: sortOrder++,
		})
	})

	// Add pages from sections
	SIDEBAR_SECTIONS.forEach((section) => {
		const category = sectionToCategory(section.id)
		const baseSortOrder = getCategoryBaseSortOrder(category)

		section.links.forEach((link, index) => {
			const pageId = pathToPageId(link.path)
			
			pages.push({
				pageId,
				title: link.label,
				path: link.path,
				category,
				description: `${link.label} page`,
				sortOrder: baseSortOrder + index,
			})
		})
	})

	return pages
}

/**
 * Get base sort order for each category
 */
const getCategoryBaseSortOrder = (category: string): number => {
	const categorySortMap: Record<string, number> = {
		'Main': 1,
		'Administration': 10,
		'CRM': 20,
		'Operations': 30,
		'Employee': 40,
		'Management': 50,
		'Compliance': 60,
		'Recruitment': 70,
		'Customer': 80,
	}
	return categorySortMap[category] || 100
}

/**
 * Canonical list of all pages in the application
 * This is the single source of truth for page definitions
 */
export const PAGE_DEFINITIONS: PageDefinition[] = [
	// Main pages
	{
		pageId: 'dashboard',
		title: 'Dashboard',
		path: '/dashboard',
		category: 'Main',
		description: 'Main dashboard',
		sortOrder: 1,
	},
	{
		pageId: 'action-calendar',
		title: 'Action Calendar',
		path: '/action-calendar',
		category: 'Main',
		description: 'Action calendar',
		sortOrder: 2,
	},
	{
		pageId: 'profile',
		title: 'Profile',
		path: '/profile',
		category: 'Main',
		description: 'User profile',
		sortOrder: 3,
	},
	{
		pageId: 'settings',
		title: 'Settings',
		path: '/settings',
		category: 'Main',
		description: 'Application settings',
		sortOrder: 4,
	},

	// Administration
	{
		pageId: 'user-setup',
		title: 'User Setup',
		path: '/administration/user-setup',
		category: 'Administration',
		description: 'User management and setup',
		sortOrder: 10,
	},
	{
		pageId: 'employee-registration',
		title: 'Employee Registration',
		path: '/administration/employee-registration',
		category: 'Administration',
		description: 'Employee registration',
		sortOrder: 11,
	},
	{
		pageId: 'customer-setup',
		title: 'Customer Setup',
		path: '/administration/customer-setup',
		category: 'Administration',
		description: 'Customer management',
		sortOrder: 12,
	},
	{
		pageId: 'customer-page-settings',
		title: 'Customer Page Settings',
		path: '/administration/customer-page-settings',
		category: 'Administration',
		description: 'Configure which pages are available to customers',
		sortOrder: 13,
	},
	{
		pageId: 'stock-control',
		title: 'Stock Control',
		path: '/administration/stock-control',
		category: 'Administration',
		description: 'Stock management',
		sortOrder: 14,
	},

	// CRM
	{
		pageId: 'crm-dashboard',
		title: 'CRM Dashboard',
		path: '/crm/dashboard',
		category: 'CRM',
		description: 'CRM dashboard',
		sortOrder: 81,
	},
	{
		pageId: 'crm-contacts',
		title: 'CRM Contacts',
		path: '/crm/contacts',
		category: 'CRM',
		description: 'CRM contacts management',
		sortOrder: 82,
	},
	{
		pageId: 'crm-pipeline',
		title: 'Sales Pipeline',
		path: '/crm/pipeline',
		category: 'CRM',
		description: 'CRM sales pipeline management',
		sortOrder: 83,
	},

	// Operations
	{
		pageId: 'incident-report',
		title: 'Incident Report',
		path: '/operations/incident-report',
		category: 'Operations',
		description: 'Incident reporting',
		sortOrder: 20,
	},
	{
		pageId: 'mystery-shopper',
		title: 'Mystery Shopper',
		path: '/operations/mystery-shopper',
		category: 'Operations',
		description: 'Mystery shopper reports',
		sortOrder: 21,
	},
	{
		pageId: 'site-visit',
		title: 'Site Visit',
		path: '/operations/site-visit',
		category: 'Operations',
		description: 'Site visit reports',
		sortOrder: 22,
	},
	{
		pageId: 'holiday-requests',
		title: 'Holiday Requests',
		path: '/operations/holiday-requests',
		category: 'Operations',
		description: 'Holiday request management',
		sortOrder: 23,
	},
	{
		pageId: 'bank-holiday',
		title: 'Bank Holiday',
		path: '/operations/bank-holiday',
		category: 'Operations',
		description: 'Bank holiday management',
		sortOrder: 24,
	},
	{
		pageId: 'customer-satisfaction',
		title: 'Customer Satisfaction',
		path: '/operations/customer-satisfaction',
		category: 'Operations',
		description: 'Customer satisfaction reports',
		sortOrder: 25,
	},
	{
		pageId: 'safe-duress-words',
		title: 'Safe/Duress Words',
		path: '/operations/safe-duress-words',
		category: 'Operations',
		description: 'Safe and duress words management',
		sortOrder: 27,
	},
	{
		pageId: 'officer-support',
		title: 'Officer Support',
		path: '/operations/officer-support',
		category: 'Operations',
		description: 'Officer support',
		sortOrder: 28,
	},
	{
		pageId: 'officer-expenses',
		title: 'Officer Expenses',
		path: '/operations/officer-expenses',
		category: 'Operations',
		description: 'Officer expenses management',
		sortOrder: 29,
	},

	// Employee
	{
		pageId: 'uniform-equipment',
		title: 'Uniform & Equipment',
		path: '/employee/uniform-equipment',
		category: 'Employee',
		description: 'Uniform and equipment management',
		sortOrder: 30,
	},
	{
		pageId: 'disciplinary',
		title: 'Disciplinary',
		path: '/employee/disciplinary',
		category: 'Employee',
		description: 'Disciplinary records',
		sortOrder: 31,
	},
	{
		pageId: 'diary',
		title: 'Diary',
		path: '/employee/diary',
		category: 'Employee',
		description: 'Employee diary',
		sortOrder: 32,
	},

	// Management
	{
		pageId: 'management-customer-reporting',
		title: 'Customer Reporting',
		path: '/management/customer-reporting',
		category: 'Management',
		description: 'Customer reporting',
		sortOrder: 40,
	},
	{
		pageId: 'manager-support',
		title: 'Manager Support',
		path: '/management/manager-support',
		category: 'Management',
		description: 'Manager support',
		sortOrder: 41,
	},
	{
		pageId: 'officer-performance',
		title: 'Officer Performance',
		path: '/management/officer-performance',
		category: 'Management',
		description: 'Officer performance tracking',
		sortOrder: 43,
	},
	{
		pageId: 'data-analytics-hub',
		title: 'Data Analytics Hub',
		path: '/analytics/data-analytics-hub',
		category: 'Management',
		description: 'Comprehensive crime analytics and intelligence dashboard',
		sortOrder: 44,
	},

	// Compliance
	{
		pageId: 'contract-renewal',
		title: 'Contract Renewal',
		path: '/compliance/contract-renewal',
		category: 'Compliance',
		description: 'Contract renewal management',
		sortOrder: 50,
	},
	{
		pageId: 'password-register',
		title: 'Password Register',
		path: '/compliance/password-register',
		category: 'Compliance',
		description: 'Password register',
		sortOrder: 51,
	},
	{
		pageId: 'asset-register',
		title: 'Asset Register',
		path: '/compliance/asset-register',
		category: 'Compliance',
		description: 'Asset register',
		sortOrder: 52,
	},

	// Recruitment
	{
		pageId: 'vetting',
		title: 'Vetting',
		path: '/recruitment/vetting',
		category: 'Recruitment',
		description: 'Recruitment vetting',
		sortOrder: 60,
	},
	{
		pageId: 'cbt',
		title: 'CBT',
		path: '/recruitment/cbt',
		category: 'Recruitment',
		description: 'Computer-based training',
		sortOrder: 61,
	},
	{
		pageId: 'take-test',
		title: 'Take Test',
		path: '/recruitment/take-test',
		category: 'Recruitment',
		description: 'Take recruitment test',
		sortOrder: 62,
	},

	// Customer pages
	{
		pageId: 'customer-daily-activity-report',
		title: 'Daily Activity Report',
		path: '/customer/daily-activity-report',
		category: 'Customer',
		description: 'Daily activity reporting',
		sortOrder: 74,
	},
	{
		pageId: 'customer-incident-graph',
		title: 'Incident Graph',
		path: '/customer/incident-graph',
		category: 'Customer',
		description: 'Incident graphs',
		sortOrder: 75,
	},
	{
		pageId: 'customer-crime-intelligence',
		title: 'Crime Intelligence',
		path: '/customer/crime-intelligence',
		category: 'Customer',
		description: 'Crime intelligence dashboard',
		sortOrder: 79,
	},
	{
		pageId: 'customer-incident-report',
		title: 'Incident Report',
		path: '/customer/incident-report',
		category: 'Customer',
		description: 'Customer incident reporting',
		sortOrder: 71,
	},
	{
		pageId: 'customer-satisfaction-report',
		title: 'Satisfaction Reports',
		path: '/customer/satisfaction-report',
		category: 'Customer',
		description: 'Customer satisfaction reports',
		sortOrder: 72,
	},
	{
		pageId: 'customer-be-safe-be-secure',
		title: 'Daily Activity Graphs',
		path: '/customer/be-safe-be-secure',
		category: 'Customer',
		description: 'Daily activity graphs',
		sortOrder: 73,
	},
	{
		pageId: 'customer-officer-support',
		title: 'Officer Support',
		path: '/customer/officer-support',
		category: 'Customer',
		description: 'Customer officer support',
		sortOrder: 76,
	},
	{
		pageId: 'daily-occurrence-book',
		title: 'Daily Occurrence Book',
		path: '/customer/daily-occurrence-book',
		category: 'Customer',
		description: 'Daily occurrence book (DOB)',
		sortOrder: 77,
	},
	// Legacy/alias page definitions that the backend expects (these are duplicates/aliases)
	// These are kept to satisfy backend validation checks
	{
		pageId: 'incident-graph',
		title: 'Incident Graph',
		path: '/customer/incident-graph',
		category: 'Customer',
		description: 'Incident graphs (legacy alias for customer-incident-graph)',
		sortOrder: 81,
	},
	{
		pageId: 'satisfaction-reports',
		title: 'Satisfaction Reports',
		path: '/customer/satisfaction-report',
		category: 'Customer',
		description: 'Customer satisfaction reports (legacy alias for customer-satisfaction-report)',
		sortOrder: 82,
	},
	{
		pageId: 'be-safe-be-secure-graph',
		title: 'Daily Activity Graphs',
		path: '/customer/be-safe-be-secure',
		category: 'Customer',
		description: 'Daily activity graphs (legacy alias for customer-be-safe-be-secure)',
		sortOrder: 83,
	},
]

/**
 * Get page definition by path
 */
export const getPageDefinitionByPath = (path: string): PageDefinition | undefined => {
	return PAGE_DEFINITIONS.find(p => p.path === path)
}

/**
 * Get page definition by pageId
 */
export const getPageDefinitionById = (pageId: string): PageDefinition | undefined => {
	return PAGE_DEFINITIONS.find(p => p.pageId === pageId)
}

/**
 * Get all pages for a specific category
 */
export const getPagesByCategory = (category: string): PageDefinition[] => {
	return PAGE_DEFINITIONS.filter(p => p.category === category)
}

