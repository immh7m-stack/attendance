import { reportService } from '../services/reportService.js';
import * as notifications from './notifications.js';
import { createCard, createTable, createEmptyState, createLoader, createErrorState } from './components.js';

let currentReportType = 'daily';
let currentDateFilter = '';

function buildReportTable(items = []) {
  return createTable(
    ['الفترة', 'عدد الحضور'],
    items.map((item) => [item.period || '-', item.count || 0])
  );
}

function renderReports(container, reportData, type = currentReportType) {
  const summary = reportData?.summary || {};
  const items = reportData?.items || [];

  const card = createCard('التقارير', '');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <select id="reportTypeFilter">
      <option value="daily" ${type === 'daily' ? 'selected' : ''}>يومي</option>
      <option value="weekly" ${type === 'weekly' ? 'selected' : ''}>أسبوعي</option>
      <option value="monthly" ${type === 'monthly' ? 'selected' : ''}>شهري</option>
    </select>
    <input id="reportDateFilter" type="date" value="${currentDateFilter}" placeholder="تاريخ" />
    <button type="button" id="reportApplyFiltersBtn" class="btn btn-primary">تطبيق الفلتر</button>
  `;
  card.querySelector('.card-body').appendChild(toolbar);

  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-box">إجمالي الطلاب<br><strong>${summary.totalStudents || 0}</strong></div>
      <div class="stat-box">الجلسات المفتوحة<br><strong>${summary.activeSessions || 0}</strong></div>
      <div class="stat-box">سجلات الحضور<br><strong>${summary.records || 0}</strong></div>
      <div class="stat-box">نسبة الحضور<br><strong>${Math.round(((summary.records || 0) / Math.max(summary.totalStudents || 1, 1)) * 100)}%</strong></div>
    </div>
  `;
  card.querySelector('.card-body').insertAdjacentHTML('beforeend', statsHtml);

  if (items.length) {
    card.querySelector('.card-body').appendChild(buildReportTable(items));
  } else {
    card.querySelector('.card-body').appendChild(createEmptyState('لا توجد بيانات تقارير', 'لا توجد بيانات كافية لعرض التقرير في هذا الفiltro.'));
  }

  container.innerHTML = '';
  container.appendChild(card);

  const reportTypeFilter = document.getElementById('reportTypeFilter');
  const reportDateFilter = document.getElementById('reportDateFilter');
  const applyButton = document.getElementById('reportApplyFiltersBtn');

  const applyFilters = async () => {
    const nextType = reportTypeFilter?.value || 'daily';
    const nextDate = reportDateFilter?.value || '';

    currentReportType = nextType;
    currentDateFilter = nextDate;

    container.innerHTML = '';
    container.appendChild(createLoader('جاري تطبيق الفلتر وجلب التقرير...'));

    try {
      const result = await reportService.getReports(nextType, nextDate);
      const data = result?.status === 'success' ? result.data : null;
      renderReports(container, data, nextType);
      notifications.success('تم تطبيق الفلتر بنجاح.');
    } catch (error) {
      notifications.error('تعذر تحديث التقرير.');
      container.innerHTML = '';
      container.appendChild(createErrorState('تعذر تحديث التقرير. يرجى المحاولة مرة أخرى.'));
    }
  };

  if (applyButton) applyButton.addEventListener('click', applyFilters);
}

export async function initReportsPage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(createLoader('جاري جلب البيانات لعرضها. الرجاء الانتظار...'));

  try {
    const result = await reportService.getReports(currentReportType, currentDateFilter);
    const reportData = result?.status === 'success' ? result.data : null;
    if (!reportData) {
      container.innerHTML = '';
      container.appendChild(createEmptyState('لا توجد تقارير', 'لا توجد تقارير متاحة حاليًا.'));
      return;
    }

    renderReports(container, reportData, currentReportType);
  } catch (error) {
    container.innerHTML = '';
    container.appendChild(createErrorState('تعذر جلب البيانات. يرجى المحاولة مرة أخرى.'));
  }
}
