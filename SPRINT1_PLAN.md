# Sprint 1 Plan

## Goals
- Deliver a high-quality Student-facing experience (UI + UX) using Mock API.
- Apply low-priority foundation fixes (responsive links, design tokens, service/module separation).

## Scope
- Frontend-only work; no backend, no Google Apps Script or Sheets integration.
- All student pages and student flow components.

## Target Pages
- `student/index.html`
- `student/success.html`, `student/denied.html`, `student/duplicate.html`, `student/error.html`, `student/offline.html`
- `index.html` (landing)

## Modules Used
- `location.js` (GPS mock)
- `attendance.js` (flow control)
- `qr.js` (QR parsing mock)
- `students.js` (lookup mock)
- `notifications.js` (UI notifications)
- `export.js` (client export helpers)

## Services Used
- `attendanceService.js` (Mock)
- `sessionService.js` (Mock)
- `studentService.js` (Mock)
- `notificationService.js` (event-only, no DOM)
- `exportService.js` (returns blobs, no DOM)

## Mock Data Required
- `data/sample-students.json` (student records)
- `data/sessions.json` (active session mock)
- `data/settings.json` (location and radius)

## User Flow (high level)
1. Student opens `student/index.html` (reads QR / session mock).
2. App requests GPS permission (mocked flow) and validates radius.
3. Student enters `studentId` and the app looks up the student in mock data.
4. Student confirms and submits attendance to Mock API.
5. UI shows success / duplicate / denied / error pages accordingly.

## Testing Checklist
- Responsive layout across pages (mobile → desktop).
- GPS permission and radius handling (accept, deny, out-of-range).
- Student lookup returns correct profile from mock data.
- Duplicate prevention (client-side check).
- All notifications and loader behaviors.
- Navigation to success/denied/duplicate/error pages.

## Definition of Done
- All targeted pages include `responsive.css` and use `theme.css` tokens.
- No services manipulate the DOM; UI modules/components handle DOM.
- Student flow implemented end-to-end using only Mock API responses.
- Unit and manual integration checks in checklist passed.
- `SPRINT1_PLAN.md` added and repo compiles in static server.

## Risks
- GPS spoofing can't be fully prevented in-browser (documented limitation).
- Large-scale data and quotas not addressed (Apps Script + Sheets deferred).
- Some admin pages are out of scope for Sprint 1.

--
Sprint 1 starts after these foundation fixes are merged.
