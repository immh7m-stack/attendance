# Smart Attendance System - Design Document

## 01. Project Overview

### فكرة المشروع
Smart Attendance System هو نظام حضور ذكي يعتمد على مسح QR Code وGPS من أجل تسجيل الحضور تلقائياً ودقيقاً للطلاب في المحاضرات والدورات. يتم فتح الموقع عبر GitHub Pages، ويجري التحقق النهائي على جهة الخلفية باستخدام Google Apps Script وGoogle Sheets كمخزن بيانات.

### أهداف المشروع
- بناء نظام حضور ذكي ومنظم لكل جامعة أو مؤسسة تعليمية.
- تمكين تسجيل الحضور عبر QR Code وGPS.
- ضمان التحقق من وجود جلسة مفتوحة وأن الطالب داخل النطاق الجغرافي.
- منع التكرار وضمان أمن البيانات عبر التحقق النهائي في الخلفية.
- تقديم لوحة مشرف قابلة للتوسع للتحكم في الطلاب، الجلسات، التقارير، والإعدادات.
- اعتماد البنية النظيفية والمنفصلة لتسهيل التوسع والصيانة.

### المميزات
- تسجيل حضور الطالب عبر QR Code.
- طلب إذن GPS والتحقق من الموقع.
- تنبيهات حالة التسجيل: نجاح، مكرر، خارج النطاق، خطأ، عدم اتصال.
- لوحة مشرف متكاملة مع إحصائيات وتقارير وإدارة.
- فصل واضح بين الواجهة، منطق التطبيق، خدمات البيانات، والـ API.
- قابلية التوسع لأكثر من جامعة، كلية، مادة، قاعة، وجلسة.

### المستخدمين
- الطالب: يقوم بمسح QR وتسجيل حضوره.
- المشرف / Administrator: يدير النظام، الطلاب، الجلسات، الإعدادات، والتقارير.
- المراقب / Viewer: يطلع على التقارير والإحصائيات دون تعديل.
- المساعد / Assistant: يساعد في إدارة الدورات والطلاب والمعلومات.

### حدود النظام
- لا يتضمن نظام تسجيل دخول الطلاب الفردي في النسخة الأساسية.
- يعتمد على GPS المتاح في المتصفح ولا يدعم تحديد الموقع بدقة أعلى من المتصفح فقط.
- يستخدم Google Sheets كقاعدة بيانات ولا يدعم قواعد بيانات SQL خارجية في الإصدار الأول.
- لا يعتمد على خادم NodeJS، بل Google Apps Script كطبقة Backend.
- لا يدعم حالياً معالجة صور QR مباشرة على الخادم.

### حالات الاستخدام
- تسجيل حضور الطالب باستخدام QR + GPS.
- المشرف يدخل إلى لوحة التحكم.
- المشرف ينشئ/يغلق جلسة.
- المشرف يعرض بيانات الطلاب.
- المشرف يولد تقرير يومي أو أسبوعي.
- المشرف يغير إعدادات الحضور.

## 02. Software Architecture

### نظرة عامة على الطبقات
النظام مبني على معماريات نظيفة ومنفصلة، ويتكون من الطبقات التالية:

```
Frontend (UI)
↓
Application Layer
↓
Services Layer
↓
API Layer
↓
Google Apps Script
↓
Google Sheets
```

### Frontend (UI)
- مسؤول عن عرض واجهات المستخدم.
- يتضمن صفحات HTML، CSS، والمكونات التفاعلية.
- يتعامل مع الأحداث، إدخالات المستخدم، والتنقل بين الصفحات.
- لا يحتوي على قواعد الأعمال أو منطق التحقق النهائي.

### Application Layer
- يحتوي على وحدات Modules المسؤولة عن تدفق التطبيق.
- يقوم بمعالجة UI events ويختار الخدمة المناسبة.
- ينفذ قواعد التحقق البسيطة، تنسيق البيانات، وإدارة الحالة المحلية.
- مثال: `attendance.js`, `auth.js`, `dashboard.js`.

### Services Layer
- تغليف الاتصالات الخارجية والعمليات المتكررة.
- يتضمن عمليات CRUD، التفاعل مع API، والتخزين المحلي.
- يوفر واجهة واضحة للـ Application Layer.
- مثال: `attendanceService.js`, `authService.js`, `storageService.js`.
- في Sprint 0.5، تم توحيد هذه الخدمات حول Mock API موحد يقدّم استجابات متسقة مع `status`, `data`, و`error`، ويضيف دعم التصفية والـ pagination.

### API Layer
- يمثل واجهة REST-like التي يديرها Google Apps Script.
- يترجم الطلبات القادمة من الواجهة إلى عمليات على Google Sheets.
- يتحقق من صحة الطلبات، الصلاحية، ومنطق الأعمال الحاسم.

### Google Apps Script
- ينفذ منطق Backend النهائي.
- يتعامل مع أوراق Google Sheets.
- يتحقق من التكرار، الجلسات، وتسجيل الحضور.
- يوفر end points للـ frontend.

### Google Sheets
- يعتبر قاعدة البيانات النهائية.
- يحتوي على Sheets متعددة تخزن الطلاب، الحضور، الجلسات، الإعدادات، والسجلات.
- يسمح بالتقارير والتحليلات.

## 03. Folder Structure

### مراجعة الهيكل الحالي
الهيكل الحالي جيد كأساس، لكنه يحتاج إلى تعزيز فصل الطبقات بتقسيم أوضح بين الخدمات، الحالة، والنماذج. سنقترح تنظيمًا أدق يدعم قابلية التوسع.

### الهيكل المقترح النهائي

```
attendance-system/
│
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── 404.html
├── index.html
│
├── student/
│   ├── index.html
│   ├── success.html
│   ├── denied.html
│   ├── duplicate.html
│   ├── offline.html
│   └── error.html
│
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── attendance.html
│   ├── students.html
│   ├── sessions.html
│   ├── reports.html
│   ├── settings.html
│   ├── logs.html
│   └── profile.html
│
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── student.css
│   │   ├── admin.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── responsive.css
│   │   └── theme.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── router.js
│   │   ├── models.js
│   │   ├── state.js
│   │   ├── services/
│   │   │   ├── attendanceService.js
│   │   │   ├── authService.js
│   │   │   ├── sessionService.js
│   │   │   ├── studentService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── reportService.js
│   │   │   ├── settingsService.js
│   │   │   ├── notificationService.js
│   │   │   ├── qrService.js
│   │   │   ├── gpsService.js
│   │   │   ├── exportService.js
│   │   │   └── storageService.js
│   │   ├── modules/
│   │   │   ├── location.js
│   │   │   ├── attendance.js
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   ├── reports.js
│   │   │   ├── students.js
│   │   │   ├── sessions.js
│   │   │   ├── validation.js
│   │   │   ├── export.js
│   │   │   ├── qr.js
│   │   │   ├── notifications.js
│   │   │   ├── storage.js
│   │   │   ├── map.js
│   │   │   └── utils.js
│   │
│   ├── images/
│   ├── fonts/
│   └── audio/
│
├── data/
│   ├── departments.json
│   ├── levels.json
│   └── sample-students.json
│
├── docs/
│   ├── installation.md
│   ├── deployment.md
│   ├── api.md
│   ├── workflow.md
│   ├── changelog.md
│   └── architecture.md
│
└── .github/
    └── workflows/
        └── deploy.yml
```

