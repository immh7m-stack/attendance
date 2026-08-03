# Google Apps Script Specification

## Overview
هذا المستند يحدد اتفاقية الـ API التي يجب أن تنفذها Google Apps Script للربط مع الواجهة الحالية في المشروع. تم مراجعة هذا الملف بما يتوافق مع طبقة الـ adapter الحالية في [assets/js/services/apiAdapter.js](assets/js/services/apiAdapter.js) وموفر الـ Mock في [assets/js/services/providers/mockApiProvider.js](assets/js/services/providers/mockApiProvider.js).

## Compatibility Notes
الواجهة الحالية لا ترسل الطلبات إلى مسار REST مباشر بالكامل، بل تستخدم دالة بناء URL في [assets/js/api.js](assets/js/api.js) التي ترسل الطلب على هيئة:

```text
?action=<endpoint>
```

لذلك يجب أن يدعم Google Apps Script هذه الطريقة الأساسية، مع إمكانية إضافة دعم لروابط REST لاحقاً.

## Request Contract
### Common conventions
- جميع الطلبات يجب أن ترسل كـ JSON عند وجود body.
- يجب أن تُرجع الاستجابات بصيغة موحدة:

```json
{
  "status": "success",
  "data": {},
  "meta": {},
  "error": {}
}
```

- الطلبات المحمية تتطلب:

```http
Authorization: Bearer <token>
```

## Endpoint Matrix

| Action | Method | Purpose |
|---|---|---|
| `login` | POST | تسجيل دخول المشرف |
| `logout` | POST | تسجيل خروج المشرف |
| `students` | GET / POST | قراءة أو إنشاء الطلاب |
| `student` | GET | قراءة طالب واحد |
| `sessions` | GET / POST | قراءة أو إنشاء الجلسات |
| `sessions/active` | GET | قراءة الجلسة المفتوحة |
| `sessions/close` | POST | إغلاق جلسة |
| `attendance` | GET / POST | قراءة أو تسجيل الحضور |
| `attendance/batch` | POST | تسجيل حضور مجمع |
| `reports/daily` | GET | التقرير اليومي |
| `reports/weekly` | GET | التقرير الأسبوعي |
| `reports/monthly` | GET | التقرير الشهري |
| `settings` | GET / POST | قراءة أو حفظ الإعدادات |
| `logs` | GET | قراءة السجلات |

## Function Mapping
يجب أن تربط كل action بدالة داخل Apps Script، على سبيل المثال:

- `doGet(e)`
- `doPost(e)`
- `routeAction(action, params, body)`
- `handleLogin(request)`
- `handleLogout(request)`
- `handleGetStudents(request)`
- `handleGetStudent(request)`
- `handleCreateStudent(request)`
- `handleUpdateStudent(request)`
- `handleDeleteStudent(request)`
- `handleGetSessions(request)`
- `handleGetActiveSession(request)`
- `handleCreateSession(request)`
- `handleUpdateSession(request)`
- `handleCloseSession(request)`
- `handleDeleteSession(request)`
- `handleGetAttendance(request)`
- `handleSubmitAttendance(request)`
- `handleBatchAttendance(request)`
- `handleGetReports(request)`
- `handleGetSettings(request)`
- `handleSaveSettings(request)`
- `handleGetLogs(request)`

## Request Examples

### Login
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Create student
```json
{
  "studentId": "202101234",
  "name": "Ahmed Ali",
  "department": "علوم الحاسوب",
  "faculty": "الهندسة",
  "level": "Level 1",
  "phone": "+201000000001",
  "email": "ahmed@example.com",
  "status": "active"
}
```

### Create session
```json
{
  "sessionId": "session-001",
  "subjectName": "برمجة الويب",
  "subjectCode": "WEB101",
  "date": "2026-08-01",
  "startTime": "09:00",
  "endTime": "10:30",
  "room": "قاعة A",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "radius": 300,
  "status": "open"
}
```

### Submit attendance
```json
{
  "studentId": "202101234",
  "studentName": "Ahmed Ali",
  "department": "علوم الحاسوب",
  "level": "Level 1",
  "sessionId": "session-001",
  "date": "2026-08-01",
  "time": "09:12:05",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "distance": 42,
  "device": "Windows",
  "browser": "Chrome",
  "status": "present"
}
```

## Success Response Format
```json
{
  "status": "success",
  "data": {
    "id": "generated-id"
  },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 100
  }
}
```

## Error Response Format
```json
{
  "status": "error",
  "error": {
    "code": "validation_error",
    "message": "بيانات الطلب غير صالحة",
    "details": {}
  }
}
```

## Error Codes
- `invalid_credentials`
- `validation_error`
- `not_found`
- `duplicate_attendance`
- `session_closed`
- `out_of_range`
- `unauthorized`
- `timeout`
- `offline`
- `internal_error`

## Validation Rules
### Login
- `username`: required, non-empty
- `password`: required, non-empty

### Student
- `studentId`: required, unique
- `name`: required
- `department`: required
- `level`: required
- `status`: one of `active`, `inactive`, `suspended`

### Session
- `sessionId`: required, unique
- `subjectName`: required
- `date`: required in `YYYY-MM-DD`
- `startTime`: required in `HH:mm`
- `endTime`: required in `HH:mm`
- `latitude`, `longitude`, `radius`: numeric
- `status`: one of `open`, `closed`

### Attendance
- `studentId`: required
- `sessionId`: required
- `date`: required
- `time`: required
- `latitude`, `longitude`: required
- `status`: required

## Authentication Flow
1. الواجهة ترسل بيانات الدخول إلى `login`.
2. Apps Script يقارن البيانات مع ورقة `admins`.
3. عند النجاح، يرجع رمزًا مميزًا مع بيانات المستخدم.
4. الواجهة تحفظ الرمز في `localStorage`.
5. الطلبات اللاحقة ترسل `Authorization: Bearer <token>`.

## GPS and QR Validation Flow
1. الواجهة تقرأ الموقع الحالي من المتصفح.
2. تقارن الإحداثيات مع بيانات الجلسة الحالية.
3. إذا كان الطالب داخل النطاق، يسمح بالتسجيل.
4. إذا كان خارج النطاق، ترجع `out_of_range` وتعرض صفحة الرفض.
5. إذا كان QR غير صالح أو الجلسة مغلقة، ترجع `session_closed` أو `not_found`.

## Implementation Notes
- لا يُطلب تنفيذ الكود فعليًا في هذه المرحلة، وإنما مواصفات جاهزة للتنفيذ.
- ينبغي أن تستخدم Apps Script أوراق Google Sheets كمصدر وحيد للبيانات في الإصدار الأول.
- ينبغي أن تكون منطقية التحقق النهائية في الخلفية، بينما تبقى الواجهة مسؤولة عن التفاعل مع المستخدم.
