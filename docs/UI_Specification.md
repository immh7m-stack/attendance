# UI Specification

هذا المستند يصف واجهات المستخدم لكل صفحة من صفحات المشروع، يحدد الهدف، المكونات، الحقول، حالات التحميل، النجاح، الخطأ، والخطوط العامة للتجاوب. يستخدم كمرجع قبل كتابة أي HTML/CSS/JS.

ملاحظة: الوثيقة تركز على النسخة 1.0 — بدون HMAC في QR، بدون Refresh Tokens، وبدون Offline Sync.

---

## تنسيق عام
- لغة الواجهة: العربية (RTL) مع دعم LTR عند الحاجة.
- نظام الشبكات: responsive باستخدام CSS grid/flex.
- خطوط الأزرار والحقول يجب أن تكون قابلة للوصول (تفصيل الألوان في نظام التصميم لاحقًا).

---

## صفحات الطالب

### 1) Student - Index (student/index.html)
- Purpose: استقبال الطالب بعد مسح الـ QR، عرض معلومات الجلسة، طلب إذن GPS، وإتمام عملية التسجيل.
- Components:
  - Header: عنوان الجلسة (subjectName)
  - SessionCard: التاريخ، الوقت، الغرفة، المسافة المسموح بها
  - LocationStatus: حالة إذن الموقع (idle, requesting, allowed, denied)
  - Form: حقل `studentId` وزر `تسجيل` (CTA)
  - Loader/Spinner
  - Toast area

- Wireframe (simplified):

  [Header]
  [SessionCard]
  [LocationStatus][Button: Retry Location]
  [Form -> Input: studentId] [Button: تسجيل]
  [Footer / Support link]

- Fields & behavior:
  - `studentId` (required) — numeric/alpha validation
  - When page loads:
    - If QR data present, display session summary.
    - Auto-call `GPSService.requestPermission()` and show `LocationStatus`.
    - If permission denied -> show link to `denied.html` with explanation.
  - On submit:
    - Validate `studentId` client-side.
    - Show loader, perform duplicate check locally, then POST `/attendance`.

- Loading states:
  - Location request: show spinner and message "جاري تحديد الموقع..."
  - Submission: disabled inputs + spinner overlay

- Success state: redirect to `success.html` with a brief message and check-in details.
- Error states:
  - Duplicate -> redirect `duplicate.html` with details
  - Out of range -> redirect `denied.html`
  - Network error -> redirect `offline.html` or show inline error and allow retry

- Responsive:
  - Mobile: single-column, large CTA
  - Desktop: two-column session info + form

### 2) Success / Denied / Duplicate / Offline / Error pages
- Purpose: إعلام المستخدم بنتيجة محاولة التسجيل.
- Components (common): icon, headline, message, action button (العودة/المحاولة مجدداً), contact/support link.
- Variants:
  - `success.html`: show `studentName`, `sessionName`, `time`, `distance`.
  - `duplicate.html`: show وقت التسجيل السابق و إرشادات الاتصال.
  - `denied.html`: show سبب الرفض (خارج النطاق أو جلسة مغلقة) + زر `طلب مساعدة`.
  - `offline.html`: "لا يوجد اتصال" مع زر `أعد المحاولة`.
  - `error.html`: generic error + retry

---

## صفحات المشرف (Admin)

الأساس: جميع صفحات المشرف تستخدم شبكة ثانوية (sidebar navigation)، وحماية الوصول عبر `AuthenticationService`.

### 3) Admin - Login (admin/login.html)
- Purpose: مصادقة المشرف للولوج إلى لوحة التحكم.
- Components:
  - Form: `username`, `password`, `remember me` (اختياري)
  - Error area
  - CTA: `تسجيل الدخول`

- Validation:
  - required fields
  - show `invalid credentials` message عند 401

- Loading: disable fields + spinner on button

### 4) Admin - Dashboard (admin/dashboard.html)
- Purpose: عرض ملخصات سريعة (cards) وإحصائيات، وروابط سريعة لإدارة الطلاب والجلسات.
- Components:
  - Navbar (top) with user menu
  - Sidebar
  - DashboardCards: `totalStudents`, `activeSessions`, `presentToday`, `absentToday`
  - RecentCheckIns table (paginated)
  - QuickActions: Open Session, Export Report

- Loading: skeleton cards and table rows

### 5) Admin - Students (admin/students.html)
- Purpose: إدارة طلاب المؤسسة (CRUD)
- Components:
  - Search & Filters (department, level, status)
  - Table columns: `studentId`, `name`, `department`, `level`, `status`, `actions`
  - Actions: Edit (opens modal), Delete (confirm dialog), View
  - Add Student button -> modal form

- Forms fields: as in `models.Student`
- States: loading, empty state (no students), validation errors

### 6) Admin - Sessions (admin/sessions.html)
- Purpose: إدارة جلسات، فتح/إغلاق جلسة
- Components:
  - List/Table of sessions with status (open/closed)
  - Create Session form/modal: `subject`, `date`, `start`, `end`, `location (lat,lng)`, `radius`, `room`
  - Action: Open / Close / Edit / Delete

### 7) Admin - Attendance (admin/attendance.html)
- Purpose: عرض سجلات الحضور، فلترة حسب جلسة/تاريخ/طالب
- Components:
  - Filters: sessionId, date range, studentId
  - Table: `time`, `studentId`, `studentName`, `distance`, `status`, `device`, `browser`
  - Export button (CSV)

### 8) Admin - Reports (admin/reports.html)
- Purpose: توليد وتحميل التقارير
- Components:
  - Controls: type (daily/weekly/monthly), date range, subject filter
  - Chart area (placeholder) + table
  - Export options

### 9) Admin - Settings (admin/settings.html)
- Purpose: ضبط إعدادات الحضور (default location, radius, times)
- Components: form with fields from `models.Settings` and Save button

### 10) Admin - Logs (admin/logs.html)
- Purpose: مراجعة سجل الأحداث
- Components: table `date,time,action,user,result,description` + filters

### 11) Admin - Profile (admin/profile.html)
- Purpose: عرض بيانات المشرف وتغيير كلمة المرور
- Components: profile card + Change Password form

---

## ملاحظات التفاعل (Interaction Notes)
- أثناء كل عملية حرِص على:
  - إظهار Loaders وDisable للأزرار لمنع الضعط المتكرر
  - إظهار رسائل خطأ صريحة ومقترحات تصحيح
  - الحفاظ على الوصولية (contrast, keyboard)

## التنقل بين الصفحات
- الربط البسيط عبر روابط HTML (GitHub Pages) أو عبر `router.js` عند استخدام SPA-like navigation. كل صفحة تحفظ حالة عرض مختصرة إن لزم.

## Responsive Design
- Mobile-first: جميع الأزرار كبيرة كفاية للمس.
- Desktop: sidebar دائم، mobile: sidebar كـ off-canvas menu.

## Accessibility
- جميع الحقول تحتوي `label` مرجعي و`aria-*` مناسب.
- Use proper focus order for modal dialogs.

---

## Appendix: Wireframe Examples (ASCII)

- Student Index (mobile)

  [Subject Title]
  [Session: date | time | room]
  [Location: status]
  [Input: studentId]
  [Button: تسجيل]

- Admin Dashboard (desktop)

  [Navbar]
  [Sidebar] | [Cards Row]
            | [Recent Checkins Table]

---

بعد الموافقة على هذه الوثائق، سأبدأ بتحويلها إلى خطة تنفيذية مفصلة للـ Phase 2 (بناء واجهة الطالب مع Mock Data). لا أكتب أي HTML/CSS/JS حتى تأمر بالمواصلة.
