# API Specification

المستند هذا يصف واجهات الـ API التي ستوفرها Google Apps Script للـ Smart Attendance System. كل Endpoint موثق بالغاية، طريقة الاتصال، رؤوس الطلب، معايير التحقق، أمثلة طلب/استجابة، وحالات الخطأ المتوقعة.

## 0. قواعد عامة
- Base URL: `https://script.google.com/macros/s/<DEPLOY_ID>/exec` (يُحدَّث في `config.js` كـ `API_URL`).
- Content-Type: `application/json` لجميع الطلبات التي تحمل جسم JSON.
- Authentication: معظم عمليات المشرف محمية عبر Header: `Authorization: Bearer <token>`.
- Response format (عام):

> ملاحظة Sprint 0.5: في النسخة الحالية، يتم محاكاة هذا الشكل عبر ملف Mock API محلي داخل [assets/js/services/mockApi.js](assets/js/services/mockApi.js)، مع دعم `status`, `data`, `meta`, و`error`.

```json
{
  "status": "success" | "error",
  "data": { ... },
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

- Pagination convention:
  - Query params: `page` (1-based), `pageSize` (default 25, max 200).
  - Response: include `meta` object: `{ "page": 1, "pageSize": 25, "total": 120 }`.

- Validation errors return 400 with `error.code = "validation_error"` and `error.details` يحتوي على الحقول المعيبة.

- NOTE: تم تأجيل ميزات HMAC على الـ QR، نظام Refresh Token، وآلية الـ Offline Sync حسب توجيهات المشروع الأولي.

---

## Authentication

### POST /login
- Purpose: مصادقة مشرف وإصدار توكن جلْسة (short-lived token).
- Method: POST
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "username": "admin",
  "password": "secret"
}
```
- Validation:
  - `username`: required, non-empty string
  - `password`: required, non-empty string
- Success 200:

```json
{
  "status": "success",
  "data": {
    "token": "<session-token>",
    "user": { "id": "admin-1", "username": "admin", "role": "Admin" },
    "expiresAt": "2026-08-01T12:00:00Z"
  }
}
```
- Errors:
  - 400: missing fields
  - 401: invalid credentials (error.code = `invalid_credentials`)

### POST /logout
- Purpose: إبطال الجلسة الحالية (خادمياً).
- Method: POST
- Headers: `Authorization: Bearer <token>`
- Body: none
- Success 200: `{ "status": "success" }`
- Errors: 401 if token invalid

---

## Students

### GET /students
- Purpose: جلب قائمة الطلاب مع فلترة وpagination
- Method: GET
- Query parameters:
  - `department` (optional)
  - `level` (optional)
  - `status` (optional)
  - `page`, `pageSize`
- Success 200:

```json
{
  "status":"success",
  "data": [ { "id":"uuid","studentId":"202101234", "name":"Ahmed" } ],
  "meta": { "page":1, "pageSize":25, "total":120 }
}
```
- Errors: 400 for invalid pagination params

### GET /student
- Purpose: جلب طالب واحد
- Method: GET
- Query: `?studentId=202101234` أو `?id=uuid`
- Success 200:

```json
{ "status":"success", "data": { "id":"uuid","studentId":"202101234", "name":"Ahmed" } }
```
- Errors: 400 if missing identifier, 404 if not found

### POST /students
- Purpose: إنشاء طالب جديد
- Method: POST
- Headers: `Authorization: Bearer <token>`
- Body schema (JSON):

```json
{
  "studentId": "202101234",
  "name": "Ahmed Ali",
  "departmentId": "dept-1",
  "facultyId": "faculty-1",
  "level": "Level 1",
  "phone": "+201234...",
  "email": "a@x.com",
  "status": "active"
}
```
- Validation:
  - `studentId`, `name`, `departmentId`, `level` required
  - `email` must be valid format if present
  - `status` in [`active`,`inactive`,`suspended`]
- Success 201:

```json
{ "status":"success", "data": { "id":"uuid", ... } }
```
- Errors: 400 validation, 409 duplicate studentId

### PUT /students/:id
- Purpose: تحديث بيانات طالب
- Method: PUT
- Path: `/students/{id}`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body: partial fields to update
- Validation: id exists, fields validated as in POST
- Success 200: returns updated student
- Errors: 400, 404

### DELETE /students/:id
- Purpose: حذف طالب (soft-delete يفضّل)
- Method: DELETE
- Headers: `Authorization: Bearer <token>`
- Success 200: `{ "status":"success" }`
- Errors: 404 if not found

---

## Sessions

### GET /sessions
- Purpose: جلب الجلسات مع فلترة وpagination
- Method: GET
- Query params: `date`, `status`, `subjectId`, `page`, `pageSize`
- Success 200: list + meta

### GET /session/active
- Purpose: استعلام عن الجلسة المفتوحة حالياً (يُستخدم في صفحة الطالب)
- Method: GET
- Success 200: `{ "status":"success", "data": { ...session... } }` أو 404 إذا لا توجد جلسة مفتوحة

