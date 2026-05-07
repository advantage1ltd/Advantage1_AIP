export interface Customer {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User' | 'Support';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  assignedCustomers?: Customer[];
  officerType?: string;
}

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Central England COOP' },
  { id: 'c2', name: 'Midcounties COOP' },
  { id: 'c3', name: 'Heart Of England COOP' },
  { id: 'c4', name: 'Eastbrook Tewksbury' }
];

export const DUMMY_USERS: User[] = [
  {
    id: "u1",
    username: "john.doe",
    email: "john.doe@example.com",
    role: "Admin",
    status: "active",
    lastLogin: "2025-01-31T10:00:00Z",
    createdAt: "2024-12-01T08:00:00Z",
    assignedCustomers: [SAMPLE_CUSTOMERS[0], SAMPLE_CUSTOMERS[1]]
  },
  {
    id: "u2",
    username: "jane.smith",
    email: "jane.smith@example.com",
    role: "Manager",
    status: "active",
    lastLogin: "2025-01-30T15:30:00Z",
    createdAt: "2024-12-02T09:15:00Z",
    assignedCustomers: [SAMPLE_CUSTOMERS[2]]
  },
  {
    id: "u3",
    username: "bob.wilson",
    email: "bob.wilson@example.com",
    role: "User",
    status: "inactive",
    lastLogin: "2025-01-15T11:20:00Z",
    createdAt: "2024-12-03T10:30:00Z",
    assignedCustomers: []
  },
  {
    id: "u4",
    username: "sarah.jones",
    email: "sarah.jones@example.com",
    role: "Manager",
    status: "active",
    lastLogin: "2025-01-31T09:45:00Z",
    createdAt: "2024-12-04T14:20:00Z",
    assignedCustomers: [SAMPLE_CUSTOMERS[3]]
  },
  {
    id: "u5",
    username: "mike.brown",
    email: "mike.brown@example.com",
    role: "User",
    status: "active",
    lastLogin: "2025-01-30T16:15:00Z",
    createdAt: "2024-12-05T11:10:00Z",
    assignedCustomers: []
  },
  {
    id: "u6",
    username: "emma.davis",
    email: "emma.davis@example.com",
    role: "Support",
    status: "active",
    lastLogin: "2025-01-31T08:20:00Z",
    createdAt: "2024-12-06T13:45:00Z",
    assignedCustomers: []
  },
  {
    id: "u7",
    username: "alex.miller",
    email: "alex.miller@example.com",
    role: "User",
    status: "inactive",
    lastLogin: "2025-01-20T14:30:00Z",
    createdAt: "2024-12-07T09:30:00Z",
    assignedCustomers: []
  },
  {
    id: "u8",
    username: "lisa.taylor",
    email: "lisa.taylor@example.com",
    role: "Manager",
    status: "active",
    lastLogin: "2025-01-31T11:10:00Z",
    createdAt: "2024-12-08T10:15:00Z",
    assignedCustomers: [SAMPLE_CUSTOMERS[1]]
  },
  {
    id: "u9",
    username: "david.clark",
    email: "david.clark@example.com",
    role: "Admin",
    status: "active",
    lastLogin: "2025-01-31T09:00:00Z",
    createdAt: "2024-12-09T08:45:00Z",
    assignedCustomers: [SAMPLE_CUSTOMERS[0], SAMPLE_CUSTOMERS[2]]
  },
  {
    id: "u10",
    username: "rachel.white",
    email: "rachel.white@example.com",
    role: "Support",
    status: "active",
    lastLogin: "2025-01-30T17:20:00Z",
    createdAt: "2024-12-10T11:30:00Z",
    assignedCustomers: []
  }
];
