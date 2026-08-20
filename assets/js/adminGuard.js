const ADMIN_SESSION_KEY = 'admin_session';
const pageId = document.body?.dataset?.page || '';
const pathname = window.location.pathname || '';
const adminPages = ['admin-dashboard', 'students', 'sessions', 'attendance', 'reports', 'settings', 'logs', 'profile'];
const isLoginPage = pageId === 'admin-login';
const isAdminArea = pathname.includes('/admin/') || pageId.startsWith('admin-') || adminPages.includes(pageId);
const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);

function hideRedirectLoader() {
  const overlay = document.getElementById('student-redirect-overlay');
  if (overlay) overlay.remove();
}

function showRedirectLoader({
  title = 'جارٍ توجيهك إلى الصفحة الرئيسية...',
  subtitle = 'يتم تجهيز بياناتك والعودة إلى صفحتك الشخصية.'
} = {}) {
  if (document.getElementById('student-redirect-overlay')) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'student-redirect-overlay';
    overlay.className = 'student-redirect-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-label', title);

    overlay.innerHTML = `
      <div class="student-redirect-box" dir="rtl">
        <div class="student-redirect-icon-wrap" aria-hidden="true">
          <div class="student-redirect-spinner"></div>
        </div>
        <h2 class="student-redirect-title">${title}</h2>
        <p class="student-redirect-subtitle">${subtitle}</p>
        <div class="student-redirect-progress" aria-hidden="true">
          <div class="student-redirect-progress-bar" id="student-redirect-progress-bar"></div>
        </div>
        <div class="student-redirect-meta">
          <span class="student-redirect-label">التقدم</span>
          <span class="student-redirect-percent" id="student-redirect-percent">0%</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const progressBar = overlay.querySelector('#student-redirect-progress-bar');
    const progressText = overlay.querySelector('#student-redirect-percent');
    const durationMs = 8000;
    let startTs = null;

    const animate = (timestamp) => {
      if (startTs === null) startTs = timestamp;
      const elapsed = timestamp - startTs;
      const percent = Math.min(100, (elapsed / durationMs) * 100);

      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `${Math.round(percent)}%`;

      if (elapsed < durationMs) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          hideRedirectLoader();
          resolve();
        }, 150);
      }
    };

    requestAnimationFrame(animate);
  });
}

async function redirectToPage(targetUrl, options = {}) {
  const { title = 'جارٍ توجيهك إلى الصفحة...', subtitle = 'يتم تجهيز بياناتك...' } = options;
  await showRedirectLoader({ title, subtitle });
  window.location.href = targetUrl;
}

if (!adminSession && isAdminArea && !isLoginPage) {
  redirectToPage('login.html', {
    title: 'جارٍ تسجيل الخروج',
    subtitle: 'يتم التحقق من الجلسة وإعادة توجيهك إلى صفحة تسجيل الدخول.'
  });
}

if (adminSession && isLoginPage) {
  redirectToPage('dashboard.html', {
    title: 'جارٍ فتح لوحة التحكم',
    subtitle: 'يتم تجهيز بياناتك والعودة إلى لوحة الإدارة.'
  });
}
