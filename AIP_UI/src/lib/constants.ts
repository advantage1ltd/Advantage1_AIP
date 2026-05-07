import { CalendarDays, Users, Building2, ClipboardList, BellRing, Settings as SettingsIcon } from "lucide-react"

export const UK_COUNTIES = [
  "Derbyshire",
  "Gloucestershire",
  "Greater London",
  "Greater Manchester",
  "Hampshire",
  "Hertfordshire",
  "Kent",
  "Lancashire",
  "Leicestershire",
  "Northamptonshire",
  "Nottinghamshire",
  "Oxfordshire",
  "Somerset",
  "Staffordshire",
  "Surrey",
  "Warwickshire",
  "West Midlands",
  "West Yorkshire",
  "Wiltshire"
];

export const INDUSTRIES = [
  "Technology",
  "Retail",
  "Healthcare",
  "Manufacturing",
  "Financial Services",
  "Education",
  "Construction",
  "Hospitality",
  "Transportation",
  "Energy",
  "Other"
];

export interface ServiceCategory {
  name: string;
  services?: string[];
  subcategories?: {
    name: string;
    services?: string[];
    subcategories?: {
      name: string;
      services: string[];
    }[];
  }[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    name: "Security Guards",
    services: [
      "Retail Officers",
      "Store Detective",
      "Loss Prevention Officers",
      "Covert Operatives",
      "Gatehouse Officers",
      "Concierge Officers",
      "Fire Wardens",
      "Public Protection (CSAS RSAS)",
      "Crime Scene Protection",
      "Event Officers"
    ]
  },
  {
    name: "CCTV Monitoring",
    services: [
      "Alarm Receiving",
      "CCTV Monitoring",
      "System(s) Monitoring"
    ]
  },
  {
    name: "Mobile Patrols",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  },
  {
    name: "Key Holding",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  },
  {
    name: "Access Control",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  },
  {
    name: "Event Security",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  },
  {
    name: "Alarm Response",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  },
  {
    name: "Risk Assessment",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  },
  {
    name: "Security Training",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  },
  {
    name: "Security Consulting",
    services: [
      "Key Holding or Support",
      "Alarm Response",
      "Lone Worker Response",
      "Patrol Services",
      "CCTV Patrols"
    ]
  }
];

// Flatten all services for validation
export const SERVICES = SERVICE_CATEGORIES.reduce<string[]>((acc, category) => {
  if (category.services) {
    acc.push(...category.services);
  }
  if (category.subcategories) {
    category.subcategories.forEach(subcategory => {
      if (subcategory.services) {
        acc.push(...subcategory.services);
      }
      if (subcategory.subcategories) {
        subcategory.subcategories.forEach(subsubcategory => {
          if (subsubcategory.services) {
            acc.push(...subsubcategory.services);
          }
        });
      }
    });
  }
  return acc;
}, []);

export const MENU_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Building2,
  },
  {
    title: "Contacts",
    href: "/crm/contacts",
    icon: Users,
  },
  {
    title: "Holiday Requests",
    href: "/holiday-requests",
    icon: CalendarDays,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: BellRing,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: SettingsIcon,
  },
]
