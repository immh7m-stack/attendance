import { APP_CONFIG } from './config.js';
import * as router from './router.js';
import * as notifications from './modules/notifications.js';
import * as validation from './modules/validation.js';
import * as locationModule from './modules/location.js';
import * as attendance from './modules/attendance.js';
import * as auth from './modules/auth.js';
import * as dashboard from './modules/dashboard.js';
import * as students from './modules/students.js';
import * as sessions from './modules/sessions.js';
import * as attendanceAdmin from './modules/attendanceAdmin.js';
import * as reports from './modules/reports.js';
import * as settings from './modules/settings.js';
import * as logs from './modules/logs.js';
import * as profile from './modules/profile.js';
import * as departments from './modules/departments.js';
import * as levels from './modules/levels.js';
import * as studentDashboard from './modules/studentDashboard.js';
import { authService } from './services/authService.js';
import { settingsService } from './services/settingsService.js';
import { sessionService } from './services/sessionService.js';
import { renderAdminPage } from './modules/adminPage.js';

const pageId = router.getCurrentPage();

const setGeneratedLinks = () => {
  const studentLink = document.querySelector('[data-route="student"]');
  if (studentLink) {
    studentLink.href = APP_CONFIG.studentUrl;
  }
};

async function initHomePage() {
  const homeStatus = document.getElementById('homeStatus');
  if (homeStatus) {
    homeStatus.textContent = 'جارٍ التحقق من الموقع...';
    homeStatus.classList.remove('error');
    homeStatus.classList.remove('success');
  }

  try {
    const [settingsRes, sessionRes] = await Promise.all([
      settingsService.getLocationSettings(),
      sessionService.getActiveSession()
    ]);

    const locationSettings = settingsRes?.status === 'success' ? settingsRes.data : {};
    const activeSession = sessionRes?.status === 'success' ? sessionRes.data : null;

    const targetLatitude = Number(activeSession?.latitude || locationSettings?.university_latitude || locationSettings?.latitude || 0);
    const targetLongitude = Number(activeSession?.longitude || locationSettings?.university_longitude || locationSettings?.longitude || 0);
    const targetRadius = Number(activeSession?.radius || locationSettings?.gps_radius || locationSettings?.radius || 300);

    if (!Number.isFinite(targetLatitude) || !Number.isFinite(targetLongitude) || targetLatitude === 0 || targetLongitude === 0) {
      if (homeStatus) {
        homeStatus.textContent = 'إعدادات الموقع غير مكتملة. تواصل مع الإدارة.';
        homeStatus.classList.add('error');
      }
      return;
    }

    const currentLocation = await locationModule.getCurrentLocation();
    const radiusCheck = locationModule.isInsideRadius(
      currentLocation,
      { latitude: targetLatitude, longitude: targetLongitude },
      targetRadius
    );

    if (!radiusCheck.inside) {
      if (homeStatus) {
        homeStatus.textContent = `أنت خارج النطاق الحالي. المسافة الحالية: ${Math.round(radiusCheck.distance)} متر، والحد المسموح: ${Math.round(targetRadius)} متر.`;
        homeStatus.classList.add('error');
      }
      return;
    }

    if (homeStatus) {
      homeStatus.textContent = 'تم التحقق من الموقع. جاري تحويلك إلى نموذج الحضور...';
      homeStatus.classList.add('success');
    }

    window.location.href = APP_CONFIG.studentUrl;
  } catch (error) {
    if (homeStatus) {
      homeStatus.textContent = error?.message || 'تعذر الحصول على موقعك. حاول مرة أخرى.';
      homeStatus.classList.add('error');
    }
  }
}

const requireAdminAuth = () => {
  if (!authService.isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
};

const isAdminRoute = () => {
  const pathname = window.location.pathname || '';
  return pathname.includes('/admin/') || pageId.startsWith('admin-') || ['students', 'sessions', 'attendance', 'departments', 'levels', 'reports', 'settings', 'logs', 'profile'].includes(pageId);
};

const initPage = () => {
  setGeneratedLinks();
  document.title = `${APP_CONFIG.appName} - ${document.title}`;

  if (isAdminRoute() && pageId !== 'admin-login' && !requireAdminAuth()) {
    return;
  }

  switch (pageId) {
    case 'home':
      initHomePage();
      break;
    case 'admin-login':
      auth.initAuthPage();
      break;
    case 'admin-dashboard': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('dashboard');
      dashboard.initDashboardPage(container);
      break;
    }
    case 'students': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('students');
      students.initStudentsPage(container);
      break;
    }
    case 'sessions': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('sessions');
      sessions.initSessionsPage(container);
      break;
    }
    case 'attendance': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('attendance');
      attendanceAdmin.initAttendancePage(container);
      break;
    }
    case 'departments': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('departments');
      departments.initDepartmentsPage(container);
      break;
    }
    case 'levels': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('levels');
      levels.initLevelsPage(container);
      break;
    }
    case 'reports': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('reports');
      reports.initReportsPage(container);
      break;
    }
    case 'settings': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('settings');
      settings.initSettingsPage(container);
      break;
    }
    case 'logs': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('logs');
      logs.initLogsPage(container);
      break;
    }
    case 'profile': {
      if (!requireAdminAuth()) return;
      const container = renderAdminPage('profile');
      profile.initProfilePage(container);
      break;
    }
    case 'student-index':
      attendance.initStudentPage();
      break;
    case 'student-dashboard':
      studentDashboard.initStudentDashboardPage();
      break;
    default:
      attendance.initStudentPage();
      break;
  }
};

document.addEventListener('DOMContentLoaded', initPage);

export { APP_CONFIG, router, notifications, validation, locationModule, attendance, auth, dashboard, students, sessions, attendanceAdmin, departments, levels, reports, settings, logs, profile };
