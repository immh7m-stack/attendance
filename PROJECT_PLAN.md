# Project Plan

## الهدف
تنفيذ الربط النهائي بين الموقع الثابت على GitHub Pages وGoogle Apps Script كـ backend وGoogle Sheets كمخزن بيانات.

## الحالة الحالية
- الواجهة الأمامية موجودة وتعمل على GitHub Pages.
- يوجد كود جاهز في `google-apps-script/Code.gs`.
- `assets/js/config.js` يحتوي على إعداد `apiProvider: 'google'` و`googleScriptUrl` placeholder.
- تم إعداد بنية API provider في `assets/js/services/apiAdapter.js` و`assets/js/services/providers/googleApiProvider.js`.

## خطة العمل

### 1. إعداد Google Sheets
1. افتح Google Sheet جديد أو استخدم الرابط الموجود.
2. أنشئ الأوراق التالية:
   - `settings`
   - `students`
   - `sessions`
   - `attendance`
   - `logs`
   - `admins`
3. أضف الأعمدة الموصى بها لكل ورقة (من `INTEGRATION_PLAN.md`).
4. املأ بيانات اختبارية بسيطة على الأقل لطلاب وجلسات.

### 2. إعداد Google Apps Script
1. افتح `Extensions > Apps Script` داخل Google Sheet.
2. أنشئ مشروع Apps Script جديد.
3. انسخ الكود من `google-apps-script/Code.gs` إلى السكربت.
4. في `Project Settings` أو `PropertiesService`، أضف خاصية:
   - `SPREADSHEET_ID` → معرف المستند من رابط Google Sheets.
5. اضبط `appsscript.json` ليكون:
   ```json
   {
     "timeZone": "Africa/Cairo",
     "dependencies": {},
     "exceptionLogging": "STACKDRIVER",
     "runtimeVersion": "V8",
     "webapp": {
       "access": "ANYONE_ANONYMOUS",
       "executeAs": "USER_DEPLOYING"
     }
   }
   ```
6. انشر المشروع كـ Web App (`Deploy > New deployment > Web app`).
7. انسخ رابط `https://script.google.com/macros/s/<DEPLOY_ID>/exec`.

### 3. تحديث إعدادات الواجهة
1. افتح `assets/js/config.js`.
2. عدّل `googleScriptUrl` و`apiUrl` إلى الرابط الفعلي الناتج من نشر Apps Script.
3. تأكد أن `apiProvider` هو `google`.

### 4. اختبار محلي
1. شغّل خادم محلي بسيط داخل المشروع:
   - `python3 -m http.server 8000`
2. افتح المتصفح إلى `http://127.0.0.1:8000`.
3. جرّب الوظائف التالية:
   - طلب الطلاب
   - طلب الجلسات
   - تسجيل الحضور
   - صلاحية الجلسة المفتوحة
4. راقب الاستجابات أن تعود بصيغة:
   - `status: 'success'`
   - `status: 'error'`

### 5. نشر GitHub Pages
1. تأكد من أن الموقع يعمل محلياً.
2. ادفع التغييرات إلى `main`.
3. تأكد من GitHub Pages في الإعدادات تستخدم الفرع الصحيح.
4. تحقق من:
   - `https://immh7m-stack.github.io/attendance/`
   - `https://immh7m-stack.github.io/attendance/admin/`
   - `https://immh7m-stack.github.io/attendance/qr.html`

## مخرجات متوقعة
- موقع ثابت يعمل على GitHub Pages.
- Google Apps Script يعمل كواجهة API حقيقية.
- Google Sheets يخزن الطلاب والجلسات والحضور.
- الواجهة تُرسل الطلبات إلى `googleApiProvider` بنجاح.

## ملاحظات
- إذا ظهرت مشكلة في `googleApiProvider`، تحقق من أن الرابط مع `exec` صحيح.
- إذا ظهرت مشكلة في بناء الطلبات، راجع `assets/js/services/providers/googleApiProvider.js` و`assets/js/services/apiAdapter.js`.
- لا تنسَ تحديث `googleScriptUrl` بعد كل نشر جديد لـ Apps Script.
