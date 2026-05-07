import type { Region } from "@/types/customer"

const now = new Date().toISOString()

export const DUMMY_REGIONS: Region[] = [
  // Central England COOP Regions
  {
    regionID: 1,
    fkCustomerID: 21,
    regionName: "East Midlands",
    regionDescription: "East Midlands region for Central England COOP",
    recordIsDeletedYN: false,
    dateCreated: now,
    createdBy: "system",
    dateModified: undefined,
    modifiedBy: undefined
  },
  {
    regionID: 2,
    fkCustomerID: 21,
    regionName: "West Midlands",
    regionDescription: "West Midlands region for Central England COOP",
    recordIsDeletedYN: false,
    dateCreated: now,
    createdBy: "system",
    dateModified: undefined,
    modifiedBy: undefined
  },

  // Midcounties COOP Regions
  {
    regionID: 3,
    fkCustomerID: 23,
    regionName: "Oxfordshire & Gloucestershire",
    regionDescription: "Oxfordshire & Gloucestershire region for Midcounties COOP",
    recordIsDeletedYN: false,
    dateCreated: now,
    createdBy: "system",
    dateModified: undefined,
    modifiedBy: undefined
  },
  {
    regionID: 4,
    fkCustomerID: 23,
    regionName: "Wiltshire & Somerset",
    regionDescription: "Wiltshire & Somerset region for Midcounties COOP",
    recordIsDeletedYN: false,
    dateCreated: now,
    createdBy: "system",
    dateModified: undefined,
    modifiedBy: undefined
  },

  // Heart of England COOP Regions
  {
    regionID: 5,
    fkCustomerID: 22,
    regionName: "Coventry & Warwickshire",
    regionDescription: "Coventry & Warwickshire region for Heart of England COOP",
    recordIsDeletedYN: false,
    dateCreated: now,
    createdBy: "system",
    dateModified: undefined,
    modifiedBy: undefined
  },
  {
    regionID: 6,
    fkCustomerID: 22,
    regionName: "Leicestershire & Northamptonshire",
    regionDescription: "Leicestershire & Northamptonshire region for Heart of England COOP",
    recordIsDeletedYN: false,
    dateCreated: now,
    createdBy: "system",
    dateModified: undefined,
    modifiedBy: undefined
  }
] 