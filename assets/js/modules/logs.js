import { createCard, createSearchBox, createTable, createPagination, createEmptyState } from './components.js';

const sampleLogs = [
  { date: '2026-08-01', action: 'تسجيل دخول', user: 'admin', result: 'نجاح', description: 'تسجيل دخول المشرف' },
  { date: '2026-08-01', action: 'إضافة طالب', user: 'admin', result: 'نجاح', description: 'تمت إضافة طالب جديد' },
  { date: '2026-08-02', action: 'تحديث جلسة', user: 'admin', result: 'نجاح', description: 'تم تحديث الجلسة' }
];

function buildRows(items) {
  return items.map((item) => [item.date, item.action, item.user, item.result, item.description]);
}

export async function initLogsPage(container) {
  if (!container) return;
  const card = createCard('السجلات', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.appendChild(createSearchBox('بحث في السجلات...', '', 'logs-search'));
  card.querySelector('.card-body').appendChild(toolbar);
  card.querySelector('.card-body').appendChild(createTable(['التاريخ', 'الإجراء', 'المستخدم', 'النتيجة', 'الوصف'], buildRows(sampleLogs)));
  card.querySelector('.card-body').appendChild(createPagination(1, 1, () => {}));
  container.innerHTML = '';
  container.appendChild(card);
}
