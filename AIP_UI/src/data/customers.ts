import type { Customer, CustomerWithRelations } from "@/types/customer"
import { DUMMY_REGIONS } from "./mockRegions"
import { DUMMY_SITES } from "./mockSites"

const now = new Date().toISOString()

const baseCustomer = {
  status: 'active' as const,
  customerType: 'retail' as const,
  createdAt: now,
  updatedAt: now
}

// Making DUMMY_CUSTOMERS mutable so it can be updated by the customerService
export let DUMMY_CUSTOMERS: Customer[] = [
  {
    ...baseCustomer,
    id: 21,
    companyName: "Central England COOP",
    companyNumber: "31278R",
    vatNumber: "GB 915 1416 82",
    address: {
      building: "Central House",
      street: "Herrick Way",
      village: "Westcotes",
      town: "Leicester",
      county: "Leicestershire",
      postcode: "LE3 5QH"
    },
    contact: {
      title: "Mr",
      forename: "James",
      surname: "Mitchell",
      position: "Head of Security",
      email: "james.mitchell@centralengland.coop",
      phone: "0116 254 1234"
    },
    viewConfig: {
      id: "vc21",
      customerId: 21,
      customerType: "retail",
      enabledPages: [
        "daily-activity-report",
        "incident-report",
        "satisfaction-report"
      ],
      createdAt: now,
      updatedAt: now
    },
    pageAssignments: {
      "daily-activity-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "incident-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "satisfaction-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      }
    }
  },
  {
    ...baseCustomer,
    id: 22,
    companyName: "Heart of England COOP",
    companyNumber: "1399R",
    vatNumber: "GB 712 3091 45",
    address: {
      building: "22",
      street: "Abbey Street",
      town: "Nuneaton",
      county: "Warwickshire",
      postcode: "CV11 5BU"
    },
    contact: {
      title: "Mr",
      forename: "David",
      surname: "Wilson",
      position: "Operations Director",
      email: "david.wilson@heartofengland.coop",
      phone: "02476 382 331"
    },
    viewConfig: {
      id: "vc22",
      customerId: 22,
      customerType: "retail",
      enabledPages: [
        "daily-activity-report",
        "incident-graph",
        "incident-report",
        "satisfaction-report",
        "be-safe-be-secure"
      ],
      createdAt: now,
      updatedAt: now
    },
    pageAssignments: {
      "daily-activity-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "incident-graph": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "incident-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "satisfaction-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "be-safe-be-secure": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      }
    }
  },
  {
    ...baseCustomer,
    id: 23,
    companyName: "Midcounties COOP",
    companyNumber: "2582R",
    vatNumber: "GB 476 6063 78",
    address: {
      building: "Co-operative House",
      street: "Warwick Technology Park",
      town: "Warwick",
      county: "Warwickshire",
      postcode: "CV34 6DA"
    },
    contact: {
      title: "Mrs",
      forename: "Sarah",
      surname: "Thompson",
      position: "Security Manager",
      email: "sarah.thompson@midcounties.coop",
      phone: "01926 516 000"
    },
    viewConfig: {
      id: "vc23",
      customerId: 23,
      customerType: "retail",
      enabledPages: [
        "daily-activity-report",
        "incident-graph",
        "incident-report",
        "satisfaction-report",
        "be-safe-be-secure"
      ],
      createdAt: now,
      updatedAt: now
    },
    pageAssignments: {
      "daily-activity-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "incident-graph": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "incident-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "satisfaction-report": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      },
      "be-safe-be-secure": {
        enabled: true,
        customized: false,
        lastModified: now,
        modifiedBy: "system"
      }
    }
  }
]

export function getCustomersWithRelations(): CustomerWithRelations[] {
  return DUMMY_CUSTOMERS.map(customer => ({
    ...customer,
    regions: DUMMY_REGIONS.filter(region => region.customerId === customer.id),
    sites: DUMMY_SITES.filter(site => site.customerId === customer.id)
  }))
}
