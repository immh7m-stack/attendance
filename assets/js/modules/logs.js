import { createCard, createSearchBox, createTable, createPagination, createEmptyState } from './components.js';
import { get } from '../services/apiAdapter.js';

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

  try {
    const res = await get('logs');
    const items = res?.status === 'success' ? res.data : [];
    if (!items || !items.length) {
      card.querySelector('.card-body').appendChild(createEmptyState('لا توجد سجلات', 'لاتوجد سجلات حالياً.'));
    } else {
      card.querySelector('.card-body').appendChild(createTable(['التاريخ', 'الإجراء', 'المستخدم', 'النتيجة', 'الوصف'], buildRows(items)));
      card.querySelector('.card-body').appendChild(createPagination(1, Math.max(1, Math.ceil(items.length / 25)), () => {}));
    }
  } catch (e) {
    card.querySelector('.card-body').appendChild(createEmptyState('تعذر جلب السجلات', 'حدث خطأ أثناء جلب السجلات.'));
  }

  container.innerHTML = '';
  container.appendChild(card);
}
