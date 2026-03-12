// Test script for Hospital Appointment API
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing Hospital Appointment API ===\n');

  // Test 1: Create Patient
  console.log('1. Creating a patient...');
  const patientData = JSON.stringify({
    name: 'John Doe',
    email: 'johndoe@example.com',
    phone: '1234567890',
    date_of_birth: '1990-01-15',
    address: '123 Main Street'
  });
  const patient = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/patients',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': patientData.length
    }
  }, patientData);
  console.log('Patient created:', patient);
  const patientId = patient.id;

  // Test 2: Create Doctor
  console.log('\n2. Creating a doctor...');
  const doctorData = JSON.stringify({
    name: 'Sarah Smith',
    specialization: 'Cardiology',
    email: 'sarah.smith@hospital.com',
    phone: '9876543210'
  });
  const doctor = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/doctors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': doctorData.length
    }
  }, doctorData);
  console.log('Doctor created:', doctor);
  const doctorId = doctor.id;

  // Test 3: Create Appointment
  console.log('\n3. Creating an appointment...');
  const appointmentData = JSON.stringify({
    patient_id: patientId,
    doctor_id: doctorId,
    appointment_date: '2024-12-25',
    appointment_time: '10:00',
    status: 'scheduled',
    notes: 'Regular checkup'
  });
  const appointment = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/appointments',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': appointmentData.length
    }
  }, appointmentData);
  console.log('Appointment created:', appointment);

  // Test 4: Get all patients
  console.log('\n4. Getting all patients...');
  const patients = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/patients',
    method: 'GET'
  });
  console.log('Patients:', patients);

  // Test 5: Get all doctors
  console.log('\n5. Getting all doctors...');
  const doctors = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/doctors',
    method: 'GET'
  });
  console.log('Doctors:', doctors);

  // Test 6: Get all appointments
  console.log('\n6. Getting all appointments...');
  const appointments = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/appointments',
    method: 'GET'
  });
  console.log('Appointments:', appointments);

  console.log('\n=== All tests passed! ===');
}

runTests().catch(console.error);

