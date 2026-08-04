import * as locationModule from './location.js';
import * as validation from './validation.js';
import * as notifications from './notifications.js';
import { navigateTo } from '../router.js';
import { attendanceService } from '../services/attendanceService.js';
import { settingsService } from '../services/settingsService.js';
import { studentService } from '../services/studentService.js';
import { sessionService } from '../services/sessionService.js';
import { setState } from '../state.js';
import { getDeviceFingerprint, getPublicIp } from './device.js';

function renderStudentSummary(student, session, stats) {
  const summaryParts = [];
  if (student) {
    summaryParts.push(`<strong>${student.name}</strong> — ${student.studentId}`);
    summaryParts.push(`${student.department || '-'} — ${student.level || '-'}`);
  }
  if (session) {
    summaryParts.push(`الجلسة: ${session.session_token || session.sessionToken || ''}`);
    summaryParts.push(`تاريخ الدخول: ${session.login_date || ''} ${session.login_time || ''}`);
    summaryParts.push(`تنتهي: ${session.expires_at || ''}`);
  }
  return summaryParts.join(' | ');
}

function renderStudentStats(stats) {
  if (!stats) return '';
  return `
    <div class="stats-grid">
      <div class="stat-box">إجمالي المحاضرات<br><strong>${stats.totalLectures || 0}</strong></div>
      <div class="stat-box">الحضور<br><strong>${stats.present || 0}</strong></div>
      <div class="stat-box">الغياب<br><strong>${stats.absent || 0}</strong></div>
      <div class="stat-box">نسبة الحضور<br><strong>${stats.attendanceRate || 0}%</strong></div>
    </div>
  `;
}

function showStudentPanel(student, session, stats) {
  const studentPanel = document.getElementById('studentPanel');
  const studentSummary = document.getElementById('studentSummary');
  const studentSessionStatus = document.getElementById('studentSessionStatus');
  const studentStats = document.getElementById('studentStats');
  if (!studentPanel || !studentSummary || !studentSessionStatus || !studentStats) return;

  studentPanel.style.display = 'block';
  studentSummary.innerHTML = renderStudentSummary(student, session, stats);
  studentSessionStatus.textContent = session ? 'الحالة: جلسة فعّالة لليوم' : 'الحالة: لم تُسجَّل جلسة بعد';
  studentStats.innerHTML = renderStudentStats(stats);
}

function hideStudentPanel() {
  const studentPanel = document.getElementById('studentPanel');
  if (studentPanel) studentPanel.style.display = 'none';
}

async function loadStudentSessionAndStats(studentId, studentData) {
  if (!studentId) return null;
  const [sessionRes, statsRes] = await Promise.all([
    studentService.getStudentSession({ studentId }),
    studentService.getStudentStatistics({ studentId })
  ]);

  const session = sessionRes?.status === 'success' ? sessionRes.data : null;
  const stats = statsRes?.status === 'success' ? statsRes.data : null;
  showStudentPanel(studentData, session, stats);
  return session;
}