### وظيفة كل مجلد

- `/root`: ملفات وثائق المشروع، إعدادات الحزم، والصفحة الرئيسية.
- `/student`: صفحات واجهة الطالب ومخرجات حالة التسجيل.
- `/admin`: صفحات واجهة المشرف ولوحة التحكم.
- `/assets/css`: أنماط العرض ومكونات التصميم.
- `/assets/js`: الشيفرة التنفيذية للواجهة، تقسيمها إلى طبقة تطبيق، خدمات، ونماذج.
- `/assets/js/services`: الخدمات التي توفر واجهات بيانات ومكالمات API.
- `/assets/js/modules`: وحدات منطق التطبيق التي تربط UI بالخدمات.
- `/assets/js/models.js`: تعريف نماذج البيانات المشتركة.
- `/assets/js/state.js`: إدارة الحالة المركزية.
- `/assets/images`, `/assets/fonts`, `/assets/audio`: موارد الوسائط.
- `/data`: بيانات تجريبية وملفات Mock.
- `/docs`: وثائق المشروع.
- `/.github`: إعدادات CI/CD أو GitHub Actions.

### وظيفة الملفات الرئيسية

- `app.js`: تنسيق الصفحة الحالية، تحميل الحالة الأساسية، وإطلاق الوحدات المناسبة.
- `config.js`: إعدادات ثابتة وبيئية للنظام.
- `api.js`: تغليف طلبات HTTP إلى Google Apps Script.
- `router.js`: إدارة التنقل وتحديد المسارات.
- `models.js`: تعريف الكيانات والنماذج المشروعية.
- `state.js`: إدارة الحالة المشتركة في الواجهة.

## 04. Data Models

### Student
```json
{
  "id": "uuid",
  "studentId": "202101234",
  "name": "Ahmed Ali",
  "department": "CS",
  "faculty": "Engineering",
  "level": "Level 1",
  "phone": "+201234567890",
  "email": "ahmed@example.com",
  "status": "active",
  "createdAt": "2026-08-01T08:00:00Z",
  "updatedAt": "2026-08-01T09:00:00Z"
}
```
- `id` (Required, String): معرف فريد داخلي.
- `studentId` (Required, String): الرقم الجامعي.
- `name` (Required, String): اسم الطالب.
- `department` (Required, String): الكلية أو القسم.
- `faculty` (Optional, String): اسم الكلية أو المؤسسة.
- `level` (Required, String): المستوى الدراسي.
- `phone` (Optional, String): رقم الهاتف.
- `email` (Optional, String): البريد الإلكتروني.
- `status` (Required, String): `active`, `inactive`, `suspended`.
- `createdAt`, `updatedAt` (Required, String): توقيت الإنشاء والتعديل.

### Attendance
```json
{
  "id": "attendance-123",
  "studentId": "202101234",
  "sessionId": "session-123",
  "latitude": 30.0445,
  "longitude": 31.2358,
  "distance": 45,
  "date": "2026-08-01",
  "time": "09:12:05",
  "status": "present",
  "device": "Windows",
  "browser": "Chrome",
  "createdAt": "2026-08-01T09:12:05Z"
}
```
- `id` (Required, String): معرف التسجيل.
- `studentId` (Required, String): رقم الطالب المرتبط.
- `sessionId` (Required, String): معرف الجلسة.
- `latitude`, `longitude` (Required, Number): إحداثيات الموقع عند التسجيل.
- `distance` (Required, Number): المسافة بالمتر من مركز الجلسة.
- `date`, `time` (Required, String): توقيت الحضور.
- `status` (Required, String): `present`, `late`, `absent`, `denied`.
- `device` (Optional, String): جهاز الطالب.
- `browser` (Optional, String): متصفح الطالب.
- `createdAt` (Required, String): الطابع الزمني للتسجيل.

### Session
```json
{
  "id": "session-123",
  "subjectId": "subject-101",
  "subjectName": "برمجة قواعد البيانات",
  "date": "2026-08-01",
  "start": "09:00",
  "end": "10:30",
  "location": {
    "latitude": 30.0444,
    "longitude": 31.2357,
    "radius": 300
  },
  "room": "Room A",
  "status": "open",
  "createdAt": "2026-08-01T08:30:00Z",
  "updatedAt": "2026-08-01T08:45:00Z"
}
```
- `id` (Required, String): معرف الجلسة.
- `subjectId` (Required, String): معرف المادة.
- `subjectName` (Required, String): اسم المادة للعرض.
- `date` (Required, String): تاريخ الجلسة.
- `start`, `end` (Required, String): أوقات البداية والنهاية.
- `location.latitude`, `location.longitude` (Required, Number): إحداثيات مركز التسجيل.
- `location.radius` (Required, Number): نصف القطر المسموح به بالمتر.
- `room` (Optional, String): اسم القاعة.
- `status` (Required, String): `open`, `closed`, `cancelled`.
- `createdAt`, `updatedAt` (Required, String).

### Admin
```json
{
  "id": "admin-1",
  "username": "admin",
  "role": "Admin",
  "permissions": ["manage_students", "manage_sessions", "view_reports"],
  "status": "active",
  "createdAt": "2026-08-01T07:00:00Z"
}
```
- `id` (Required, String): معرف المستخدم.
- `username` (Required, String): اسم المستخدم.
- `role` (Required, String): الدور.
- `permissions` (Required, Array): قائمة الصلاحيات.
- `status` (Required, String): `active`, `inactive`.
- `createdAt` (Required, String).

### Subject
```json
{
  "id": "subject-101",
  "name": "برمجة قواعد البيانات",
  "code": "CS101",
  "departmentId": "dept-1",
  "facultyId": "faculty-1",
  "status": "active"
}
```
- `id`, `name`, `code` (Required).
- `departmentId`, `facultyId` (Required): ربط تسلسلي.
- `status` (Required): `active`, `inactive`.

### Department
```json
{
  "id": "dept-1",
  "name": "علوم الحاسوب",
  "facultyId": "faculty-1",
  "status": "active"
}
```
- `id`, `name` (Required).
- `facultyId` (Required): الكلية الأعلى.
- `status` (Required).

### Faculty
```json
{
  "id": "faculty-1",
  "name": "كلية الهندسة",
  "status": "active"
}
```
- `id`, `name` (Required).
- `status` (Required).

