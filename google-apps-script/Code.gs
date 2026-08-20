const SHEET_CONFIG = {
  settings: 'settings',
  students: 'students',
  sessions: 'sessions',
  attendance: 'attendance',
  logs: 'logs',
  admins: 'admins',
  student_sessions: 'student_sessions',
  departments: 'departments',
  levels: 'levels'
};

const SCRIPT_PROPERTY_SPREADSHEET_ID = 'SPREADSHEET_ID';
// Updated to the actual spreadsheet used by this project.
const DEFAULT_SPREADSHEET_ID = '1dOa6KqmoJ_2AYFBOcNhCgbuvKvSg4S-pH_T8O0TSpNQ';
// Default GPS radius in meters used when settings or session radius are not provided
const DEFAULT_GPS_RADIUS = 300;

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

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
}

function getTodayDate() {
  return Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd');
}

function getLocationSettings() {
  const settings = getEntityRows(SHEET_CONFIG.settings, {});
  return settings.reduce((acc, item) => {
    const key = String(getRowValue(item, 'key') || '').trim();
    if (!key) return acc;
    acc[key] = getRowValue(item, 'value');
    return acc;
  }, {});
}

function findStudentSessionByStudentId(studentId) {
  const sessions = getEntityRows(SHEET_CONFIG.student_sessions, { student_id: studentId, login_date: getTodayDate() });
  return sessions.find((session) => String(getRowValue(session, 'active')).toLowerCase() === 'true') || null;
}

function isSessionActive(session) {
  if (!session) return false;
  const active = String(getRowValue(session, 'active')).toLowerCase() === 'true';
  const expiresAt = new Date(String(getRowValue(session, 'expires_at') || '')).getTime();
  return active && !Number.isNaN(expiresAt) && expiresAt > Date.now();
}

function findStudentSessionByToken(token) {
  const sessions = getEntityRows(SHEET_CONFIG.student_sessions, { session_token: token });
  const session = sessions[0] || null;
  return isSessionActive(session) ? session : null;
}

function findStudentSessionByFingerprint(fingerprint) {
  const sessions = getEntityRows(SHEET_CONFIG.student_sessions, { device_fingerprint: fingerprint, login_date: getTodayDate() });
  return sessions.find((session) => isSessionActive(session)) || null;
}

function createOrUpdateStudentSession(sessionData) {
  const existing = findStudentSessionByStudentId(sessionData.student_id);
  if (existing) {
    const updated = Object.assign({}, existing, sessionData, { updated_at: new Date().toISOString() });
    return updateRow(SHEET_CONFIG.student_sessions, existing.__rowNum, updated);
  }
  appendRow(SHEET_CONFIG.student_sessions, sessionData);
  return sessionData;
}

function isWithinAllowedRadius(latitude, longitude, centerLat, centerLng, radius) {
  if (!centerLat || !centerLng) return { allowed: false, distance: Infinity, radius };
  const distance = calculateDistance(centerLat, centerLng, Number(latitude), Number(longitude));
  return { allowed: distance <= radius, distance, radius };
}

function getActiveLectureSession() {
  const sessions = getEntityRows(SHEET_CONFIG.sessions, { status: 'open' });
  return sessions[0] || null;
}

function handleStudentLogout(body) {
  const token = String(body.sessionToken || body.token || body.session_token || '').trim();
  if (!token) return createSuccess({ ok: true });
  const session = findStudentSessionByToken(token);
  if (!session) return createSuccess({ ok: true });
  return createSuccess({ ok: true });
}

function handleAuthLogin(body) {
  const studentId = String(body.studentId || body.student_id || '').trim();
  if (studentId) {
    return handleStudentLogin(body);
  }
  return handleAdminLogin(body);
}

