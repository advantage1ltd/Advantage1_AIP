import {
	AlertTriangle,
	BadgeCheck,
	BarChart2,
	BarChart3,
	BookOpen,
	Boxes,
	Calendar,
	CalendarRange,
	CheckSquare,
	DollarSign,
	FileQuestion,
	FileSearch,
	FileText,
	FileText as FileTextIcon,
	FileWarning,
	GitBranch,
	GraduationCap,
	HelpCircle,
	Key,
	LayoutDashboard,
	Shirt,
	ShieldCheck,
	TrendingUp,
	User,
	UserCog,
	UserPlus,
	UserCheck,
	Users as Users2,
	Wallet,
	Building,
	Cog,
	Brain,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export interface SidebarGuardContext {
	hasAccess: (path: string) => boolean
	isCustomerRole: boolean
	isAdministrator: boolean
	isOfficerRole: boolean
}

type GuardFn = (context: SidebarGuardContext) => boolean

export interface SidebarNavLink {
	path: string
	label: string
	icon: LucideIcon
	guard?: GuardFn
	bypassAccessCheck?: boolean
}

export interface SidebarSection {
	id: string
	label: string
	icon: LucideIcon
	links: SidebarNavLink[]
	guard?: GuardFn
	showCustomerSelector?: boolean
}

export const SIDEBAR_TOP_LINKS: SidebarNavLink[] = [
	{
		path: '/action-calendar',
		label: 'Action Calendar',
		icon: Calendar,
	},
	{
		path: '/management/customer-reporting',
		label: 'Customer Reporting',
		icon: BarChart3,
		guard: (context) => context.hasAccess('/management/customer-reporting'),
	},
	{
		path: '/analytics/data-analytics-hub',
		label: 'Data Analytics Hub',
		icon: Brain,
	},
]

export const SIDEBAR_SECTIONS: SidebarSection[] = [
	{
		id: 'administration',
		label: 'Administration',
		icon: UserCog,
		// Remove section-level guard - let individual links be controlled by page access settings
		// This allows CustomerHOManager to see User Setup if granted in settings
		guard: undefined,
		links: [
			{
				path: '/administration/user-setup',
				label: 'User Setup',
				icon: User,
			},
			{
				path: '/administration/employee-registration',
				label: 'Employee Registration',
				icon: UserPlus,
			},
			{
				path: '/administration/customer-setup',
				label: 'Customer Setup',
				icon: Building,
			},
			{
				path: '/administration/customer-page-settings',
				label: 'Customer Page Settings',
				icon: Cog,
			},
			{
				path: '/administration/stock-control',
				label: 'Stock Control',
				icon: Boxes,
			},
		],
	},
	{
		id: 'crm',
		label: 'CRM',
		icon: Users2,
		links: [
			{
				path: '/crm/dashboard',
				label: 'Dashboard',
				icon: LayoutDashboard,
			},
			{
				path: '/crm/contacts',
				label: 'CRM Contacts',
				icon: UserPlus,
			},
			{
				path: '/crm/pipeline',
				label: 'Sales Pipeline',
				icon: GitBranch,
			},
		],
	},
	{
		id: 'operations',
		label: 'Operations',
		icon: UserCheck,
		links: [
			{
				path: '/operations/incident-report',
				label: 'Incident Report',
				icon: AlertTriangle,
			},
			{
				path: '/operations/mystery-shopper',
				label: 'Mystery Shopper',
				icon: FileSearch,
			},
			{
				path: '/operations/site-visit',
				label: 'Site Visit',
				icon: Building,
			},
			{
				path: '/operations/holiday-requests',
				label: 'Holiday Requests',
				icon: Calendar,
			},
			{
				path: '/operations/bank-holiday',
				label: 'Bank Holiday',
				icon: CalendarRange,
			},
			{
				path: '/operations/customer-satisfaction',
				label: 'Customer Satisfaction',
				icon: BadgeCheck,
			},
			{
				path: '/operations/safe-duress-words',
				label: 'Safe/Duress Words',
				icon: Key,
			},
			{
				path: '/operations/officer-support',
				label: 'Officer Support',
				icon: HelpCircle,
			},
			{
				path: '/operations/officer-expenses',
				label: 'Officer Expenses',
				icon: Wallet,
			},
		],
	},
	{
		id: 'employee',
		label: 'Employee',
		icon: Users2,
		links: [
			{
				path: '/employee/uniform-equipment',
				label: 'Uniform & Equipment',
				icon: Shirt,
			},
			{
				path: '/employee/disciplinary',
				label: 'Disciplinary',
				icon: AlertTriangle,
			},
			{
				path: '/employee/diary',
				label: 'Diary',
				icon: FileTextIcon,
			},
		],
	},
	{
		id: 'management',
		label: 'Management',
		icon: BarChart3,
		links: [
			{
				path: '/management/manager-support',
				label: 'Manager Support',
				icon: Building,
			},
			{
				path: '/management/officer-performance',
				label: 'Officer Performance',
				icon: UserCheck,
			},
			// {
			// 	path: '/analytics/data-analytics-hub',
			// 	label: 'Data Analytics Hub',
			// 	icon: Brain,
			// },
		],
	},
	{
		id: 'compliance',
		label: 'Compliance',
		icon: ShieldCheck,
		links: [
			{
				path: '/compliance/contract-renewal',
				label: 'Contract Renewal',
				icon: FileText,
			},
			{
				path: '/compliance/password-register',
				label: 'Password Register',
				icon: Key,
			},
			{
				path: '/compliance/asset-register',
				label: 'Asset Register',
				icon: Boxes,
			},
		],
	},
	{
		id: 'recruitment',
		label: 'Recruitment',
		icon: GraduationCap,
		links: [
			{
				path: '/recruitment/cbt',
				label: 'CBT',
				icon: BookOpen,
			},
			{
				path: '/recruitment/take-test',
				label: 'Take Test',
				icon: FileQuestion,
			},
		],
	},
	{
		id: 'customer',
		label: 'Customer',
		icon: Building,
		showCustomerSelector: true,
		// Hide customer section from officers in sidebar (but they can still access pages via direct navigation)
		guard: (context) => {
			// Administrators and customer roles can see it
			if (context.isAdministrator || context.isCustomerRole) {
				return true;
			}
			// Hide from officers in sidebar (access is still granted via PageAccessContext fallback)
			if (context.isOfficerRole) {
				return false;
			}
			// For other roles, check access normally
			return true;
		},
		links: [
			{
				path: '/customer/daily-activity-report',
				label: 'Daily Activity Report',
				icon: FileText,
			},
			{
				path: '/customer/daily-occurrence-book',
				label: 'Daily Occurrence Book',
				icon: BookOpen,
			},
			{
				path: '/customer/be-safe-be-secure',
				label: 'Daily Activity Report Graph',
				icon: BarChart2,
			},
			{
				path: '/customer/incident-graph',
				label: 'Incident Graph',
				icon: BarChart2,
			},
			{
				path: '/customer/incident-report',
				label: 'Incident Report',
				icon: FileWarning,
			},
			{
				path: '/customer/crime-intelligence',
				label: 'Crime Intelligence',
				icon: TrendingUp,
			},
			{
				path: '/customer/satisfaction-report',
				label: 'Satisfaction Reports',
				icon: FileText,
			},
			{
				path: '/customer/officer-support',
				label: 'Officer Support',
				icon: HelpCircle,
			},
		],
	},
]