export function generateAttendanceObject(student, session, location) {
  const now = new Date();
  return {
    attendanceId: `att-${now.getTime()}`,
    studentId: student.studentId,
    studentName: student.name,
    department: student.department,
    level: student.level,
    sessionId: session?.sessionToken || session?.session_token || session?.sessionId || null,
    sessionToken: session?.sessionToken || session?.session_token || null,
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

export async function submitAttendance(attendanceData) {
  return attendanceService.submitAttendance(attendanceData);
}

export function showSuccess() { navigateTo('dashboard.html'); }
export function showDenied(message = 'أنت خارج نطاق الجامعة.') { notifications.error(message); }
export function showDuplicate(message = 'تم تسجيل الحضور مسبقًا لهذا اليوم.') { notifications.error(message); }
export function showOffline(message = 'لا يوجد اتصال بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.') { notifications.error(message); }
export function showError(message = 'حدث خطأ. حاول مرة أخرى لاحقًا.') { notifications.error(message); }

export async function initStudentPage() {
  const form = document.querySelector('#attendance-form');
  const sessionInfoContainer = document.getElementById('sessionInfo');
  const studentPanel = document.getElementById('studentPanel');
  const studentSummary = document.getElementById('studentSummary');
  const studentSessionStatus = document.getElementById('studentSessionStatus');
  const studentStats = document.getElementById('studentStats');
  const logoutBtn = document.getElementById('studentLogoutBtn');
  const departmentSelect = document.querySelector('#department');
  const levelSelect = document.querySelector('#level');
  const studentIdInput = document.querySelector('#studentId');
  const studentCard = document.getElementById('studentCard');

  if (!form) return;

  if (sessionInfoContainer) {
    sessionInfoContainer.textContent = 'تحميل خيارات التسجيل...';
  }

  async function loadDropdownOptions() {
    const departmentsResult = await studentService.getDepartments({ active: true });
    const departments = Array.isArray(departmentsResult?.data) ? departmentsResult.data : [];

    if (departmentSelect) {
      departmentSelect.innerHTML = '<option value="">اختر القسم</option>' + departments.map((dept) => `<option value="${dept.id}" data-name="${dept.department_name}">${dept.department_name}</option>`).join('');
      departmentSelect.disabled = departments.length === 0;
    }
    if (levelSelect) {
      levelSelect.innerHTML = '<option value="">اختر القسم أولاً</option>';
      levelSelect.disabled = true;
    }

    if (sessionInfoContainer) {
      sessionInfoContainer.textContent = departments.length
        ? 'أدخل بياناتك ثم اضغط تسجيل الحضور.'
        : 'لم يتم إعداد الأقسام بعد. تواصل مع الإدارة.';
    }
  }

  async function loadLevelOptions(departmentId) {
    const levelsResult = await studentService.getLevels({ department_id: departmentId, active: true });
    const levels = Array.isArray(levelsResult?.data) ? levelsResult.data : [];
    if (levelSelect) {
      levelSelect.innerHTML = '<option value="">اختر الفرقة</option>' + levels.map((level) => `<option value="${level.level_name}">${level.level_name}</option>`).join('');
      levelSelect.disabled = levels.length === 0;
    }
  }

  async function restoreSessionFromStudentId(studentId) {
    const sessionResponse = await studentService.getStudentSession({ studentId });
    if (sessionResponse?.status === 'success' && sessionResponse.data) {
      const session = sessionResponse.data;
      localStorage.setItem('student_session_token', session.session_token || session.sessionToken || '');
      const studentRes = await studentService.getStudent(session.student_id);
      if (studentRes?.status === 'success') {
        const student = studentRes.data;
        if (studentIdInput) studentIdInput.value = student.studentId || studentIdInput.value;
        const nameInput = document.querySelector('#studentName');
        const departmentInput = document.querySelector('#department');
        const levelInput = document.querySelector('#level');
        if (nameInput) nameInput.value = student.name || '';
        if (departmentInput) {
          const option = Array.from(departmentInput.options).find((opt) => opt.text === student.department);
          if (option) {
            departmentInput.value = option.value;
            await loadLevelOptions(option.value);
          }
        }
        if (levelInput) levelInput.value = student.level || '';
        await loadStudentSessionAndStats(student.studentId, student);
      }
      return session;
    }
    return null;
  }

  let currentLecture = null;

  async function initializeStudentForm() {
    await loadDropdownOptions();

    const activeSessionRes = await sessionService.getActiveSession();
    if (activeSessionRes?.status === 'success' && activeSessionRes.data) {
      currentLecture = activeSessionRes.data;
      if (sessionInfoContainer) {
        const subject = currentLecture.subject_name || currentLecture.session_id || 'المحاضرة الحالية';
        sessionInfoContainer.textContent = `المحاضرة الحالية: ${subject}. اختر بياناتك ثم اضغط تسجيل الحضور.`;
      }
    } else if (sessionInfoContainer) {
      sessionInfoContainer.textContent = 'لا توجد محاضرة حالية. تواصل مع الإدارة.';
      form.querySelector('button[type="submit"]').disabled = true;
    }

    const savedToken = localStorage.getItem('student_session_token');
    if (savedToken) {
      const sessionRes = await studentService.getStudentSession({ sessionToken: savedToken });
      if (sessionRes?.status === 'success' && sessionRes.data) {
        localStorage.setItem('student_session_token', sessionRes.data.session_token || sessionRes.data.sessionToken || '');
        window.location.href = 'dashboard.html';
        return;
      }
      localStorage.removeItem('student_session_token');
    }
  }

  if (departmentSelect) {
    departmentSelect.addEventListener('change', async () => {
      const departmentId = departmentSelect.value;
      if (departmentId) {
        await loadLevelOptions(departmentId);
      } else if (levelSelect) {
        levelSelect.innerHTML = '<option value="">اختر القسم أولاً</option>';
        levelSelect.disabled = true;
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setState('attendance', { validationErrors: [] });
    notifications.loading(true, 'جاري معالجة طلب الحضور...');

    if (!navigator.onLine) {
      notifications.loading(false);
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
      notifications.loading(false);
      setState('attendance', { validationErrors: ['يرجى إكمال جميع الحقول بشكل صحيح.'] });
      notifications.error('يرجى إكمال جميع الحقول بشكل صحيح.');
      return;
    }

    if (!student.department || !student.level) {
      notifications.loading(false);
      notifications.error('يرجى اختيار القسم والمستوى من القائمة الثابتة.');
      return;
    }

    const existingSessionRes = await studentService.getStudentSession({ studentId: student.studentId });
    if (existingSessionRes?.status === 'success' && existingSessionRes.data) {
      localStorage.setItem('student_session_token', existingSessionRes.data.session_token || existingSessionRes.data.sessionToken || '');
      window.location.href = 'dashboard.html';
      return;
    }

    if (!currentLecture) {
      notifications.loading(false);
      notifications.error('لا توجد محاضرة حالية. تواصل مع الإدارة.');
      return;
    }

    let currentLocation;
    try {
      currentLocation = await locationModule.getCurrentLocation();
      locationModule.showLocationStatus('تم التحقق من الموقع.', true);
    } catch (error) {
      notifications.loading(false);
      showError();
      return;
    }

    const lectureLatitude = Number(currentLecture.latitude || 0);
    const lectureLongitude = Number(currentLecture.longitude || 0);
    const gpsRadius = Number(currentLecture.radius || 300);

    if (!Number.isFinite(lectureLatitude) || !Number.isFinite(lectureLongitude) || lectureLatitude === 0 || lectureLongitude === 0) {
      notifications.loading(false);
      notifications.error('إعدادات مكان المحاضرة غير مكتملة. تواصل مع الإدارة.');
      showError();
      return;
    }

    const radiusCheck = locationModule.isInsideRadius(
      currentLocation,
      {
        latitude: lectureLatitude,
        longitude: lectureLongitude
      },
      gpsRadius
    );

    if (!radiusCheck.inside) {
      notifications.loading(false);
      locationModule.showLocationStatus(`أنت خارج نطاق الجامعة. المسافة ${Math.round(radiusCheck.distance)} متر.`, false);
      showDenied();
      return;
    }

    const fingerprint = getDeviceFingerprint();
    const publicIp = await getPublicIp();

    const selectedDepartmentOption = departmentSelect?.selectedOptions?.[0];
    const departmentName = selectedDepartmentOption?.dataset?.name || departmentSelect?.value || '';
    const loginPayload = {
      studentId: student.studentId,
      name: student.name,
      department: departmentName,
      level: student.level,
      sessionId: currentLecture.session_id || '',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      deviceFingerprint: fingerprint,
      publicIp,
      userAgent: navigator.userAgent
    };

    const loginResult = await studentService.loginStudent(loginPayload);
    if (loginResult?.status !== 'success') {
      notifications.loading(false);
      const errorCode = loginResult?.error?.code;
      if (errorCode === 'out_of_range') {
        locationModule.showLocationStatus('أنت خارج نطاق الجامعة.', false);
        showDenied();
        return;
      }
      if (errorCode === 'device_in_use') {
        notifications.error(loginResult.error.message || 'هذا الجهاز مستخدم بالفعل بواسطة طالب آخر اليوم.');
        return;
      }
      if (errorCode === 'device_mismatch') {
        notifications.error(loginResult.error.message || 'تم تغيير الجهاز، مطلوب التحقق.');
        return;
      }
      notifications.error(loginResult?.error?.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.');
      return;
    }

    const studentSession = loginResult.data;
    setState('studentSession', studentSession);
    localStorage.setItem('student_session_token', studentSession.session_token || studentSession.sessionToken || '');

    const attendanceLocation = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      distance: Math.round(radiusCheck.distance)
    };

    const attendanceData = generateAttendanceObject(student, studentSession, attendanceLocation);
    const apiResult = await submitAttendance(attendanceData);
    notifications.loading(false);

    if (apiResult.status === 'success') {
      setState('attendance', { currentAttendance: attendanceData, submissionResult: apiResult });
      showSuccess();
    } else {
      if (apiResult.error && apiResult.error.code === 'duplicate_attendance') {
        showDuplicate();
        return;
      }
      notifications.error(apiResult.error?.message || 'فشل إرسال بيانات الحضور. حاول مرة أخرى.');
    }
  });

  await initializeStudentForm();

  if (studentIdInput) {
    studentIdInput.addEventListener('blur', async () => {
      const sid = studentIdInput.value.trim();
      if (!sid) {
        if (studentCard) studentCard.innerHTML = '';
        hideStudentPanel();
        return;
      }
      try {
        notifications.loading(true, 'جاري البحث عن الطالب...');
        const sessionResponse = await studentService.getStudentSession({ studentId: sid });
        if (sessionResponse?.status === 'success' && sessionResponse.data) {
          localStorage.setItem('student_session_token', sessionResponse.data.session_token || sessionResponse.data.sessionToken || '');
          window.location.href = 'dashboard.html';
          return;
        }

        const res = await studentService.getStudent(sid);
        if (res && res.status === 'success' && studentCard) {
          const st = res.data;
          studentCard.innerHTML = `<div class="student-info"><strong>${st.name}</strong> — ${st.studentId}<br>${st.department || '-'} — ${st.level || '-'}<br><button id="useStudentBtn" class="btn btn-secondary">استخدام هذه البيانات</button></div>`;
          const useBtn = document.getElementById('useStudentBtn');
          if (useBtn) {
            useBtn.addEventListener('click', async (ev) => {
              ev.preventDefault();
              const nameInput = document.querySelector('#studentName');
              const departmentInput = document.querySelector('#department');
              const levelInput = document.querySelector('#level');
              if (nameInput) nameInput.value = st.name || '';
              if (departmentInput) {
                const option = Array.from(departmentInput.options).find((opt) => opt.text === st.department);
                if (option) {
                  departmentInput.value = option.value;
                  await loadLevelOptions(option.value);
                }
              }
              if (levelInput) levelInput.value = st.level || '';
              await loadStudentSessionAndStats(st.studentId, st);
            });
          }
          await loadStudentSessionAndStats(st.studentId, st);
        } else if (studentCard) {
          studentCard.innerHTML = `<div class="student-info error">لم يتم العثور على الطالب.</div>`;
          hideStudentPanel();
        }
      } catch (e) {
        if (studentCard) studentCard.innerHTML = `<div class="student-info error">خطأ أثناء البحث.</div>`;
        hideStudentPanel();
      } finally {
        notifications.loading(false);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const token = localStorage.getItem('student_session_token');
      if (token) {
        try {
          await studentService.logoutStudent({ sessionToken: token });
        } catch (error) {
          console.warn('Student logout API failed:', error);
        }
      }
      localStorage.removeItem('student_session_token');
      hideStudentPanel();
      window.location.reload();
    });
  }
}
