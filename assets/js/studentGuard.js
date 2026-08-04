import { studentService } from './services/studentService.js';
import { getDeviceFingerprint } from './modules/device.js';

const STUDENT_TOKEN_KEY = 'student_session_token';
const protectedPages = ['dashboard.html'];
const pageName = (window.location.pathname.match(/[^/]+$/) || [''])[0] || 'index.html';

function redirectToIndex(clearToken = false) {
  if (clearToken) {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
  }
  window.location.href = 'index.html';
}

async function validateStudentSession() {
  const token = localStorage.getItem(STUDENT_TOKEN_KEY);
  if (!token) {
    redirectToIndex();
    return false;
  }

  try {
    const response = await studentService.getStudentSession({ sessionToken: token });
    if (response?.status === 'success' && response.data) {
      return true;
    }
  } catch (error) {
    console.warn('Student session validation failed:', error);
  }

  redirectToIndex(true);
  return false;
}

async function restoreByDeviceFingerprint() {
  const fingerprint = getDeviceFingerprint();
  if (!fingerprint) return false;

  try {
    const response = await studentService.getStudentSession({ deviceFingerprint: fingerprint });
    if (response?.status === 'success' && response.data) {
      localStorage.setItem(STUDENT_TOKEN_KEY, response.data.session_token || response.data.sessionToken || '');
      window.location.href = 'dashboard.html';
      return true;
    }
  } catch (error) {
    console.warn('Device fingerprint session restore failed:', error);
  }

  return false;
}

async function initStudentGuard() {
  if (protectedPages.includes(pageName)) {
    await validateStudentSession();
    return;
  }

  if (pageName === 'index.html' || pageName === '') {
    const token = localStorage.getItem(STUDENT_TOKEN_KEY);
    if (token) {
      try {
        const response = await studentService.getStudentSession({ sessionToken: token });
        if (response?.status === 'success' && response.data) {
          window.location.href = 'dashboard.html';
          return;
        }
      } catch (error) {
        console.warn('Student session validation failed:', error);
      }
      localStorage.removeItem(STUDENT_TOKEN_KEY);
    }

    await restoreByDeviceFingerprint();
  }
}

document.addEventListener('DOMContentLoaded', initStudentGuard);
