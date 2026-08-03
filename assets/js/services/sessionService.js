import { get, post } from './apiAdapter.js';

export const sessionService = {
  async getSessions(filters = {}) {
    return get('sessions', filters);
  },
  async getActiveSession() {
    return get('sessions/active');
  },
  async createSession(payload) {
    return post('sessions', payload);
  },
  async updateSession(id, updates) {
    return post(`sessions/${encodeURIComponent(id)}`, updates);
  },
  async closeSession(id) {
    return post(`sessions/${encodeURIComponent(id)}/close`);
  },
  async deleteSession(id) {
    return post(`sessions/${encodeURIComponent(id)}/delete`);
  }
};
