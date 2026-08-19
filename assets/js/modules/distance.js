import { APP_CONFIG } from '../config.js';

export async function distanceBetween(lat1, lon1, lat2, lon2) {
  const url = new URL(APP_CONFIG.googleScriptUrl);
  url.searchParams.set('action', 'calculate/distance');
  url.searchParams.set('lat1', String(lat1));
  url.searchParams.set('lon1', String(lon1));
  url.searchParams.set('lat2', String(lat2));
  url.searchParams.set('lon2', String(lon2));

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to calculate distance (network)');
  const json = await res.json();
  if (json && json.status === 'success' && json.data && typeof json.data.distance !== 'undefined') {
    return Number(json.data.distance);
  }
  throw new Error('Invalid response from distance API');
}

