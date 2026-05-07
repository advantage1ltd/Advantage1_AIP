import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DualListBox } from './DualListBox';
import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserRole,
  CustomerUser,
  AdvantageOneUser,
} from '@/types/user';
import { useAvailableCustomers } from '@/hooks/useAvailableCustomers';
import { Users, Eye, EyeOff, Building2, Lock, FileText, Shield, Briefcase, ChevronRight, ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { employeeService } from '@/services/employeeService';
import { userService } from '@/services/userService';
import { Employee } from '@/types/employee';
import { toast } from 'sonner';

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => void;
  onCancel: () => void;
}

const USER_ROLES: UserRole[] = [
  'advantageoneofficer',
  'advantageonehoofficer',
  'administrator',
  'customersitemanager',
  'customerhomanager',
];

// Helper to format role for display (PascalCase)
const formatRoleForDisplay = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    'administrator': 'Administrator',
    'advantageoneofficer': 'AdvantageOneOfficer',
    'advantageonehoofficer': 'AdvantageOneHOOfficer',
    'customersitemanager': 'CustomerSiteManager',
    'customerhomanager': 'CustomerHOManager'
  };
  return roleMap[role] || role;
};

type FormState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  pageAccessRole: UserRole;
  signature?: string;
  signatureCode?: string;
  jobTitle?: string;
  customerId?: number;
  recordIsDeleted?: boolean;
  employeeId?: number;
} & (
  | { role: 'customersitemanager' | 'customerhomanager' }
  | { role: 'advantageoneofficer' | 'advantageonehoofficer' | 'administrator'; assignedCustomerIds: number[] }
);

