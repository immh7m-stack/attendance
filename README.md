# Attendance System

Smart attendance system for students and admins, built as a static web app with optional Google Apps Script backend integration.

## Features
- Student attendance flow with QR and GPS support
- Admin dashboard for students, sessions, reports, and settings
- Mock API provider for local development
- Google Sheets / Apps Script integration documentation
- GitHub Pages deployment ready

## Project Structure
- `student/` — student-facing pages
- `admin/` — admin pages
- `assets/` — CSS, JS, images, and shared assets
- `docs/` — architecture, API, and deployment documentation
- `google-apps-script/` — Apps Script starter files

## Local Development
Run the app locally:

```bash
python3 -m http.server 8000
```

Then open:
- http://127.0.0.1:8000/

## GitHub Pages
The app is configured to use GitHub Pages with the repository:
- https://immh7m-stack.github.io/attendance/

## Git Commands
```bash
git init
git branch -M main
git remote add origin https://github.com/immh7m-stack/attendance.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Release Notes
Create a release from GitHub after pushing the code:
1. Go to Releases
2. Click "Draft a new release"
3. Tag version like `v1.0.0`
4. Publish
5. redeploy

## GitHub Actions
A basic workflow is included at `.github/workflows/deploy.yml` for future deployment automation.
