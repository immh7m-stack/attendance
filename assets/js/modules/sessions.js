import { sessionService } from '../services/sessionService.js';
import { createCard, createSearchBox, createTable, createPagination, createEmptyState } from './components.js';

let currentItems = [];
let currentPage = 1;

function buildRows(items) {
  return items.map((item) => [item.subjectName || '-', item.subjectId || '-', item.date || '-', item.start || '-', item.end || '-', item.location?.radius || '-', item.status || '-']);
}

function renderSessions(container, items) {
  const card = createCard('الجلسات', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.appendChild(createSearchBox('بحث باسم الجلسة...', '', 'session-search'));
  card.querySelector('.card-body').appendChild(toolbar);

  if (!items.length) {
    card.querySelector('.card-body').appendChild(createEmptyState('لا توجد جلسات', 'لا توجد جلسات متاحة حاليًا.'));
  } else {
    card.querySelector('.card-body').appendChild(createTable(['اسم الجلسة', 'المادة', 'التاريخ', 'البداية', 'النهاية', 'GPS Radius', 'الحالة'], buildRows(items)));
    card.querySelector('.card-body').appendChild(createPagination(currentPage, Math.max(1, Math.ceil(currentItems.length / 5)), (page) => {
      currentPage = page;
      const start = (page - 1) * 5;
      renderSessions(container, currentItems.slice(start, start + 5));
    }));
  }

  container.innerHTML = '';
  container.appendChild(card);
}

export async function initSessionsPage(container) {
  if (!container) return;
  const result = await sessionService.getSessions({ page: 1, pageSize: 25 });
  const items = result?.status === 'success' ? result.data : [];
  currentItems = items;
  renderSessions(container, items.slice(0, 5));
}

export async function createSession(data) { return sessionService.createSession(data); }
export async function closeSession(sessionId) { return sessionService.closeSession(sessionId); }
export async function getActiveSession() { return sessionService.getActiveSession(); }
export async function deleteSession(sessionId) { return sessionService.deleteSession(sessionId); }
export async function updateSession(sessionId, data) { return sessionService.updateSession(sessionId, data); }
