import { get } from './apiAdapter.js';

export const dashboardService = {
  async getSummary(date = null) {
    return get('dashboard/summary', { date });
  },
  async getTrend(range = 'daily') {
    return get('dashboard/trend', { range });
  },
  async getRecentCheckIns(limit = 5) {
    return get('attendance', { page: 1, pageSize: limit });
  }
};
