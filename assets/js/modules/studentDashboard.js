import { studentService } from '../services/studentService.js';
import { attendanceService } from '../services/attendanceService.js';
import * as locationModule from './location.js';
import * as notifications from './notifications.js';
import { sessionService } from '../services/sessionService.js';

const STATUS_LABELS = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب'
};

function initials(name) {
  if (!name) return '؟';
  const parts = String(name).trim().split(/\s+/);
  return parts[0]?.charAt(0) || '؟';
}

function normalizeStudent(student = {}) {
  return {
    ...student,
    studentId: student.studentId || student.student_id || student.id || '',
    name: student.name || student.student_name || '',
    department: student.department || student.student_department || '',
    level: student.level || student.student_level || ''
  };
}

function normalizeSession(session = {}) {
  return {
    ...session,
    login_date: session.login_date || session.loginDate || session.date || '',
    login_time: session.login_time || session.loginTime || session.time || '',
    expires_at: session.expires_at || session.expiresAt || ''
  };
}

function formatDatePart(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(date);
}

function formatTimePart(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function attendanceRow(item) {
  const statusKey = String(item.status || '').toLowerCase();
  const label = STATUS_LABELS[statusKey] || item.status || '-';
  const badgeClass = ['present', 'late', 'absent'].includes(statusKey) ? statusKey : 'absent';
  const distance = item.distance !== undefined && item.distance !== null ? `${Math.round(item.distance)} م` : '-';

  return `
    <tr>
      <td class="mono" data-label="التاريخ">${formatDatePart(item.date)}</td>
      <td class="mono" data-label="الوقت">${formatTimePart(item.time)}</td>
      <td data-label="الحالة"><span class="status-badge ${badgeClass}">${label}</span></td>
      <td class="mono" data-label="المسافة">${distance}</td>
    </tr>
  `;
}

function createDashboardContent(student, session, stats, attendanceRecords) {
  const normalizedStudent = normalizeStudent(student);
  const normalizedSession = normalizeSession(session);
  const attendanceRows = attendanceRecords.map(attendanceRow).join('');
  const rate = Number(stats.attendanceRate || 0);
  const CIRCUMFERENCE = 339.3;
  const offset = CIRCUMFERENCE - (Math.min(Math.max(rate, 0), 100) / 100) * CIRCUMFERENCE;

  return `
    <section class="student-dashboard">
      <header class="sd-header">
        <div class="sd-eyebrow"><span class="dot"></span> لوحة الطالب</div>
        <div class="sd-id-row">
          <div class="sd-avatar">${initials(normalizedStudent.name)}</div>
          <div class="sd-id-main">
            <h1 class="sd-name">${normalizedStudent.name || '-'}</h1>
            <div class="sd-chips">
              <span class="sd-chip">رقم الطالب <b class="mono">${normalizedStudent.studentId || '—'}</b></span>
              <span class="sd-chip">القسم <b>${normalizedStudent.department || '-'}</b></span>
              <span class="sd-chip">المستوى <b>${normalizedStudent.level || '-'}</b></span>
            </div>
          </div>
        </div>
        <div class="sd-session-pill">
          <span>دخلت الجلسة <b class="mono">${formatDatePart(normalizedSession.login_date)} · ${formatTimePart(normalizedSession.login_time)}</b></span>
          <span>تنتهي الجلسة <b class="mono">${formatDatePart(normalizedSession.expires_at)} · ${formatTimePart(normalizedSession.expires_at)}</b></span>
        </div>
      </header>

      <div class="sd-stats-card">
        <div class="sd-ring-wrap">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle class="sd-ring-track" cx="64" cy="64" r="54" fill="none" stroke-width="12"></circle>
            <circle class="sd-ring-progress" cx="64" cy="64" r="54" fill="none" stroke-width="12"
              stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}"></circle>
          </svg>
          <div class="sd-ring-center">
            <div class="sd-ring-pct">${rate}%</div>
            <div class="sd-ring-label">نسبة الحضور</div>
          </div>
        </div>
        <div class="sd-stat-list">
          <div class="sd-stat-row">
            <span class="sd-stat-name">إجمالي المحاضرات</span>
            <span class="sd-stat-value">${stats.totalLectures || 0}</span>
          </div>
          <div class="sd-stat-row">
            <span class="sd-stat-name">عدد مرات الحضور</span>
            <span class="sd-stat-value">${stats.present || 0}</span>
          </div>
        </div>
      </div>

      <div class="sd-action">
        <button id="checkInBtn" class="btn-checkin">
          <span class="pin"></span>
          تسجيل الحضور الآن
        </button>
      </div>

      <div class="sd-log-card">
        <div class="sd-log-head">
          <h2 class="sd-log-title">سجل الحضور</h2>
          <span class="sd-log-count">${attendanceRecords.length} سجل</span>
        </div>
        ${attendanceRecords.length ? `
          <table class="sd-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>الحالة</th>
                <th>المسافة</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceRows}
            </tbody>
          </table>
        ` : `<div class="sd-empty">لا توجد سجلات حضور بعد</div>`}
      </div>
    </section>
  `;
}

