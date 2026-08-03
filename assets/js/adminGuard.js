const ADMIN_SESSION_KEY = 'admin_session';
const pageId = document.body?.dataset?.page || '';
const pathname = window.location.pathname || '';
const adminPages = ['admin-dashboard', 'students', 'sessions', 'attendance', 'reports', 'settings', 'logs', 'profile'];
const isLoginPage = pageId === 'admin-login';
const isAdminArea = pathname.includes('/admin/') || pageId.startsWith('admin-') || adminPages.includes(pageId);
const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);

if (!adminSession && isAdminArea && !isLoginPage) {
  window.location.href = 'login.html';
}

if (adminSession && isLoginPage) {
  window.location.href = 'dashboard.html';
}
