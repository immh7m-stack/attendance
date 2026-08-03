import { dashboardService } from '../services/dashboardService.js';
import { setState } from '../state.js';
import { createCard, createStatisticCard, createTable, createEmptyState } from './components.js';

export async function getStatistics() {
  const result = await dashboardService.getSummary();
  if (result.status === 'success') {
    return result.data;
  }
  return {
    totalStudents: 0,
    presentToday: 0,
    openSessions: 0,
    attendanceRate: 0,
  };
}

export async function initDashboardPage(container) {
  if (!container) return;
  const stats = await getStatistics();
  setState('admin', { summary: stats });

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  grid.appendChild(createStatisticCard('إجمالي الطلاب', stats.totalStudents, 'محدث'));
  grid.appendChild(createStatisticCard('الحضور اليوم', stats.presentToday, 'مقبول'));
  grid.appendChild(createStatisticCard('الغياب اليوم', Math.max(0, stats.totalStudents - stats.presentToday), 'محتاج مراجعة'));
  grid.appendChild(createStatisticCard('عدد الجلسات', stats.openSessions, 'نشطة'));
  grid.appendChild(createStatisticCard('الجلسة النشطة', 'برمجة الويب', 'قاعة A'));
  grid.appendChild(createStatisticCard('نسبة الحضور', `${stats.attendanceRate}%`, 'جيد'));

  const recentCard = createCard('آخر عمليات تسجيل', '');
  recentCard.querySelector('.card-body').appendChild(createTable(['الطالب', 'الوقت', 'الحالة'], [['أحمد علي', '09:12', 'حاضر'], ['سارة محمود', '09:20', 'حاضر']]));

  const sessionsCard = createCard('آخر الجلسات', '');
  sessionsCard.querySelector('.card-body').appendChild(createTable(['الجلسة', 'المادة', 'الحالة'], [['جلسة 1', 'برمجة الويب', 'مفتوحة'], ['جلسة 2', 'قواعد البيانات', 'مغلقة']]));

  const actionsCard = createCard('Quick Actions', '');
  actionsCard.querySelector('.card-body').innerHTML = '<div class="action-list"><button class="btn btn-primary">فتح جلسة جديدة</button><button class="btn btn-secondary">تصدير تقرير</button></div>';

  container.innerHTML = '';
  container.appendChild(grid);
  container.appendChild(recentCard);
  container.appendChild(sessionsCard);
  container.appendChild(actionsCard);

  const [openButton, exportButton] = actionsCard.querySelectorAll('button');
  if (openButton) {
    openButton.addEventListener('click', () => {
      window.location.href = 'sessions.html';
    });
  }
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      window.location.href = 'reports.html';
    });
  }
}