### Settings
```json
{
  "id": "settings-1",
  "defaultLatitude": 30.0444,
  "defaultLongitude": 31.2357,
  "defaultRadius": 300,
  "attendanceStart": "08:30",
  "attendanceEnd": "10:30",
  "university": "جامعة المثال",
  "faculty": "كلية الحاسوب",
  "department": "نظم المعلومات",
  "timeZone": "Africa/Cairo",
  "updatedAt": "2026-08-01T07:00:00Z"
}
```
- `id` (Required, String).
- `defaultLatitude`, `defaultLongitude` (Optional, Number).
- `defaultRadius` (Required, Number).
- `attendanceStart`, `attendanceEnd` (Required, String).
- `university`, `faculty`, `department` (Optional, String).
- `timeZone` (Optional, String).
- `updatedAt` (Required, String).

### Report
```json
{
  "date": "2026-08-01",
  "subjectId": "subject-101",
  "sessionId": "session-123",
  "totalStudents": 120,
  "present": 95,
  "absent": 25,
  "percentage": 79.2,
  "createdAt": "2026-08-01T11:00:00Z"
}
```
- `date`, `subjectId`, `sessionId` (Required).
- `totalStudents`, `present`, `absent` (Required, Number).
- `percentage` (Required, Number).
- `createdAt` (Required, String).

### Log
```json
{
  "id": "log-1",
  "date": "2026-08-01",
  "time": "09:15:00",
  "action": "registerAttendance",
  "user": "student-202101234",
  "result": "success",
  "description": "Student check-in successful"
}
```
- `id`, `date`, `time`, `action`, `user`, `result` (Required).
- `description` (Optional, String).

### Notification
```json
{
  "id": "notif-1",
  "type": "success",
  "message": "تم تسجيل الحضور بنجاح.",
  "createdAt": "2026-08-01T09:15:05Z",
  "duration": 4000
}
```
- `id`, `type`, `message`, `createdAt` (Required).
- `duration` (Optional, Number).

### UserSession
```json
{
  "token": "jwt-or-session-token",
  "userId": "admin-1",
  "role": "Admin",
  "expiresAt": "2026-08-01T12:00:00Z",
  "issuedAt": "2026-08-01T09:00:00Z"
}
```
- `token`, `userId`, `role`, `expiresAt`, `issuedAt` (Required).

## 05. Database Design

### Google Sheets Structure

يستند التصميم إلى أوراق منفصلة لكل كيان أساسي مع علاقات خارجية بسيطة عبر المعرفات.

#### Sheets
- `Students`
- `Attendance`
- `Sessions`
- `Settings`
- `Logs`
- `Subjects`
- `Departments`
- `Faculties`
- `Admins`

### `Students` Columns
- `ID` (String): معرف فريد.
- `StudentID` (String): الرقم الجامعي.
- `Name` (String)
- `DepartmentID` (String)
- `FacultyID` (String)
- `Level` (String)
- `Phone` (String)
- `Email` (String)
- `Status` (String)
- `CreatedAt` (DateTime)
- `UpdatedAt` (DateTime)

### `Attendance` Columns
- `ID` (String)
- `StudentID` (String)
- `SessionID` (String)
- `Latitude` (Number)
- `Longitude` (Number)
- `Distance` (Number)
- `Date` (Date)
- `Time` (Time)
- `Status` (String)
- `Device` (String)
- `Browser` (String)
- `CreatedAt` (DateTime)

### `Sessions` Columns
- `ID` (String)
- `SubjectID` (String)
- `Date` (Date)
- `StartTime` (Time)
- `EndTime` (Time)
- `Latitude` (Number)
- `Longitude` (Number)
- `Radius` (Number)
- `Room` (String)
- `Status` (String)
- `CreatedAt` (DateTime)
- `UpdatedAt` (DateTime)

### `Settings` Columns
- `ID` (String)
- `University` (String)
- `Faculty` (String)
- `Department` (String)
- `Latitude` (Number)
- `Longitude` (Number)
- `Radius` (Number)
- `AttendanceStart` (Time)
- `AttendanceEnd` (Time)
- `TimeZone` (String)
- `UpdatedAt` (DateTime)

### `Logs` Columns
- `ID` (String)
- `Date` (Date)
- `Time` (Time)
- `Action` (String)
- `User` (String)
- `Result` (String)
- `Description` (String)
- `CreatedAt` (DateTime)

### `Subjects` Columns
- `ID` (String)
- `Code` (String)
- `Name` (String)
- `DepartmentID` (String)
- `Status` (String)

### `Departments` Columns
- `ID` (String)
- `Name` (String)
- `FacultyID` (String)
- `Status` (String)

### `Faculties` Columns
- `ID` (String)
- `Name` (String)
- `Status` (String)

### `Admins` Columns
- `ID` (String)
- `Username` (String)
- `Role` (String)
- `Status` (String)
- `CreatedAt` (DateTime)

### العلاقات
- `Attendance.StudentID` → `Students.StudentID`
- `Attendance.SessionID` → `Sessions.ID`
- `Sessions.SubjectID` → `Subjects.ID`
- `Students.DepartmentID` → `Departments.ID`
- `Students.FacultyID` → `Faculties.ID`
- `Subjects.DepartmentID` → `Departments.ID`

### لماذا هذا التصميم
- يفصل الكيانات لسهولة الاستعلام والتقارير.
- يدعم إضافة أكثر من جامعة، كلية، قسم، مادة، وجلسة دون إعادة هيكلة.
- يعالج التوسع باستخدام معرفات علاقات بسيطة.
- يسمح للـ Apps Script بالعمل مع بنية واضحة وسهلة الصيانة.

## 06. API Contract

### اعتبار عام
- يعتمد API على `Google Apps Script` ويُستدعى بواسطة `api.js` من الواجهة.
- جميع الاستجابات بصيغة JSON.
- يستخدم `action` في Query أو `endpoint` لتمييز العملية.
- يدعم HTTP methods: GET, POST, PUT, DELETE.
- كل طلب يعيد `status`, `data`, `error` عند الفشل.

### Endpoints

#### POST /login
- Request:
  - Body: `{ "username": "admin", "password": "secret" }`
- Response 200:
  - `{ "status": "success", "data": { "token": "...", "user": { ... } } }`
- Errors:
  - 400: `Bad Request`
  - 401: `Invalid credentials`

#### POST /logout
- Request:
  - Headers: `Authorization: Bearer <token>`
- Response 200:
  - `{ "status": "success" }`

#### GET /student
- Query: `?studentId=202101234`
- Response 200:
  - `{ "status": "success", "data": { ...Student... } }`
- Errors:
  - 400: `studentId required`
  - 404: `Student not found`

#### GET /students
- Query: `?department=CS&level=Level 1&status=active`
- Response 200:
  - `{ "status": "success", "data": [ ... ] }`

