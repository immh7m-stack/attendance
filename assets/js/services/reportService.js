import { get } from './apiAdapter.js';

export const reportService = {
  async getReports(type = 'daily', date = null) {
    return get(`reports/${encodeURIComponent(type)}`, { date });
  },
  async getDailyReport(date) {
    return this.getReports('daily', date);
  },
  async getWeeklyReport(startDate) {
    return this.getReports('weekly', startDate);
  }
};
