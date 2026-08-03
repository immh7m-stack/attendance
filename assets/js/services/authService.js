import { get, post } from './apiAdapter.js';

export const authService = {
  async login(credentials) {
    return get('login', credentials);
  },
  async logout() {
    return post('logout');
  },
  isAuthenticated() {
    return Boolean(localStorage.getItem('admin_session'));
  },
  getCurrentUser() {
    const raw = localStorage.getItem('admin_session');
    return raw ? JSON.parse(raw) : null;
  }
};