export const UserForm = ({ initialData, onSubmit, onCancel }: UserFormProps) => {
  const { availableCustomers, isLoading } = useAvailableCustomers();
  
  // Debug logging for initialData
  useEffect(() => {
    if (initialData) {
      console.log('🔍 [UserForm] Initial data received:', {
        id: initialData.id,
        username: initialData.username,
        employeeId: (initialData as any).employeeId,
        employeeName: (initialData as any).employeeName,
        role: initialData.role
      });
      console.log('🔍 [UserForm] Full initialData object:', initialData);
      console.log('🔍 [UserForm] EmployeeId from initialData:', (initialData as any).employeeId);
      console.log('🔍 [UserForm] EmployeeName from initialData:', (initialData as any).employeeName);
      
      // Debug customer assignments
      if ('assignedCustomerIds' in initialData) {
        console.log('🔍 [UserForm] AssignedCustomerIds:', initialData.assignedCustomerIds);
        console.log('🔍 [UserForm] AssignedCustomerIds type:', typeof initialData.assignedCustomerIds);
        console.log('🔍 [UserForm] AssignedCustomerIds length:', Array.isArray(initialData.assignedCustomerIds) ? initialData.assignedCustomerIds.length : 'Not an array');
      }
      
      // Debug customerId for customer users
      if (initialData.role === 'customersitemanager' || initialData.role === 'customerhomanager') {
        console.log('🔍 [UserForm] CustomerId from initialData:', (initialData as CustomerUser)?.customerId);
      }
    }
  }, [initialData]);
  
  // Helper function to parse assignedCustomerIds
  const parseAssignedCustomerIds = (customerIds: any): number[] => {
    if (!customerIds) return [];
    if (Array.isArray(customerIds)) return customerIds;
    if (typeof customerIds === 'string') {
      try {
        const parsed = JSON.parse(customerIds);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing assignedCustomerIds:', error);
        return [];
      }
    }
    return [];
  };

  const [formData, setFormData] = useState<FormState>(() => {
    const baseData = {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      username: initialData?.username || '',
      email: initialData?.email || '',
      password: '',
      role: initialData?.role || USER_ROLES[0],
      pageAccessRole: initialData?.pageAccessRole || USER_ROLES[0],
      signature: initialData?.signature || '',
      signatureCode: initialData?.signatureCode || '',
      jobTitle: initialData?.jobTitle || '',
      customerId: (initialData as CustomerUser)?.customerId ?? undefined,
      recordIsDeleted: initialData?.recordIsDeleted || false,
      employeeId: (initialData as any)?.employeeId ?? undefined,
    };

    console.log('🔍 [UserForm] Form data initialization:', {
      initialDataEmployeeId: (initialData as any)?.employeeId,
      baseDataEmployeeId: baseData.employeeId,
      fullBaseData: baseData
    });

    if (initialData?.role === 'customersitemanager' || initialData?.role === 'customerhomanager') {
      return {
        ...baseData,
        role: initialData.role,
        customerId: (initialData as CustomerUser)?.customerId ?? undefined,
      } as FormState;
    } else {
      const assignedCustomerIds = initialData && 'assignedCustomerIds' in initialData 
        ? parseAssignedCustomerIds(initialData.assignedCustomerIds)
        : [];
      
      console.log('🔍 [UserForm] Parsed assignedCustomerIds:', assignedCustomerIds);
      
      return {
        ...baseData,
        role: (initialData?.role as 'advantageoneofficer' | 'advantageonehoofficer' | 'administrator') || 'advantageoneofficer',
        assignedCustomerIds,
      } as FormState;
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    const shouldLoad = formData.role !== 'customersitemanager' && formData.role !== 'customerhomanager';
    if (!shouldLoad) {
      setEmployees([]);
      return;
    }

    const load = async () => {
      setLoadingEmployees(true);
      try {
        // For editing, we need all employees (including the currently linked one)
        // For creating, we only need unlinked employees
        if (initialData) {
          // When editing, get all active employees
          const allEmployees = await employeeService.getActiveEmployees();
          console.log('🔍 [UserForm] Loaded all employees for editing:', allEmployees);
          setEmployees(allEmployees);
        } else {
          // When creating, get only unlinked employees
          const unlinked = await userService.getUnlinkedEmployees();
          console.log('🔍 [UserForm] Loaded unlinked employees for creating:', unlinked);
          setEmployees(unlinked);
        }
      } catch (err) {
        console.error('Error loading employees for UserForm:', err);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    load();
  }, [formData.role, initialData]);

  // Convert availableCustomers to Customer objects for DualListBox
  const availableCustomersForDualList = useMemo(() => {
    return availableCustomers.map(customer => ({
      id: String(customer.id),
      name: customer.name,
      companyName: customer.name,
      companyNumber: '',
      vatNumber: '',
      status: 'active' as const,
      customerType: 'retail' as const,
      address: {
        building: '',
        street: '',
        village: '',
        town: '',
        county: '',
        postcode: ''
      },
      contact: {
        title: '',
        forename: '',
        surname: '',
        position: '',
        email: '',
        phone: ''
      },
      viewConfig: {
        id: '',
        customerId: String(customer.id),
        customerType: 'retail' as const,
        enabledPages: [],
        createdAt: '',
        updatedAt: ''
      },
      createdAt: '',
      updatedAt: ''
    }));
  }, [availableCustomers]);

  // Get selected customers for DualListBox
  const selectedCustomersForDualList = useMemo(() => {
    if (!('assignedCustomerIds' in formData)) return [];
    
    return formData.assignedCustomerIds
      .map(customerId => {
        const customer = availableCustomers.find(c => c.id === customerId);
        if (!customer) return null;
        
        return {
          id: String(customer.id),
          name: customer.name,
          companyName: customer.name,
          companyNumber: '',
          vatNumber: '',
          status: 'active' as const,
          customerType: 'retail' as const,
          address: {
            building: '',
            street: '',
            village: '',
            town: '',
            county: '',
            postcode: ''
          },
          contact: {
            title: '',
            forename: '',
            surname: '',
            position: '',
            email: '',
            phone: ''
          },
          viewConfig: {
            id: '',
            customerId: String(customer.id),
            customerType: 'retail' as const,
            enabledPages: [],
            createdAt: '',
            updatedAt: ''
          },
          createdAt: '',
          updatedAt: ''
        };
      })
      .filter(Boolean) as any[];
  }, [formData, availableCustomers]);

  // Get available customers (not yet selected) for DualListBox
  const availableCustomersNotSelected = useMemo(() => {
    if (!('assignedCustomerIds' in formData)) return availableCustomersForDualList;
    
    return availableCustomersForDualList.filter(
      customer => !formData.assignedCustomerIds.includes(Number(customer.id))
    );
  }, [availableCustomersForDualList, formData]);

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleAddCustomer = (customer: any) => {
    if ('assignedCustomerIds' in formData && !formData.assignedCustomerIds.includes(customer.id)) {
      setFormData({
        ...formData,
        assignedCustomerIds: [...formData.assignedCustomerIds, Number(customer.id)],
      } as FormState);
    }
  };

  const handleRemoveCustomer = (customer: any) => {
    if ('assignedCustomerIds' in formData) {
      setFormData({
        ...formData,
        assignedCustomerIds: formData.assignedCustomerIds.filter(id => id !== Number(customer.id)),
      } as FormState);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'role') {
      const role = value as UserRole;
      const isCustomerRole = role === 'customersitemanager' || role === 'customerhomanager';
      
      if (isCustomerRole) {
        setFormData({
          ...formData,
          role,
          pageAccessRole: role,
          employeeId: undefined,
          customerId: undefined,
        } as FormState);
      } else {
        setFormData({
          ...formData,
          role,
          pageAccessRole: role,
          assignedCustomerIds: [],
          employeeId: undefined,
        } as FormState);
      }
    } else if (name === 'customerId') {
      setFormData(prev => ({ ...prev, customerId: value ? parseInt(value) : undefined }));
    }
  };

  const isCustomerRole = formData.role === 'customersitemanager' || formData.role === 'customerhomanager';

  // Debug logging for customerId changes
  useEffect(() => {
    if (isCustomerRole) {
      console.log('🔍 [UserForm] CustomerId in formData:', formData.customerId);
      console.log('🔍 [UserForm] Available customers count:', availableCustomers.length);
      if (formData.customerId) {
        const selectedCustomer = availableCustomers.find(c => c.id === formData.customerId);
        console.log('🔍 [UserForm] Selected customer:', selectedCustomer?.name || 'Not found');
      }
    }
  }, [formData.customerId, isCustomerRole, availableCustomers]);

  // Debug logging for employee dropdown
  useEffect(() => {
    if (!isCustomerRole) {
      console.log('🔍 [UserForm] Employee dropdown debug:', {
        formDataEmployeeId: formData.employeeId,
        dropdownValue: formData.employeeId ? String(formData.employeeId) : '',
        employeesCount: employees.length,
        employees: employees.map(emp => ({ id: emp.id, name: `${emp.firstName} ${emp.surname}` })),
        hasMatchingEmployee: employees.some(emp => emp.id === formData.employeeId)
      });
    }
  }, [formData.employeeId, employees, isCustomerRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate employee requirement for non-customer users
    if (!isCustomerRole && !formData.employeeId) {
      toast.error('Employee selection is required for non-customer users');
      return;
    }
    
    // Validate customerId requirement for customer users
    if (isCustomerRole && !formData.customerId) {
      toast.error('Customer selection is required for customer users');
      return;
    }
    
    console.log('🔄 [UserForm] Form submission started', {
      isEdit: !!initialData,
      userId: initialData?.id,
      formData: {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        employeeId: formData.employeeId,
        customerId: formData.customerId,
        assignedCustomerIds: 'assignedCustomerIds' in formData ? formData.assignedCustomerIds : 'N/A'
      }
    });
    
    const { password, ...restData } = formData;
    
    try {
      if (initialData) {
        const updateData = {
          id: initialData.id,
          ...(password ? { password } : {}),
          ...restData,
        } as UpdateUserInput & { employeeId?: number; customerId?: number };
        
        // Explicitly ensure customerId is included for customer users
        // Always send customerId for customer roles, even if it's undefined (to allow clearing)
        if (isCustomerRole) {
          (updateData as any).customerId = formData.customerId ?? null;
        } else {
          // For non-customer roles, explicitly set to null to clear any existing customerId
          (updateData as any).customerId = null;
        }
        
        console.log('🔄 [UserForm] Submitting update data', updateData);
        console.log('🔄 [UserForm] CustomerId in update data:', (updateData as any).customerId);
        console.log('🔄 [UserForm] Is customer role:', isCustomerRole);
        onSubmit(updateData);
      } else {
        const createData = {
          ...formData,
          confirmPassword: formData.password || '',
        } as CreateUserInput & { employeeId?: number; customerId?: number };
        
        console.log('🔄 [UserForm] Submitting create data', createData);
        onSubmit(createData);
      }
      
      console.log('✅ [UserForm] Form submission completed successfully');
    } catch (error) {
      console.error('❌ [UserForm] Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={handleInputChange}
                required={!initialData}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleForDisplay(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

                     {/* Employee Selection for non-customer roles */}
           {!isCustomerRole && (
             <div className="md:col-span-2">
               <Label htmlFor="employeeId" className={!formData.employeeId ? 'text-red-600' : ''}>
                 Select Employee *
               </Label>
               <Select
                 value={formData.employeeId ? String(formData.employeeId) : ''}
                 onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value ? parseInt(value) : undefined }))}
                 required
               >
                 <SelectTrigger className={!formData.employeeId ? 'border-red-500' : ''}>
                   <SelectValue placeholder={loadingEmployees ? 'Loading employees...' : 'Select an employee'} />
                 </SelectTrigger>
                 <SelectContent>
                   {loadingEmployees ? (
                     <SelectItem value="loading" disabled>
                       <div className="flex items-center gap-2">
                         <Loader2 className="h-4 w-4 animate-spin" />
                         Loading employees...
                       </div>
                     </SelectItem>
                   ) : employees.length === 0 ? (
                     <SelectItem value="no-employees" disabled>
                       <div className="flex items-center gap-2">
                         <AlertTriangle className="h-4 w-4" />
                         No employees available
                       </div>
                     </SelectItem>
                   ) : (
                     employees.map(emp => (
                       <SelectItem key={emp.id} value={String(emp.id)}>
                         {emp.firstName} {emp.surname}
                       </SelectItem>
                     ))
                   )}
                 </SelectContent>
               </Select>
             </div>
           )}
        </CardContent>
      </Card>

      {/* Customer Assignment Section - Only for Advantage One roles */}
      {!isCustomerRole && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Customer Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500">Loading customers...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Assign customers to this officer</Label>
                <DualListBox
                  available={availableCustomersNotSelected}
                  selected={selectedCustomersForDualList}
                  onAdd={handleAddCustomer}
                  onRemove={handleRemoveCustomer}
                />
                <div className="text-sm text-gray-500">
                  {selectedCustomersForDualList.length} customer(s) assigned
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle || ''}
              onChange={handleInputChange}
            />
          </div>
          {isCustomerRole && (
            <div>
              <Label htmlFor="customerId" className={!formData.customerId ? 'text-red-600' : ''}>
                Customer *
              </Label>
              <Select
                value={formData.customerId ? String(formData.customerId) : ''}
                onValueChange={(value) => handleSelectChange('customerId', value)}
                required
              >
                <SelectTrigger className={!formData.customerId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={isLoading ? 'Loading customers...' : 'Select customer'} />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading customers...
                      </div>
                    </SelectItem>
                  ) : availableCustomers.length === 0 ? (
                    <SelectItem value="no-customers" disabled>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        No customers available
                      </div>
                    </SelectItem>
                  ) : (
                    availableCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!formData.customerId && (
                <p className="text-xs text-red-600 mt-1">Customer selection is required for customer users</p>
              )}
            </div>
          )}
          <div className={isCustomerRole ? "" : "md:col-start-1"}>
            <Label htmlFor="signature">Signature</Label>
            <Input
              id="signature"
              name="signature"
              value={formData.signature || ''}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="signatureCode">Signature Code</Label>
            <Input
              id="signatureCode"
              name="signatureCode"
              value={formData.signatureCode || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recordIsDeleted"
                checked={formData.recordIsDeleted || false}
                onCheckedChange={(checked) => handleCheckboxChange('recordIsDeleted', !!checked)}
              />
              <Label htmlFor="recordIsDeleted">Record is Deleted</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} User
        </Button>
      </div>
    </form>
  );
}; 