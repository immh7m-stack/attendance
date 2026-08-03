import { get, post } from './apiAdapter.js';

export const studentService = {
  async getStudents(filters = {}) {
    return get('students', filters);
  },
  async getStudent(id) {
    return get('student', { studentId: id });
  },
  async createStudent(data) {
    return post('students', data);
  },
  async updateStudent(id, updates) {
    return post(`students/${encodeURIComponent(id)}`, updates);
  },
  async deleteStudent(id) {
    return post(`students/${encodeURIComponent(id)}/delete`);
  },
  async searchStudents(query) {
    return get('students', { query });
  },
  async loginStudent(payload) {
    return post('login', payload);
  },
  async getStudentSession(params = {}) {
    return get('student/session', params);
  },
  async getStudentProfile(params = {}) {
    return get('student/profile', params);
  },
  async getDepartments(params = {}) {
    return get('departments', params);
  },
  async getLevels(params = {}) {
    return get('levels', params);
  },
  async getStudentAttendance(params = {}) {
    return get('student/attendance', params);
  },
  async getStudentStatistics(params = {}) {
    return get('student/statistics', params);
  },
  async logoutStudent(payload = {}) {
    return post('logout', payload);
  }
};
