import { studentService } from '../services/studentService.js';
import { attendanceService } from '../services/attendanceService.js';
import * as locationModule from './location.js';
import * as notifications from './notifications.js';
import { sessionService } from '../services/sessionService.js';

function createDashboardContent(student, session, stats, attendanceRecords) {
  const attendanceRows = attendanceRecords.map((item) => `
      <tr>
        <td>${item.date || '-'}</td>
        <td>${item.time || '-'}</td>
        <td>${item.status || '-'}</td>
        <td>${item.distance !== undefined ? item.distance : '-'} متر</td>
      </tr>
    `).join('');

  return `
    <section class="student-dashboard">
      <div class="student-header">
        <h1>لوحة الطالب</h1>
        <div class="student-card-summary">
          <strong>${student.name}</strong>
          <p>رقم الطالب: ${student.studentId}</p>
          <p>القسم: ${student.department || '-'}</p>
          <p>المستوى: ${student.level || '-'}</p>
          <p>تاريخ الدخول: ${session?.login_date || '-'} ${session?.login_time || ''}</p>
          <p>تنتهي الجلسة: ${session?.expires_at || '-'}</p>
        </div>
      </div>
      <div class="student-stats-grid">
        <div class="stat-box">
          <span>إجمالي المحاضرات</span>
          <strong>${stats.totalLectures || 0}</strong>
        </div>
        <div class="stat-box">
          <span>عدد الحضور</span>
          <strong>${stats.present || 0}</strong>
        </div>
        <div class="stat-box">
          <span>نسبة الحضور</span>
          <strong>${stats.attendanceRate || 0}%</strong>
        </div>
      </div>
      <div class="student-actions">
        <button id="checkInBtn" class="btn btn-primary">تسجيل الحضور</button>
      </div>
      <div class="attendance-records">
        <h2>سجل الحضور</h2>
        <table class="table">
          <thead>
            <tr><th>التاريخ</th><th>الوقت</th><th>الحالة</th><th>المسافة</th></tr>
          </thead>
          <tbody>
            ${attendanceRows || '<tr><td colspan="4">لا توجد سجلات بعد</td></tr>'}
          </tbody>
        </table>
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

  const session = sessionRes.data;
  const studentRes = await studentService.getStudent(session.student_id);
  const statsRes = await studentService.getStudentStatistics({ studentId: session.student_id });
  const attendanceRes = await studentService.getStudentAttendance({ studentId: session.student_id });

  if (studentRes?.status !== 'success') {
    window.location.href = 'index.html';
    return;
  }

  const student = studentRes.data;
  const stats = statsRes?.status === 'success' ? statsRes.data : { totalLectures: 0, present: 0, absent: 0, attendanceRate: 0 };
  const attendanceRecords = attendanceRes?.status === 'success' ? attendanceRes.data : [];

  container.innerHTML = createDashboardContent(student, session, stats, attendanceRecords);

  const checkInBtn = document.querySelector('#checkInBtn');
  if (checkInBtn) {
    checkInBtn.addEventListener('click', async () => {
      notifications.loading(true, 'جاري استخدام موقعك لتسجيل الحضور...');
      try {
        const currentLocation = await locationModule.getCurrentLocation();
        const activeSessionRes = await sessionService.getActiveSession();
        const activeSession = activeSessionRes?.status === 'success' ? activeSessionRes.data : null;
        if (!activeSession) {
          notifications.error('لا توجد محاضرة حالية.');
          notifications.loading(false);
          return;
        }
        const lectureLatitude = Number(activeSession.latitude || 0);
        const lectureLongitude = Number(activeSession.longitude || 0);
        const gpsRadius = Number(activeSession.radius || 300);
        const radiusCheck = locationModule.isInsideRadius(currentLocation, { latitude: lectureLatitude, longitude: lectureLongitude }, gpsRadius);
        if (!radiusCheck.inside) {
          notifications.error(`أنت خارج نطاق الجامعة. المسافة ${Math.round(radiusCheck.distance)} متر.`);
          notifications.loading(false);
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
        } else {
          if (attendResult.error?.code === 'duplicate_attendance') {
            notifications.error('لقد تم تسجيل حضورك مسبقًا لهذا اليوم.');
            return;
          }
          notifications.error(attendResult.error?.message || 'تعذر تسجيل الحضور. حاول مرة أخرى.');
        }
      } catch (error) {
        notifications.loading(false);
        notifications.error(error.message || 'تعذر الحصول على الموقع.');
      }
    });
  }
}
