// User data
export const USER_DATA = {
  name: "David Ibanga",
  email: "david.ibanga@example.com",
  role: "Administrator",
  avatar: "/AdvantageOne.svg",
  initials: "DI"
} as const;

// Common button styles
export const BUTTON_STYLES = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline"
} as const;

// Common class names
export const COMMON_CLASSES = {
  mobileHeader: "flex h-18 items-center justify-between px-5 bg-header-bg text-header-text lg:hidden border-b border-header-border",
  desktopHeader: "hidden lg:flex h-20 items-center px-4 bg-header-bg text-header-text border-b border-header-border",
  sheetContent: "w-[340px] sm:w-[400px] p-0 flex flex-col h-full bg-slate-800 text-white border-r border-slate-700",
  searchInput: "w-full pl-9 h-10 rounded-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-200 focus-visible:ring-2 focus-visible:ring-accent-teal/60 focus-visible:ring-offset-0 focus-visible:border-accent-teal"
} as const;

// Navigation related constants
export const NOTIFICATION_COUNT = 3;
export const LOGO_SIZES = {
  mobile: "h-48",
  sheet: "h-56",
  ipad: "h-64",
  desktop: "h-34"
} as const;

export const NAVIGATION_ITEMS = [
  {
    title: "Dashboard",
    href: "/",
    icon: "Home"
  },
  {
    title: "Administration",
    href: "/administration",
    icon: "Settings",
    children: [
      {
        title: "User Setup",
        href: "/administration/user-setup",
        description: "Manage user accounts and permissions"
      },
      {
        title: "Employee Registration",
        href: "/administration/employee-registration",
        description: "Register and manage employees"
      },
      {
        title: "Customer Setup",
        href: "/administration/customer-setup",
        description: "Manage customer accounts"
      },
      {
        title: "Stock Control",
        href: "/administration/stock-control",
        description: "Manage inventory and stock"
      }
    ]
  },
  {
    title: "CRM",
    href: "/crm",
    icon: "Users",
    children: [
      {
        title: "Contacts",
        href: "/crm/contacts",
        description: "Manage contacts and leads"
      },
      {
        title: "Deals",
        href: "/crm/deals",
        description: "Track deals and opportunities"
      },
      {
        title: "Pipeline",
        href: "/crm/pipeline",
        description: "View sales pipeline"
      },
      {
        title: "Tasks",
        href: "/crm/tasks",
        description: "Manage tasks and follow-ups"
      }
    ]
  },
  {
    title: "Recruitment",
    href: "/recruitment",
    icon: "UserPlus",
    children: [
      {
        title: "Vetting",
        href: "/recruitment/vetting",
        description: "Candidate vetting process"
      },
      {
        title: "CBT",
        href: "/recruitment/cbt",
        description: "Computer-based testing"
      },
      {
        title: "Take Test",
        href: "/recruitment/take-test",
        description: "Take assessment tests"
      },
      {
        title: "Test Session",
        href: "/recruitment/test-session",
        description: "Manage test sessions"
      }
    ]
  },
  {
    title: "Operations",
    href: "/operations",
    icon: "Activity",
    children: [
      {
        title: "Incident Report",
        href: "/operations/incident-report",
        description: "Report and track incidents"
      },
      {
        title: "Mystery Shopper",
        href: "/operations/mystery-shopper",
        description: "Mystery shopper program"
      },
      {
        title: "Site Visit",
        href: "/operations/site-visit",
        description: "Site inspection reports"
      }
    ]
  }
] 