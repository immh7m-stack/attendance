import { authService } from '../services/authService.js';
import { setState } from '../state.js';
import { showRedirectLoader } from './redirectLoader.js';

const AUTH_KEY = 'admin_session';

export function saveSession(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function removeSession() {
  localStorage.removeItem(AUTH_KEY);
}

export function checkToken() {
  const session = localStorage.getItem(AUTH_KEY);
  return session ? JSON.parse(session) : null;
}

export async function login(username, password) {
  const result = await authService.login({ username, password });
  if (result.status === 'success') {
    const session = { ...result.data, createdAt: new Date().toISOString() };
    saveSession(session);
    setState('app', { currentUser: session.user || null, appStatus: 'authenticated' });
    return session;
  }
  return null;
}

export async function logout() {
  removeSession();
  await showRedirectLoader({
    title: 'جارٍ تسجيل الخروج',
    subtitle: 'يتم تجهيز الصفحة وعودة المستخدم إلى تسجيل الدخول.'
  });
  window.location.href = 'login.html';
}

export function initAuthPage() {
  const form = document.querySelector('#admin-login-form');
  const errorElement = document.querySelector('#loginError');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.querySelector('#username').value.trim();
    const password = document.querySelector('#password').value.trim();
    const session = await login(username, password);
    if (session) {
      await showRedirectLoader({
        title: 'مرحباً بك',
        subtitle: 'جارٍ تجهيز لوحة الإدارة...' 
      });
      window.location.href = 'dashboard.html';
    } else if (errorElement) {
      errorElement.textContent = 'بيانات الدخول غير صحيحة.';
    }
  });
}
