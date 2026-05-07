import type { CustomerPage } from "@/types/customer"
import type { CustomerType } from "@/types/customer"

export const CUSTOMER_PAGES: Record<string, CustomerPage> = {
  'daily-activity': {
    id: 'customer-daily-activity-report',
    title: 'Daily Activity Report',
    description: 'View and manage daily activity reports for this customer',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/daily-activity-report',
    readOnly: false,
    category: 'reporting',
    icon: 'Calendar'
  },
  'incident-graph': {
    id: 'customer-incident-graph',
    title: 'Incident Graph',
    description: 'Visual representation of incident trends and patterns',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/incident-graph',
    readOnly: true,
    category: 'reporting',
    icon: 'BarChart3'
  },
  'incident-report': {
    id: 'customer-incident-report',
    title: 'Incident Report',
    description: 'View and manage incident reports for this customer',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/incident-report',
    readOnly: false,
    category: 'security',
    icon: 'AlertTriangle'
  },
  'customer-satisfaction': {
    id: 'customer-satisfaction-report',
    title: 'Customer Satisfaction Report',
    description: 'View customer satisfaction survey results and feedback',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/satisfaction-report',
    readOnly: true,
    category: 'reporting',
    icon: 'MessageSquare'
  },
  'be-safe-be-secure': {
    id: 'customer-be-safe-be-secure',
    title: 'Be Safe Be Secure',
    description: 'Daily activity graphs and security awareness information',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/be-safe-be-secure',
    readOnly: false,
    category: 'security',
    icon: 'Shield'
  },
  'mystery-shopper': {
    id: 'customer-mystery-shopper-report',
    title: 'Mystery Shopper Evaluations',
    description: 'Track and manage mystery shopper performance evaluations',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/mystery-shopper-report',
    readOnly: false,
    category: 'activity',
    icon: 'UserCheck'
  },
  'site-visit-reports': {
    id: 'customer-site-visit-reports',
    title: 'Site Visit Reports',
    description: 'Track and manage site visits and inspections',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/site-visit-reports',
    readOnly: false,
    category: 'activity',
    icon: 'MapPin'
  },
  'officer-support': {
    id: 'customer-officer-support',
    title: 'Officer Support',
    description: 'Support tools and resources for security officers',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/officer-support',
    readOnly: false,
    category: 'support',
    icon: 'Users'
  },
  'daily-occurrence-book': {
    id: 'customer-daily-occurrence-book',
    title: 'Daily Occurrence Book (DOB)',
    description: 'Record and manage daily occurrences, incidents, and events for this customer',
    enabled: true,
    requiredForTypes: [], // No required pages - customers needs vary
    path: '/customer/daily-occurrence-book',
    readOnly: false,
    category: 'security',
    icon: 'BookOpen'
  }
}

// Helper function to get pages based on customer type (now returns empty since no pages are required)
export const getPagesByCustomerType = (customerType: CustomerType | string): CustomerPage[] => {
  // Since customer needs vary, no pages are automatically required for any customer type
  // Return empty array - pages should be selected based on individual customer needs
  return [];
};

export const getPagesByCategory = (category: CustomerPage['category']): CustomerPage[] => {
  return Object.values(CUSTOMER_PAGES).filter(page => page.category === category)
}

export const CUSTOMER_PAGE_CATEGORIES = {
  reporting: 'Reporting & Analytics',
  activity: 'Daily Activities', 
  security: 'Security & Safety',
  support: 'Support Services'
} as const 