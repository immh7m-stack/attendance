import { createCard, createSearchBox, createTable, createPagination, createEmptyState, createLoader, createErrorState } from './components.js';
import { get } from '../services/apiAdapter.js';

function buildRows(items) {
  return items.map((item) => [item.date || '-', item.action || '-', item.user || '-', item.result || '-', item.description || '-']);
}

export async function initLogsPage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(createLoader('جاري جلب البيانات لعرضها. الرجاء الانتظار...'));

  const card = createCard('السجلات', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.appendChild(createSearchBox('بحث في السجلات...', '', 'logs-search'));
  card.querySelector('.card-body').appendChild(toolbar);

  try {
    const res = await get('logs');
    const items = res?.status === 'success' ? res.data : [];
    let currentItems = items;

    const render = (list) => {
      const body = card.querySelector('.card-body');
      const existingTable = body.querySelector('table');
      if (existingTable) existingTable.remove();
      const existingPagination = body.querySelector('.pagination');
      if (existingPagination) existingPagination.remove();

      if (!list.length) {
        body.appendChild(createEmptyState('لا توجد سجلات', 'لاتوجد سجلات حالياً.'));
        return;
      }

      body.appendChild(createTable(['التاريخ', 'الإجراء', 'المستخدم', 'النتيجة', 'الوصف'], buildRows(list)));
      body.appendChild(createPagination(1, Math.max(1, Math.ceil(list.length / 25)), () => {}));
    };

    render(currentItems);

    const searchInput = document.getElementById('logs-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        const filtered = currentItems.filter((item) => Object.values(item).join(' ').toLowerCase().includes(query.toLowerCase()));
        render(filtered);
      });
    }

    container.innerHTML = '';
    container.appendChild(card);
  } catch (e) {
    container.innerHTML = '';
    container.appendChild(createErrorState('تعذر جلب البيانات. يرجى المحاولة مرة أخرى.'));
  }
}
