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
  }
};
