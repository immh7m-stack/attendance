# Google Sheets Schema

## Overview
هذا المستند يحدد هيكل أوراق Google Sheets المطلوبة لنظام Smart Attendance System، بما يتوافق مع طبقة الـ API الحالية في المشروع ومع منطق الحضور والجلسات.

> يحتوي التصميم على 7 أوراق رئيسية: 6 جداول أساسية للنظام بالإضافة إلى جدول `student_sessions` لدعم جلسات الطلاب اليومية.

## Conventions
- استخدم الصف الأول كـ header row.
- استخدم أسماء الأعمدة بصيغة snake_case.
- استخدم قيم تاريخ ووقت بصيغة ISO موحدة مثل `YYYY-MM-DD` و`YYYY-MM-DDTHH:mm:ssZ`.
- احفظ الأعمدة الأساسية في كل ورقة مع `id` كـ primary key داخلي.
- لا تقم بتحرير ورقة `admins` من الواجهة، بل من إعدادات Google Sheets فقط.

## Sheet 1: settings
الغرض: تخزين الإعدادات العامة للنظام مثل نصف القطر الافتراضي، اسم المؤسسة، أو الخيارات المتغيرة.

### Columns
- `id` (String, Primary Key)
- `key` (String, Unique)
- `value` (String)
- `description` (String)
- `updated_at` (Datetime)

### Sample header row
```text
id,key,value,description,updated_at
```

---

## Sheet 2: students
الغرض: تخزين بيانات الطلاب المعتمدين في النظام.

### Columns
- `id` (String, Primary Key)
- `student_id` (String, Unique)
- `name` (String)
- `department` (String)
- `faculty` (String)
- `level` (String)
- `phone` (String)
- `email` (String)
- `status` (String)
- `created_at` (Datetime)
- `updated_at` (Datetime)

### Sample header row
```text
id,student_id,name,department,faculty,level,phone,email,status,created_at,updated_at
```

### Validation rules
- `student_id` مطلوب ومميز.
- `name` و`department` و`level` مطلوبة.
- `status` يجب أن يكون أحد: `active`, `inactive`, `suspended`.

---

## Sheet 3: sessions
الغرض: تخزين الجلسات المفتوحة أو المغلقة وتفاصيل الموقع الجغرافي.

### Columns
- `id` (String, Primary Key)
- `session_id` (String, Unique)
- `subject_name` (String)
- `subject_code` (String)
- `date` (Date)
- `start_time` (Time)
- `end_time` (Time)
- `room` (String)
- `latitude` (Number)
- `longitude` (Number)
- `radius` (Number)
- `status` (String)
- `created_at` (Datetime)
- `updated_at` (Datetime)

### Sample header row
```text
id,session_id,subject_name,subject_code,date,start_time,end_time,room,latitude,longitude,radius,status,created_at,updated_at
```

### Validation rules
- `session_id` مطلوب ومميز.
- `subject_name` و`date` و`start_time` و`end_time` مطلوبة.
- `latitude`, `longitude`, `radius` يجب أن تكون أرقامًا.
- `status` يجب أن يكون `open` أو `closed`.

---

## Sheet 4: attendance
الغرض: تخزين سجلات الحضور الفعلية مع معلومات الموقع والوقت.

### Columns
- `id` (String, Primary Key)
- `student_id` (String)
- `student_name` (String)
- `session_id` (String)
- `department` (String)
- `level` (String)
- `date` (Date)
- `time` (Time)
- `status` (String)
- `distance` (Number)
- `latitude` (Number)
- `longitude` (Number)
- `device` (String)
- `browser` (String)
- `notes` (String)
- `created_at` (Datetime)

### Sample header row
```text
id,student_id,student_name,session_id,department,level,date,time,status,distance,latitude,longitude,device,browser,notes,created_at
```

