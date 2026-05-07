import { HolidayRequest } from '@/types/holidayRequest';
import { mockOfficers } from './mockOfficers';

export const mockRequests: HolidayRequest[] = [
  {
    id: "hr001",
    officerId: mockOfficers[0].id,
    officerName: mockOfficers[0].name,
    startDate: new Date(2024, 8, 15), // Sept 15, 2024
    endDate: new Date(2024, 8, 25), // Sept 25, 2024
    returnToWorkDate: new Date(2024, 8, 26), // Sept 26, 2024
    dateOfRequest: new Date(2024, 5, 10), // June 10, 2024
    authorisedBy: "m1",
    dateAuthorised: new Date(2024, 5, 12), // June 12, 2024
    status: 'approved',
    comment: "Family vacation",
    totalDays: 11,
    archived: false
  },
  {
    id: "hr002",
    officerId: mockOfficers[1].id,
    officerName: mockOfficers[1].name,
    startDate: new Date(2024, 7, 5), // Aug 5, 2024
    endDate: new Date(2024, 7, 12), // Aug 12, 2024
    returnToWorkDate: new Date(2024, 7, 13), // Aug 13, 2024
    dateOfRequest: new Date(2024, 4, 20), // May 20, 2024
    authorisedBy: "m2",
    dateAuthorised: null,
    status: 'pending',
    comment: "Wedding anniversary trip",
    totalDays: 8,
    archived: false
  },
  {
    id: "hr003",
    officerId: mockOfficers[2].id,
    officerName: mockOfficers[2].name,
    startDate: new Date(2024, 9, 10), // Oct 10, 2024
    endDate: new Date(2024, 9, 17), // Oct 17, 2024
    returnToWorkDate: new Date(2024, 9, 18), // Oct 18, 2024
    dateOfRequest: new Date(2024, 6, 5), // July 5, 2024
    authorisedBy: "m3",
    dateAuthorised: new Date(2024, 6, 7), // July 7, 2024
    status: 'denied',
    comment: "Please reschedule for November if possible",
    totalDays: 8,
    archived: false
  },
  {
    id: "hr004",
    officerId: mockOfficers[3].id,
    officerName: mockOfficers[3].name,
    startDate: new Date(2024, 11, 22), // Dec 22, 2024
    endDate: new Date(2024, 11, 29), // Dec 29, 2024
    returnToWorkDate: new Date(2024, 11, 30), // Dec 30, 2024
    dateOfRequest: new Date(2024, 8, 15), // Sept 15, 2024
    authorisedBy: "m4",
    dateAuthorised: new Date(2024, 8, 17), // Sept 17, 2024
    status: 'approved',
    comment: "Christmas holiday with family",
    totalDays: 8,
    archived: false
  },
  {
    id: "hr005",
    officerId: mockOfficers[0].id,
    officerName: mockOfficers[0].name,
    startDate: new Date(2025, 1, 10), // Feb 10, 2025
    endDate: new Date(2025, 1, 14), // Feb 14, 2025
    returnToWorkDate: new Date(2025, 1, 15), // Feb 15, 2025
    dateOfRequest: new Date(2024, 10, 5), // Nov 5, 2024
    authorisedBy: "m2",
    dateAuthorised: null,
    status: 'pending',
    comment: "Winter vacation",
    totalDays: 5,
    archived: false
  }
]; 