function handleStudentLogin(body) {
  const studentId = String(body.studentId || body.student_id || '').trim();
  const studentName = String(body.name || body.studentName || body.student_name || '').trim();
  const departmentName = String(body.department || '').trim();
  const levelName = String(body.level || '').trim();
  const latitude = String(body.latitude || '').trim();
  const longitude = String(body.longitude || '').trim();
  const deviceFingerprint = String(body.deviceFingerprint || body.device_fingerprint || '').trim();
  const publicIp = String(body.publicIp || body.public_ip || '').trim();
  const userAgent = String(body.userAgent || body.user_agent || body.ua || '').trim();

  if (!studentId || !studentName || !departmentName || !levelName || !latitude || !longitude || !deviceFingerprint) {
    return createError('validation_error', 'Missing required student login fields', {
      studentId: 'required',
      studentName: 'required',
      department: 'required',
      level: 'required',
      latitude: 'required',
      longitude: 'required',
      deviceFingerprint: 'required'
    });
  }

  const locationSettings = getLocationSettings();
  const allowMultipleDevices = parseBoolean(locationSettings.allow_multiple_devices);

  const activeDepartments = getEntityRows(SHEET_CONFIG.departments, { active: 'TRUE' });
  const departmentRow = findRow(activeDepartments, 'department_name', departmentName);
  if (!departmentRow) {
    return createError('invalid_department', 'القسم غير مسموح به.', { department: body.department });
  }
  const allowedLevels = getEntityRows(SHEET_CONFIG.levels, { active: 'TRUE', department_id: getRowValue(departmentRow, 'id') });
  const levelRow = findRow(allowedLevels, 'level_name', levelName);
  if (!levelRow) {
    return createError('invalid_level', 'المستوى غير مسموح به لهذا القسم.', { level: body.level });
  }

  const activeSession = getActiveLectureSession();
  let geoCenter = null;
  let geoRadius = 0;
  if (activeSession) {
    geoCenter = {
      latitude: Number(getRowValue(activeSession, 'latitude') || 0),
      longitude: Number(getRowValue(activeSession, 'longitude') || 0)
    };
    geoRadius = Number(getRowValue(activeSession, 'radius') || DEFAULT_GPS_RADIUS);
  } else {
    geoCenter = {
      latitude: Number(locationSettings.university_latitude || locationSettings.latitude || 0),
      longitude: Number(locationSettings.university_longitude || locationSettings.longitude || 0)
    };
    geoRadius = Number(locationSettings.gps_radius || locationSettings.radius || DEFAULT_GPS_RADIUS);
  }

  const geoCheck = isWithinAllowedRadius(latitude, longitude, geoCenter.latitude, geoCenter.longitude, geoRadius);
  if (!geoCheck.allowed) {
    return createError('out_of_range', 'Student is outside the allowed geographic area', { distance: Math.round(geoCheck.distance), radius: geoRadius, session: activeSession ? getRowValue(activeSession, 'session_id') : null });
  }

  const students = getEntityRows(SHEET_CONFIG.students, {});
  let student = findRow(students, 'student_id', studentId) || findRow(students, 'id', studentId);
  if (!student) {
    student = {
      id: generateId('student'),
      student_id: studentId,
      name: studentName,
      department: departmentName,
      level: levelName,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    appendRow(SHEET_CONFIG.students, student);
  }

  // ========== التحقق من الـ Session النشطة الموجودة ==========
  const existingByStudent = findStudentSessionByStudentId(studentId);
  if (existingByStudent && isSessionActive(existingByStudent)) {
    // لا يُسمح بـ login جديد طالما هناك session نشطة
    return createError('active_session_exists', 
      'لديك جلسة نشطة بالفعل، يرجى الانتظار حتى انتهاء الجلسة أو الاتصال بالإدارة.', 
      { 
        existingSession: {
          session_token: getRowValue(existingByStudent, 'session_token'),
          expires_at: getRowValue(existingByStudent, 'expires_at'),
          login_date: getRowValue(existingByStudent, 'login_date')
        }
      });
  }

  // إذا كانت session قديمة (منتهية)، يتم السماح بـ login جديد
  if (existingByStudent) {
    const existingFingerprint = String(getRowValue(existingByStudent, 'device_fingerprint') || '').trim();
    if (existingFingerprint !== deviceFingerprint && !allowMultipleDevices) {
      return createError('device_mismatch', 'تم تغيير الجهاز بشكل كبير، مطلوب التحقق.', { allowMultipleDevices });
    }
  }

  // ========== التحقق من جهاز آخر يستخدم نفس الـ Fingerprint ==========
  const collision = findStudentSessionByFingerprint(deviceFingerprint);
  if (collision && String(getRowValue(collision, 'student_id')) !== studentId) {
    return createError('device_in_use', 'هذا الجهاز مستخدم بالفعل بواسطة طالب آخر اليوم.');
  }

  // ========== إنشاء Session جديدة ==========
  const sessionToken = generateId('student_session');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (Number(locationSettings.session_duration_hours || 24) * 3600000)).toISOString();
  const loginDate = getTodayDate();
  const loginTime = Utilities.formatDate(now, 'Africa/Cairo', 'HH:mm:ss');

  const session = {
    id: generateId('student_session_record'),
    student_id: studentId,
    student_name: studentName,
    student_department: departmentName,
    student_level: levelName,
    session_id: activeSession ? String(getRowValue(activeSession, 'session_id') || '') : String(body.sessionId || ''),
    session_token: sessionToken,
    device_fingerprint: deviceFingerprint,
    public_ip: publicIp,
    user_agent: userAgent,
    login_date: loginDate,
    login_time: loginTime,
    expires_at: expiresAt,
    latitude: latitude,
    longitude: longitude,
    active: true,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };

  createOrUpdateStudentSession(session);
  return createSuccess(session);
}

