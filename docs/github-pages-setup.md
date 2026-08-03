# GitHub Pages + QR + Google Sheets Setup

## 1) GitHub Pages
1. افتح المستودع على GitHub.
2. اذهب إلى Settings → Pages.
3. اختر Branch: `main` أو `master`.
4. اختر Folder: `/root`.
5. احفظ.

بعد النشر، سيكون الموقع متاحًا على:

- https://immh7m-stack.github.io/attendance/

## 2) الروابط المولدة تلقائيًا
تم توحيد الروابط في:
- [assets/js/config.js](assets/js/config.js)

إذا غيّرت المستخدم أو المستودع، ستتغير الروابط تلقائيًا.

## 3) QR Code
يمكنك الآن فتح:
- https://immh7m-stack.github.io/attendance/qr.html

وستنشئ QR لعنوان الطالب تلقائيًا باستخدام الرابط:
- https://immh7m-stack.github.io/attendance/student/?session=YOUR_SESSION_ID

## 4) Google Sheets
استخدم الرابط المقدم:
- https://docs.google.com/spreadsheets/d/1yqhDccY21PtHKJdO3c9EXXsnRt6dlomMlWZ3WvBEpzo/edit?usp=sharing

ثم في Apps Script:
1. أنشئ مشروع Apps Script جديد.
2. أضف `SPREADSHEET_ID` كخاصية.
3. ضع معرف الورقة من الرابط.
4. نشر المشروع كـ Web App.

## 5) الملاحظات
- إذا أردت تغيير اسم المستخدم أو اسم المستودع، غيّر القيم في [assets/js/config.js](assets/js/config.js) فقط.
- إذا أردت، أستطيع لاحقًا ربط التطبيق فعليًا ببرنامج Apps Script كامل بدلًا من القالب الحالي.