#### POST /attendance
- Body:
  ```json
  {
    "studentId": "202101234",
    "sessionId": "session-123",
    "latitude": 30.0445,
    "longitude": 31.2358,
    "distance": 45,
    "device": "Windows",
    "browser": "Chrome"
  }
  ```
- Response 201:
  - `{ "status": "success", "data": { ...Attendance... } }`
- Errors:
  - 400: `Missing fields`
  - 409: `Duplicate attendance`
  - 422: `Out of range` or `Session closed`

#### GET /attendance
- Query: `?sessionId=session-123&date=2026-08-01`
- Response 200:
  - `{ "status": "success", "data": [ ... ] }`

#### GET /dashboard
- Query: `?date=2026-08-01`
- Response 200:
  - `{ "status": "success", "data": { "totalStudents": 120, "present": 95, ... } }`

#### GET /reports
- Query: `?type=daily&date=2026-08-01`
- Response 200:
  - `{ "status": "success", "data": [ ...Report... ] }`

#### POST /settings
- Body: `{ "latitude": 30.0444, "longitude": 31.2357, "radius": 300, ... }`
- Response 200:
  - `{ "status": "success", "data": { ...Settings... } }`

#### POST /session/open
- Body: `{ "subjectId": "subject-101", "date": "2026-08-01", "start": "09:00", "end": "10:30", "location": { ... } }`
- Response 201:
  - `{ "status": "success", "data": { ...Session... } }`

#### POST /session/close
- Body: `{ "sessionId": "session-123" }`
- Response 200:
  - `{ "status": "success" }`

#### GET /session/active
- Response 200:
  - `{ "status": "success", "data": { ...Session... } }`

### Validation and Errors
- كل endpoint يتحقق من وجود الحقول Required.
- `studentId`, `sessionId`, `latitude`, `longitude` هي حقول إلزامية في تسجيل الحضور.
- أخطاء JSON:
  - `400 Bad Request` عند غياب حقول.
  - `401 Unauthorized` عند فشل التوكن.
  - `403 Forbidden` عند صلاحية غير كافية.
  - `404 Not Found` عند عدم العثور على الكيان.
  - `409 Conflict` عند تكرار التسجيل.
  - `422 Unprocessable Entity` عند فشل التحقق الجغرافي.

### Response Example
```json
{
  "status": "success",
  "data": {
    "id": "attendance-123",
    "studentId": "202101234",
    "sessionId": "session-123"
  }
}
```

## 07. Services Design

### AttendanceService
- مسؤولية: تسجيل حضور الطالب، التحقق من التكرار، وإدارة سلسلة بيانات الحضور.
- Functions:
  - `registerAttendance(attendancePayload)`
  - `checkDuplicate(studentId, sessionId, date)`
  - `prepareAttendancePayload(student, session, location)`
  - `getAttendanceBySession(sessionId, date)`

### StudentService
- مسؤولية: إدارة بيانات الطلاب، بحث الطلاب، وتخزين بيانات الطلاب.
- Functions:
  - `getStudent(studentId)`
  - `searchStudents(filters)`
  - `createStudent(studentData)`
  - `updateStudent(studentId, updates)`
  - `deleteStudent(studentId)`

### DashboardService
- مسؤولية: جلب الإحصائيات والنسب.
- Functions:
  - `getDashboardSummary(date)`
  - `getAttendanceTrend(range)`
  - `getLastCheckIns(limit)`

### GPSService
- مسؤولية: طلب صلاحية الموقع، قراءته، وحساب المسافة.
- Functions:
  - `requestPermission()`
  - `getCurrentLocation()`
  - `calculateDistance(coordA, coordB)`
  - `isInsideRadius(coordA, coordB, radius)`

### QRService
- مسؤولية: توليد رمز QR والقراءة والتحقق.
- Functions:
  - `generateQRCode(payload)`
  - `parseQRData(qrString)`
  - `validateQRCode(qrData)`

### NotificationService
- مسؤولية: عرض التنبيهات للمستخدم.
- Functions:
  - `showToast(message, type)`
  - `showLoading(message)`
  - `hideLoading()`
- Types: `success`, `error`, `warning`, `info`.

### ExportService
- مسؤولية: تصدير البيانات إلى CSV/Excel/PDF.
- Functions:
  - `exportToCSV(data, filename)`
  - `exportToExcel(data, filename)`
  - `exportToPDF(data, filename)`

### SettingsService
- مسؤولية: جلب وحفظ إعدادات النظام.
- Functions:
  - `getSettings()`
  - `saveSettings(settingsPayload)`

### SessionService
- مسؤولية: إدارة جلسات الحضور.
- Functions:
  - `getActiveSession()`
  - `createSession(sessionPayload)`
  - `closeSession(sessionId)`
  - `updateSession(sessionId, updates)`

### AuthenticationService
- مسؤولية: تسجيل الدخول، التحقق، الجلسة المحلية.
- Functions:
  - `login(credentials)`
  - `logout()`
  - `isAuthenticated()`
  - `getCurrentUser()`
  - `refreshToken()`

### StorageService
- مسؤولية: واجهة LocalStorage/SessionStorage.
- Functions:
  - `save(key, value)`
  - `load(key)`
  - `remove(key)`
  - `clear()`

### ReportService
- مسؤولية: توليد وتحميل التقارير.
- Functions:
  - `getDailyReport(date)`
  - `getWeeklyReport(startDate)`
  - `getMonthlyReport(month)`
  - `getCustomReport(filters)`

## 08. Modules Design

### location.js
- `requestPermission()` → يطلب صلاحية الموقع.
- `getCurrentLocation()` → يعيد { latitude, longitude, accuracy }.
- `calculateDistance(coordA, coordB)` → يحسب المسافة بالمتر.
- `isInsideRadius(coordA, coordB, radius)` → يعيد `{ inside, distance }`.
- `showLocationStatus(message, status)` → يعرض حالة GPS.
- Dependencies: `GPSService`, `NotificationService`.

### attendance.js
- `initStudentPage()` → يربط عناصر النموذج ويبدأ التدفق.
- `onAttendanceSubmit(event)` → يتعامل مع إرسال النموذج.
- `validateStudentInput(student)` → يتحقق من صحة الإدخالات.
- `displayAttendanceResult(result)` → يعرض الحالة النهائية.
- Dependencies: `AttendanceService`, `SessionService`, `GPSService`, `NotificationService`, `Router`.

### students.js
- `initStudentsPage()` → يحمّل بيانات الطلاب.
- `renderStudentTable(students)` → يعرض الجدول.
- `handleSearch(query)` → يبحث الطلاب.
- `handleStudentUpdate(studentId, updates)` → يحدث بيانات الطالب.
- `handleStudentDelete(studentId)` → يحذف طالبًا.
- Dependencies: `StudentService`, `Validation`, `NotificationService`.

