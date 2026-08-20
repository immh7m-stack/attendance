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
import { showRedirectLoader } from './modules/redirectLoader.js';

const pageId = router.getCurrentPage();

const setGeneratedLinks = () => {
  const studentLink = document.querySelector('[data-route="student"]');
  if (studentLink) {
    studentLink.href = APP_CONFIG.studentUrl;
  }
};

async function initHomePage() {
  const homeStatus = document.getElementById('homeStatus');
  const showHomeStatus = (message, type = '') => {
    if (!homeStatus) return;
    homeStatus.textContent = message;
    homeStatus.classList.remove('error');
    homeStatus.classList.remove('success');
    if (type) {
      homeStatus.classList.add(type);
    }
  };

  if (homeStatus) {
    showHomeStatus('جارٍ التحقق من الموقع...');
  }

  if (!navigator.geolocation) {
    showHomeStatus('يجب تفعيل خدمة الموقع (Location) على الهاتف أو استخدام متصفح يدعم الموقع.', 'error');
    return;
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
    const targetRadius = Number(activeSession?.radius || locationSettings?.gps_radius || locationSettings?.radius || APP_CONFIG.gpsRadiusMeters);

    if (!Number.isFinite(targetLatitude) || !Number.isFinite(targetLongitude) || targetLatitude === 0 || targetLongitude === 0) {
      showHomeStatus('إعدادات الموقع غير مكتملة. تواصل مع الإدارة.', 'error');
      return;
    }

    const currentLocation = await locationModule.getCurrentLocation();
    const radiusCheck = await locationModule.isInsideRadius(
      currentLocation,
      { latitude: targetLatitude, longitude: targetLongitude },
      targetRadius
    );

    if (!radiusCheck.inside) {
      showHomeStatus(`أنت خارج النطاق الحالي. المسافة الحالية: ${Math.round(radiusCheck.distance)} متر، والحد المسموح: ${Math.round(targetRadius)} متر.`, 'error');
      return;
    }

    localStorage.setItem('student_location_gate', JSON.stringify({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      distance: Math.round(radiusCheck.distance),
      checkedAt: Date.now(),
      sessionId: activeSession?.session_id || '',
      inside: true
    }));

    showHomeStatus('تم التحقق من الموقع. جاري تحويلك إلى نموذج الحضور...', 'success');

    await showRedirectLoader({
      title: 'جارٍ تجهيز نموذج الحضور',
      subtitle: 'يتم تجهيز بياناتك ونقلك إلى صفحة تسجيل الحضور.'
    });
    window.location.href = APP_CONFIG.studentUrl;
  } catch (error) {
    const message = error?.message || 'تعذر الحصول على موقعك. حاول مرة أخرى.';
    const isLocationDisabled = /location|permission|denied|gps|موقع|لوكيشن/i.test(message);
    showHomeStatus(
      isLocationDisabled
        ? 'يجب تفعيل خدمة الموقع (Location) على الهاتف قبل الدخول. بعد تفعيلها، أعد تحميل الصفحة.'
        : message,
      'error'
    );
  }
}

const requireAdminAuth = async () => {
  if (!authService.isAuthenticated()) {
    await showRedirectLoader({
      title: 'جارٍ تسجيل الدخول',
      subtitle: 'يتم التحقق من الجلسة وإعادة توجيهك إلى صفحة تسجيل الدخول.'
    });
    window.location.href = 'login.html';
    return false;
  }
  return true;
};

const isAdminRoute = () => {
  const pathname = window.location.pathname || '';
  return pathname.includes('/admin/') || pageId.startsWith('admin-') || ['students', 'sessions', 'attendance', 'departments', 'levels', 'reports', 'settings', 'logs', 'profile'].includes(pageId);
};

const initPage = async () => {
  setGeneratedLinks();
  document.title = `${APP_CONFIG.appName} - ${document.title}`;

  if (isAdminRoute() && pageId !== 'admin-login' && !(await requireAdminAuth())) {
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
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('dashboard');
      dashboard.initDashboardPage(container);
      break;
    }
    case 'students': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('students');
      students.initStudentsPage(container);
      break;
    }
    case 'sessions': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('sessions');
      sessions.initSessionsPage(container);
      break;
    }
    case 'attendance': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('attendance');
      attendanceAdmin.initAttendancePage(container);
      break;
    }
    case 'departments': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('departments');
      departments.initDepartmentsPage(container);
      break;
    }
    case 'levels': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('levels');
      levels.initLevelsPage(container);
      break;
    }
    case 'reports': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('reports');
      reports.initReportsPage(container);
      break;
    }
    case 'settings': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('settings');
      settings.initSettingsPage(container);
      break;
    }
    case 'logs': {
      if (!(await requireAdminAuth())) return;
      const container = renderAdminPage('logs');
      logs.initLogsPage(container);
      break;
    }
    case 'profile': {
      if (!(await requireAdminAuth())) return;
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
