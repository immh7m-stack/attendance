function createElement(tag, className = '', attrs = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) element.setAttribute(key, value);
  });
  return element;
}

export function createNavbar(title = 'Smart Attendance') {
  const nav = createElement('nav', 'app-nav');
  nav.innerHTML = `
    <div class="brand">${title}</div>
    <div class="badge"></div>
  `;
  return nav;
}

export function createSidebar(active = 'dashboard') {
  const sidebar = createElement('aside', 'app-sidebar');
  sidebar.innerHTML = `
    <h3>الإدارة</h3>
    <a href="dashboard.html" class="${active === 'dashboard' ? 'active' : ''}">لوحة التحكم</a>
    <a href="students.html" class="${active === 'students' ? 'active' : ''}">الطلاب</a>
    <a href="sessions.html" class="${active === 'sessions' ? 'active' : ''}">الجلسات</a>
    <a href="attendance.html" class="${active === 'attendance' ? 'active' : ''}">الحضور</a>
    <a href="reports.html" class="${active === 'reports' ? 'active' : ''}">التقارير</a>
    <a href="settings.html" class="${active === 'settings' ? 'active' : ''}">الإعدادات</a>
    <a href="logs.html" class="${active === 'logs' ? 'active' : ''}">السجلات</a>
    <a href="profile.html" class="${active === 'profile' ? 'active' : ''}">الملف الشخصي</a>
  `;
  return sidebar;
}

export function createTopbar(title, subtitle = '') {
  const topbar = createElement('section', 'topbar');
  topbar.innerHTML = `
    <div>
      <h1 class="page-title">${title}</h1>
      <p class="page-subtitle">${subtitle}</p>
    </div>
  `;
  return topbar;
}

export function createBreadcrumb(items = []) {
  const nav = createElement('nav', 'breadcrumb');
  nav.innerHTML = `<div class="crumb-list">${items.map((item, index) => `<span class="crumb">${item}</span>`).join('')}</div>`;
  return nav;
}

export function createCard(title, bodyContent = '', footer = '') {
  const card = createElement('article', 'admin-card');
  card.innerHTML = `
    <div class="card-header">
      <h3>${title}</h3>
    </div>
    <div class="card-body">${bodyContent}</div>
    ${footer ? `<div class="card-footer">${footer}</div>` : ''}
  `;
  return card;
}

export function createLoader(message = 'جاري التحميل...') {
  const loader = createElement('div', 'loader');
  loader.innerHTML = `<div>${message}</div>`;
  return loader;
}

export function createToast(message, type = 'info') {
  const toast = createElement('div', `toast ${type}`);
  toast.textContent = message;
  return toast;
}

export function createStatisticCard(title, value, footer = '') {
  const card = createElement('article', 'stat-card');
  card.innerHTML = `
    <h3>${title}</h3>
    <div class="value">${value}</div>
    <div class="footer">${footer}</div>
  `;
  return card;
}

export function createTable(headers, rows) {
  const table = createElement('table', 'table');
  table.innerHTML = `
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  `;
  return table;
}

export function createSearchBox(placeholder = 'بحث...', value = '', id = '') {
  const box = createElement('div', 'search-box');
  box.innerHTML = `
    <input type="search" placeholder="${placeholder}" value="${value}" ${id ? `id="${id}"` : ''} />
  `;
  return box;
}

export function createPagination(currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) return createElement('div', 'pagination');
  const nav = createElement('nav', 'pagination');
  const prev = createElement('button', 'page-btn');
  prev.textContent = 'السابق';
  prev.disabled = currentPage <= 1;
  prev.addEventListener('click', () => onPageChange(currentPage - 1));

  const pages = createElement('div', 'pagination-pages');
  for (let index = 1; index <= totalPages; index += 1) {
    const pageButton = createElement('button', `page-btn${index === currentPage ? ' active' : ''}`);
    pageButton.textContent = index;
    pageButton.addEventListener('click', () => onPageChange(index));
    pages.appendChild(pageButton);
  }

  const next = createElement('button', 'page-btn');
  next.textContent = 'التالي';
  next.disabled = currentPage >= totalPages;
  next.addEventListener('click', () => onPageChange(currentPage + 1));

  nav.append(prev, pages, next);
  return nav;
}

export function createModal(title, bodyContent = '', footerContent = '') {
  const backdrop = createElement('div', 'modal-backdrop');
  const modal = createElement('div', 'modal');
  const header = createElement('div', 'modal-header');
  header.innerHTML = `<h3>${title}</h3><button type="button" class="btn btn-ghost close-modal">×</button>`;
  const body = createElement('div', 'modal-body');
  body.innerHTML = bodyContent;
  const footer = createElement('div', 'modal-footer');
  footer.innerHTML = footerContent;

  modal.append(header, body, footer);
  backdrop.appendChild(modal);
  return backdrop;
}

export function createDialog(message, actionLabel = 'حسناً') {
  const dialog = createElement('div', 'dialog');
  dialog.innerHTML = `
    <p>${message}</p>
    <button type="button" class="btn btn-primary dialog-confirm">${actionLabel}</button>
  `;
  return dialog;
}

export function createEmptyState(title, message) {
  const state = createElement('div', 'empty-state');
  state.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
  return state;
}

export function createErrorState(message, retryLabel = 'إعادة المحاولة') {
  const state = createElement('div', 'error-state');
  state.innerHTML = `<h3>حدث خطأ</h3><p>${message}</p><button type="button" class="btn btn-primary">${retryLabel}</button>`;
  return state;
}
