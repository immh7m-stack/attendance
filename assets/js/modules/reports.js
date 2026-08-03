import { reportService } from '../services/reportService.js';
import { createCard, createTable, createEmptyState } from './components.js';

export async function initReportsPage(container) {
  if (!container) return;

  const result = await reportService.getReports('daily');
  const reportData = result?.status === 'success' ? result.data : null;
  if (!reportData) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('لا توجد تقارير', 'لا توجد تقارير متاحة حاليًا.'));
    return;
  }

  const summary = reportData.summary || {};
  const items = reportData.items || [];

  const card = createCard('التقارير', '');
  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-box">إجمالي الطلاب<br><strong>${summary.totalStudents || 0}</strong></div>
      <div class="stat-box">الجلسات المفتوحة<br><strong>${summary.activeSessions || 0}</strong></div>
      <div class="stat-box">سجلات الحضور<br><strong>${summary.records || 0}</strong></div>
      <div class="stat-box">نسبة الحضور<br><strong>${Math.round(((summary.records || 0) / Math.max(summary.totalStudents || 1, 1)) * 100)}%</strong></div>
    </div>
  `;

  card.querySelector('.card-body').innerHTML = statsHtml;

  if (items.length) {
    card.querySelector('.card-body').appendChild(createTable(
      ['الفترة', 'عدد الحضور'],
      items.map((item) => [item.period, item.count])
    ));
  } else {
    card.querySelector('.card-body').appendChild(createEmptyState('لا توجد بيانات تقارير', 'لا توجد بيانات كافية لعرض التقرير.'));
  }

  container.innerHTML = '';
  container.appendChild(card);
}
