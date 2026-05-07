import type { Customer, Region, Site } from '@/types/customer'

const now = new Date().toISOString()

export const mockCustomers: Customer[] = [
  {
    id: "21", // Changed from "COOP001" to "21" to match regions/sites
    companyName: "Central England COOP",
    companyNumber: "IP00141R",
    vatNumber: "GB123456789",
    status: "active",
    customerType: "retail",
    address: {
      building: "Central House",
      street: "Herrick Way",
      town: "Enderby",
      county: "Leicestershire",
      postcode: "LE19 1LS"
    },
    contact: {
      title: "Mr",
      forename: "James",
      surname: "Wilson",
      position: "Head of Security",
      email: "james.wilson@centralengland.coop",
      phone: "0116 123 4567"
    },
    viewConfig: {
      id: "vc-21",
      customerId: "21", // Updated to match customer ID
      customerType: "retail",
      enabledPages: [
        "incident-report",
        "daily-activity",
        "customer-satisfaction",
        "be-safe-be-secure",
        "site-visit-reports",
        "officer-support"
      ],
      createdAt: now,
      updatedAt: now
    },
    pageAssignments: [
      {
        pageId: "incident-report",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "daily-activity",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "customer-satisfaction",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "be-safe-be-secure",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "site-visit-reports",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "officer-support",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      }
    ],
    assignedOfficers: ["2", "3"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "22", // Changed from "COOP002" to "22" to match regions/sites
    companyName: "Heart of England",
    companyNumber: "IP00141S",
    vatNumber: "GB987654321",
    status: "active",
    customerType: "retail",
    address: {
      building: "Co-operative House",
      street: "Warwick Technology Park",
      town: "Warwick",
      county: "Warwickshire",
      postcode: "CV34 6DA"
    },
    contact: {
      title: "Ms",
      forename: "Sarah",
      surname: "Johnson",
      position: "Security Manager",
      email: "sarah.johnson@heartofengland.coop",
      phone: "01926 456 789"
    },
    viewConfig: {
      id: "vc-22",
      customerId: "22", // Updated to match customer ID
      customerType: "retail",
      enabledPages: [
        "incident-report",
        "daily-activity",
        "customer-satisfaction"
      ],
      createdAt: now,
      updatedAt: now
    },
    pageAssignments: [
      {
        pageId: "incident-report",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "daily-activity",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "customer-satisfaction",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      }
    ],
    assignedOfficers: ["1", "4"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "23", // Changed from "COOP003" to "23" to match regions/sites
    companyName: "Midcounties COOP",
    companyNumber: "IP00141T",
    vatNumber: "GB456789123",
    status: "active",
    customerType: "retail",
    address: {
      building: "Midcounties House",
      street: "Warwick Technology Park",
      town: "Warwick",
      county: "Warwickshire",
      postcode: "CV34 6DA"
    },
    contact: {
      title: "Mr",
      forename: "Michael",
      surname: "Brown",
      position: "Operations Director",
      email: "michael.brown@midcounties.coop",
      phone: "01926 789 123"
    },
    viewConfig: {
      id: "vc-23",
      customerId: "23", // Updated to match customer ID
      customerType: "retail",
      enabledPages: [
        "incident-report",
        "daily-activity",
        "customer-satisfaction",
        "be-safe-be-secure"
      ],
      createdAt: now,
      updatedAt: now
    },
    pageAssignments: [
      {
        pageId: "incident-report",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "daily-activity",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "customer-satisfaction",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      {
        pageId: "be-safe-be-secure",
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      }
    ],
    assignedOfficers: ["2", "5"],
    createdAt: now,
    updatedAt: now
  }
]

export const mockRegions: Region[] = [
  // Central England COOP Regions
  {
    id: "REG001",
    name: "East Midlands",
    customerId: "COOP001",
    manager: "Peter Smith",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "REG002",
    name: "West Midlands",
    customerId: "COOP001",
    manager: "Emma Davis",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "REG003",
    name: "Yorkshire",
    customerId: "COOP001",
    manager: "Michael Johnson",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  
  // Midcounties COOP Regions
  {
    id: "REG004",
    name: "Oxfordshire",
    customerId: "COOP002",
    manager: "Rachel Green",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "REG005",
    name: "Gloucestershire",
    customerId: "COOP002",
    manager: "Tom Wilson",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "REG006",
    name: "Wiltshire",
    customerId: "COOP002",
    manager: "Lucy Taylor",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  
  // Heart of England COOP Regions
  {
    id: "REG007",
    name: "Coventry",
    customerId: "COOP003",
    manager: "John Roberts",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "REG008",
    name: "Nuneaton",
    customerId: "COOP003",
    manager: "Sarah Palmer",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "REG009",
    name: "Rugby",
    customerId: "COOP003",
    manager: "Mark Thompson",
    status: "active",
    createdAt: now,
    updatedAt: now
  }
]

export const mockSites: Site[] = [
  // Central England COOP Sites
  {
    id: "SITE001",
    locationName: "Leicester Superstore",
    regionId: "REG001",
    customerId: "COOP001",
    buildingName: "Central Retail Park",
    street: "Vaughan Way",
    town: "Leicester",
    county: "Leicestershire",
    postcode: "LE1 4SL",
    isCoreSite: true,
    sinNumber: "SIN001",
    telephone: "0116 255 1234",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "SITE002",
    locationName: "Birmingham Store",
    regionId: "REG002",
    customerId: "COOP001",
    buildingName: "The Forum",
    street: "Corporation Street",
    town: "Birmingham",
    county: "West Midlands",
    postcode: "B4 6DH",
    isCoreSite: true,
    sinNumber: "SIN002",
    telephone: "0121 236 4567",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "SITE003",
    locationName: "Sheffield Branch",
    regionId: "REG003",
    customerId: "COOP001",
    buildingName: "Meadowhall Centre",
    street: "The Arcade",
    town: "Sheffield",
    county: "South Yorkshire",
    postcode: "S9 1EP",
    isCoreSite: false,
    sinNumber: "SIN003",
    telephone: "0114 256 7890",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  
  // Midcounties COOP Sites
  {
    id: "SITE004",
    locationName: "Oxford City Centre",
    regionId: "REG004",
    customerId: "COOP002",
    buildingName: "Westgate Centre",
    street: "Queen Street",
    town: "Oxford",
    county: "Oxfordshire",
    postcode: "OX1 1PB",
    isCoreSite: true,
    sinNumber: "SIN004",
    telephone: "01865 123 456",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "SITE005",
    locationName: "Cheltenham Store",
    regionId: "REG005",
    customerId: "COOP002",
    buildingName: "High Street Store",
    street: "High Street",
    town: "Cheltenham",
    county: "Gloucestershire",
    postcode: "GL50 1EE",
    isCoreSite: true,
    sinNumber: "SIN005",
    telephone: "01242 123 456",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "SITE006",
    locationName: "Swindon Branch",
    regionId: "REG006",
    customerId: "COOP002",
    buildingName: "Orbital Shopping Park",
    street: "Thamesdown Drive",
    town: "Swindon",
    county: "Wiltshire",
    postcode: "SN25 4AN",
    isCoreSite: false,
    sinNumber: "SIN006",
    telephone: "01793 123 456",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  
  // Heart of England COOP Sites
  {
    id: "SITE007",
    locationName: "Coventry Central",
    regionId: "REG007",
    customerId: "COOP003",
    buildingName: "City Arcade",
    street: "Corporation Street",
    town: "Coventry",
    county: "West Midlands",
    postcode: "CV1 1GF",
    isCoreSite: true,
    sinNumber: "SIN007",
    telephone: "024 7622 1234",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "SITE008",
    locationName: "Nuneaton Main Store",
    regionId: "REG008",
    customerId: "COOP003",
    buildingName: "Ropewalk Shopping Centre",
    street: "Chapel Street",
    town: "Nuneaton",
    county: "Warwickshire",
    postcode: "CV11 5TZ",
    isCoreSite: true,
    sinNumber: "SIN008",
    telephone: "024 7634 5678",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "SITE009",
    locationName: "Rugby Store",
    regionId: "REG009",
    customerId: "COOP003",
    buildingName: "Clock Towers Shopping Centre",
    street: "Market Place",
    town: "Rugby",
    county: "Warwickshire",
    postcode: "CV21 2JR",
    isCoreSite: false,
    sinNumber: "SIN009",
    telephone: "01788 123 456",
    status: "active",
    createdAt: now,
    updatedAt: now
  }
] 