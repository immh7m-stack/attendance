import { attendanceService } from '../services/attendanceService.js';
import { createCard, createSearchBox, createTable, createPagination, createEmptyState } from './components.js';

let currentPage = 1;
let currentItems = [];

function buildRows(items) {
  return items.map((item) => [
    item.studentName || item.studentId || '-',
    item.studentId || '-',
    item.sessionId || item.session_id || '-',
    item.date || '-',
    item.time || '-',
    item.status || '-',
    item.distance !== undefined ? item.distance : '-',
  ]);
}

function renderAttendance(container, items) {
  const card = createCard('سجل الحضور', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.appendChild(createSearchBox('بحث بالاسم أو الرقم...', '', 'attendance-search'));
  card.querySelector('.card-body').appendChild(toolbar);

  const table = createTable(['اسم الطالب', 'Student ID', 'Session ID', 'التاريخ', 'الوقت', 'الحالة', 'المسافة (متر)'], buildRows(items));
  card.querySelector('.card-body').appendChild(table);

  const pager = createPagination(currentPage, Math.max(1, Math.ceil(items.length / 5)), (page) => {
    currentPage = page;
    const start = (page - 1) * 5;
    renderAttendance(container, currentItems.slice(start, start + 5));
  });
  card.querySelector('.card-body').appendChild(pager);

  container.innerHTML = '';
  container.appendChild(card);

  const searchInput = document.getElementById('attendance-search');
  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      const query = searchInput.value.trim();
      const result = await attendanceService.getAttendance({ query });
      const filtered = result?.status === 'success' ? result.data : [];
      currentItems = filtered;
      currentPage = 1;
      renderAttendance(container, filtered.slice(0, 5));
    });
  }
}

export async function initAttendancePage(container) {
  if (!container) return;
  const result = await attendanceService.getAttendance({ page: 1, pageSize: 25 });
  const items = result?.status === 'success' ? result.data : [];
  currentItems = items;
  renderAttendance(container, items.slice(0, 5));
}
