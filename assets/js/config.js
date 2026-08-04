const normalizeRepo = (repo) => String(repo || '').trim().replace(/^\/+|\/+$/g, '').replace(/\/$/, '');

const buildGitHubPagesUrl = (githubUser, githubRepo, path = '') => {
  const repoSlug = normalizeRepo(githubRepo);
  const cleanPath = String(path || '').trim().replace(/^\/+|\/+$/g, '');
  return `https://${githubUser}.github.io/${repoSlug}${cleanPath ? `/${cleanPath}` : ''}`;
};

export const APP_CONFIG = {
  appName: 'Smart Attendance System',
  version: '1.0.0',
  googleScriptUrl: 'https://script.google.com/macros/s/AKfycbyJBidnH_jeUG69UijtKDkPLQqyuvZy51qNabXVDUa8DYo8wkuqOnMsrG26ffWsVn6k/exec',
  apiUrl: '', // Optional fallback API URL if not using Google Apps Script
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1dOa6KqmoJ_2AYFBOcNhCgbuvKvSg4S-pH_T8O0TSpNQ/edit?usp=sharing',
  gpsRadiusMeters: 300,
  timeoutMs: 15000,
  theme: 'light',
  defaultSession: null,
  githubUser: 'immh7m-stack',
  githubRepo: 'attendance',
  // Determine whether to use GitHub Pages URLs or local relative paths
  siteUrl: buildGitHubPagesUrl('immh7m-stack', 'attendance'),
  studentUrl: (typeof location !== 'undefined' && String(location.hostname || '').endsWith('github.io'))
    ? buildGitHubPagesUrl('immh7m-stack', 'attendance', 'student/')
    : 'student/index.html',
  adminUrl: (typeof location !== 'undefined' && String(location.hostname || '').endsWith('github.io'))
    ? buildGitHubPagesUrl('immh7m-stack', 'attendance', 'admin/')
    : 'admin/login.html'
};
