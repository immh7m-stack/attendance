import { studentService } from '../services/studentService.js';
import { attendanceService } from '../services/attendanceService.js';
import * as notifications from './notifications.js';
import { createCard, createSearchBox, createTable, createPagination, createEmptyState, createLoader, createErrorState } from './components.js';

let currentItems = [];
let currentPage = 1;
let currentAttendanceSummary = new Map();
let currentFilters = {
  query: '',
  department: '',
  level: '',
  attendance: 'all'
};

function normalizeStudentId(item = {}) {
  return String(item.studentId || item.student_id || item.id || '').trim();
}

function toDateKey(value) {
  if (!value && value !== 0) return '';

  const rawValue = String(value).trim();
  if (!rawValue) return '';

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(parsedDate);
}

function buildAttendanceSummary(items = []) {
  const summary = new Map();

  items.forEach((item) => {
    const studentId = normalizeStudentId(item);
    if (!studentId) return;

    const existing = summary.get(studentId) || {
      total: 0,
      present: 0,
      absent: 0,
      daysPresent: new Set(),
      allDates: new Set()
    };

    const status = String(item.status || '').trim().toLowerCase();
    const rawDate = item.date || item.session_date || item.login_date || item.attendance_date || item.created_at || item.recorded_at || item.timestamp || '';
    const dateKey = toDateKey(rawDate);

    existing.total += 1;

    if (dateKey) {
      existing.allDates.add(dateKey);
      if (status === 'present') existing.daysPresent.add(dateKey);
    }

    if (status === 'present') existing.present += 1;
    if (status === 'absent') existing.absent += 1;

    summary.set(studentId, existing);
  });

  return new Map(Array.from(summary.entries()).map(([studentId, stats]) => [
    studentId,
    {
      total: stats.total,
      present: stats.present,
      absent: stats.absent,
      daysPresent: stats.daysPresent.size,
      uniqueDays: stats.allDates.size
    }
  ]));
}

function applyAttendanceFilter(items, summary, mode = 'all') {
  if (mode === 'all') return items;

  return items.filter((item) => {
    const studentId = normalizeStudentId(item);
    const stats = summary.get(studentId) || { total: 0, present: 0, absent: 0, daysPresent: 0, uniqueDays: 0 };

    if (mode === 'logged') return stats.total > 0;
    if (mode === 'present') return stats.present > 0;
    if (mode === 'absent') return stats.absent > 0;
    if (mode === 'repeated') return stats.daysPresent > 1;
    return true;
  });
}

function applyCombinedFilters(items, filters, summary) {
  const query = String(filters.query || '').trim().toLowerCase();
  const department = String(filters.department || '').trim();
  const level = String(filters.level || '').trim();
  const attendanceMode = String(filters.attendance || 'all');

  return items.filter((item) => {
    const studentId = normalizeStudentId(item);
    const fullText = `${item.name || ''} ${studentId} ${item.department || ''} ${item.level || ''}`.toLowerCase();
    if (query && !fullText.includes(query)) return false;
    if (department && String(item.department || '') !== department) return false;
    if (level && String(item.level || '') !== level) return false;

    const stats = summary.get(studentId) || { total: 0, present: 0, absent: 0, daysPresent: 0, uniqueDays: 0 };
    if (attendanceMode === 'logged' && stats.total <= 0) return false;
    if (attendanceMode === 'present' && stats.present <= 0) return false;
    if (attendanceMode === 'absent' && stats.absent <= 0) return false;
    if (attendanceMode === 'repeated' && stats.daysPresent <= 1) return false;

    return true;
  });
}

function buildRows(items, summary = new Map()) {
  return items.map((item) => {
    const studentId = normalizeStudentId(item);
    const stats = summary.get(studentId) || { total: 0, present: 0, absent: 0, daysPresent: 0, uniqueDays: 0 };
    return [
      studentId || '-',
      item.name || '-',
      item.faculty || '-',
      item.department || '-',
      item.level || '-',
      stats.total,
      stats.daysPresent,
      stats.present,
      stats.absent,
      item.status || '-'
    ];
  });
}

function getUniqueOptions(items, key) {
  return Array.from(new Set(items.map((item) => item[key] || '').filter(Boolean))).sort();
}

