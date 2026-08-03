# Integration Plan

## Overview
This document defines the transition strategy from the current mock-only frontend to a production-ready architecture based on:
- GitHub Pages for the frontend
- Google Apps Script as the API layer
- Google Sheets as the data store
- GPS-based attendance validation
- QR-based student entry

The goal is to keep the UI stable and replace only the API layer when moving from development to production.

---

## 1. Architecture Target

Student/Admin UI
  ↓
Modules
  ↓
Services
  ↓
API Layer
  ├── Mock API (Development)
  └── Google Apps Script API (Production)
        ↓
    Google Sheets

### Design Principle
The UI, modules, and services should remain unchanged as much as possible. Only the API implementation behind the service layer should be swapped.

---

## 2. Recommended Data Storage in Google Sheets

Create the following sheets:

### Sheet: settings
Columns:
- key
- value
- description

Example rows:
- university_name → جامعة المثال
- latitude → 30.0444
- longitude → 31.2357
- radius → 300
- attendance_open → TRUE
- attendance_start → 09:00
- attendance_end → 10:00
- language → ar
- theme → light

### Sheet: students
Columns:
- id
- student_id
- name
- department
- faculty
- level
- phone
- email
- status
- created_at
- updated_at

### Sheet: sessions
Columns:
- id
- session_id
- subject_name
- subject_code
- date
- start_time
- end_time
- room
- latitude
- longitude
- radius
- status
- created_at
- updated_at

### Sheet: attendance
Columns:
- id
- student_id
- session_id
- student_name
- department
- level
- timestamp
- date
- time
- status
- distance
- latitude
- longitude
- device
- browser
- notes

### Sheet: logs
Columns:
- id
- actor
- action
- target
- result
- timestamp
- details

### Sheet: admins
Columns:
- id
- username
- password_hash
- role
- email
- status
- last_login

---

## 3. Recommended Apps Script Endpoints

### Auth
- POST /login
- POST /logout

Request body:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "status": "success",
  "data": {
    "token": "...",
    "user": {
      "id": "1",
      "username": "admin",
      "role": "admin"
    }
  }
}

### Students
- GET /students
- GET /students/:id
- POST /students
- PUT /students/:id
- DELETE /students/:id

### Sessions
- GET /sessions
- GET /sessions/active
- POST /sessions
- PUT /sessions/:id
- POST /sessions/:id/close

### Attendance
- GET /attendance
- POST /attendance
- GET /attendance/:studentId/:sessionId

### Settings
- GET /settings
- PUT /settings

### Reports
- GET /reports/daily
- GET /reports/weekly
- GET /reports/monthly

### Logs
- GET /logs

---

## 4. Request/Response Contract

All endpoints should return a consistent response shape:

Success:
{
  "status": "success",
  "data": {}
}

Error:
{
  "status": "error",
  "error": {
    "code": "invalid_credentials",
    "message": "Invalid credentials"
  }
}

This keeps the frontend unchanged when switching between Mock API and Apps Script API.

---

## 5. Authentication and Authorization

### Authentication
Use a simple token-based session flow:
- Login returns a token
- Token is stored in localStorage
- Subsequent requests include it in headers

### Authorization Roles
- Guest
  - Can access the student attendance page
  - Can register attendance only
- Student
  - Can register attendance
  - Optional: view own attendance history
- Admin
  - Manage students
  - Manage sessions
  - View reports
  - Manage settings
- Super Admin (optional)
  - Manage admins
  - Full system access

### Frontend Behavior
The UI should check role before rendering protected sections.

---

## 6. GPS Flow

### Flow
1. Student opens the attendance page using a QR link such as:
   https://your-site.github.io/student/?session=2026-CS101-01
2. Frontend reads the session parameter.
3. Frontend requests settings from Apps Script.
4. Frontend requests the student’s current GPS coordinates.
5. Frontend compares the coordinates against the configured university location and radius.
6. If inside the allowed radius, attendance is accepted.
7. If outside the radius, the student is redirected to the denied page.

### Settings Source
Settings should be stored in Google Sheets and loaded dynamically at runtime.

### Why this is better than config.js
- No need to redeploy the site for each location change
- Admin can change radius/location from Sheets or administration UI
- The same frontend can serve different campuses or lecture halls

---

## 7. QR Flow

QR should not be static.

### Recommended QR Content
A URL containing:
- Session ID
- Timestamp
- Optional signature later

Example:
https://your-site.github.io/student/?session=2026-CS101-01

### Why
- Easy to generate per session
- No need to hardcode QR content in the frontend
- Enables session-specific attendance validation

---

## 8. Error Handling Strategy

The application should handle:
- GPS permission denied
- GPS not supported
- Session not found
- Student not found
- Attendance already submitted
- Network failure
- Apps Script error

Each error should map to a frontend state such as:
- denied page
- duplicate page
- offline page
- error page

---

## 9. Migration Strategy from Mock to Production

### Phase 1: Keep Mock API
- Build UI and modules normally
- Keep services returning mock responses

### Phase 2: Introduce API Adapter
- Add an API layer abstraction so each service can target either mock or Apps Script
- Keep the UI unchanged

### Phase 3: Replace API Implementation
- Switch services from mock responses to Apps Script endpoints
- Keep the same response schema

### Phase 4: Enable Real Data
- Connect sheets and test live flows
- Validate GPS, QR, and admin actions

---

## 10. Recommended Implementation Order for Sprint 3

1. Create the Google Apps Script backend
2. Create the Google Sheets structure
3. Implement the Apps Script endpoints
4. Add a service adapter for production API
5. Connect settings to Google Sheets
6. Connect attendance, students, and sessions to Apps Script
7. Add role-based access control in the frontend
8. Test QR and GPS end to end

---

## 11. Notes

- The current frontend should remain the same as much as possible.
- No real backend should be introduced directly into the UI modules.
- All production integrations should go through the services layer.
- The mock layer should stay available for development and testing.