### dashboard.js
- `initDashboardPage()` → يحمّل الإحصائيات.
- `renderDashboardCards(summary)` → يعرض البطاقات.
- `renderRecentCheckIns(items)` → يعرض آخر التسجيلات.
- Dependencies: `DashboardService`, `NotificationService`.

### reports.js
- `initReportsPage()` → يفعّل فلترة التقارير.
- `fetchReport(type, params)` → يستدعي `ReportService`.
- `renderReportChart(data)` → يصنع المخطط.
- `handleExport(format)` → يصدر التقرير.
- Dependencies: `ReportService`, `ExportService`, `NotificationService`.

### auth.js
- `initAuthPage()` → يعالج صفحة الدخول.
- `redirectIfAuthenticated()` → يمنع الوصول غير المصرح.
- `handleLogin(credentials)` → يستدعي `AuthenticationService`.
- Dependencies: `AuthenticationService`, `Router`, `NotificationService`.

### validation.js
- `validateID(value)`, `validateName(value)`, `validateDepartment(value)`, `validateGPS(coord)`, `validateAttendance(student)`, `validateSession(session)`.
- Dependencies: none أو `Utils`.

### map.js
- `initMap(containerId, options)` → يُنشئ الخريطة.
- `showStudentLocation(location)` → يضع علامة.
- `showRadius(center, radius)` → يرسم النطاق.
- Dependencies: خرائط خارجية (Leaflet أو Google Maps) إن تم تفعيلها.

### export.js
- `exportTableToCSV(tableId)`.
- `exportDataToExcel(data)`.
- `downloadFile(content, filename, mimeType)`.
- Dependencies: `ExportService`.

### notifications.js
- `showToast(message, type)`.
- `showLoading(message)`.
- `hideLoading()`.
- `showDialog(options)`.
- `showConfirmation(message)`.
- Dependencies: DOM.

### utils.js
- `formatDate(date)`, `formatTime(date)`, `randomId(length)`, `uuid()`, `slugify(text)`, `distanceBetween(...)`.
- Dependencies: none.

### storage.js
- `saveData(key, value)`, `loadData(key)`, `removeData(key)`, `clearData()`.
- Dependencies: Browser Storage API.

### qr.js
- `generateQR(payload)` → يحول البارامترات إلى نص.
- `parseQRData(payload)` → يقرأ بيانات QR.
- `validateQR(qrData)` → يتحقق من صلاحية البيانات.
- Dependencies: `QRCode library` أو توليد نص Base64.

## 09. State Management

### appState
- مسؤولية: الحالة العامة للنظام.
- يحتوي على:
  - `currentUser`
  - `currentRoute`
  - `settings`
  - `appStatus`

### studentState
- مسؤولية: بيانات طالب الواجهة.
- يحتوي على:
  - `studentProfile`
  - `activeSession`
  - `location`
  - `attendanceStatus`
  - `qrData`

### attendanceState
- مسؤولية: حالة عملية تسجيل الحضور.
- يحتوي على:
  - `currentAttendance`
  - `duplicateCheck`
  - `submissionResult`
  - `validationErrors`

### dashboardState
- مسؤولية: بيانات لوحة المشرف.
- يحتوي على:
  - `summary`
  - `recentCheckIns`
  - `chartsData`
  - `filters`

### sessionState
- مسؤولية: حالة الجلسات.
- يحتوي على:
  - `activeSession`
  - `sessionList`
  - `sessionDetails`
  - `sessionStatus`

### طريقة التخزين
- `state.js` يوفر واجهة واحدة للوصول والتحديث.
- نظرة واحدة على الحالة الكاملة تسهل الربط بين المكونات.

## 10. UI Components

### Navbar
- Props:
  - `title`, `links`, `userMenu`, `logo`, `onLogout`
- وظيفة: التنقل الأعلى وعرض المستخدم.

### Sidebar
- Props:
  - `items`, `activeItem`, `onSelect`
- وظيفة: تنقل صفحات المشرف.

### Card
- Props:
  - `title`, `value`, `icon`, `footer`, `status`
- وظيفة: عرض ملخصات.

### Table
- Props:
  - `columns`, `rows`, `actions`, `sortable`, `searchable`
- وظيفة: عرض بيانات جدولية.

### Loader
- Props:
  - `message`, `visible`
- وظيفة: عرض حالة انتظار.

### Toast
- Props:
  - `message`, `type`, `duration`
- وظيفة: عرض إعلامات عابرة.

### Modal
- Props:
  - `title`, `content`, `actions`, `visible`
- وظيفة: عرض حوارات تراكبية.

### Dialog
- Props:
  - `title`, `message`, `buttons`
- وظيفة: تأكيد أو إعلام المستخدم.

### Confirmation
- Props:
  - `message`, `onConfirm`, `onCancel`
- وظيفة: تأكيد الإجراءات الحساسة.

### Student Card
- Props:
  - `student`, `status`, `actions`
- وظيفة: عرض بيانات الطالب بشكل ملخص.

### Attendance Table
- Props:
  - `records`, `columns`, `actions`
- وظيفة: عرض سجلات الحضور.

### Dashboard Cards
- Props:
  - `label`, `value`, `icon`, `trend`
- وظيفة: عرض مؤشرات الأداء.

### Statistic Card
- Props:
  - `metric`, `amount`, `change`, `description`
- وظيفة: إبراز القيمة الرئيسية.

### Search Box
- Props:
  - `value`, `placeholder`, `onSearch`
- وظيفة: فلترة النتائج.

### Pagination
- Props:
  - `currentPage`, `pageSize`, `total`, `onPageChange`
- وظيفة: تنقل بين الصفحات.

## 11. Routing

### Student Routes
- `/` → صفحة البداية.
- `/student/index.html` → صفحة تسجيل الحضور.
- `/student/success.html`
- `/student/denied.html`
- `/student/duplicate.html`
- `/student/offline.html`
- `/student/error.html`

### Admin Routes
- `/admin/login.html`
- `/admin/dashboard.html`
- `/admin/attendance.html`
- `/admin/students.html`
- `/admin/sessions.html`
- `/admin/reports.html`
- `/admin/settings.html`
- `/admin/logs.html`
- `/admin/profile.html`

### Error Routes
- `/404.html`
- يمكن إعادة توجيه الصفحات غير المعروفة إلى `404.html`.

### Authentication Routes
- المستخدم غير المصادق يتم إعادة توجيهه إلى `/admin/login.html`.
- المستخدم المصادق يمكن الوصول إلى `/admin/*`.
- الواجهات الخاصة بالطالب تعتمد على حالة الجلسة والـ QR.

## 12. Authentication

### نظام دخول المشرف
- يعتمد على `AuthenticationService`.
- يقوم بإرسال بيانات الدخول إلى API.
- API يعيد `token` و`user`.
- `token` يخزن في `localStorage` أو `sessionStorage`.
- يُستخدم لتعريف المستخدم والتحقق من الصلاحية.

