import { studentService } from '../services/studentService.js';
import { createCard, createSearchBox, createPagination, createEmptyState, createModal } from './components.js';

let currentItems = [];
let currentPage = 1;
let sortBy = 'level_name';
let sortDirection = 'asc';
let departments = [];
const departmentMap = new Map();

function createActionButton(label, className = 'btn', onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function compareItems(a, b, field) {
  const valueA = String(a[field] || '').toLowerCase();
  const valueB = String(b[field] || '').toLowerCase();
  if (valueA < valueB) return -1;
  if (valueA > valueB) return 1;
  return 0;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const result = compareItems(a, b, sortBy);
    return sortDirection === 'asc' ? result : -result;
  });
}

function buildLevelsTable(items) {
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead>
      <tr>
        <th data-sort="id">ID</th>
        <th data-sort="department_id">القسم</th>
        <th data-sort="level_name">اسم الفرقة</th>
        <th data-sort="active">نشط</th>
        <th>إجراءات</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item) => `
        <tr data-id="${item.id}">
          <td>${item.id || '-'}</td>
          <td>${departmentMap.get(String(item.department_id)) || item.department_id || '-'}</td>
          <td>${item.level_name || '-'}</td>
          <td>${String(item.active).toLowerCase() === 'true' || item.active === true ? 'نعم' : 'لا'}</td>
          <td>
            <button type="button" class="btn btn-secondary edit-level" data-id="${item.id}">تعديل</button>
            <button type="button" class="btn btn-danger delete-level" data-id="${item.id}">حذف</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  return table;
}

function createDepartmentOptions(selectedDepartmentId = '') {
  const activeDepartments = departments;
  return activeDepartments.map((dept) => `<option value="${dept.id}" ${String(dept.id) === String(selectedDepartmentId) ? 'selected' : ''}>${dept.department_name}</option>`).join('');
}

function openLevelModal(container, level = null) {
  const title = level ? 'تعديل الفرقة' : 'إضافة فرقة جديدة';
  const formContent = `
    <form class="admin-form">
      <label>القسم<select id="levelDepartmentId" required>
          <option value="">اختر القسم</option>
          ${createDepartmentOptions(level ? level.department_id : '')}
        </select></label>
      <label>اسم الفرقة<input id="levelName" type="text" value="${level ? level.level_name || '' : ''}" required /></label>
      <label>نشط<input id="levelActive" type="checkbox" ${level && String(level.active).toLowerCase() !== 'false' ? 'checked' : ''} /></label>
      <div class="modal-actions">
        <button type="submit" class="btn btn-primary">حفظ</button>
        <button type="button" class="btn btn-secondary cancel-modal">إلغاء</button>
      </div>
    </form>
  `;
  const modal = createModal(title, formContent, '');
  const form = modal.querySelector('form');
  const cancelBtn = modal.querySelector('.cancel-modal');

  const closeModal = () => modal.remove();
  modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  function buildPayload(fields) {
    const payload = {};
    Object.keys(fields).forEach((k) => {
      const v = fields[k];
      if (v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      payload[k] = v;
    });
    return payload;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const departmentId = form.querySelector('#levelDepartmentId').value.trim();
    const levelName = form.querySelector('#levelName').value.trim();
    const active = form.querySelector('#levelActive').checked;

    if (!departmentId || !levelName) {
      // Only department and level name are required in the UI
      return;
    }

    const raw = { department_id: departmentId, level_name: levelName, active };
    const payload = buildPayload(raw);

    let result;
    if (level && level.id) {
      result = await studentService.updateLevel(level.id, payload);
    } else {
      result = await studentService.createLevel(payload);
    }

    if (result?.status === 'success') {
      closeModal();
      await loadLevels(container);
    } else {
      alert(result.error?.message || 'حدث خطأ أثناء حفظ الفرقة');
    }
  });

  document.body.appendChild(modal);
}

async function loadLevels(container, query = '') {
  const [levelsResult, departmentsResult] = await Promise.all([
    studentService.getLevels(query ? { query } : {}),
    studentService.getDepartments({})
  ]);

  currentItems = levelsResult?.status === 'success' ? levelsResult.data : [];
  departments = departmentsResult?.status === 'success' ? departmentsResult.data : [];
  departmentMap.clear();
  departments.forEach((dept) => departmentMap.set(String(dept.id), dept.department_name));
  currentPage = 1;
  renderLevels(container, currentItems.slice(0, 5));
}

function renderLevels(container, items) {
  const card = createCard('إدارة الفرق', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  const searchBox = createSearchBox('بحث بالفرقة...', '', 'level-search');
  toolbar.appendChild(searchBox);

  const actionButton = createActionButton('إضافة فرقة جديدة', 'btn btn-primary', () => openLevelModal(container));
  toolbar.appendChild(actionButton);
  card.querySelector('.card-body').appendChild(toolbar);

  if (!items.length) {
    card.querySelector('.card-body').appendChild(createEmptyState('لا توجد فرق', 'لم يتم إعداد فرق بعد.'));
  } else {
    const sortedItems = sortItems(items);
    const table = buildLevelsTable(sortedItems);
    card.querySelector('.card-body').appendChild(table);
    card.querySelector('.card-body').appendChild(createPagination(currentPage, Math.max(1, Math.ceil(currentItems.length / 5)), (page) => {
      currentPage = page;
      const start = (page - 1) * 5;
      renderLevels(container, currentItems.slice(start, start + 5));
    }));

    table.querySelectorAll('th[data-sort]').forEach((header) => {
      header.addEventListener('click', () => {
        const nextSort = header.dataset.sort;
        if (sortBy === nextSort) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortBy = nextSort;
          sortDirection = 'asc';
        }
        renderLevels(container, items);
      });
    });

    table.querySelectorAll('.edit-level').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        const level = currentItems.find((item) => String(item.id) === String(id));
        if (level) openLevelModal(container, level);
      });
    });

    table.querySelectorAll('.delete-level').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        if (!window.confirm('هل أنت متأكد من حذف هذه الفرقة؟')) return;
        const result = await studentService.deleteLevel(id);
        if (result?.status === 'success') {
          currentItems = currentItems.filter((item) => String(item.id) !== String(id));
          renderLevels(container, currentItems.slice(0, 5));
        } else {
          alert(result.error?.message || 'حدث خطأ أثناء حذف الفرقة');
        }
      });
    });
  }

  container.innerHTML = '';
  container.appendChild(card);

  const searchInput = document.getElementById('level-search');
  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      await loadLevels(container, searchInput.value.trim());
    });
  }
}

export async function initLevelsPage(container) {
  if (!container) return;
  await loadLevels(container);
}
