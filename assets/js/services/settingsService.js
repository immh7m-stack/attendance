import { get, post } from './apiAdapter.js';

export const settingsService = {
  async getSettings() {
    return get('settings');
  },
  async saveSettings(settings) {
    return post('settings', settings);
  },
  async getLocationSettings() {
    return get('settings/location');
  }
};