### POST /session/open
- Purpose: فتح جلسة جديدة
- Method: POST
- Headers: `Authorization: Bearer <token>`
- Body:

```json
{
  "subjectId":"subject-101",
  "date":"2026-08-01",
  "start":"09:00",
  "end":"10:30",
  "location": { "latitude":30.0444, "longitude":31.2357, "radius":300 },
  "room":"Room A"
}
```
- Validation: subjectId required; date in ISO date; start/end valid times; radius > 0
- Success 201: returns session object

### PUT /session/:id
- Purpose: تعديل جلسة
- Method: PUT
- Headers: `Authorization: Bearer <token>`
- Body: partial updates
- Success 200: updated session

### DELETE /session/:id
- Purpose: حذف/إغلاق جلسة
- Method: DELETE
- Headers: `Authorization: Bearer <token>`
- Success 200

---

## Attendance

### POST /attendance
- Purpose: تسجيل حضور طالب (العملية الأساسية من الواجهة)
- Method: POST
- Headers: `Content-Type: application/json`
- Body (required):

```json
{
  "studentId": "202101234",
  "sessionId": "session-123",
  "latitude": 30.0445,
  "longitude": 31.2358,
  "accuracy": 12.5,
  "device": "Android",
  "browser": "Chrome",
  "userAgent": "..."
}
```
- Validation rules:
  - `studentId`, `sessionId`, `latitude`, `longitude` required
  - `accuracy` optional but recommended (number <= 100)
  - Verify `sessionId` references an open session and `expiresAt` not passed
  - Compute `distance` server-side from session location and compare to `radius`
  - Check duplicate: same `studentId` + `sessionId` + date
- Server behavior:
  - If distance > radius => respond 422 with `error.code = "out_of_range"`.
  - If duplicate => 409 conflict with `error.code = "duplicate_attendance"`.
  - On success: 201 and persisted Attendance object (with `id`, `createdAt`, `distance`, `status`).
- Success 201 example:

```json
{
  "status":"success",
  "data": {
     "id":"att-123",
     "studentId":"202101234",
     "sessionId":"session-123",
     "distance":45,
     "status":"present",
     "createdAt":"2026-08-01T09:12:05Z"
  }
}
```
- Errors:
  - 400: validation_error
  - 401: unauthorized (for admin-only endpoints)
  - 409: duplicate_attendance
  - 422: out_of_range or session_closed

### GET /attendance
- Purpose: جلب سجلات الحضور مع فلترة
- Method: GET
- Query params: `sessionId`, `date`, `studentId`, `page`, `pageSize`
- Success 200: list + meta

---

## Dashboard & Reports

### GET /dashboard
- Purpose: إحصائيات سريعة لعرض البطاقات
- Query params: `date` (optional)
- Response: summary object `{ totalStudents, present, absent, percentage }`

### GET /reports
- Purpose: جلب تقارير (daily, weekly, monthly)
- Query: `?type=daily&date=2026-08-01` أو `?type=monthly&month=2026-08`
- Response: array of report entries

---

## Settings

### GET /settings
- Purpose: جلب إعدادات النظام
- Method: GET
- Success 200: `{ "status":"success","data":{...} }`

### POST /settings
- Purpose: تحديث الإعدادات (Admin)
- Headers: `Authorization: Bearer <token>`
- Body: settings payload (see `models`)
- Success 200: updated settings

---

## Admin & Reference Endpoints

### GET /subjects, GET /departments, GET /faculties, GET /admins
- Purpose: جلب بيانات مرجعية لاستخدام الواجهات.
- Method: GET
- Query: `?page`, `?pageSize`, `?status`
- Success 200: list + meta

### POST /admins, PUT /admins/:id, DELETE /admins/:id
- Purpose: إدارة حسابات المشرفين (Admin only)
- Headers: `Authorization: Bearer <token>`

---

## Error Codes (مقترح)
- `validation_error` — 400
- `invalid_credentials` — 401
- `unauthorized` — 401
- `forbidden` — 403
- `not_found` — 404
- `conflict` — 409
- `out_of_range` — 422
- `server_error` — 500

---

## Security Notes
- احفظ مفاتيح حساسة على جانب الخادم (Apps Script properties)، لا تخزنها في الواجهة.
- راجع معدلات الطلبات: Apps Script له حصص؛ ضع سياسة تحقق/حد على مستوى الطلب وحدد حد زمني أدنى بين تسجيلات الحضور من نفس الجهاز لمعالجة سوء الاستخدام.
- توثيق: لا تستخدم Refresh Tokens حالياً؛ جلسة المشرف قصيرة الصلاحية كافية للنسخة الأولى.

---

## Appendix: Example Requests

Login (curl):

```bash
curl -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'
```

Register attendance (fetch example):

```js
fetch(`${API_URL}/attendance`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId:'202101234', sessionId:'session-123', latitude:30.0445, longitude:31.2358 })
})
```
# API

The frontend expects JSON data from the backend service.
