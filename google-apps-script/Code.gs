const SHEET_CONFIG = {
  settings: 'settings',
  students: 'students',
  sessions: 'sessions',
  attendance: 'attendance',
  logs: 'logs',
  admins: 'admins'
};

const SCRIPT_PROPERTY_SPREADSHEET_ID = 'SPREADSHEET_ID';
const DEFAULT_SPREADSHEET_ID = '1yqhDccY21PtHKJdO3c9EXXsnRt6dlomMlWZ3WvBEpzo';

function getSpreadsheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_SPREADSHEET_ID) || DEFAULT_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not configured');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet(name) {
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet not found: ${name}`);
  }
  return sheet;
}

function parseSheet(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return { headers: [], rows: [] };
  const headers = values[0].map(String);
  const rows = values.slice(1).map((row, rowIndex) => {
    const item = { __rowNum: rowIndex + 2 };
    headers.forEach((header, colIndex) => {
      item[header] = row[colIndex] === undefined ? '' : row[colIndex];
    });
    return item;
  });
  return { headers, rows };
}

function toSnakeCase(value) {
  return String(value || '').replace(/([A-Z])/g, '_$1').toLowerCase();
}

function toCamelCase(value) {
  return String(value || '').replace(/_([a-zA-Z])/g, (match, char) => char.toUpperCase());
}

function getRowValue(row, key) {
  const variants = [key, toSnakeCase(key), toCamelCase(key), String(key || '').toLowerCase()];
  for (const variant of variants) {
    if (Object.prototype.hasOwnProperty.call(row, variant) && row[variant] !== undefined) {
      return row[variant];
    }
  }
  return undefined;
}

function getRecordValue(record, key) {
  return getRowValue(record, key);
}

function setCorsHeaders(output) {
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

function jsonResponse(payload, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  output.setResponseCode(statusCode);
  return setCorsHeaders(output);
}

function createSuccess(data, meta = null) {
  const payload = { status: 'success', data };
  if (meta) payload.meta = meta;
  return payload;
}

function createError(code, message, details = {}) {
  return {
    status: 'error',
    error: { code, message, details }
  };
}

function handleLogin(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();
  if (!username || !password) return createError('validation_error', 'username and password are required');
  const admins = getEntityRows(SHEET_CONFIG.admins, {});
  const admin = admins.find((a) => String(getRowValue(a, 'username')) === username && String(getRowValue(a, 'password')) === password);
  if (!admin) return createError('invalid_credentials', 'بيانات الدخول غير صحيحة');
  const user = { id: getRowValue(admin, 'id') || getRowValue(admin, 'username'), username: getRowValue(admin, 'username'), role: getRowValue(admin, 'role') || 'Admin' };
  // generate a simple token
  const token = generateId('token');
  return createSuccess({ token, user });
}

function sendResponse(result) {
  if (!result || typeof result !== 'object') {
    return jsonResponse(createSuccess(result));
  }
  if (result.status === 'error' || result.status === 'success') {
    return jsonResponse(result);
  }
  return jsonResponse(createSuccess(result));
}

function filterRows(rows, filters) {
  if (!filters) return rows;
  return rows.filter((row) => {
    return Object.keys(filters).every((key) => {
      const value = filters[key];
      if (value === undefined || value === null || value === '') return true;
      if (key === 'query') {
        const haystack = Object.values(row).join(' ').toLowerCase();
        return String(value).toLowerCase().split(' ').every((term) => haystack.includes(term));
      }
      const rowValue = getRowValue(row, key);
      return String(rowValue || '').toLowerCase().includes(String(value).toLowerCase());
    });
  });
}

function paginate(rows, page, pageSize) {
  const currentPage = Number(page) || 1;
  const size = Number(pageSize) || 25;
  const start = (currentPage - 1) * size;
  return {
    items: rows.slice(start, start + size),
    meta: { page: currentPage, pageSize: size, total: rows.length }
  };
}

function findRow(rows, key, value) {
  return rows.find((row) => String(getRowValue(row, key)) === String(value));
}

function findRecordById(rows, value) {
  const candidates = ['id', 'student_id', 'studentId', 'session_id', 'sessionId', 'attendance_id', 'log_id'];
  return rows.find((row) => candidates.some((key) => String(getRowValue(row, key)) === String(value)));
}

function createRowFromRecord(record, headers) {
  return headers.map((header) => {
    const value = getRecordValue(record, header);
    return value === undefined || value === null ? '' : value;
  });
}

function appendRow(sheetName, record) {
  const sheet = getSheet(sheetName);
  const { headers } = parseSheet(sheetName);
  const values = createRowFromRecord(record, headers);
  sheet.appendRow(values);
  return record;
}

function updateRow(sheetName, rowNum, record) {
  const sheet = getSheet(sheetName);
  const { headers } = parseSheet(sheetName);
  const values = createRowFromRecord(record, headers);
  sheet.getRange(rowNum, 1, 1, values.length).setValues([values]);
  return record;
}

function deleteRow(sheetName, rowNum) {
  const sheet = getSheet(sheetName);
  sheet.deleteRow(rowNum);
  return true;
}

function generateId(prefix) {
  return `${String(prefix || 'id')}-${new Date().getTime()}`;
}

function getEntityRows(sheetName, filters) {
  const { rows } = parseSheet(sheetName);
  return filterRows(rows, filters);
}

function parseAction(action) {
  const raw = String(action || '').trim();
  const segments = raw.split('/').filter((segment) => segment.trim());
  return {
    raw,
    segments,
    resource: segments[0] || '',
    id: segments[1] || '',
    subAction: segments[2] || ''
  };
}

function sanitizeParams(params) {
  const sanitized = {};
  Object.keys(params || {}).forEach((key) => {
    if (key === 'action') return;
    sanitized[key] = params[key];
  });
  return sanitized;
}

function doGet(e) {
  const action = e.parameter.action || 'settings';
  const params = sanitizeParams(e.parameter || {});
  const route = parseAction(action);

  try {
    if (route.resource === 'login') {
      return jsonResponse(handleLogin(params));
    }
    if (route.resource === 'settings') {
      return jsonResponse(createSuccess(handleGetSettings(params)));
    }
    if (route.resource === 'students') {
      return jsonResponse(createSuccess(getEntityRows(SHEET_CONFIG.students, params)));
    }
    if (route.resource === 'student') {
      return jsonResponse(handleGetStudent(params));
    }
    if (route.resource === 'sessions') {
      if (route.id === 'active' || params.active === 'true') {
        return jsonResponse(handleGetActiveSession());
      }
      return jsonResponse(createSuccess(getEntityRows(SHEET_CONFIG.sessions, params)));
    }
    if (route.resource === 'attendance') {
      return jsonResponse(createSuccess(getEntityRows(SHEET_CONFIG.attendance, params)));
    }
    if (route.resource === 'dashboard') {
      if (route.id === 'summary') {
        return jsonResponse(handleDashboardSummary(params));
      }
      if (route.id === 'trend') {
        return jsonResponse(handleDashboardTrend(params));
      }
    }
    if (route.resource === 'reports') {
      return jsonResponse(handleGetReports(route.id, params.date));
    }
    if (route.resource === 'logs') {
      return jsonResponse(createSuccess(getEntityRows(SHEET_CONFIG.logs, params)));
    }
    return jsonResponse(createError('not_found', 'Action not found', { action }), 404);
  } catch (error) {
    return jsonResponse(createError('internal_error', error.message || 'Unexpected error'), 500);
  }
}

function handleGetStudent(params) {
  const studentId = params.studentId || params.id;
  if (!studentId) return createError('validation_error', 'studentId is required');
  const students = getEntityRows(SHEET_CONFIG.students, {});
  const student = findRow(students, 'student_id', studentId) || findRow(students, 'id', studentId);
  if (!student) return createError('not_found', 'Student not found', { studentId });
  return createSuccess(student);
}

function handleGetSettings(params) {
  const settings = getEntityRows(SHEET_CONFIG.settings, {});
  if (params.key) {
    return settings.filter((item) => String(getRowValue(item, 'key')).toLowerCase() === String(params.key).toLowerCase());
  }
  return settings;
}

function handleGetActiveSession() {
  const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
  const active = sessions.find((session) => String(getRowValue(session, 'status')).toLowerCase() === 'open');
  if (!active) return createError('not_found', 'No active session');
  return createSuccess(active);
}

function handleGetReports(type, date) {
  const attendance = getEntityRows(SHEET_CONFIG.attendance, date ? { date } : {});
  const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
  const students = getEntityRows(SHEET_CONFIG.students, {});
  const totalStudents = students.length;
  const activeSessions = sessions.filter((session) => String(getRowValue(session, 'status')).toLowerCase() === 'open').length;
  const reportData = attendance.reduce((memo, item) => {
    const key = type === 'monthly'
      ? String(getRowValue(item, 'date')).slice(0, 7)
      : type === 'weekly'
        ? getWeekKey(String(getRowValue(item, 'date')))
        : String(getRowValue(item, 'date'));
    memo[key] = (memo[key] || 0) + 1;
    return memo;
  }, {});
  const items = Object.keys(reportData).sort().map((key) => ({ period: key, count: reportData[key] }));
  return createSuccess({ summary: { totalStudents, activeSessions, records: attendance.length }, items });
}

function getWeekKey(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const week = Math.ceil((((date - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function handleDashboardSummary(params) {
  const attendance = getEntityRows(SHEET_CONFIG.attendance, params.date ? { date: params.date } : {});
  const students = getEntityRows(SHEET_CONFIG.students, {});
  const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
  const presentCount = attendance.filter((item) => String(getRowValue(item, 'status')).toLowerCase() === 'present').length;
  const openSessions = sessions.filter((item) => String(getRowValue(item, 'status')).toLowerCase() === 'open').length;
  return createSuccess({
    totalStudents: students.length,
    presentToday: presentCount,
    openSessions,
    attendanceRate: Math.round((presentCount / Math.max(students.length, 1)) * 100)
  });
}

function handleDashboardTrend(params) {
  const attendance = getEntityRows(SHEET_CONFIG.attendance, params.date ? { date: params.date } : {});
  const trend = attendance.reduce((memo, item) => {
    const key = String(getRowValue(item, 'date'));
    memo[key] = (memo[key] || 0) + 1;
    return memo;
  }, {});
  const items = Object.keys(trend).sort().map((date) => ({ date, count: trend[date] }));
  return createSuccess({ items });
}

function parseRequestBody(e) {
  if (e.postData && e.postData.type && e.postData.type.indexOf('application/json') !== -1) {
    try {
      return JSON.parse(e.postData.contents || '{}');
    } catch (err) {
      return {};
    }
  }

  const body = {};
  Object.keys(e.parameter || {}).forEach((key) => {
    if (key !== 'action') {
      body[key] = e.parameter[key];
    }
  });
  return body;
}

function doPost(e) {
  const action = e.parameter.action || 'login';
  const body = parseRequestBody(e);
  const route = parseAction(action);

  try {
    if (route.resource === 'login') {
      return jsonResponse(handleLogin(body));
    }
    if (route.resource === 'logout') {
      return jsonResponse(createSuccess({ ok: true }));
    }
    if (route.resource === 'students') {
      if (route.id && route.subAction === 'delete') {
        return jsonResponse(handleDeleteRecord(SHEET_CONFIG.students, route.id));
      }
      if (route.id) {
        return jsonResponse(handleUpdateStudent(route.id, body));
      }
      return jsonResponse(handleCreateStudent(body));
    }
    if (route.resource === 'sessions') {
      if (route.id && route.subAction === 'close') {
        return jsonResponse(handleCloseSession(route.id));
      }
      if (route.id && route.subAction === 'delete') {
        return jsonResponse(handleDeleteRecord(SHEET_CONFIG.sessions, route.id));
      }
      if (route.id) {
        return jsonResponse(handleUpdateSession(route.id, body));
      }
      return jsonResponse(handleCreateSession(body));
    }
    if (route.resource === 'attendance') {
      if (route.id === 'batch') {
        return jsonResponse(handleBatchAttendance(body));
      }
      return jsonResponse(handleSubmitAttendance(body));
    }
    if (route.resource === 'settings') {
      return jsonResponse(handleSaveSettings(body));
    }
    return jsonResponse(createError('not_found', 'Action not found', { action }), 404);
  } catch (error) {
    return jsonResponse(createError('internal_error', error.message || 'Unexpected error'), 500);
  }
}

function handleUpdateStudent(id, body) {
  if (!id) return createError('validation_error', 'Student id is required');
  const students = getEntityRows(SHEET_CONFIG.students, {});
  const existing = findRow(students, 'id', id) || findRow(students, 'student_id', id);
  if (!existing) return createError('not_found', 'Student not found', { id });
  const updated = Object.assign({}, existing, body, { updated_at: new Date().toISOString() });
  updateRow(SHEET_CONFIG.students, existing.__rowNum, updated);
  return createSuccess(updated);
}

function handleUpdateSession(id, body) {
  if (!id) return createError('validation_error', 'Session id is required');
  const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
  const existing = findRow(sessions, 'id', id) || findRow(sessions, 'session_id', id);
  if (!existing) return createError('not_found', 'Session not found', { id });
  const updated = Object.assign({}, existing, body, { updated_at: new Date().toISOString() });
  updateRow(SHEET_CONFIG.sessions, existing.__rowNum, updated);
  return createSuccess(updated);
}

function handleCloseSession(id) {
  if (!id) return createError('validation_error', 'Session id is required');
  const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
  const existing = findRow(sessions, 'id', id) || findRow(sessions, 'session_id', id);
  if (!existing) return createError('not_found', 'Session not found', { id });
  const updated = Object.assign({}, existing, { status: 'closed', updated_at: new Date().toISOString() });
  updateRow(SHEET_CONFIG.sessions, existing.__rowNum, updated);
  return createSuccess(updated);
}

function handleDeleteRecord(sheetName, id) {
  if (!id) return createError('validation_error', 'Record id is required');
  const rows = getEntityRows(sheetName, {});
  const existing = findRecordById(rows, id);
  if (!existing) return createError('not_found', 'Record not found', { id });
  deleteRow(sheetName, existing.__rowNum);
  return createSuccess({ deleted: true, id });
}

function handleBatchAttendance(payloads) {
  if (!Array.isArray(payloads)) {
    return createError('validation_error', 'Payload must be an array of attendance records');
  }
  const accepted = [];
  const rejected = [];
  payloads.forEach((payload) => {
    const result = handleSubmitAttendance(payload);
    if (result.status === 'success') {
      accepted.push(result.data);
    } else {
      rejected.push(result);
    }
  });
  return createSuccess({ accepted, rejected });
}

function handleCreateStudent(body) {
  if (!body.studentId || !body.name) {
    return createError('validation_error', 'Missing required fields', { studentId: 'required', name: 'required' });
  }
  const students = getEntityRows(SHEET_CONFIG.students, {});
  if (findRow(students, 'student_id', body.studentId)) {
    return createError('duplicate_student', 'Student already exists', { studentId: body.studentId });
  }
  const now = new Date().toISOString();
  const student = {
    id: generateId('student'),
    student_id: body.studentId,
    name: body.name,
    department: body.department || '',
    faculty: body.faculty || '',
    level: body.level || '',
    phone: body.phone || '',
    email: body.email || '',
    status: body.status || 'active',
    created_at: now,
    updated_at: now
  };
  appendRow(SHEET_CONFIG.students, student);
  return createSuccess(student);
}

function handleCreateSession(body) {
  if (!body.sessionId || !body.subjectName || !body.date) {
    return createError('validation_error', 'Missing required fields', { sessionId: 'required', subjectName: 'required', date: 'required' });
  }
  const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
  if (findRow(sessions, 'session_id', body.sessionId)) {
    return createError('duplicate_session', 'Session already exists', { sessionId: body.sessionId });
  }
  const now = new Date().toISOString();
  const session = {
    id: generateId('session'),
    session_id: body.sessionId,
    subject_name: body.subjectName,
    subject_code: body.subjectCode || '',
    date: body.date,
    start_time: body.startTime || '',
    end_time: body.endTime || '',
    room: body.room || '',
    latitude: body.latitude || '',
    longitude: body.longitude || '',
    radius: body.radius || '',
    status: body.status || 'open',
    created_at: now,
    updated_at: now
  };
  appendRow(SHEET_CONFIG.sessions, session);
  return createSuccess(session);
}

function handleSubmitAttendance(body) {
  if (!body.studentId || !body.sessionId || !body.date || !body.time || !body.latitude || !body.longitude) {
    return createError('validation_error', 'Missing required fields for attendance', { studentId: 'required', sessionId: 'required', date: 'required', time: 'required', latitude: 'required', longitude: 'required' });
  }
  const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
  const session = findRow(sessions, 'session_id', body.sessionId);
  if (!session) return createError('not_found', 'Session not found', { sessionId: body.sessionId });
  if (String(getRowValue(session, 'status')).toLowerCase() !== 'open') return createError('session_closed', 'Session is closed', { sessionId: body.sessionId });
  const distance = calculateDistance(Number(getRowValue(session, 'latitude')), Number(getRowValue(session, 'longitude')), Number(body.latitude), Number(body.longitude));
  const radius = Number(getRowValue(session, 'radius') || body.radius || 0);
  if (radius > 0 && distance > radius) {
    return createError('out_of_range', 'Student is outside the allowed radius', { distance: Math.round(distance), radius });
  }
  const attendanceRecords = getEntityRows(SHEET_CONFIG.attendance, { studentId: body.studentId, sessionId: body.sessionId, date: body.date });
  if (attendanceRecords.length) {
    return createError('duplicate_attendance', 'Attendance already recorded', { studentId: body.studentId, sessionId: body.sessionId });
  }
  const record = {
    id: generateId('attendance'),
    student_id: body.studentId,
    student_name: body.studentName || '',
    department: body.department || '',
    level: body.level || '',
    session_id: body.sessionId,
    date: body.date,
    time: body.time,
    status: body.status || 'present',
    distance: Math.round(distance),
    latitude: body.latitude,
    longitude: body.longitude,
    device: body.device || '',
    browser: body.browser || '',
    notes: body.notes || '',
    created_at: new Date().toISOString()
  };
  appendRow(SHEET_CONFIG.attendance, record);
  return createSuccess(record);
}

function handleSaveSettings(body) {
  if (!body.key) return createError('validation_error', 'Setting key is required', { key: 'required' });
  const settings = getEntityRows(SHEET_CONFIG.settings, {});
  const existing = findRow(settings, 'key', body.key);
  const now = new Date().toISOString();
  const record = {
    id: existing ? getRowValue(existing, 'id') : generateId('setting'),
    key: body.key,
    value: body.value || '',
    description: body.description || getRowValue(existing, 'description') || '',
    updated_at: now
  };
  if (existing) {
    updateRow(SHEET_CONFIG.settings, existing.__rowNum, record);
  } else {
    appendRow(SHEET_CONFIG.settings, record);
  }
  return createSuccess(record);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lon1)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthRadius = 6371000;
  return earthRadius * c;
}
