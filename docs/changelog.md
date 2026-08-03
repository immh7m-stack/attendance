# Changelog

## v1.0.0-alpha (2026-08-01)

### Added
- إنشاء هيكل مشروع أساسي للـ Smart Attendance System.
- إضافة صفحات الطالب والمشرف الأساسية.
- تطبيق تصميم موحد عبر CSS shared theme.
- إضافة ملفات Mock Data للطلاب، الجلسات، الحضور، التقارير، والإعدادات.
- إنشاء طبقة خدمات أولية وملفات JS modules كـ foundation Sprint 0.
- توثيق معماري أولي في docs/architecture.md.
- توثيق واجهات API في docs/api.md.
- توثيق مواصفات واجهة المستخدم في docs/UI_Specification.md.

### Changed
- توحيد الصفحات الرئيسية والطالبية والإدارية حول نظام تصميم مشترك.
- تحديث صفحات الخطأ والنتائج لتتوافق مع الواجهة الموحدة.

### Notes
- هذه النسخة تمثل Sprint 0 Foundation فقط.
- لا توجد yet integration حقيقية مع Google Apps Script أو Google Sheets.
- لا توجد features business logic كاملة بعد.

## v1.0.1-sprint0.5 (2026-08-01)

### Added
- طبقة Mock API موحدة مع دعم التحقق من الصحة، التصفية، والـ pagination.
- خدمات جديدة للطلاب، الجلسات، التقارير، الإعدادات، والمصادقة.
- إدارة حالة مركزية للـ app/student/admin/session/attendance.

### Changed
- ربط الوحدات الأساسية بالخدمات بدلاً من المنطق التجريبي المباشر.
- تحسين العرض العام للصفحات الرئيسية والطالبية والإدارية مع loader وتنسيق مشترك.

### Notes
- هذه التغييرات تهدف إلى تحسين جودة foundation دون إضافة features جديدة أو backend حقيقي.
