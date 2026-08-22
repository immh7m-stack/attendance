import { dashboardService } from '../services/dashboardService.js';
import { sessionService } from '../services/sessionService.js';
import { setState } from '../state.js';
import { createCard, createStatisticCard, createTable, createEmptyState, createLoader, createErrorState } from './components.js';

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

function getStudentDisplayName(item = {}) {
  return item.studentName || item.student_name || item.name || item.studentId || item.student_id || '-';
}

function buildAttendanceRows(items) {
  return items.map((item) => [
    getStudentDisplayName(item),
    item.studentId || item.student_id || '-',
    item.date || '-',
    item.time || '-',
    item.status || '-',
    item.distance !== undefined ? item.distance : '-',
  ]);
}

function buildSessionRows(items) {
  return items.map((item) => [
    item.subjectName || item.subject || '-',
    item.sessionId || item.session_id || '-',
    item.date || '-',
    item.start_time || item.start || '-',
    item.end_time || item.end || '-',
    item.status || '-',
  ]);
}

export async function initDashboardPage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(createLoader('جاري جلب البيانات لعرضها. الرجاء الانتظار...'));

  try {
    const stats = await getStatistics();
    setState('admin', { summary: stats });

    const attendanceResult = await dashboardService.getRecentCheckIns(5);
    const recentAttendance = attendanceResult?.status === 'success' ? attendanceResult.data : [];

    const sessionResult = await sessionService.getSessions({ page: 1, pageSize: 5 });
    const recentSessions = sessionResult?.status === 'success' ? sessionResult.data : [];

    const grid = document.createElement('div');
    grid.className = 'card-grid';
    grid.appendChild(createStatisticCard('إجمالي الطلاب', stats.totalStudents, 'محدث'));
    grid.appendChild(createStatisticCard('الحضور اليوم', stats.presentToday, 'مقبول'));
    grid.appendChild(createStatisticCard('الجلسات المفتوحة', stats.openSessions, 'نشطة'));
    grid.appendChild(createStatisticCard('نسبة الحضور', `${stats.attendanceRate}%`, 'اليومي'));

    const recentCard = createCard('آخر عمليات تسجيل', '');
    if (recentAttendance.length) {
      recentCard.querySelector('.card-body').appendChild(createTable(
        ['الطالب', 'Student ID', 'التاريخ', 'الوقت', 'الحالة', 'المسافة'],
        buildAttendanceRows(recentAttendance)
      ));
    } else {
      recentCard.querySelector('.card-body').appendChild(createEmptyState('لا توجد عمليات تسجيل', 'لم يتم تسجيل حضور مؤخراً.'));
    }

    const sessionsCard = createCard('آخر الجلسات', '');
    if (recentSessions.length) {
      sessionsCard.querySelector('.card-body').appendChild(createTable(
        ['المادة', 'Session ID', 'التاريخ', 'البداية', 'النهاية', 'الحالة'],
        buildSessionRows(recentSessions)
      ));
    } else {
      sessionsCard.querySelector('.card-body').appendChild(createEmptyState('لا توجد جلسات', 'لا توجد جلسات متاحة حالياً.'));
    }

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
  } catch (error) {
    container.innerHTML = '';
    container.appendChild(createErrorState('تعذر جلب البيانات. يرجى المحاولة مرة أخرى.'));
  }
}
