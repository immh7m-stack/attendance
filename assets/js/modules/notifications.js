import { notificationService } from '../services/notificationService.js';

function createToast(message, type = 'info') {
  const alertBox = document.createElement('div');
  alertBox.className = `toast ${type}`;
  alertBox.setAttribute('role', 'alert');
  alertBox.setAttribute('aria-live', 'assertive');
  alertBox.textContent = message;
  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.style.opacity = '0';
    alertBox.style.transform = 'translate(-50%, -50%) translateY(10px)';
    setTimeout(() => alertBox.remove(), 220);
  }, 2800);
}

function ensureLoader() {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    const container = document.createElement('div');
    container.id = 'global-loader';
    container.className = 'loader';
    container.textContent = 'جاري التحميل...';
    document.body.appendChild(container);
    loader = container;
  }
  return loader;
}

// Listen to service-dispatched events and manipulate DOM here (modules own UI)
window.addEventListener('app:toast', (e) => {
  const { message, type } = e.detail || {};
  createToast(message, type);
});

window.addEventListener('app:loading:show', (e) => {
  const msg = (e && e.detail && e.detail.message) || 'جاري التحميل...';
  const loader = ensureLoader();
  loader.textContent = msg;
  loader.classList.add('show');
});

window.addEventListener('app:loading:hide', () => {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.remove('show');
});

// Export helpers that trigger service events (keeps existing call sites compatible)
export function toast(message) {
  notificationService.showToast(message, 'info');
}

export function success(message) {
  notificationService.showToast(message, 'success');
}

export function error(message) {
  notificationService.showToast(message, 'error');
}

export function loading(show = true, message = 'جاري التحميل...') {
  if (show) notificationService.showLoading(message);
  else notificationService.hideLoading();
}
