import { get, post } from './apiAdapter.js';

export const attendanceService = {
  async getAttendance(filters = {}) {
    return get('attendance', filters);
  },
  async submitAttendance(payload) {
    return post('attendance', payload);
  },
  async submitAttendanceBatch(payloads) {
    return post('attendance/batch', payloads);
  },
  async checkDuplicate(studentId, sessionId, date) {
    const result = await this.getAttendance({ studentId, sessionId, date });
    return result.status === 'success' && result.data.length > 0;
  }
};
