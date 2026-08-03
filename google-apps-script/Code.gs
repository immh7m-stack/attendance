const SHEET_CONFIG = {
  settings: 'settings',
  students: 'students',
  sessions: 'sessions',
  attendance: 'attendance',
  logs: 'logs',
  admins: 'admins'
};

function getSpreadsheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
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

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0];
  return values.slice(1).map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] || '';
    });
    return entry;
  });
}

function jsonResponse(payload, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
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

function doGet(e) {
  const action = e.parameter.action || 'settings';
  try {
    switch (action) {
      case 'settings':
        return jsonResponse(createSuccess(getSheetData(SHEET_CONFIG.settings)), 200);
      case 'students':
        return jsonResponse(createSuccess(getSheetData(SHEET_CONFIG.students)), 200);
      case 'sessions':
        return jsonResponse(createSuccess(getSheetData(SHEET_CONFIG.sessions)), 200);
      case 'attendance':
        return jsonResponse(createSuccess(getSheetData(SHEET_CONFIG.attendance)), 200);
      default:
        return jsonResponse(createError('not_found', 'Action not found', { action }), 404);
    }
  } catch (error) {
    return jsonResponse(createError('internal_error', error.message || 'Unexpected error'), 500);
  }
}

function doPost(e) {
  const action = e.parameter.action || 'login';
  try {
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    switch (action) {
      case 'login':
        return jsonResponse(createSuccess({ ok: true, action }), 200);
      case 'students':
        return jsonResponse(createSuccess({ ok: true, received: body }), 200);
      case 'sessions':
        return jsonResponse(createSuccess({ ok: true, received: body }), 200);
      case 'attendance':
        return jsonResponse(createSuccess({ ok: true, received: body }), 200);
      default:
        return jsonResponse(createError('not_found', 'Action not found', { action }), 404);
    }
  } catch (error) {
    return jsonResponse(createError('internal_error', error.message || 'Unexpected error'), 500);
  }
}
