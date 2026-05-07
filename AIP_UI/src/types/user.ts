// Roles are stored in lowercase to match backend
export type UserRole = 
  | 'advantageoneofficer'
  | 'advantageonehoofficer'
  | 'administrator'
  | 'customersitemanager'
  | 'customerhomanager';

export interface Customer {
  id: string;
  companyName: string;
  companyNumber: string;
  vatNumber: string;
  status: 'active' | 'inactive';
  customerType: CustomerType[];
  regions: Region[];
  sites: Site[];
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  id: string;
  name: string;
  customerId: string;
  manager: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  name: string;
  regionId: string;
  customerId: string;
  address: {
    buildingName: string;
    street: string;
    town: string;
    county: string;
    postcode: string;
  };
  isCoreSite: boolean;
  sinNumber: string;
  telephone: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = 
  | 'Event'
  | 'Static'
  | 'Gatehouse'
  | 'Retail'
  | 'Mobile Patrol'
  | 'Keyholding & Alarm Response'
  | 'Other';

export interface BaseUser {
  id: string;
  username: string;
  password?: string;  // Optional since we don't want to expose it in responses
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  pageAccessRole: UserRole;
  signature?: string;
  signatureCode?: string;
  jobTitle?: string;
  profilePhotoFile?: string;
  recordIsDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  employeeId?: number;
  employeeName?: string;
}

export interface CustomerUser extends BaseUser {
  role: Extract<UserRole, 'customersitemanager' | 'customerhomanager'>;
  customerId: number;
  customerName?: string; // Company name for customer users
}

export interface AdvantageOneUser extends BaseUser {
  role: Extract<UserRole, 'advantageoneofficer' | 'advantageonehoofficer' | 'administrator'>;
  assignedCustomerIds?: number[];
  assignedCustomerNames?: string[];
}

export type User = CustomerUser | AdvantageOneUser;

export interface Employee {
  id: string;
  userId: string;
  name: string;
  jobRole: string;
  department: string;
  startDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: Omit<User, 'password'>;
    accessToken: string; // Changed from 'token' to 'accessToken' to match backend
  };
  message?: string;
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
  };
  message?: string;
}

/**
 * @deprecated Use customerService.getAllCustomers() or customerMappingService.getCustomerMappings() instead
 * This static array is kept for backward compatibility only.
 * Customer IDs should be fetched dynamically from the API to ensure they match the database.
 */
export const AVAILABLE_CUSTOMERS = [
  { id: 1, name: "Central England COOP" },
  { id: 22, name: "Heart of England" },
  { id: 23, name: "Midcounties COOP" },
  { id: 24, name: "Eastbrook Worcester" },
  { id: 25, name: "Eastbrook Tewksbury" }
] as const;

export const USER_COMPANIES = [
  'Central England COOP',
  'Midcounties COOP',
  'Eastbrook Worcester',
  'Eastbrook Tewksbury',
  'Heart of England'
] as const;

export interface CreateUserInput extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  confirmPassword?: string;
}
export interface UpdateUserInput extends Partial<Omit<User, 'createdAt' | 'updatedAt'>> {
  id: string;
}
