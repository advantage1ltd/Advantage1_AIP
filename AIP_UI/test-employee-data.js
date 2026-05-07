// Simple test to check employee data
const testEmployeeData = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/Employee/active', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Employee data:', data);
    
    if (data.success && data.data) {
      console.log('Total employees:', data.data.length);
      console.log('Employees with userId:', data.data.filter(emp => emp.userId).length);
      console.log('Sample employee:', data.data[0]);
    }
  } catch (error) {
    console.error('Error fetching employee data:', error);
  }
};

// Run the test
testEmployeeData();
