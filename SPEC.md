# Hospital Appointment System - Specification

## 1. Project Overview
- **Project Name:** Hospital Appointment System
- **Type:** RESTful API + Web Application
- **Core Functionality:** A system for managing patients, doctors, and appointments in a hospital setting
- **Target Users:** Hospital staff, administrators

## 2. Technology Stack
- **Backend:** Node.js with Express.js
- **Database:** SQLite with better-sqlite3
- **Frontend:** HTML5, CSS3, Vanilla JavaScript

## 3. Database Schema

### Patients Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE NOT NULL |
| phone | TEXT | NOT NULL |
| date_of_birth | TEXT | |
| address | TEXT | |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### Doctors Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| specialization | TEXT | NOT NULL |
| email | TEXT | UNIQUE |
| phone | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### Appointments Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| patient_id | INTEGER | FOREIGN KEY REFERENCES patients(id) |
| doctor_id | INTEGER | FOREIGN KEY REFERENCES doctors(id) |
| appointment_date | TEXT | NOT NULL |
| appointment_time | TEXT | NOT NULL |
| status | TEXT | DEFAULT 'scheduled' |
| notes | TEXT | |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

## 4. API Endpoints

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/patients | Get all patients |
| GET | /api/patients/:id | Get patient by ID |
| POST | /api/patients | Create new patient |
| PUT | /api/patients/:id | Update patient |
| DELETE | /api/patients/:id | Delete patient |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/doctors | Get all doctors |
| GET | /api/doctors/:id | Get doctor by ID |
| POST | /api/doctors | Create new doctor |
| PUT | /api/doctors/:id | Update doctor |
| DELETE | /api/doctors/:id | Delete doctor |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/appointments | Get all appointments |
| GET | /api/appointments/:id | Get appointment by ID |
| POST | /api/appointments | Create new appointment |
| PUT | /api/appointments/:id | Update appointment |
| DELETE | /api/appointments/:id | Delete appointment |
| GET | /api/appointments/patient/:patientId | Get appointments by patient |
| GET | /api/appointments/doctor/:doctorId | Get appointments by doctor |

## 5. HTTP Status Codes
- 200: OK - Success
- 201: Created - Resource successfully created
- 400: Bad Request - Invalid input
- 404: Not Found - Resource not found
- 500: Internal Server Error

## 6. Frontend Pages
1. **index.html** - Dashboard with navigation
2. **patients.html** - Patient management
3. **doctors.html** - Doctor management
4. **appointments.html** - Appointment booking and management

## 7. Acceptance Criteria
- All CRUD operations work for Patients, Doctors, and Appointments
- API returns proper JSON responses
- Web interface can interact with all API endpoints
- Database persists data correctly
- Proper error handling with appropriate status codes