function handleGetStudentSession(params) {
  const token = String(params.sessionToken || params.token || params.session_token || '').trim();
  const studentId = String(params.studentId || params.student_id || '').trim();
  const deviceFingerprint = String(params.deviceFingerprint || params.device_fingerprint || '').trim();

  if (token) {
    const session = findStudentSessionByToken(token);
    if (!session) return createError('not_found', 'Student session not found', { token });
    return createSuccess(session);
  }
  if (studentId) {
    const session = findStudentSessionByStudentId(studentId);
    if (!session) return createError('not_found', 'Student session not found', { studentId });
    return createSuccess(session);
  }
  if (deviceFingerprint) {
    const session = findStudentSessionByFingerprint(deviceFingerprint);
    if (!session) return createError('not_found', 'Student session not found for device fingerprint', { deviceFingerprint });
    return createSuccess(session);
  }
  return createError('validation_error', 'studentId or sessionToken is required');
}

function handleGetStudentProfile(params) {
  const studentId = String(params.studentId || params.student_id || '').trim();
  if (!studentId) return createError('validation_error', 'studentId is required');
  const students = getEntityRows(SHEET_CONFIG.students, {});
  const student = findRow(students, 'student_id', studentId) || findRow(students, 'id', studentId);
  if (!student) return createError('not_found', 'Student not found', { studentId });
  return createSuccess(student);
}

function handleGetStudentAttendance(params) {
  const studentId = String(params.studentId || params.student_id || '').trim();
  if (!studentId) return createError('validation_error', 'studentId is required');
  const attendance = getEntityRows(SHEET_CONFIG.attendance, { studentId });
  return createSuccess(attendance);
}

function handleGetStudentStatistics(params) {
  const studentId = String(params.studentId || params.student_id || '').trim();
  if (!studentId) return createError('validation_error', 'studentId is required');
  const attendance = getEntityRows(SHEET_CONFIG.attendance, { studentId });
  const present = attendance.filter((item) => String(getRowValue(item, 'status')).toLowerCase() === 'present').length;
  const absent = attendance.filter((item) => String(getRowValue(item, 'status')).toLowerCase() === 'absent').length;
  const total = attendance.length;
  const percentage = total ? Math.round((present / total) * 100) : 0;
  return createSuccess({ totalLectures: total, present, absent, attendanceRate: percentage, records: attendance });
}

function parseListValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item || '').trim()).filter(Boolean);
  } catch (error) {
    // ignore JSON parse errors
  }
  return text.split(/\r?\n|,\s*/).map((item) => String(item || '').trim()).filter(Boolean);
}

function handleGetLocationSettings() {
  const settings = getLocationSettings();
  return createSuccess({
    university_latitude: settings.university_latitude || settings.latitude || '',
    university_longitude: settings.university_longitude || settings.longitude || '',
    gps_radius: settings.gps_radius || settings.radius || '',
    allow_multiple_devices: parseBoolean(settings.allow_multiple_devices),
    session_duration_hours: Number(settings.session_duration_hours || 24),
    departments: parseListValue(settings.departments || settings.department_list || ''),
    levels: parseListValue(settings.levels || settings.level_list || '')
  });
}