### Session
- كل تسجيل دخول يولد جلسة مستخدم محلياً.
- `UserSession` يحتوي على `token`, `userId`, `role`, `expiresAt`.

### Token
- يمكن أن يكون JWT أو رمز جلسة مُولَّد.
- يحتوي على مدة صلاحية.
- يُرسل في Header `Authorization: Bearer <token>`.

### Expiration
- مدة الجلسة المقترحة: 4 ساعات.
- يتم التحقق من الصلاحية قبل الوصول للصفحات الإدارية.
- عند انتهاء الصلاحية، يُعاد توجيه المستخدم إلى صفحة `login`.

### Permissions
- يتم تعيين صلاحيات حسب الدور.
- `roles`: `Admin`, `Supervisor`, `Assistant`, `Viewer`.
- `permissions` قائمة مفصلة لكل مستخدم.

## 13. Authorization

### صلاحيات الأدوار

#### Admin
- إضافة/تعديل/حذف طالب.
- إنشاء/إغلاق جلسه.
- تعديل الإعدادات.
- عرض وتصدير التقارير.
- إدارة المستخدمين.

#### Supervisor
- إدارة الطلاب.
- إنشاء/إغلاق جلسات.
- عرض التقارير.
- لا يغير إعدادات النظام الأساسية.

#### Assistant
- عرض الطلاب.
- عرض الجلسات.
- تسجيل الحضور بشكل محدود.
- لا يستطيع حذف أو تعديل إعدادات.

#### Viewer
- عرض لوحة المعلومات.
- عرض التقارير.
- لا يملك صلاحيات تعديل.

### أفعال محددة
- إضافة طالب: `Admin`, `Supervisor`.
- حذف طالب: `Admin`.
- إنشاء Session: `Admin`, `Supervisor`.
- إغلاق Session: `Admin`, `Supervisor`.
- تعديل Settings: `Admin`.
- تصدير Excel: `Admin`, `Supervisor`, `Viewer` (عرض فقط).

## 14. QR Design

### محتوى QR
QR يحمل JSON أو سلسلة مشفرة تتضمن:
- `sessionId`
- `subjectId`
- `subjectName`
- `date`
- `start`
- `end`
- `lat`
- `lng`
- `radius`
- `issuedAt`
- `expiresAt`

### طريقة التحقق
- يقرأ التطبيق بيانات الـ QR.
- يتحقق من صلاحية `expiresAt` و`date`.
- يتحقق من أن الجلسة مفتوحة وأن `sessionId` موجود.
- في المرحلة الأولى، يمكن استخدام Mock Data للـ QR.

### صلاحية QR
- صلاحية QR مرتبطة بوقت الجلسة.
- يمكن أن تنتهي بعد `end` أو بعد `issuedAt + 30 دقيقة`.
- لا يقبل بعد انتهاء التوقيت.

### حماية QR
- تشفير النص بطريقة بسيطة مثل Base64 + HMAC مقابل مفتاح سري.
- في المرحلة الأولى، يمكن احتواء البيانات كـ JSON مشفر.
- التحقق النهائي في الـ Apps Script يمنع التلاعب.

## 15. GPS Design

### طلب الصلاحية
- `GPSService.requestPermission()` يستعلم عن حالة الإذن.
- إذا رفض المستخدم، تعرض رسالة `offline` أو `denied`.

### قراءة الموقع
- `GPSService.getCurrentLocation()` يستخدم `navigator.geolocation.getCurrentPosition`.
- يدعم `enableHighAccuracy`, `timeout`, `maximumAge`.

### حساب المسافة
- `GPSService.calculateDistance(coordA, coordB)` يحسب المسافة بين الإحداثيات.
- يستخدم صيغة هافرزين.

### التحقق من النطاق
- `GPSService.isInsideRadius(coordA, coordB, radius)` يحدد إذا كان الطالب داخل النطاق المسموح.
- إذا تجاوز النطاق، يتجه المستخدم إلى `denied.html`.

### التعامل مع رفض GPS
- عرض تعليمات توضح كيف يمكن تمكين الموقع.
- تقديم خيار إعادة المحاولة.
- تفعيل تحميل بيانات Mock إذا كان النظام يعمل في وضع عرض تجريبي.

### التعامل مع الموقع الوهمي
- في المتصفح العادي لا يمكن الحماية التامة.
- التحقق النهائي في Apps Script يجب أن يحسب المسافة من موقع الجلسة، ويقارن بقيم `latitude` و`longitude`.
- يمكن تسجيل `accuracy` وتسجيلات لتحديد الموقع غير الموثوق.

## 16. Security

### Duplicate Protection
- قبل إرسال الحضور، يتحقق `AttendanceService.checkDuplicate` محلياً.
- في الـ API، يتحقق `registerAttendance` من وجود نفس `studentId` و`sessionId` و`date`.
- يعيد `409 Conflict` عند الازدواج.

### Request Validation
- تتحقق الخدمات من بناء الجسم المطلوب.
- كل حقل مطلوب يتم التحقق منه.
- ترجع أخطاء واضحة عند الغياب.

### Timestamp Validation
- التحقق من `createdAt`, `issuedAt`, `expiresAt`.
- رفض الطلبات القديمة أو المستقبلية بشكل غير منطقي.

### Replay Attack Protection
- لكل QR يحتوي على `issuedAt` و`expiresAt`.
- API يتحقق من حالة الجلسة الحالية.
- يمكن استخدام `nonce` مؤقت في المستقبل.

### Token Validation
- يتحقق `AuthenticationService` من صلاحية التوكن قبل كل طلب محمي.
- في Apps Script، يتم التحقق من `Authorization` header.

### Input Validation
- التحقق من `string length`, `number range`, `required fields`.
- منع إدخال نصوص خبيثة.

### Rate Limiting
- من الممكن تنفيذ الحدّ على مستوى Apps Script بتسجيل عدد الطلبات لكل مصدر.
- على الأقل يمكن تقييد طلبات الحضور المتكررة داخل 10 ثوان.

### Logging
- يتم تسجيل كل حدث مهم في `Logs` sheet.
- يسجل `action`, `user`, `result`, `description`.

### Audit Trail
- `Logs` تتيح تتبع من قام بأي عملية ومتى.
- يجب أن تكون كل عمليات تسجيل الحضور، إنشاء جلسة، تعديل إعدادات موثقة.

### Error Handling
- استخدام `status` و`error` في JSON.
- عرض رسائل واضحة في واجهة المستخدم.
- عدم كشف تفاصيل النظام الداخلية.

## 17. User Flow

