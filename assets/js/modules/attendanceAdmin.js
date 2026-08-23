import { attendanceService } from '../services/attendanceService.js';
import * as notifications from './notifications.js';
import { createCard, createSearchBox, createTable, createPagination, createEmptyState, createLoader, createErrorState, formatDateCell, formatTimeCell } from './components.js';

let currentPage = 1;
let currentItems = [];
let currentFilters = {
  query: '',
  department: '',
  level: '',
  status: 'all'
};

function getStudentDisplayName(item = {}) {
  return item.studentName || item.student_name || item.name || item.studentId || item.student_id || '-';
}

function normalizeValue(value) {
  return String(value ?? '').trim();
}

function getUniqueOptions(items, key) {
  return Array.from(new Set(items.map((item) => normalizeValue(item[key]).replace(/\s+/g, ' ')).filter(Boolean))).sort();
}

function applyCombinedFilters(items, filters) {
  const query = String(filters.query || '').trim().toLowerCase();
  const department = String(filters.department || '').trim();
  const level = String(filters.level || '').trim();
  const status = String(filters.status || 'all').trim().toLowerCase();

  return items.filter((item) => {
    const studentName = getStudentDisplayName(item).toLowerCase();
    const studentId = normalizeValue(item.studentId || item.student_id).toLowerCase();
    const departmentValue = normalizeValue(item.department || item.studentDepartment || item.faculty || item.dept).toLowerCase();
    const levelValue = normalizeValue(item.level || item.studentLevel || item.classLevel).toLowerCase();
    const recordStatus = normalizeValue(item.status).toLowerCase();

    const queryText = `${studentName} ${studentId} ${departmentValue} ${levelValue}`;
    if (query && !queryText.includes(query)) return false;
    if (department && departmentValue !== department.toLowerCase()) return false;
    if (level && levelValue !== level.toLowerCase()) return false;
    if (status !== 'all' && recordStatus !== status) return false;

    return true;
  });
}

function buildRows(items) {
  return items.map((item) => [
    getStudentDisplayName(item),
    item.studentId || item.student_id || '-',
    item.sessionId || item.session_id || '-',
    formatDateCell(item.date),
    formatTimeCell(item.time),
    item.status || '-',
    item.distance !== undefined ? item.distance : '-',
  ]);
}

function renderAttendance(container, items = currentItems) {
  const filteredItems = applyCombinedFilters(items, currentFilters);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / 5));
  if (currentPage > totalPages) currentPage = 1;
  const visibleItems = filteredItems.slice((currentPage - 1) * 5, currentPage * 5);

  const card = createCard('سجل الحضور', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  const searchBox = createSearchBox('بحث بالاسم أو الرقم...', currentFilters.query, 'attendance-search');
  toolbar.appendChild(searchBox);

  const departments = getUniqueOptions(currentItems, 'department');
  const levels = getUniqueOptions(currentItems, 'level');
  const filters = document.createElement('div');
  filters.className = 'toolbar-group';
  filters.innerHTML = `
    <select id="attendanceDepartmentFilter">
      <option value="">الكل الأقسام</option>
      ${departments.map((dept) => `<option value="${dept}" ${currentFilters.department === dept ? 'selected' : ''}>${dept}</option>`).join('')}
    </select>
    <select id="attendanceLevelFilter">
      <option value="">الكل المستويات</option>
      ${levels.map((lvl) => `<option value="${lvl}" ${currentFilters.level === lvl ? 'selected' : ''}>${lvl}</option>`).join('')}
    </select>
    <select id="attendanceStatusFilter">
      <option value="all" ${currentFilters.status === 'all' ? 'selected' : ''}>الكل</option>
      <option value="present" ${currentFilters.status === 'present' ? 'selected' : ''}>حضور</option>
      <option value="absent" ${currentFilters.status === 'absent' ? 'selected' : ''}>غياب</option>
      <option value="late" ${currentFilters.status === 'late' ? 'selected' : ''}>متأخر</option>
    </select>
    <button type="button" id="attendanceApplyFiltersBtn" class="btn btn-primary">تطبيق الفلتر</button>
    <button type="button" id="attendanceResetFiltersBtn" class="btn btn-ghost">إعادة تعيين</button>
  `;
  toolbar.appendChild(filters);
  card.querySelector('.card-body').appendChild(toolbar);

  if (!filteredItems.length) {
    card.querySelector('.card-body').appendChild(createEmptyState('لا توجد نتائج', 'لا توجد سجلات تطابق الفلاتر المختارة.'));
  } else {
    card.querySelector('.card-body').appendChild(createTable([
      'اسم الطالب',
      'Student ID',
      'Session ID',
      'التاريخ',
      'الوقت',
      'الحالة',
      'المسافة (متر)'
    ], buildRows(visibleItems)));
    card.querySelector('.card-body').appendChild(createPagination(currentPage, totalPages, (page) => {
      currentPage = page;
      renderAttendance(container, currentItems);
    }));
  }

  container.innerHTML = '';
  container.appendChild(card);

  const searchInput = document.getElementById('attendance-search');
  const departmentFilter = document.getElementById('attendanceDepartmentFilter');
  const levelFilter = document.getElementById('attendanceLevelFilter');
  const statusFilter = document.getElementById('attendanceStatusFilter');
  const applyButton = document.getElementById('attendanceApplyFiltersBtn');
  const resetButton = document.getElementById('attendanceResetFiltersBtn');

  const applyFilters = () => {
    currentFilters.query = searchInput?.value.trim() || '';
    currentFilters.department = departmentFilter?.value || '';
    currentFilters.level = levelFilter?.value || '';
    currentFilters.status = statusFilter?.value || 'all';
    currentPage = 1;

    container.innerHTML = '';
    container.appendChild(createLoader('جاري تطبيق الفلتر وجلب بيانات الحضور...'));

    setTimeout(() => {
      renderAttendance(container, currentItems);
      notifications.success('تم تطبيق الفلتر بنجاح.');
    }, 350);
  };

  const resetFilters = () => {
    currentFilters = { query: '', department: '', level: '', status: 'all' };
    if (searchInput) searchInput.value = '';
    if (departmentFilter) departmentFilter.value = '';
    if (levelFilter) levelFilter.value = '';
    if (statusFilter) statusFilter.value = 'all';
    currentPage = 1;
    renderAttendance(container, currentItems);
  };

  if (searchInput) searchInput.addEventListener('input', () => {
    currentFilters.query = searchInput.value.trim();
    currentPage = 1;
    renderAttendance(container, currentItems);
  });
  if (applyButton) applyButton.addEventListener('click', applyFilters);
  if (resetButton) resetButton.addEventListener('click', resetFilters);
}

export async function initAttendancePage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(createLoader('جاري جلب البيانات لعرضها. الرجاء الانتظار...'));

  try {
    const result = await attendanceService.getAttendance({ page: 1, pageSize: 5000 });
    const items = result?.status === 'success' ? result.data : [];
    currentItems = items;
    renderAttendance(container, items);
  } catch (error) {
    container.innerHTML = '';
    container.appendChild(createErrorState('تعذر جلب البيانات. يرجى المحاولة مرة أخرى.'));
  }
}
