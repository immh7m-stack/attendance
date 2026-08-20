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
    container.innerHTML = `
      <span class="loader-spinner" aria-hidden="true"></span>
      <span class="loader-text">جاري التحميل...</span>
    `;
    document.body.appendChild(container);
    loader = container;
  }
  return loader;
}

function ensureProcessOverlay() {
  let overlay = document.getElementById('global-process-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-process-overlay';
    overlay.className = 'global-process-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
      <div class="global-process-box" dir="rtl">
        <div class="global-process-spinner" aria-hidden="true"></div>
        <h2 class="global-process-title">جارٍ معالجة الطلب</h2>
        <p class="global-process-message">يتم إرسال بيانات الحضور، يرجى الانتظار...</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function hideProcessOverlay() {
  const overlay = document.getElementById('global-process-overlay');
  if (overlay) overlay.remove();
}

// Listen to service-dispatched events and manipulate DOM here (modules own UI)
window.addEventListener('app:toast', (e) => {
  const { message, type } = e.detail || {};
  createToast(message, type);
});

window.addEventListener('app:loading:show', (e) => {
  const msg = (e && e.detail && e.detail.message) || 'جاري التحميل...';
  const loader = ensureLoader();
  const loaderText = loader.querySelector('.loader-text');
  if (loaderText) loaderText.textContent = msg;
  loader.classList.add('show');

  if (/جاري معالجة الطلب|معالجة الطلب|يرجى الانتظار|جاري.*الطلب/i.test(msg)) {
    const overlay = ensureProcessOverlay();
    const messageNode = overlay.querySelector('.global-process-message');
    if (messageNode) messageNode.textContent = msg;
    overlay.classList.add('show');
  }
});

window.addEventListener('app:loading:hide', () => {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.remove('show');
  hideProcessOverlay();
});

// Export helpers that trigger service events (keeps existing call sites compatible)
export function toast(message) {
  notificationService.showToast(message, 'info');
}

export function success(message) {
  notificationService.showToast(message, 'success');
}

export function warning(message) {
  notificationService.showToast(message, 'warning');
}

export function error(message) {
  notificationService.showToast(message, 'error');
}

export function loading(show = true, message = 'جاري التحميل...') {
  if (show) notificationService.showLoading(message);
  else notificationService.hideLoading();
}
