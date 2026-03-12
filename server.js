const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'hospital.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

// Initialize Database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create Tables
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      date_of_birth TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    )
  `);

  saveDatabase();
  console.log('Database initialized successfully');
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper function to run queries
function runQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function runInsert(sql, params = []) {
  db.run(sql, params);
  // Get last insert id before saving to file
  const result = db.exec('SELECT last_insert_rowid() as id');
  let id = null;
  if (result.length > 0 && result[0].values.length > 0) {
    id = result[0].values[0][0];
  }
  saveDatabase();
  return id;
}

function runUpdate(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

function runDelete(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

// ==================== PATIENTS API ====================

// Get all patients
app.get('/api/patients', (req, res) => {
  try {
    const patients = runQuery('SELECT * FROM patients ORDER BY created_at DESC');
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
app.get('/api/patients/:id', (req, res) => {
  try {
    const patients = runQuery('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json(patients[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new patient
app.post('/api/patients', (req, res) => {
  const { name, email, phone, date_of_birth, address } = req.body;
  
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  try {
    const id = runInsert(
      'INSERT INTO patients (name, email, phone, date_of_birth, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, date_of_birth || null, address || null]
    );
    
    const patient = runQuery('SELECT * FROM patients WHERE id = ?', [id])[0];
    res.status(201).json(patient);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
  const { name, email, phone, date_of_birth, address } = req.body;
  const { id } = req.params;

  const existingPatient = runQuery('SELECT * FROM patients WHERE id = ?', [id]);
  if (existingPatient.length === 0) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  try {
    runUpdate(
      'UPDATE patients SET name = ?, email = ?, phone = ?, date_of_birth = ?, address = ? WHERE id = ?',
      [name, email, phone, date_of_birth || null, address || null, id]
    );

    const patient = runQuery('SELECT * FROM patients WHERE id = ?', [id])[0];
    res.status(200).json(patient);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  try {
    const patient = runQuery('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete associated appointments first
    runDelete('DELETE FROM appointments WHERE patient_id = ?', [req.params.id]);
    runDelete('DELETE FROM patients WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DOCTORS API ====================

// Get all doctors
app.get('/api/doctors', (req, res) => {
  try {
    const doctors = runQuery('SELECT * FROM doctors ORDER BY created_at DESC');
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor by ID
app.get('/api/doctors/:id', (req, res) => {
  try {
    const doctors = runQuery('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (doctors.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json(doctors[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new doctor
app.post('/api/doctors', (req, res) => {
  const { name, specialization, email, phone } = req.body;
  
  if (!name || !specialization || !phone) {
    return res.status(400).json({ error: 'Name, specialization, and phone are required' });
  }

  try {
    const id = runInsert(
      'INSERT INTO doctors (name, specialization, email, phone) VALUES (?, ?, ?, ?)',
      [name, specialization, email || null, phone]
    );
    
    const doctor = runQuery('SELECT * FROM doctors WHERE id = ?', [id])[0];
    res.status(201).json(doctor);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update doctor
app.put('/api/doctors/:id', (req, res) => {
  const { name, specialization, email, phone } = req.body;
  const { id } = req.params;

  const existingDoctor = runQuery('SELECT * FROM doctors WHERE id = ?', [id]);
  if (existingDoctor.length === 0) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  if (!name || !specialization || !phone) {
    return res.status(400).json({ error: 'Name, specialization, and phone are required' });
  }

  try {
    runUpdate(
      'UPDATE doctors SET name = ?, specialization = ?, email = ?, phone = ? WHERE id = ?',
      [name, specialization, email || null, phone, id]
    );

    const doctor = runQuery('SELECT * FROM doctors WHERE id = ?', [id])[0];
    res.status(200).json(doctor);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete doctor
app.delete('/api/doctors/:id', (req, res) => {
  try {
    const doctor = runQuery('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Delete associated appointments first
    runDelete('DELETE FROM appointments WHERE doctor_id = ?', [req.params.id]);
    runDelete('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== APPOINTMENTS API ====================

// Get all appointments
app.get('/api/appointments', (req, res) => {
  try {
    const appointments = runQuery(`
      SELECT 
        a.*,
        p.name as patient_name,
        p.email as patient_email,
        p.phone as patient_phone,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `);
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment by ID
app.get('/api/appointments/:id', (req, res) => {
  try {
    const appointments = runQuery(`
      SELECT 
        a.*,
        p.name as patient_name,
        p.email as patient_email,
        p.phone as patient_phone,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json(appointments[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments by patient
app.get('/api/appointments/patient/:patientId', (req, res) => {
  try {
    const appointments = runQuery(`
      SELECT 
        a.*,
        p.name as patient_name,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.params.patientId]);
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments by doctor
app.get('/api/appointments/doctor/:doctorId', (req, res) => {
  try {
    const appointments = runQuery(`
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.params.doctorId]);
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new appointment
app.post('/api/appointments', (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, status, notes } = req.body;
  
  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Patient ID, Doctor ID, date, and time are required' });
  }

  // Check if patient exists
  const patient = runQuery('SELECT * FROM patients WHERE id = ?', [patient_id]);
  if (patient.length === 0) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Check if doctor exists
  const doctor = runQuery('SELECT * FROM doctors WHERE id = ?', [doctor_id]);
  if (doctor.length === 0) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  try {
    const id = runInsert(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id, appointment_date, appointment_time, status || 'scheduled', notes || null]
    );
    
    const appointment = runQuery(`
      SELECT 
        a.*,
        p.name as patient_name,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `, [id])[0];
    
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
app.put('/api/appointments/:id', (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, status, notes } = req.body;
  const { id } = req.params;

  const existingAppointment = runQuery('SELECT * FROM appointments WHERE id = ?', [id]);
  if (existingAppointment.length === 0) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  // Check patient if provided
  if (patient_id) {
    const patient = runQuery('SELECT * FROM patients WHERE id = ?', [patient_id]);
    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
  }

  // Check doctor if provided
  if (doctor_id) {
    const doctor = runQuery('SELECT * FROM doctors WHERE id = ?', [doctor_id]);
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
  }

  try {
    const oldAppointment = existingAppointment[0];
    runUpdate(
      'UPDATE appointments SET patient_id = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, status = ?, notes = ? WHERE id = ?',
      [
        patient_id || oldAppointment.patient_id,
        doctor_id || oldAppointment.doctor_id,
        appointment_date || oldAppointment.appointment_date,
        appointment_time || oldAppointment.appointment_time,
        status || oldAppointment.status,
        notes !== undefined ? notes : oldAppointment.notes,
        id
      ]
    );

    const appointment = runQuery(`
      SELECT 
        a.*,
        p.name as patient_name,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `, [id])[0];
    
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', (req, res) => {
  try {
    const appointment = runQuery('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (appointment.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    runDelete('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/patients', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'patients.html'));
});

app.get('/doctors', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'doctors.html'));
});

app.get('/appointments', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'appointments.html'));
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Hospital Appointment System running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

