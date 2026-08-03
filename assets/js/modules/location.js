import { APP_CONFIG } from '../config.js';

export async function requestPermission() {
  if (!navigator.permissions) return true;

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state !== 'denied';
  } catch (error) {
    return true;
  }
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isInsideRadius(current, target, radius = APP_CONFIG.gpsRadiusMeters) {
  const distance = calculateDistance(current.latitude, current.longitude, target.latitude, target.longitude);
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
          ? 'تم رفض إذن الموقع. مطلوب السماح بالموقع لتسجيل الحضور.'
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