### Validation rules
- `student_id` و`session_id` و`date` و`time` مطلوبة.
- `status` يجب أن يكون `present`, `late`, أو `absent`.
- يجب منع التسجيل المكرر لنفس الطالب ونفس الجلسة في نفس اليوم.

---

## Sheet 5: logs
الغرض: تسجيل العمليات الإدارية مثل تسجيل الدخول أو إنشاء الجلسات أو التغييرات المهمة.

### Columns
- `id` (String, Primary Key)
- `actor` (String)
- `action` (String)
- `target` (String)
- `result` (String)
- `timestamp` (Datetime)
- `date` (Datetime, optional alias for `timestamp`)
- `details` (String)
- `description` (String, optional alias for `details`)
- `user` (String, optional alias for `actor`)

### Sample header row
```text
id,actor,action,target,result,timestamp,details
```

### Notes
- الواجهة تدعم أيضًا الأعمدة البديلة `date` و`description` و`user` لمطابقة بيانات السجل الموجودة حالياً.
- إذا كنت تستخدم `timestamp`، فسيتم عرضها كالتاريخ في واجهة السجلات.

---

## Sheet 6: admins
الغرض: تخزين حسابات المشرفين المؤهلة للوصول إلى لوحة الإدارة.

### Columns
- `id` (String, Primary Key)
- `username` (String, Unique)
- `password_hash` (String)
- `password` (String, Optional)
- `role` (String)
- `email` (String)
- `status` (String)
- `last_login` (Datetime)
- `created_at` (Datetime)
- `updated_at` (Datetime)

### Sample header row
```text
id,username,password_hash,password,role,email,status,last_login,created_at,updated_at
```

### Validation rules
- `username` مطلوب ومميز.
- `password_hash` مطلوب ما لم يكن هناك عمود `password` صالح.
- `password` يُقبل كبديل مؤقت أو للتوافق، لكن الأفضل استخدام `password_hash`.
- `role` يجب أن يكون أحد: `Admin`, `Super Admin`, `Viewer`.

---

## Sheet 7: student_sessions
الغرض: تخزين بيانات جلسات الطالب اليومية وحالة تسجيل الدخول.

### Columns
- `id` (String, Primary Key)
- `student_id` (String)
- `student_name` (String)
- `session_token` (String, Unique)
- `login_date` (Date)
- `login_time` (Time)
- `expires_at` (Datetime)
- `latitude` (Number)
- `longitude` (Number)
- `radius` (Number)
- `device_fingerprint` (String)
- `public_ip` (String)
- `user_agent` (String)
- `active` (String)
- `created_at` (Datetime)
- `updated_at` (Datetime)

### Sample header row
```text
id,student_id,student_name,session_token,login_date,login_time,expires_at,latitude,longitude,radius,device_fingerprint,public_ip,user_agent,active,created_at,updated_at
```

### Validation rules
- `student_id` و`session_token` و`login_date` مطلوبة.
- `active` يجب أن يكون `true` أو `false`.
- `session_token` يجب أن يكون فريدًا لكل جلسة.
- يجب منع استخدام نفس `device_fingerprint` لأكثر من طالب واحد في نفس اليوم إذا سمحت الإعدادات بمنع الأجهزة المتعددة.

---

## Relationships
- `attendance.student_id` → `students.student_id`
- `attendance.session_id` → `sessions.session_id`
- `sessions.session_id` يُستخدم في التحقق من QR والـ attendance
- `admins.role` يحدد صلاحيات لوحة الإدارة

## Recommended indexes / filters
- `students.student_id`
- `students.status`
- `sessions.session_id`
- `sessions.status`
- `attendance.student_id`
- `attendance.session_id`
- `attendance.date`
- `settings.key`

## Notes
- يجب أن تكون جميع `id` قيمًا فريدة مثل UUID أو سلسلة زمنية.
- من الأفضل استخدام تنسيق موحد للتواريخ والوقت عبر كل الأوراق.
- يفضّل حماية ورقة `admins` من التعديل غير المصرح به.
