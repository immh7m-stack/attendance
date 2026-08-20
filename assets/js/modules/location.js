import { APP_CONFIG } from '../config.js';
import { distanceBetween } from './distance.js';

export async function requestPermission() {
  if (!navigator.permissions) return true;

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state !== 'denied';
  } catch (error) {
    return true;
  }
}

// Using `distanceBetween` from ./distance.js

export async function isInsideRadius(current, target, radius = APP_CONFIG.gpsRadiusMeters) {
  const distance = await distanceBetween(current.latitude, current.longitude, target.latitude, target.longitude);
  return { inside: distance <= radius, distance };
}

export async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const message = error && error.code === error.PERMISSION_DENIED
          ? 'يجب تفعيل خدمة الموقع (Location) على الهاتف قبل تسجيل الحضور.'
          : error?.message || 'تعذّر الحصول على الموقع.';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: APP_CONFIG.timeoutMs, maximumAge: 0 }
    );
  });
}

export function showLocationStatus(message, success = true) {
  const statusElement = document.querySelector('#locationStatus');
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.classList.toggle('success', success);
  statusElement.classList.toggle('error', !success);
}
