import { studentService } from '../services/studentService.js';
import { createCard, createSearchBox, createPagination, createEmptyState, createModal } from './components.js';

let currentItems = [];
let currentPage = 1;
let sortBy = 'department_name';
let sortDirection = 'asc';

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

function buildDepartmentsTable(items) {
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead>
      <tr>
        <th data-sort="id">ID</th>
        <th data-sort="department_name">اسم القسم</th>
        <th data-sort="active">نشط</th>
        <th>إجراءات</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item) => `
        <tr data-id="${item.id}">
          <td>${item.id || '-'}</td>
          <td>${item.department_name || '-'}</td>
          <td>${String(item.active).toLowerCase() === 'true' || item.active === true ? 'نعم' : 'لا'}</td>
          <td>
            <button type="button" class="btn btn-secondary edit-department" data-id="${item.id}">تعديل</button>
            <button type="button" class="btn btn-danger delete-department" data-id="${item.id}">حذف</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  return table;
}

function openDepartmentModal(container, department = null) {
  const title = department ? 'تعديل القسم' : 'إضافة قسم جديد';
  const formContent = `
    <form class="admin-form">
      <label>اسم القسم<input id="departmentName" type="text" value="${department ? department.department_name || '' : ''}" required /></label>
      <label>نشط<input id="departmentActive" type="checkbox" ${department && String(department.active).toLowerCase() !== 'false' ? 'checked' : ''} /></label>
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = form.querySelector('#departmentName').value.trim();
    const active = form.querySelector('#departmentActive').checked;
    if (!name) return;

    let result;
    if (department && department.id) {
      result = await studentService.updateDepartment(department.id, { department_name: name, active });
    } else {
      result = await studentService.createDepartment({ department_name: name, active });
    }

    if (result?.status === 'success') {
      closeModal();
      await loadDepartments(container);
    } else {
      alert(result.error?.message || 'حدث خطأ أثناء حفظ القسم');
    }
  });

  document.body.appendChild(modal);
}

async function loadDepartments(container, query = '') {
  const params = query ? { query } : {};
  const result = await studentService.getDepartments(params);
  currentItems = result?.status === 'success' ? result.data : [];
  currentPage = 1;
  renderDepartments(container, currentItems.slice(0, 5));
}

function renderDepartments(container, items) {
  const card = createCard('إدارة الأقسام', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  const searchBox = createSearchBox('بحث بالقسم...', '', 'department-search');
  toolbar.appendChild(searchBox);

  const actionButton = createActionButton('إضافة قسم جديد', 'btn btn-primary', () => openDepartmentModal(container));
  toolbar.appendChild(actionButton);
  card.querySelector('.card-body').appendChild(toolbar);

  if (!items.length) {
    card.querySelector('.card-body').appendChild(createEmptyState('لا توجد أقسام', 'لم يتم إعداد أقسام بعد.'));
  } else {
    const sortedItems = sortItems(items);
    const table = buildDepartmentsTable(sortedItems);
    card.querySelector('.card-body').appendChild(table);
    card.querySelector('.card-body').appendChild(createPagination(currentPage, Math.max(1, Math.ceil(currentItems.length / 5)), (page) => {
      currentPage = page;
      const start = (page - 1) * 5;
      renderDepartments(container, currentItems.slice(start, start + 5));
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
        renderDepartments(container, items);
      });
    });

    table.querySelectorAll('.edit-department').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        const department = currentItems.find((item) => String(item.id) === String(id));
        if (department) openDepartmentModal(container, department);
      });
    });

    table.querySelectorAll('.delete-department').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
        const result = await studentService.deleteDepartment(id);
        if (result?.status === 'success') {
          currentItems = currentItems.filter((item) => String(item.id) !== String(id));
          renderDepartments(container, currentItems.slice(0, 5));
        } else {
          alert(result.error?.message || 'حدث خطأ أثناء حذف القسم');
        }
      });
    });
  }

  container.innerHTML = '';
  container.appendChild(card);

  const searchInput = document.getElementById('department-search');
  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      await loadDepartments(container, searchInput.value.trim());
    });
  }
}

export async function initDepartmentsPage(container) {
  if (!container) return;
  await loadDepartments(container);
}
