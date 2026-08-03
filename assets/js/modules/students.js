import { studentService } from '../services/studentService.js';
import { createCard, createSearchBox, createTable, createPagination, createEmptyState } from './components.js';

let currentItems = [];
let currentPage = 1;

function buildRows(items) {
  return items.map((item) => [item.studentId || '-', item.name || '-', item.faculty || '-', item.department || '-', item.level || '-', item.status || '-']);
}

function renderStudents(container, items) {
  const card = createCard('جدول الطلاب', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.appendChild(createSearchBox('بحث بالاسم أو الرقم...', '', 'student-search'));
  const filters = document.createElement('div');
  filters.className = 'toolbar-group';
  filters.innerHTML = '<select><option>الكل</option><option>علوم الحاسوب</option><option>تقنية المعلومات</option></select><select><option>الكل</option><option>Level 1</option><option>Level 2</option></select>';
  toolbar.appendChild(filters);
  card.querySelector('.card-body').appendChild(toolbar);

  if (!items.length) {
    card.querySelector('.card-body').appendChild(createEmptyState('لا يوجد طلاب', 'لا توجد بيانات Mock للطلاب في هذا الوقت.'));
  } else {
    card.querySelector('.card-body').appendChild(createTable(['Student ID', 'الاسم', 'الكلية', 'القسم', 'المستوى', 'الحالة'], buildRows(items)));
    card.querySelector('.card-body').appendChild(createPagination(currentPage, Math.max(1, Math.ceil(currentItems.length / 5)), (page) => {
      currentPage = page;
      const start = (page - 1) * 5;
      renderStudents(container, currentItems.slice(start, start + 5));
    }));
  }

  container.innerHTML = '';
  container.appendChild(card);
}

export async function initStudentsPage(container) {
  if (!container) return;
  const result = await studentService.getStudents({ page: 1, pageSize: 25 });
  const items = result?.status === 'success' ? result.data : [];
  currentItems = items;
  renderStudents(container, items.slice(0, 5));
}

export async function getStudents(filters = {}) { return studentService.getStudents(filters); }
export async function searchStudent(query) { return studentService.searchStudents(query); }
export async function updateStudent(id, data) { return studentService.updateStudent(id, data); }
export async function deleteStudent(id) { return studentService.deleteStudent(id); }
export async function addStudent(data) { return studentService.createStudent(data); }
export function importExcel() { return false; }
export function exportExcel() { return null; }
