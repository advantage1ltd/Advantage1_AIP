import { customerService } from '@/services/customerService';
import type { Customer, CustomerType } from '@/types/customer';

// Test utility to create Eastbrook Worcester customer
export const createEastbrookWorcesterCustomer = (): { success: boolean; customer?: Customer; error?: string } => {
  const eastbrookCustomer = {
    companyName: "Eastbrook Worcester",
    companyNumber: "EW001234",
    vatNumber: "GB 123 456 789",
    status: 'active' as const,
    customerType: 'gatehouse' as CustomerType,
    address: {
      building: "Eastbrook Building",
      street: "Worcester Street",
      village: "City Centre",
      town: "Worcester", 
      county: "Worcestershire",
      postcode: "WR1 2LX"
    },
    contact: {
      title: "Mr",
      forename: "John",
      surname: "Smith",
      position: "Security Manager",
      email: "john.smith@eastbrookworcester.co.uk",
      phone: "01905 123456"
    }
  };

  console.log('🧪 [Test] Creating Eastbrook Worcester customer with gatehouse type');
  const result = customerService.createNewCustomer(eastbrookCustomer);
  
  if (result.success) {
    console.log('✅ [Test] Eastbrook Worcester customer created successfully:', result.customer);
    console.log('✅ [Test] Customer ID assigned:', result.customer?.id);
    console.log('✅ [Test] Available customers updated:', customerService.getAvailableCustomers());
    console.log('✅ [Test] Gatehouse pages assigned:', result.customer?.viewConfig.enabledPages);
  } else {
    console.error('❌ [Test] Failed to create Eastbrook Worcester customer:', result.error);
  }

  return result;
};

// Test utility to verify the complete workflow
export const testCompleteWorkflow = () => {
  console.log('🧪 [Test] Starting complete customer creation workflow test...');
  
  // 1. Get initial customer count
  const initialCustomers = customerService.getAvailableCustomers();
  console.log('📊 [Test] Initial customers count:', initialCustomers.length);
  
  // 2. Create new customer
  const result = createEastbrookWorcesterCustomer();
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 3. Verify customer was added
  const updatedCustomers = customerService.getAvailableCustomers();
  console.log('📊 [Test] Updated customers count:', updatedCustomers.length);
  
  // 4. Verify customer can be found
  const newCustomer = updatedCustomers.find(c => c.name === "Eastbrook Worcester");
  if (!newCustomer) {
    return { success: false, error: 'Customer not found in available customers list' };
  }

  // 5. Verify gatehouse pages are assigned
  const customerData = customerService.getCustomer(result.customer!.id);
  if (!customerData) {
    return { success: false, error: 'Customer data not found' };
  }

  const expectedGatehousePages = [
    'daily-activity-report',
    'incident-graph', 
    'incident-report',
    'satisfaction-report',
    'be-safe-be-secure',
    'officer-support'
  ];

  const hasRequiredPages = expectedGatehousePages.every(page => 
    customerData.viewConfig.enabledPages.includes(page)
  );

  if (!hasRequiredPages) {
    return { 
      success: false, 
      error: `Missing required gatehouse pages. Expected: ${expectedGatehousePages.join(', ')}, Got: ${customerData.viewConfig.enabledPages.join(', ')}` 
    };
  }

  console.log('✅ [Test] Complete workflow test passed!');
  console.log('✅ [Test] Customer created with ID:', result.customer?.id);
  console.log('✅ [Test] All gatehouse pages assigned correctly');
  
  return { 
    success: true, 
    customer: result.customer,
    customerId: result.customer?.id,
    availableCustomers: updatedCustomers
  };
}; 