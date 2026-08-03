const normalizeRepo = (repo) => String(repo || '').trim().replace(/^\/+|\/+$/g, '').replace(/\/$/, '');

const buildGitHubPagesUrl = (githubUser, githubRepo, path = '') => {
  const repoSlug = normalizeRepo(githubRepo);
  const cleanPath = String(path || '').trim().replace(/^\/+|\/+$/g, '');
  return `https://${githubUser}.github.io/${repoSlug}${cleanPath ? `/${cleanPath}` : ''}`;
};

export const APP_CONFIG = {
  appName: 'Smart Attendance System',
  version: '1.0.0',
  apiProvider: 'google',
  apiUrl: 'https://script.google.com/macros/s/AKfycbxdOoujFafjGT1paKvwLNIGgShHDRFEGVaFGX8Dr545hk0c4KGUds1cxCSOn3eOsIn5/exec',
  googleScriptUrl: 'https://script.google.com/macros/s/AKfycbxdOoujFafjGT1paKvwLNIGgShHDRFEGVaFGX8Dr545hk0c4KGUds1cxCSOn3eOsIn5/exec',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1yqhDccY21PtHKJdO3c9EXXsnRt6dlomMlWZ3WvBEpzo/edit?usp=sharing',
  gpsRadiusMeters: 300,
  timeoutMs: 15000,
  theme: 'light',
  defaultSession: null,
  // Enable mock GPS for Sprint 1 (frontend-only flows)
  mockGps: true,
  mockLocation: { latitude: 30.0444, longitude: 31.2357, accuracy: 30 },
  githubUser: 'immh7m-stack',
  githubRepo: 'attendance',
  siteUrl: buildGitHubPagesUrl('immh7m-stack', 'attendance'),
  studentUrl: buildGitHubPagesUrl('immh7m-stack', 'attendance', 'student/'),
  adminUrl: buildGitHubPagesUrl('immh7m-stack', 'attendance', 'admin/')
};