### مسار الطالب من فتح QR حتى النجاح
1. الطالب يمسح رمز QR.
2. يفتح المتصفح رابط النظام.
3. الصفحة تعرض معلومات الجلسة (Subject, Time, Location).
4. يطلب التطبيق إذن استخدام GPS.
5. إذا رفض، يعرض `offline.html` أو `denied.html`.
6. إذا قبل، يُحدد الموقع الحالي.
7. يُحسب المسافة من موقع الجلسة.
8. إذا في النطاق، يعرض نموذج إدخال `studentId`.
9. الطالب يدخل الرقم ويضغط تسجيل.
10. يتم التحقق من التكرار محلياً.
11. يتم إرسال الطلب إلى API.
12. إذا نجح التحقق في الخلفية، يذهب إلى `success.html`.
13. إذا كان مكررًا، يذهب إلى `duplicate.html`.
14. إذا خارج النطاق، يذهب إلى `denied.html`.
15. إذا حدث خطأ، يذهب إلى `error.html`.

## 18. Admin Flow

### رحلة المشرف من Login حتى Export Excel
1. المشرف يفتح `/admin/login.html`.
2. يدخل اسم المستخدم وكلمة المرور.
3. يتم التحقق عبر API.
4. إذا نجح، يُخزن التوكن محلياً ويُحول إلى `/admin/dashboard.html`.
5. يعرض `dashboard` ملخصات الحضور.
6. يمكن الانتقال إلى `students`, `sessions`, `reports`, `settings`, `logs`.
7. في `students`, يمكن البحث، الإضافة، التعديل، والحذف.
8. في `sessions`, يمكن إنشاء جلسة جديدة، عرض الجلسات المفتوحة والمغلقة، وإغلاق جلسة.
9. في `reports`, يمكن تحميل تقارير يومية أو أسبوعية أو شهرية.
10. في `settings`, يمكن ضبط موقع الحضور، نصف القطر، وساعات التسجيل.
11. في `logs`, يمكن مراجعة سجل العمليات.
12. عند الرغبة في حفظ نسخة خارجية، يستخدم زر `Export` لصياغة Excel/CSV.

## 19. Testing Plan

### Unit Test
- اختبار وظائف `validation.js`
- اختبار حسابات `GPSService.calculateDistance`
- اختبار `StorageService`.
- اختبار `QRService.validateQRCode`

### Integration Test
- اختبار تسلسل `attendance.js` مع `AttendanceService` و`GPSService`.
- اختبار `auth.js` مع `AuthenticationService`.
- اختبار `dashboard.js` مع `DashboardService`.

### UI Test
- اختبار عرض النموذج.
- اختبار التنقل في صفحات الطالب.
- اختبار عرض الأخطاء.
- اختبار لوحة المشرف.

### GPS Test
- اختبار رفض الإذن.
- اختبار قبول الإذن.
- اختبار الحالة خارج النطاق.
- اختبار الحساب الصحيح للمسافة.

### API Test
- اختبار `POST /login`.
- اختبار `POST /attendance` مع بيانات صحيحة وخاطئة.
- اختبار `GET /student`.
- اختبار `GET /dashboard`.

### Performance Test
- قياس وقت تحميل صفحة `dashboard`.
- قياس وقت استجابة API.
- اختبار عدد السجلات في `Attendance`.

### Edge Cases
- تسجيل نفس الطالب مرتين.
- QR منتهٍ.
- GPS غير متاح.
- جلسة مغلقة.
- طالب غير موجود.

## 20. Deployment

### GitHub Pages
- استضافة الواجهة الثابتة من المستودع.
- دعم HTTPS تلقائياً.
- نشر من الفرع الرئيسي أو `gh-pages`.

### Google Apps Script
- نشر المشروع كـ Web App.
- تحديد من يمكنه الوصول: "Anyone, even anonymous" أو حسب سياسة الأمان.
- تحديث الـ `apiUrl` في `config.js` إلى رابط النشر.

### Google Sheets
- إنشاء جدول بيانات جديد.
- مشاركة الملف مع حساب الـ Apps Script.
- تنظيم الأوراق المذكورة.

### Custom Domain
- يمكن ربط GitHub Pages بنطاق مخصص.
- تأكد من SSL مفعل.

### HTTPS
- GitHub Pages يوفر HTTPS.
- يفضل استخدام `https://` عند استدعاء Google Apps Script.

### Versioning
- استخدم Git tags لنسخ الإصدارات.
- سجل التغييرات في `docs/changelog.md`.

### Backup
- حفظ نسخة من Google Sheets بانتظام.
- تسجيل بيانات `Logs` يمكن أن يساعد على الاسترداد.

### Recovery
- في حالة خطأ، إعادة نشر نسخة مستقرة.
- الاحتفاظ بنسخ سابقة من ملف Google Sheets.

## 21. Roadmap

### Version 1.0
- واجهة الطالب الأساسية.
- لوحة المشرف الأساسية.
- تسجيل الحضور بـ QR + GPS Mock.
- إعداد Google Sheets وGoogle Apps Script الأولي.
- تسجيل الجلسات الأساسية.

### Version 1.5
- ربط البيانات الحقيقية بـ Google Sheets.
- واجهة مشرف كاملة مع إدارة الطلاب والجلسات.
- تصدير CSV/Excel.
- تحسين أمان التوكن.

### Version 2.0
- دعم أكثر من جامعة/كلية/قسم.
- دعم QR مشفر وصلاحيات أقوى.
- دعم خرائط تفاعلية (Google Maps أو Leaflet).
- تقارير متقدمة ومخططات ديناميكية.

### Version 3.0
- دعم تسجيل دخول الطلاب الشخصي.
- لوحة تحكم قابلة للتخصيص.
- نظام إشعارات متقدم.
- تكامل مع أنظمة ERP خارجية.
- دعم التصديق المتعدد العوامل.

## ملاحظات تحسينية
- التصميم الحالي ممتاز كنقطة انطلاق، لكن إضافة `services` و`state` يعمل على فصل المسؤوليات.
- الهيكل المقترح يدعم قابلية التوسع لأكثر من جامعة وقسم ومادة بدون إعادة هيكلة.
- يجب أن تظل الواجهة تعمل مبدئياً مع Mock Data قبل الربط الحقيقي بالـ API.

---

> بعد مراجعتك لهذه الوثيقة، أستطيع البدء في تنفيذ المرحلة الأولى: بناء واجهة الطالب باستخدام Mock Data، ثم اللوحة الإدارية، ثم الربط بالـ API لاحقًا.

## 22. Design Review (Engineer Audit)

هذا القسم يضم نتائج مراجعة هندسية نقدية للوثيقة، التعديلات التي نُفّذت على النص الأصلي، والملاحظات التي يجب أخذها بعين الاعتبار قبل البدء بالبرمجة.