function renderStudents(container, items) {
  const filteredItems = applyCombinedFilters(items, currentFilters, currentAttendanceSummary);
  const card = createCard('جدول الطلاب', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  const searchBox = createSearchBox('بحث بالاسم أو الرقم...', currentFilters.query, 'student-search');
  toolbar.appendChild(searchBox);

  const departments = getUniqueOptions(currentItems, 'department');
  const levels = getUniqueOptions(currentItems, 'level');
  const filters = document.createElement('div');
  filters.className = 'toolbar-group';
  filters.innerHTML = `
    <select id="studentDepartmentFilter">
      <option value="">الكل الأقسام</option>
      ${departments.map((dept) => `<option value="${dept}" ${currentFilters.department === dept ? 'selected' : ''}>${dept}</option>`).join('')}
    </select>
    <select id="studentLevelFilter">
      <option value="">الكل المستويات</option>
      ${levels.map((level) => `<option value="${level}" ${currentFilters.level === level ? 'selected' : ''}>${level}</option>`).join('')}
    </select>
    <select id="studentAttendanceFilter">
      <option value="all" ${currentFilters.attendance === 'all' ? 'selected' : ''}>الكل</option>
      <option value="logged" ${currentFilters.attendance === 'logged' ? 'selected' : ''}>سجل دخول</option>
      <option value="present" ${currentFilters.attendance === 'present' ? 'selected' : ''}>حضور</option>
      <option value="absent" ${currentFilters.attendance === 'absent' ? 'selected' : ''}>غياب</option>
      <option value="repeated" ${currentFilters.attendance === 'repeated' ? 'selected' : ''}>متكرر (أكثر من يوم)</option>
    </select>
  `;
  toolbar.appendChild(filters);
  card.querySelector('.card-body').appendChild(toolbar);

  if (!filteredItems.length) {
    card.querySelector('.card-body').appendChild(createEmptyState('لا يوجد طلاب', 'لا توجد بيانات للطلاب في هذا الوقت.'));
  } else {
    card.querySelector('.card-body').appendChild(createTable([
      'Student ID',
      'الاسم',
      'الكلية',
      'القسم',
      'المستوى',
      'إجمالي التسجيلات',
      'أيام الحضور',
      'الحضور',
      'الغياب',
      'الحالة'
    ], buildRows(filteredItems, currentAttendanceSummary)));
    card.querySelector('.card-body').appendChild(createPagination(currentPage, Math.max(1, Math.ceil(filteredItems.length / 5)), (page) => {
      currentPage = page;
      const start = (page - 1) * 5;
      renderStudents(container, currentItems.slice(start, start + 5));
    }));
  }

  container.innerHTML = '';
  container.appendChild(card);

  const searchInput = document.getElementById('student-search');
  const departmentFilter = document.getElementById('studentDepartmentFilter');
  const levelFilter = document.getElementById('studentLevelFilter');
  const attendanceFilter = document.getElementById('studentAttendanceFilter');

  const applyFilters = () => {
    notifications.loading(true, 'جاري تطبيق الفلتر وجلب البيانات المفلترة...');

    currentFilters.query = searchInput?.value.trim() || '';
    currentFilters.department = departmentFilter?.value || '';
    currentFilters.level = levelFilter?.value || '';
    currentFilters.attendance = attendanceFilter?.value || 'all';
    currentPage = 1;
    renderStudents(container, currentItems);

    setTimeout(() => {
      notifications.loading(false);
      notifications.success('تم تطبيق الفلتر بنجاح.');
    }, 350);
  };

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
  if (levelFilter) levelFilter.addEventListener('change', applyFilters);
  if (attendanceFilter) attendanceFilter.addEventListener('change', applyFilters);
}

export async function initStudentsPage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(createLoader('جاري جلب البيانات لعرضها. الرجاء الانتظار...'));

  try {
    const [studentsResult, attendanceResult] = await Promise.all([
      studentService.getStudents({ page: 1, pageSize: 250 }),
      attendanceService.getAttendance({ page: 1, pageSize: 5000 })
    ]);

    const items = studentsResult?.status === 'success' ? studentsResult.data : [];
    currentItems = items;
    currentAttendanceSummary = buildAttendanceSummary(attendanceResult?.status === 'success' ? attendanceResult.data : []);
    renderStudents(container, items.slice(0, 5));
  } catch (error) {
    container.innerHTML = '';
    container.appendChild(createErrorState('تعذر جلب البيانات. يرجى المحاولة مرة أخرى.'));
  }
}

export async function getStudents(filters = {}) { return studentService.getStudents(filters); }
export async function searchStudent(query) { return studentService.searchStudents(query); }
export async function updateStudent(id, data) { return studentService.updateStudent(id, data); }
export async function deleteStudent(id) { return studentService.deleteStudent(id); }
export async function addStudent(data) { return studentService.createStudent(data); }
export function importExcel() { return false; }
export function exportExcel() { return null; }
