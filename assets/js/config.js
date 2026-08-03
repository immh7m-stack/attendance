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
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1yqhDccY21PtHKJdO3c9EXXsnRt6dlomMlWZ3WvBEpzo/edit?usp=sharing',
  gpsRadiusMeters: 300,
  timeoutMs: 15000,
  theme: 'light',
  defaultSession: null,
  githubUser: 'immh7m-stack',
  githubRepo: 'attendance',
  siteUrl: buildGitHubPagesUrl('immh7m-stack', 'attendance'),
  studentUrl: buildGitHubPagesUrl('immh7m-stack', 'attendance', 'student/'),
  adminUrl: buildGitHubPagesUrl('immh7m-stack', 'attendance', 'admin/')
};