22.1 ملخص نقاط المراجعة
- توحيد المفاتيح الأساسية: تم تعديل مراجع الحقول لتستخدم معرفات داخلية (`ID`) كعلاقات مرجعية بدلاً من الاعتماد على `StudentID` المطبوع الذي قد يتغير أو يتكرر. يعني ذلك أن `Attendance.StudentID` يشير الآن إلى `Students.ID` وليس `Students.StudentID`.
- توسيع واجهات الـ API: أضفت توصية واضحة لواجهات إضافية (PUT/DELETE) للكيانات الأساسية (`students`, `sessions`, `subjects`, `settings`, `admins`) ولتتضمن نماذج استجابة خطأ موحدة ومثال JSON لكل حالة.
- فصل المسؤوليات: وضّحت حدود واضحة بين `services` و`modules` لتفادي التكرار الوظيفي، مع أمثلة على وظائف كل طبقة.
- قيود Google Sheets: أضفت تحذيرًا تفصيليًا حول حدود Google Sheets وApps Script (حصص الاستخدام، حجم الأوراق، زمن الاستجابة) واقتراحات للتخفيف (تقسيم ملفات، تخزين مؤقت، دفعات bulk، وتحويل للتخزين الخارجي إذا لزم).
- أمان QR وReplay: أوصيت بإضافة توقيع HMAC على محتوى QR وحقن `nonce` وختم زمني؛ وتوثيق تحقق نهائي في Apps Script.
- GPS spoofing: أضفت خطوات تحقق إضافية (تسجيل `accuracy`, reject if accuracy > threshold, record speed/jitter) وتوضيح أن الحماية ليست مطلقة على المتصفح.
- السياسات المتعلقة بالتوكن: أوصيت بتقليل الاعتماد على `localStorage` وحثّ استخدام توكنات قصيرة العمر مع تحقق من الخادم، وتوثيق سيناريوهات لتجديد التوكن وإبطال الصلاحية.

22.2 التعديلات الفعلية على الوثيقة
- أضفت هذا القسم `22. Design Review (Engineer Audit)` مع نقاط المراجعة والتوصيات.
- حدثت مرجع العلاقات لتوضيح أن `Attendance.StudentID -> Students.ID` (لم يكن موحداً صراحة في النسخة الأصلية).
- أوصيت بإضافة Endpoints إضافية التالية (لم تكن مذكورة صراحة):
  - `PUT /students/:id` — تحديث طالب
  - `DELETE /students/:id` — حذف طالب
  - `GET /sessions` — جلب قائمة الجلسات مع فلترة
  - `PUT /session/:id` — تعديل Session
  - `DELETE /session/:id` — حذف Session
  - `GET /subjects`, `GET /departments`, `GET /faculties`, `GET /admins`
  - `POST /attendance/batch` — (اختياري) إرسال دفعات تسجيل للحالات الأوفلاين

22.3 إجابات الفحص الهندسي التفصيلي

1) هل يوجد أي تعارض بين أجزاء التصميم؟
- الملاحظات: لم تكن هناك تناقضات كبيرة، لكن كان احتمال لببهن حول أي حقل يُستخدم كمرجع (StudentID vs ID). عُدّل النص لتوحيد المرجع على حقول `ID` داخلية.

2) هل جميع الـ Data Models مترابطة بشكل صحيح؟
- الملاحظات: تم توضيح العلاقات وتعزيزها في قسم الـ Database. الآن `Attendance.StudentID -> Students.ID` و`Sessions.SubjectID -> Subjects.ID` وهكذا.

3) هل جميع الـ API Endpoints كافية ولا يوجد نقص؟
- الملاحظات: وثيقة النسخة الأصلية تشمل معظم العمليات الأساسية، لكنها افتقرت لصيغ تعديل وحذف (`PUT`/`DELETE`) وواجهات للكيانات المرجعية مثل `subjects`, `departments`, `faculties`, و`admins`. هذه أُضيفت بالتوصية أعلاه.

4) هل هناك تكرار في المسؤوليات بين Services وModules؟
- الملاحظات: هناك نقاط تداخل محتملة إذا لم تُحكم الحدود بينهما. أنصح بتالي: `services` يجب أن تكون خالية من DOM أو UI ومنطق الحدث، بينما `modules` تستعمل `services` وتتعامل مع DOM/Forms والتدفق.

5) هل تصميم Google Sheets قابل للتوسع؟
- الملاحظات: التصميم منطقي لمشروعات صغيرة ومتوسطة، لكن Google Sheets له حدود (عدد الخلايا، وقت تنفيذ Apps Script، quotas). أوصينا بتقنيات تقليل الحمل: sharding (ملفات منفصلة لكل جامعة)، أرشفة قديمة، تخزين مؤقت، عمليات Batch، واستخدام BigQuery/Cloud SQL لاحقًا إذا نما النظام.

6) هل Architecture يحقق Separation of Concerns وSOLID؟
- الملاحظات: التصميم المعدّل يحقق فصلًا معقولاً بين الطبقات. للحفاظ على SOLID تطبّق: Services منفصلة، Modules خفيفة، نماذج DTO منفصلة، وواجهات API مسؤولة عن قواعد الأعمال النهائية.

7) هل يوجد أي Bottleneck أو نقطة ضعف مستقبلية؟
- الملاحظات: نعم: Apps Script + Google Sheets نقطة توافق ومحدد أداء (throttling/quotas). أيضًا كتابة التوكنات في `localStorage` قد يكون مخاطرة أمنية. وثّقنا سبل التخفيف.

8) هل يمكن دعم أكثر من جامعة/كلية/مادة/Session في نفس الوقت؟
- الملاحظات: نعم، مع شروط: استخدمنا معرفات عامة (IDs) وربط الكيانات، وأوصينا بشق البيانات (sharding) إذا ازداد الحجم، لذلك التصميم يدعم التوسع متعدد المؤسسات.

9) هل يوجد أي مشكلة أمنية أو منطقية؟
- الملاحظات: عدة نقاط أمنية نبهنا لها: توثيق التوكنات، تخزين آمن، توقيع QR، التحقق النهائي في الخلفية، قيود على معدل الطلبات، ومعاملات idempotency.

10) اقتراحات تحسين قبل التنفيذ
- طبق HMAC على QR واحتفظ بالمفتاح السري في Apps Script.
- استخدم `ID` داخلية كمرجع في Google Sheets.
- أضف `PUT/DELETE` endpoints و`GET` للكيانات المرجعية.
- سجل `accuracy`, `speed`, و`timestamp` مع كل حضور للتحقق من الموقع.
- صمم `POST /attendance/batch` لحالات الاتصال الأوفلاين.
- ضع خطة للتعامل مع حصص Apps Script وتجزئة الملفات.

22.4 إجراءات تالية
- بعد موافقتك، سأُحدّث بقية الوثائق (`docs/api.md`) لتتوافق مع قائمة Endpoints النهائية وأدرج نماذج طلب/استجابة مفصلة لكل Endpoint.
- ثم أبدأ في المرحلة 2 (واجهة الطالب مع Mock Data) فقط بعد موافقتك.
