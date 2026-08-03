import { APP_CONFIG } from '../config.js';

function getDataBasePath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  return segments.length > 1 ? '../data/' : './data/';
}

async function loadJson(fileName) {
  const response = await fetch(`${getDataBasePath()}${fileName}`);
  if (!response.ok) {
    throw new Error(`Unable to load ${fileName}`);
  }
  return response.json();
}

function delay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSuccess(data, meta = null) {
  return { status: 'success', data, ...(meta ? { meta } : {}) };
}

function createError(code, message, details = {}) {
  return {
    status: 'error',
    error: { code, message, details }
  };
}

function applyFilters(items, filters = {}) {
  return items.filter((item) => {
    if (filters.department && item.department && item.department !== filters.department) {
      return false;
    }
    if (filters.level && item.level && item.level !== filters.level) {
      return false;
    }
    if (filters.status && item.status && item.status !== filters.status) {
      return false;
    }
    if (filters.subjectId && item.subjectId && item.subjectId !== filters.subjectId) {
      return false;
    }
    if (filters.date && item.date && item.date !== filters.date) {
      return false;
    }
    if (filters.query) {
      const query = String(filters.query).toLowerCase();
      const haystack = [item.name, item.studentId, item.subjectName, item.id].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function paginate(items, page = 1, pageSize = 25) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    meta: { page, pageSize, total: items.length }
  };
}

export const mockApi = {
  async login(credentials) {
    await delay();
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      return createSuccess({
        token: 'mock-token',
        user: { id: 'admin-1', username: credentials.username, role: 'Admin' },
        expiresAt: '2026-08-01T12:00:00Z'
      });
    }
    return createError('invalid_credentials', 'بيانات الدخول غير صحيحة', { username: 'required' });
  },

  async logout() {
    await delay();
    return createSuccess({ ok: true });
  },

  async getDashboardSummary(date = null) {
    await delay();
    const [students, attendance, sessions] = await Promise.all([
      this.getStudents(),
      this.getAttendance({ date }),
      this.getSessions({ date })
    ]);
    const presentCount = attendance.data.filter((item) => item.status === 'present').length;
    const openSessions = sessions.data.filter((item) => item.status === 'open').length;
    return createSuccess({
      totalStudents: students.data.length,
      presentToday: presentCount,
      openSessions,
      attendanceRate: Math.round((presentCount / Math.max(students.data.length, 1)) * 100)
    });
  },

  async getStudents(filters = {}) {
    await delay();
    const students = await loadJson('students.json');
    const filtered = applyFilters(students, filters);
    const paged = paginate(filtered, filters.page || 1, filters.pageSize || 25);
    return createSuccess(paged.items, paged.meta);
  },

  async getStudent(studentId) {
    await delay();
    const students = await loadJson('students.json');
    const student = students.find((item) => item.studentId === studentId || item.id === studentId);
    if (!student) return createError('not_found', 'Student not found', { studentId });
    return createSuccess(student);
  },

  async createStudent(payload) {
    await delay();
    if (!payload?.studentId || !payload?.name) {
      return createError('validation_error', 'Missing required fields', { studentId: 'required', name: 'required' });
    }
    const student = { id: `st-${Date.now()}`, ...payload, status: payload.status || 'active' };
    return createSuccess(student);
  },

  async updateStudent(id, payload) {
    await delay();
    if (!id) return createError('validation_error', 'Missing id');
    return createSuccess({ id, ...payload });
  },

  async deleteStudent(id) {
    await delay();
    if (!id) return createError('validation_error', 'Missing id');
    return createSuccess({ deleted: true, id });
  },

  async getSessions(filters = {}) {
    await delay();
    const sessions = await loadJson('sessions.json');
    const filtered = applyFilters(sessions, filters);
    const paged = paginate(filtered, filters.page || 1, filters.pageSize || 25);
    return createSuccess(paged.items, paged.meta);
  },

  async getSessionActive() {
    await delay();
    const sessions = await loadJson('sessions.json');
    const active = sessions.find((item) => item.status === 'open');
    if (!active) return createError('not_found', 'No active session');
    return createSuccess(active);
  },

  async createSession(payload) {
    await delay();
    if (!payload?.subjectId || !payload?.date) {
      return createError('validation_error', 'Missing required fields');
    }
    return createSuccess({ id: `session-${Date.now()}`, status: 'open', ...payload });
  },

  async updateSession(id, payload) {
    await delay();
    if (!id) return createError('validation_error', 'Missing id');
    return createSuccess({ id, ...payload });
  },

  async closeSession(id) {
    await delay();
    if (!id) return createError('validation_error', 'Missing id');
    return createSuccess({ id, status: 'closed' });
  },

  async deleteSession(id) {
    await delay();
    if (!id) return createError('validation_error', 'Missing id');
    return createSuccess({ deleted: true, id });
  },

  async getAttendance(filters = {}) {
    await delay();
    const attendance = await loadJson('attendance.json');
    const filtered = applyFilters(attendance, filters);
    const paged = paginate(filtered, filters.page || 1, filters.pageSize || 25);
    return createSuccess(paged.items, paged.meta);
  },

  async submitAttendance(payload) {
    await delay(220);
    if (!payload?.studentId || !payload?.sessionId) {
      return createError('validation_error', 'Missing required fields', { studentId: 'required', sessionId: 'required' });
    }
    const existing = await this.getAttendance({ studentId: payload.studentId, sessionId: payload.sessionId, date: payload.date });
    if (existing.data.length) {
      return createError('duplicate_attendance', 'Duplicate attendance', { studentId: payload.studentId });
    }
    return createSuccess({ id: `att-${Date.now()}`, ...payload, status: 'present' });
  },

  async submitAttendanceBatch(payloads) {
    await delay(220);
    const accepted = [];
    const rejected = [];
    for (const payload of payloads) {
      const result = await this.submitAttendance(payload);
      if (result.status === 'success') accepted.push(result.data);
      else rejected.push(result);
    }
    return createSuccess({ accepted, rejected });
  },

  async getReports(type = 'daily', date = null) {
    await delay();
    const reports = await loadJson('reports.json');
    const filtered = reports.filter((item) => (!date || item.date === date));
    return createSuccess(filtered);
  },

  async getSettings() {
    await delay();
    const settings = await loadJson('settings.json');
    return createSuccess(settings);
  },

  async saveSettings(payload) {
    await delay();
    return createSuccess({ ...payload, updatedAt: new Date().toISOString() });
  },

  async getSubjects() {
    await delay();
    return createSuccess([{ id: 'sub-001', name: 'برمجة الويب', code: 'WEB101', status: 'active' }]);
  },

  async getDepartments() {
    await delay();
    return createSuccess([{ id: 'dept-001', name: 'علوم الحاسوب', status: 'active' }]);
  },

  async getFaculties() {
    await delay();
    return createSuccess([{ id: 'faculty-001', name: 'كلية الهندسة', status: 'active' }]);
  },

  async getAdmins() {
    await delay();
    return createSuccess([{ id: 'admin-1', username: 'admin', role: 'Admin', status: 'active' }]);
  }
};

export default mockApi;