function jsonResponse(payload, callbackOrStatusCode = '', statusCode = null) {
  const callback = typeof callbackOrStatusCode === 'string' ? callbackOrStatusCode : '';
  const useCallback = typeof callback === 'string' && callback.trim();
  const body = useCallback ? `${callback}(${JSON.stringify(payload)});` : JSON.stringify(payload);
  return ContentService.createTextOutput(body).setMimeType(useCallback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
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

function handleAdminLogin(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();
  if (!username || !password) return createError('validation_error', 'username and password are required');
  const admins = getEntityRows(SHEET_CONFIG.admins, {});
  const admin = admins.find((a) => {
    const storedUsername = String(getRowValue(a, 'username')).trim();
    const storedPassword = String(getRowValue(a, 'password')).trim();
    const storedPasswordHash = String(getRowValue(a, 'password_hash')).trim();
    return storedUsername === username && (storedPassword === password || storedPasswordHash === password);
  });
  if (!admin) return createError('invalid_credentials', 'بيانات الدخول غير صحيحة');
  const user = {
    id: getRowValue(admin, 'id') || getRowValue(admin, 'username'),
    username: getRowValue(admin, 'username'),
    role: getRowValue(admin, 'role') || 'Admin',
    email: getRowValue(admin, 'email') || ''
  };
  const token = generateId('token');
  return createSuccess({ token, user });
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
  const reserved = ['action', 'callback', 'page', 'pageSize', 'limit', 'offset', 'sort', 'order', 'range'];
  const sanitized = {};
  Object.keys(params || {}).forEach((key) => {
    if (reserved.includes(key)) return;
    sanitized[key] = params[key];
  });
  return sanitized;
}

function doGet(e) {
  const action = e.parameter.action || 'settings';
  const params = sanitizeParams(e.parameter || {});
  const route = parseAction(action);
  const callback = String(e.parameter.callback || '').trim();

  try {
    if (route.resource === 'login') {
      return jsonResponse(handleAuthLogin(params), callback);
    }
    if (route.resource === 'settings') {
      if (route.id === 'location') {
        return jsonResponse(handleGetLocationSettings());
      }
      return jsonResponse(createSuccess(handleGetSettings(params)));
    }
    // Public endpoint to calculate distance on the server side
    if (route.resource === 'calculate' && route.id === 'distance') {
      const lat1 = Number(params.lat1 || params.lat || 0);
      const lon1 = Number(params.lon1 || params.lon || 0);
      const lat2 = Number(params.lat2 || params.lat || params.latitude || 0);
      const lon2 = Number(params.lon2 || params.lon || params.longitude || 0);
      const distance = distanceBetween(lat1, lon1, lat2, lon2);
      return jsonResponse(createSuccess({ distance }));
    }
    if (route.resource === 'students') {
      return jsonResponse(createSuccess(getEntityRows(SHEET_CONFIG.students, params)));
    }
    if (route.resource === 'departments') {
      return jsonResponse(createSuccess(getEntityRows(SHEET_CONFIG.departments, params)));
    }
    if (route.resource === 'levels') {
      return jsonResponse(createSuccess(getEntityRows(SHEET_CONFIG.levels, params)));
    }
    if (route.resource === 'student') {
      if (route.id === 'session') {
        return jsonResponse(handleGetStudentSession(params));
      }
      if (route.id === 'profile') {
        return jsonResponse(handleGetStudentProfile(params));
      }
      if (route.id === 'attendance') {
        return jsonResponse(handleGetStudentAttendance(params));
      }
      if (route.id === 'statistics') {
        return jsonResponse(handleGetStudentStatistics(params));
      }
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
  const map = settings.reduce((acc, item) => {
    const key = String(getRowValue(item, 'key') || '').trim();
    if (!key) return acc;
    acc[key] = getRowValue(item, 'value');
    return acc;
  }, {});
  if (params.key) {
    const requestedKey = String(params.key || '').trim();
    return requestedKey ? map[requestedKey] : {};
  }
  return map;
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
  if (e.postData && e.postData.contents) {
    const contents = String(e.postData.contents || '').trim();
    if (contents) {
      try {
        return JSON.parse(contents);
      } catch (err) {
        // fall back to URL-encoded params below
      }
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
      return jsonResponse(handleAuthLogin(body));
    }
    if (route.resource === 'logout') {
      return jsonResponse(handleStudentLogout(body));
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
    if (route.resource === 'departments') {
      if (route.id && route.subAction === 'delete') {
        return jsonResponse(handleDeleteRecord(SHEET_CONFIG.departments, route.id));
      }
      if (route.id) {
        return jsonResponse(handleUpdateDepartment(route.id, body));
      }
      return jsonResponse(handleCreateDepartment(body));
    }
    if (route.resource === 'levels') {
      if (route.id && route.subAction === 'delete') {
        return jsonResponse(handleDeleteRecord(SHEET_CONFIG.levels, route.id));
      }
      if (route.id) {
        return jsonResponse(handleUpdateLevel(route.id, body));
      }
      return jsonResponse(handleCreateLevel(body));
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

function handleCreateDepartment(body) {
  if (!body.department_name) {
    return createError('validation_error', 'Missing required fields', { department_name: 'required' });
  }
  const departments = getEntityRows(SHEET_CONFIG.departments, {});
  if (findRow(departments, 'department_name', body.department_name)) {
    return createError('duplicate_department', 'Department already exists', { department_name: body.department_name });
  }
  const now = new Date().toISOString();
  const department = {
    id: generateId('department'),
    department_name: body.department_name,
    active: body.active === true || String(body.active).toLowerCase() === 'true' ? 'TRUE' : 'FALSE',
    created_at: now,
    updated_at: now
  };
  appendRow(SHEET_CONFIG.departments, department);
  return createSuccess(department);
}

function handleUpdateDepartment(id, body) {
  if (!id) return createError('validation_error', 'Department id is required');
  const departments = getEntityRows(SHEET_CONFIG.departments, {});
  const existing = findRow(departments, 'id', id) || findRow(departments, 'department_name', id);
  if (!existing) return createError('not_found', 'Department not found', { id });
  const updated = Object.assign({}, existing, {
    department_name: String(body.department_name || getRowValue(existing, 'department_name') || '').trim(),
    active: body.active === true || String(body.active).toLowerCase() === 'true' ? 'TRUE' : 'FALSE',
    updated_at: new Date().toISOString()
  });
  updateRow(SHEET_CONFIG.departments, existing.__rowNum, updated);
  return createSuccess(updated);
}

function handleCreateLevel(body) {
  if (!body.department_id || !body.level_name) {
    return createError('validation_error', 'Missing required fields', { department_id: 'required', level_name: 'required' });
  }
  const levels = getEntityRows(SHEET_CONFIG.levels, {});
  if (findRow(levels, 'level_name', body.level_name) && String(getRowValue(body, 'department_id')) === String(getRowValue(findRow(levels, 'level_name', body.level_name), 'department_id'))) {
    return createError('duplicate_level', 'Level already exists for this department', { department_id: body.department_id, level_name: body.level_name });
  }
  const now = new Date().toISOString();
  const level = {
    id: generateId('level'),
    department_id: body.department_id,
    level_name: body.level_name,
    active: body.active === true || String(body.active).toLowerCase() === 'true' ? 'TRUE' : 'FALSE',
    created_at: now,
    updated_at: now
  };
  appendRow(SHEET_CONFIG.levels, level);
  return createSuccess(level);
}

function handleUpdateLevel(id, body) {
  if (!id) return createError('validation_error', 'Level id is required');
  const levels = getEntityRows(SHEET_CONFIG.levels, {});
  const existing = findRow(levels, 'id', id) || findRow(levels, 'level_name', id);
  if (!existing) return createError('not_found', 'Level not found', { id });
  const updated = Object.assign({}, existing, {
    department_id: String(body.department_id || getRowValue(existing, 'department_id') || '').trim(),
    level_name: String(body.level_name || getRowValue(existing, 'level_name') || '').trim(),
    active: body.active === true || String(body.active).toLowerCase() === 'true' ? 'TRUE' : 'FALSE',
    updated_at: new Date().toISOString()
  });
  updateRow(SHEET_CONFIG.levels, existing.__rowNum, updated);
  return createSuccess(updated);
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
  if (!body.studentId || !body.date || !body.time || !body.latitude || !body.longitude) {
    return createError('validation_error', 'Missing required fields for attendance', { studentId: 'required', date: 'required', time: 'required', latitude: 'required', longitude: 'required' });
  }

  const studentSession = body.sessionToken ? findStudentSessionByToken(body.sessionToken) : null;
  let sessionId = body.sessionId || '';
  let distance = 0;
  let radius = 0;

  if (studentSession) {
    if (!isSessionActive(studentSession)) {
      return createError('session_expired', 'Student session is expired or inactive', { sessionToken: body.sessionToken });
    }
    const sessionStudentId = String(getRowValue(studentSession, 'student_id') || '').trim();
    if (sessionStudentId && sessionStudentId !== String(body.studentId).trim()) {
      return createError('session_mismatch', 'Session token does not belong to this student', { studentId: body.studentId, sessionToken: body.sessionToken });
    }
    sessionId = String(getRowValue(studentSession, 'session_id') || body.sessionId || '');
    distance = calculateDistance(Number(getRowValue(studentSession, 'latitude')), Number(getRowValue(studentSession, 'longitude')), Number(body.latitude), Number(body.longitude));
    radius = Number(getRowValue(studentSession, 'radius') || body.radius || 0);
  } else {
    const sessions = getEntityRows(SHEET_CONFIG.sessions, {});
    const session = findRow(sessions, 'session_id', body.sessionId);
    if (!session) return createError('not_found', 'Session not found', { sessionId: body.sessionId });
    if (String(getRowValue(session, 'status')).toLowerCase() !== 'open') return createError('session_closed', 'Session is closed', { sessionId: body.sessionId });
    distance = calculateDistance(Number(getRowValue(session, 'latitude')), Number(getRowValue(session, 'longitude')), Number(body.latitude), Number(body.longitude));
    radius = Number(getRowValue(session, 'radius') || body.radius || 0);
  }

  if (radius > 0 && distance > radius) {
    return createError('out_of_range', 'Student is outside the allowed radius', { distance: Math.round(distance), radius });
  }

  const attendanceRecords = getEntityRows(SHEET_CONFIG.attendance, { studentId: body.studentId, date: body.date });
  if (attendanceRecords.length) {
    return createError('duplicate_attendance', 'Attendance already recorded for this student today', { studentId: body.studentId, date: body.date });
  }

  const record = {
    id: generateId('attendance'),
    student_id: body.studentId,
    student_name: body.studentName || '',
    department: body.department || '',
    level: body.level || '',
    session_id: sessionId,
    date: body.date,
    time: body.time,
    status: body.status || 'present',
    distance: Math.round(distance),
    latitude: body.latitude,
    longitude: body.longitude,
    device: body.device || '',
    browser: body.browser || '',
    device_fingerprint: body.deviceFingerprint || body.device_fingerprint || '',
    notes: body.notes || '',
    created_at: new Date().toISOString()
  };
  appendRow(SHEET_CONFIG.attendance, record);
  return createSuccess(record);
}

function normalizeSettingValue(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function handleSaveSettings(body) {
  const settings = getEntityRows(SHEET_CONFIG.settings, {});
  const now = new Date().toISOString();
  const changed = [];
  const values = [];

  Object.keys(body || {}).forEach((key) => {
    const rawValue = body[key];
    if (rawValue === undefined) return;
    if (key === 'action') return;
    const value = normalizeSettingValue(rawValue);
    const existing = findRow(settings, 'key', key);
    const record = {
      id: existing ? getRowValue(existing, 'id') : generateId('setting'),
      key,
      value,
      description: getRowValue(existing, 'description') || '',
      updated_at: now
    };
    if (existing) {
      updateRow(SHEET_CONFIG.settings, existing.__rowNum, record);
      changed.push(key);
    } else {
      appendRow(SHEET_CONFIG.settings, record);
      changed.push(key);
    }
    values.push(record);
  });

  if (!values.length) {
    return createError('validation_error', 'No settings provided');
  }
  return createSuccess({ updated: changed, values });
}

function distanceBetween(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // result in meters
}

// Backwards-compatible alias: older code calls `calculateDistance`
function calculateDistance(lat1, lon1, lat2, lon2) {
  return distanceBetween(lat1, lon1, lat2, lon2);
}
