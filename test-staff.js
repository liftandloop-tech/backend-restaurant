// Test script to check if staff registration works
const fetch =require("node-fetch");
const mongoose =require("mongoose");

const BASE_URL = 'http://localhost:3000/api/v1';

async function testStaffRegistration() {
  try {
    console.log('Testing staff registration...');

    const testStaffData = {
      fullName: "John Doe",
      phoneNumber: "1234567890",
      email: "john.doe@example.com",
      username: "johndoe",
      password: "password123",
      role: "Waiter",
      dateOfJoining: new Date().toISOString(),
      gender: "Male",
      isActive: true,
      branch: "Main Branch",
      shiftStart: "09:00",
      shiftEnd: "17:00",
      autoAddToAttendance: false,
      baseSalary: 50000,
      paymentMode: "Monthly",
      tipCommissionEligible: true,
      bankName: "Test Bank",
      ifscCode: "TEST0001",
      accountNumber: "123456789",
      internalNotes: "Test staff member"
    };

    console.log('Sending request to:', `${BASE_URL}/staff/register`);
    console.log('Data:', JSON.stringify(testStaffData, null, 2));

    const response = await fetch(`${BASE_URL}/staff/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testStaffData),
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Staff registration successful!');

      // Check if data was saved to MongoDB
      const Staff = mongoose.model('Staff');
      const savedStaff = await Staff.findOne({ email: testStaffData.email });
      if (savedStaff) {
        console.log('✅ Data found in MongoDB:', {
          id: savedStaff._id,
          fullName: savedStaff.fullName,
          email: savedStaff.email,
          role: savedStaff.role
        });
      } else {
        console.log('❌ Data NOT found in MongoDB');
      }
    } else {
      console.log('❌ Staff registration failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Connect to MongoDB first
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/restaurant_db');
    console.log('Connected to MongoDB for testing');

    // Wait a moment for server to be ready
    setTimeout(() => {
      testStaffRegistration();
    }, 2000);

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

connectDB();
