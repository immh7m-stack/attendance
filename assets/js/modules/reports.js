import { reportService } from '../services/reportService.js';
import { createCard, createEmptyState } from './components.js';

export async function initReportsPage(container) {
  if (!container) return;
  const result = await reportService.getReports('daily');
  const reports = result?.status === 'success' ? result.data : [];
  if (!reports.length) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('لا توجد تقارير', 'لا توجد تقارير متاحة حاليًا.'));
    return;
  }

  const card = createCard('التقارير', '');
  card.querySelector('.card-body').innerHTML = `
    <div class="stats-grid">
      <div class="stat-box">Daily Report<br><strong>${reports[0].present}/${reports[0].absent}</strong></div>
      <div class="stat-box">Weekly Report<br><strong>2</strong></div>
      <div class="stat-box">Monthly Report<br><strong>8</strong></div>
      <div class="stat-box">Attendance Rate<br><strong>${reports[0].percentage}%</strong></div>
    </div>
    <div class="table-card">
      <h4>Department Comparison</h4>
      <p>علوم الحاسوب: 66%</p>
      <p>تقنية المعلومات: 33%</p>
    </div>
  `;
  container.innerHTML = '';
  container.appendChild(card);
}
