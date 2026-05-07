// Test script for Employee Registration Integration
// This script tests the real backend API integration

const API_BASE_URL = 'http://localhost:5128/api';

async function testEmployeeAPI() {
    console.log('🧪 Testing Employee Registration Integration...\n');

    try {
        // Test 1: Check if backend is running
        console.log('1️⃣ Testing backend connectivity...');
        const testResponse = await fetch(`${API_BASE_URL}/employee/test`);
        
        if (!testResponse.ok) {
            throw new Error(`Backend not responding: ${testResponse.status} ${testResponse.statusText}`);
        }
        
        const testData = await testResponse.json();
        console.log('✅ Backend is running and responding');
        console.log(`📊 Found ${testData.data?.totalCount || 0} employees in database\n`);

        // Test 2: Check employee list structure
        console.log('2️⃣ Testing employee list structure...');
        if (testData.data?.items) {
            console.log('✅ Employee list structure is correct');
            console.log(`📋 Sample employee: ${JSON.stringify(testData.data.items[0], null, 2)}\n`);
        } else {
            console.log('⚠️ Employee list structure may be incorrect');
        }

        // Test 3: Check if seeded employees exist
        console.log('3️⃣ Checking seeded employees...');
        const employees = testData.data?.items || [];
        const johnOfficer = employees.find(e => e.firstName === 'John' && e.surname === 'Officer');
        const sarahManager = employees.find(e => e.firstName === 'Sarah' && e.surname === 'Manager');
        
        if (johnOfficer) {
            console.log('✅ John Officer found in database');
        } else {
            console.log('❌ John Officer not found in database');
        }
        
        if (sarahManager) {
            console.log('✅ Sarah Manager found in database');
        } else {
            console.log('❌ Sarah Manager not found in database');
        }

        console.log('\n🎉 Employee Registration Integration Test Complete!');
        console.log('\n📝 Next Steps:');
        console.log('1. Open http://localhost:5173 in your browser');
        console.log('2. Navigate to /administration/employee-registration');
        console.log('3. Test creating, editing, and deleting employees');
        console.log('4. Check browser console for API logs');
        console.log('5. Verify data is saved to the database');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the backend is running on http://localhost:5128');
        console.log('2. Check if SQL Server is running');
        console.log('3. Verify database connection string');
        console.log('4. Check backend logs for errors');
    }
}

// Run the test
testEmployeeAPI();
