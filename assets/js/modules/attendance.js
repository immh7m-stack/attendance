import * as locationModule from './location.js';
import * as validation from './validation.js';
import * as notifications from './notifications.js';
import * as storage from './storage.js';
import { getQueryParam, navigateTo } from '../router.js';
import { attendanceService } from '../services/attendanceService.js';
import { sessionService } from '../services/sessionService.js';
import { studentService } from '../services/studentService.js';
import { setState, getState } from '../state.js';

const ATTENDANCE_KEY = 'attendance_records';

export function generateAttendanceObject(student, session, location) {
  const now = new Date();
  return {
    attendanceId: `att-${now.getTime()}`,
    studentId: student.studentId,
    studentName: student.name,
    department: student.department,
    level: student.level,
    subject: session?.subject || 'Unknown',
    sessionId: session?.sessionId || null,
    latitude: location.latitude,
    longitude: location.longitude,
    distance: location.distance,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0],
    status: 'present',
    device: navigator.platform,
    browser: navigator.userAgent,
  };
}

export function checkDuplicate(studentId, sessionId) {
  const records = storage.loadData(ATTENDANCE_KEY) || [];
  return records.some((record) => record.studentId === studentId && record.sessionId === sessionId && record.date === new Date().toISOString().split('T')[0]);
}

export async function submitAttendance(attendanceData) {
  return attendanceService.submitAttendance(attendanceData);
}

export function showSuccess() { navigateTo('success.html'); }
export function showDenied() { navigateTo('denied.html'); }
export function showDuplicate() { navigateTo('duplicate.html'); }
export function showOffline() { navigateTo('offline.html'); }
export function showError() { navigateTo('error.html'); }

export async function initStudentPage() {
  const form = document.querySelector('#attendance-form');
  if (!form) return;

  // Load active session (Mock) and render summary in the Student Home Screen
  try {
    notifications.loading(true, 'جاري جلب بيانات الجلسة...');
    const res = await sessionService.getActiveSession();
    const container = document.getElementById('sessionInfo');
    if (res && res.status === 'success' && container) {
      const s = res.data;
      // store active session in state for later validation
      setState('activeSession', s);
      container.innerHTML = `<div class="session-card"><strong>${s.subjectName || s.subject || 'جلسة'}</strong> — ${s.date} ${s.start || ''} - ${s.end || ''}<br>القاعة: ${s.room || '-'} — نصف القطر: ${s.location?.radius || s.radius || 300} متر</div>`;
    } else if (container) {
      container.textContent = 'لا توجد جلسة مفتوحة حالياً.';
    }
  } catch (e) {
    const container = document.getElementById('sessionInfo');
    if (container) container.textContent = 'فشل جلب بيانات الجلسة.';
  } finally {
    notifications.loading(false);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setState('attendance', { validationErrors: [] });

    if (!navigator.onLine) {
      showOffline();
      return;
    }

    const student = {
      studentId: document.querySelector('#studentId').value.trim(),
      name: document.querySelector('#studentName').value.trim(),
      department: document.querySelector('#department').value,
      level: document.querySelector('#level').value,
    };

    if (!validation.validateAttendance(student)) {
      setState('attendance', { validationErrors: ['يرجى إكمال جميع الحقول بشكل صحيح.'] });
      notifications.error('يرجى إكمال جميع الحقول بشكل صحيح.');
      return;
    }

    const active = getState('activeSession') || null;
    const session = {
      sessionId: getQueryParam('sessionId') || (active && (active.id || active.sessionId)) || 'default-session',
      subject: getQueryParam('subject') || (active && (active.subjectName || active.subject)) || 'General',
      latitude: parseFloat(getQueryParam('lat') || (active && (active.location?.latitude || active.latitude)) || '0'),
      longitude: parseFloat(getQueryParam('lng') || (active && (active.location?.longitude || active.longitude)) || '0'),
      radius: parseInt(getQueryParam('radius') || (active && (active.location?.radius || active.radius)) || '300', 10),
    };

    if (!session.sessionId) {
      showDenied();
      return;
    }

    if (checkDuplicate(student.studentId, session.sessionId)) {
      showDuplicate();
      return;
    }

    try {
      notifications.loading(true, 'جاري إرسال بيانات الحضور...');
      const currentLocation = await locationModule.getCurrentLocation();
      locationModule.showLocationStatus('تم التحقق من الموقع.', true);
      const locationResult = locationModule.isInsideRadius(currentLocation, { latitude: session.latitude, longitude: session.longitude }, session.radius);
      if (!locationResult.inside) {
        notifications.loading(false);
        locationModule.showLocationStatus('أنت خارج نطاق الحضور.', false);
        showDenied();
        return;
      }

      const attendanceData = generateAttendanceObject(student, session, locationResult);
      const apiResult = await submitAttendance(attendanceData);
      if (apiResult.status === 'success') {
        const records = storage.loadData(ATTENDANCE_KEY) || [];
        records.push(attendanceData);
        storage.saveData(ATTENDANCE_KEY, records);
        setState('attendance', { currentAttendance: attendanceData, submissionResult: apiResult });
        notifications.loading(false);
        showSuccess();
      } else {
        notifications.loading(false);
        notifications.error(apiResult.error?.message || 'فشل إرسال بيانات الحضور. حاول مرة أخرى.');
      }
    } catch (error) {
      notifications.loading(false);
      showError();
    }
  });

  // Student lookup (Mock) — render basic info in the student card
  const studentIdInput = document.querySelector('#studentId');
  const studentCard = document.getElementById('studentCard');
  if (studentIdInput) {
    studentIdInput.addEventListener('blur', async () => {
      const sid = studentIdInput.value.trim();
      if (!sid) {
        if (studentCard) studentCard.innerHTML = '';
        return;
      }
      try {
        notifications.loading(true, 'جاري البحث عن الطالب...');
        const res = await studentService.getStudent(sid);
        if (res && res.status === 'success' && studentCard) {
          const st = res.data;
          studentCard.innerHTML = `<div class="student-info"><strong>${st.name}</strong> — ${st.studentId}<br>${st.department || '-'} — ${st.level || '-'}<br><button id="useStudentBtn" class="btn btn-secondary">استخدام هذه البيانات</button></div>`;
          const useBtn = document.getElementById('useStudentBtn');
          if (useBtn) {
            useBtn.addEventListener('click', (ev) => {
              ev.preventDefault();
              const nameInput = document.querySelector('#studentName');
              const departmentInput = document.querySelector('#department');
              const levelInput = document.querySelector('#level');
              if (nameInput) nameInput.value = st.name || '';
              if (departmentInput) departmentInput.value = st.department || '';
              if (levelInput) levelInput.value = st.level || '';
            });
          }
        } else if (studentCard) {
          studentCard.innerHTML = `<div class="student-info error">لم يتم العثور على الطالب.</div>`;
        }
      } catch (e) {
        if (studentCard) studentCard.innerHTML = `<div class="student-info error">خطأ أثناء البحث.</div>`;
      } finally {
        notifications.loading(false);
      }
    });
  }
}