export async function initStudentDashboardPage() {
  const container = document.querySelector('#studentDashboardContainer');
  if (!container) return;

  const token = localStorage.getItem('student_session_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const sessionRes = await studentService.getStudentSession({ sessionToken: token });
  if (sessionRes?.status !== 'success' || !sessionRes.data) {
    window.location.href = 'index.html';
    return;
  }

  const session = normalizeSession(sessionRes.data);
  const studentId = session.student_id || session.studentId || '';

  const studentRes = await studentService.getStudent(studentId);
  const statsRes = await studentService.getStudentStatistics({ studentId });
  const attendanceRes = await studentService.getStudentAttendance({ studentId });

  if (studentRes?.status !== 'success') {
    window.location.href = 'index.html';
    return;
  }

  const student = normalizeStudent(studentRes.data);
  const stats = statsRes?.status === 'success' ? statsRes.data : { totalLectures: 0, present: 0, absent: 0, attendanceRate: 0 };
  const attendanceRecords = attendanceRes?.status === 'success' ? attendanceRes.data : [];

  container.innerHTML = createDashboardContent(student, session, stats, attendanceRecords);

  const checkInBtn = document.querySelector('#checkInBtn');
  if (checkInBtn) {
    checkInBtn.addEventListener('click', async () => {
      checkInBtn.disabled = true;
      notifications.loading(true, 'جاري استخدام موقعك لتسجيل الحضور...');
      try {
        const currentLocation = await locationModule.getCurrentLocation();
        const activeSessionRes = await sessionService.getActiveSession();
        const activeSession = activeSessionRes?.status === 'success' ? activeSessionRes.data : null;

        if (!activeSession) {
          notifications.error('لا توجد محاضرة حالية.');
          notifications.loading(false);
          checkInBtn.disabled = false;
          return;
        }

        const lectureLatitude = Number(activeSession.latitude || 0);
        const lectureLongitude = Number(activeSession.longitude || 0);
        const gpsRadius = Number(activeSession.radius || 300);
        const radiusCheck = locationModule.isInsideRadius(
          currentLocation,
          { latitude: lectureLatitude, longitude: lectureLongitude },
          gpsRadius
        );

        if (!radiusCheck.inside) {
          notifications.error(`أنت خارج نطاق الجامعة. المسافة ${Math.round(radiusCheck.distance)} متر.`);
          notifications.loading(false);
          checkInBtn.disabled = false;
          return;
        }

        const now = new Date();
        const attendancePayload = {
          studentId: student.studentId,
          studentName: student.name,
          department: student.department,
          level: student.level,
          sessionToken: session.session_token || session.sessionToken || '',
          date: new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Africa/Cairo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(now),
          time: new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Africa/Cairo',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).format(now),
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          status: 'present'
        };

        const attendResult = await attendanceService.submitAttendance(attendancePayload);
        notifications.loading(false);

        if (attendResult.status === 'success') {
          window.location.reload();
          return;
        }

        checkInBtn.disabled = false;
        if (attendResult.error?.code === 'duplicate_attendance') {
          notifications.error('لقد تم تسجيل حضورك مسبقًا لهذا اليوم.');
          return;
        }

        notifications.error(attendResult.error?.message || 'تعذر تسجيل الحضور. حاول مرة أخرى.');
      } catch (error) {
        notifications.loading(false);
        checkInBtn.disabled = false;
        notifications.error(error.message || 'تعذر الحصول على الموقع.');
      }
    });
  }
}
