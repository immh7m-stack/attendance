# GitHub Setup Guide

## 1) Create Repository
Create a new repository on GitHub with the name:
- `attendance`

## 2) Connect Local Project
Run the following commands:

```bash
git init
git branch -M main
git remote add origin https://github.com/immh7m-stack/attendance.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## 3) Create a Release
After pushing the code:
1. Open the repository on GitHub.
2. Go to Releases.
3. Click "Draft a new release".
4. Create a tag like `v1.0.0`.
5. Publish.

## 4) Enable GitHub Actions
The workflow file is already included at:
- `.github/workflows/deploy.yml`

## 5) Enable GitHub Pages
1. Open repository Settings.
2. Go to Pages.
3. Choose Source: GitHub Actions.
4. Save.

Your site will be available at:
- https://immh7m-stack.github.io/attendance/

## 6) Optional: Use SSH
If you prefer SSH instead of HTTPS:

```bash
git remote set-url origin git@github.com:immh7m-stack/attendance.git
```
