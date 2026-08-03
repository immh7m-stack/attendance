# API Provider Specification

## Overview
هذا المستند يحدد طريقة عمل طبقة Provider داخل التطبيق بحيث تدعم حاليًا الـ Mock Provider وتكون جاهزة للربط مع Google Apps Script لاحقًا دون تغيير كبير في الواجهة أو الخدمات.

## Provider Contract
كل Provider يجب أن يصدّر كائنًا يحتوي على الطريقتين التاليتين:

- `get(endpoint, params)`
- `post(endpoint, body)`

### Method Signatures
- `get(endpoint: string, params: object): Promise<object>`
- `post(endpoint: string, body: object): Promise<object>`

## Current Integration Points
الواجهة الحالية تستدعي الخدمات التالية عبر adapter:
- [assets/js/services/authService.js](assets/js/services/authService.js)
- [assets/js/services/studentService.js](assets/js/services/studentService.js)
- [assets/js/services/sessionService.js](assets/js/services/sessionService.js)
- [assets/js/services/providers/mockApiProvider.js](assets/js/services/providers/mockApiProvider.js)

لذلك يجب أن يكون كل Provider متوافقًا مع نفس أسماء الـ endpoints المعتمدة في التطبيق.

## Supported Endpoints

### Auth
- `login` → POST
- `logout` → POST

### Students
- `students` → GET/POST
- `student` → GET

### Sessions
- `sessions` → GET/POST
- `sessions/active` → GET
- `sessions/close` → POST

### Attendance
- `attendance` → GET/POST
- `attendance/batch` → POST

### Reports
- `reports/daily` → GET
- `reports/weekly` → GET
- `reports/monthly` → GET

### Settings
- `settings` → GET/POST

## Response Shape
كل Provider يجب أن يعيد الاستجابة بنفس الشكل المتوقع من الواجهة:

```json
{
  "status": "success" | "error",
  "data": {},
  "meta": {},
  "error": {}
}
```

## Error Contract
يجب أن تعيد جميع Providers أخطاء موحّدة مثل:
- `validation_error`
- `invalid_credentials`
- `not_found`
- `duplicate_attendance`
- `session_closed`
- `out_of_range`
- `unauthorized`
- `timeout`
- `offline`
- `internal_error`

## Provider Responsibilities
### Mock Provider
- استخدام بيانات محاكاة من [assets/js/services/mockApi.js](assets/js/services/mockApi.js)
- دعم التصفية والـ pagination
- توفير سلوك مشابه لبيئة الإنتاج في حالات النجاح والخطأ

### Google Apps Script Provider
- تحويل الطلبات إلى `action=<endpoint>` أو إلى REST endpoint جديد
- إرسال الرؤوس اللازمة مثل `Authorization: Bearer <token>`
- ترجمة نتائج Apps Script إلى نفس الشكل الموحد

## Provider Selection
يتم اختيار Provider من خلال [assets/js/config.js](assets/js/config.js) باستخدام `APP_CONFIG.apiProvider`.

القيم المقترحة:
- `mock`
- `google`
- `future`

## Implementation Notes
- لا حاجة لتعديل الخدمات أو الوحدات عند إضافة Provider جديد.
- يجب أن يبقى التوافق مع الواجهة الحالية قائمًا.
- عند ربط Google Apps Script، يفضّل الحفاظ على نفس أسماء الـ endpoints في الواجهة الحالية لتقليل التغييرات.
