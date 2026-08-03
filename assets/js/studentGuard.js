import { studentService } from './services/studentService.js';

const STUDENT_TOKEN_KEY = 'student_session_token';
const protectedPages = ['success.html', 'denied.html', 'duplicate.html', 'error.html', 'offline.html'];
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

async function initStudentGuard() {
  if (protectedPages.includes(pageName)) {
    await validateStudentSession();
    return;
  }

  if (pageName === 'index.html' || pageName === '') {
    const token = localStorage.getItem(STUDENT_TOKEN_KEY);
    if (!token) return;
    try {
      const response = await studentService.getStudentSession({ sessionToken: token });
      if (response?.status !== 'success') {
        localStorage.removeItem(STUDENT_TOKEN_KEY);
      }
    } catch (error) {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
    }
  }
}

document.addEventListener('DOMContentLoaded', initStudentGuard);
