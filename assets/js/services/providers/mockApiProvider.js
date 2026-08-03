import { mockApi } from '../mockApi.js';

export const mockApiProvider = {
  async get(endpoint, params = {}) {
    switch (endpoint) {
      case 'students':
        return mockApi.getStudents(params);
      case 'student':
        return mockApi.getStudent(params.studentId || params.id);
      case 'sessions':
        return mockApi.getSessions(params);
      case 'sessions/active':
        return mockApi.getSessionActive();
      case 'dashboard/summary':
        return mockApi.getDashboardSummary(params.date);
      case 'attendance':
        return mockApi.getAttendance(params);
      case 'reports/daily':
      case 'reports/weekly':
      case 'reports/monthly':
        return mockApi.getReports(endpoint.split('/')[1], params.date);
      case 'settings':
        return mockApi.getSettings();
      default:
        throw new Error(`Mock provider does not support GET ${endpoint}`);
    }
  },

  async post(endpoint, body = {}) {
    switch (endpoint) {
      case 'login':
        return mockApi.login(body);
      case 'logout':
        return mockApi.logout();
      case 'students':
        return mockApi.createStudent(body);
      case 'students/batch':
        return mockApi.getStudents(body);
      case 'attendance':
        return mockApi.submitAttendance(body);
      case 'attendance/batch':
        return mockApi.submitAttendanceBatch(body);
      case 'sessions':
        return mockApi.createSession(body);
      case 'sessions/close':
        return mockApi.closeSession(body.id);
      case 'settings':
        return mockApi.saveSettings(body);
      default:
        throw new Error(`Mock provider does not support POST ${endpoint}`);
    }
  }
};
