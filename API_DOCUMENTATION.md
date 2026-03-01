# API Documentation

Base URL: `http://localhost:3000/api` (development) or your production URL

All endpoints support CORS and can be accessed from any origin. All responses are in JSON format.

## Reservations

### Get All Reservations
Get current patient, waiting patients, upcoming patients, and treatment history.

**Endpoint:** `GET /api/reservations`

**Response:**
```json
{
  "data": {
    "currentPatient": Patient | null,
    "waitingPatients": Patient[],
    "upcomingPatients": Patient[],
    "treatmentHistory": Patient[]
  }
}
```

---

### Create Reservation
Create a new reservation for a patient.

**Endpoint:** `POST /api/reservations`

**Request Body:**
```json
{
  "patientId": "string (optional, if patient exists)",
  "patient": {
    "name": "string",
    "phone": "string",
    "age": "number",
    "bloodType": "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",
    "xrayImageBase64": "string | null (optional)"
  },
  "bookingType": "advance" | "walk-in" | "emergency",
  "appointmentDate": "ISO date string"
}
```

**Response:** `201 Created`
```json
{
  "data": ReservationsData
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

### Start Treatment
Start treatment for a waiting patient.

**Endpoint:** `POST /api/reservations/[id]/start`

**Request Body:**
```json
{
  "replaceCurrent": "boolean (optional, default: false)"
}
```

**Response:**
```json
{
  "data": ReservationsData
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

### Mark as Arrived
Mark an upcoming patient as arrived (moves to waiting list).

**Endpoint:** `POST /api/reservations/[id]/arrive`

**Response:**
```json
{
  "data": ReservationsData
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

### Cancel/Delete Reservation
Cancel a reservation (upcoming/waiting) or delete from history.

**Endpoint:** `DELETE /api/reservations/[id]`

**Query Parameters:**
- `fromHistory` (optional): `"true"` to delete from history, otherwise cancels upcoming/waiting

**Response:**
```json
{
  "data": ReservationsData
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

### Finish Treatment
Finish the current treatment with a note and optional X-ray image.

**Endpoint:** `POST /api/reservations/current/finish`

**Request Body:**
```json
{
  "treatmentNote": "string (required, min 5 characters)",
  "xrayImageBase64": "string | null (optional)"
}
```

**Response:**
```json
{
  "data": ReservationsData
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

## Patients

### Get All Patients
Get a list of all patients with optional search.

**Endpoint:** `GET /api/patients`

**Query Parameters:**
- `search` (optional): Search by name or phone

**Response:**
```json
{
  "data": PatientProfile[]
}
```

---

### Create Patient
Create a new patient profile.

**Endpoint:** `POST /api/patients`

**Request Body:**
```json
{
  "name": "string",
  "phone": "string",
  "age": "number",
  "bloodType": "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",
  "xrayImageBase64": "string | null (optional)"
}
```

**Response:** `201 Created`
```json
{
  "data": PatientProfile
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

### Update Patient
Update an existing patient profile.

**Endpoint:** `PATCH /api/patients/[id]`

**Request Body:**
```json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "age": "number (optional)",
  "bloodType": "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O- (optional)",
  "xrayImageBase64": "string | null (optional)"
}
```

**Response:**
```json
{
  "data": PatientProfile
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

### Delete Patient
Delete a patient profile.

**Endpoint:** `DELETE /api/patients/[id]`

**Response:**
```json
{
  "success": true
}
```

**Error:** `400 Bad Request`
```json
{
  "message": "Error message"
}
```

---

## Data Types

### Patient
```typescript
interface Patient {
  id: string
  patientId: string
  name: string
  phone: string
  age: number
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
  bookingType: "advance" | "walk-in" | "emergency"
  appointmentDate: string // ISO date string
  hasArrived: boolean
  createdAt: string // ISO date string
  completedAt?: string | null // ISO date string
  treatmentNote?: string | null
  xrayImageBase64?: string | null
}
```

### PatientProfile
```typescript
interface PatientProfile {
  id: string
  name: string
  phone: string
  age: number
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
  xrayImageBase64?: string | null
  createdAt: string // ISO date string
  linkedReservations?: Array<{
    id: string
    bookingType: "advance" | "walk-in" | "emergency"
    status: "current" | "waiting" | "upcoming" | "completed"
    appointmentDate: string
    hasArrived: boolean
    createdAt: string
    completedAt?: string | null
    treatmentNote?: string | null
    xrayImageBase64?: string | null
  }>
}
```

### ReservationsData
```typescript
interface ReservationsData {
  currentPatient: Patient | null
  waitingPatients: Patient[]
  upcomingPatients: Patient[]
  treatmentHistory: Patient[]
}
```

---

## Example Usage

### React Native Fetch Example

```typescript
const API_BASE_URL = 'http://localhost:3000/api'

// Get all reservations
async function getReservations() {
  const response = await fetch(`${API_BASE_URL}/reservations`)
  const json = await response.json()
  return json.data
}

// Create a reservation
async function createReservation(data: {
  patient: {
    name: string
    phone: string
    age: number
    bloodType: string
  }
  bookingType: string
  appointmentDate: string
}) {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const json = await response.json()
  return json.data
}

// Start treatment
async function startTreatment(patientId: string, replaceCurrent = false) {
  const response = await fetch(`${API_BASE_URL}/reservations/${patientId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ replaceCurrent }),
  })
  const json = await response.json()
  return json.data
}

// Mark as arrived
async function markAsArrived(patientId: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/${patientId}/arrive`, {
    method: 'POST',
  })
  const json = await response.json()
  return json.data
}

// Finish treatment
async function finishTreatment(treatmentNote: string, xrayImageBase64?: string | null) {
  const response = await fetch(`${API_BASE_URL}/reservations/current/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      treatmentNote,
      xrayImageBase64: xrayImageBase64 || null,
    }),
  })
  const json = await response.json()
  return json.data
}

// Cancel reservation
async function cancelReservation(patientId: string, fromHistory = false) {
  const url = `${API_BASE_URL}/reservations/${patientId}${fromHistory ? '?fromHistory=true' : ''}`
  const response = await fetch(url, {
    method: 'DELETE',
  })
  const json = await response.json()
  return json.data
}

// Get all patients
async function getPatients(search?: string) {
  const url = `${API_BASE_URL}/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`
  const response = await fetch(url)
  const json = await response.json()
  return json.data
}

// Create patient
async function createPatient(data: {
  name: string
  phone: string
  age: number
  bloodType: string
  xrayImageBase64?: string | null
}) {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const json = await response.json()
  return json.data
}

// Update patient
async function updatePatient(patientId: string, data: Partial<{
  name: string
  phone: string
  age: number
  bloodType: string
  xrayImageBase64: string | null
}>) {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const json = await response.json()
  return json.data
}

// Delete patient
async function deletePatient(patientId: string) {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
    method: 'DELETE',
  })
  const json = await response.json()
  return json
}
```

---

## CORS Configuration

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *` (or specific origin)
- `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

For production, you may want to restrict the `Access-Control-Allow-Origin` to specific domains in `lib/api/cors.ts`.

---

## Error Handling

All endpoints return error responses in the following format:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error, business logic error)
- `404` - Not Found
- `500` - Internal Server Error

Always check the response status and handle errors appropriately in your client application.
