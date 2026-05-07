import { User } from '@/types/user'

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'admin',
    status: 'active',
    department: 'Engineering',
    lastLogin: '2025-01-30T10:30:00Z',
    createdAt: '2024-12-01T08:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    role: 'manager',
    status: 'active',
    department: 'Product',
    lastLogin: '2025-01-29T16:45:00Z',
    createdAt: '2024-12-05T09:15:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@company.com',
    role: 'user',
    status: 'active',
    department: 'Marketing',
    lastLogin: '2025-01-30T08:20:00Z',
    createdAt: '2024-12-10T11:30:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily'
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'j.wilson@company.com',
    role: 'manager',
    status: 'inactive',
    department: 'Sales',
    lastLogin: '2025-01-15T14:10:00Z',
    createdAt: '2024-12-15T10:45:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James'
  },
  {
    id: '5',
    name: 'Lisa Park',
    email: 'lisa.park@company.com',
    role: 'user',
    status: 'active',
    department: 'Engineering',
    lastLogin: '2025-01-30T09:15:00Z',
    createdAt: '2024-12-20T13:20:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa'
  }
]
