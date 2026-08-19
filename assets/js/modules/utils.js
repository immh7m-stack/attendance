export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('ar-EG');
}

export function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('ar-EG');
}

export function randomId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export { distanceBetween } from './distance.js';
