function normalizeUserAgent(ua) {
  return String(ua || '')
    .replace(/(Chrome|CriOS|Firefox|FxiOS|Version|Safari|Edg|OPR|SamsungBrowser|AppleWebKit|Gecko)\/[\d.]+/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getDeviceFingerprint() {
  const ua = normalizeUserAgent(navigator.userAgent);
  const platform = navigator.platform || '';
  const language = navigator.language || navigator.userLanguage || '';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const resolution = `${window.screen.width || 0}x${window.screen.height || 0}`;
  const concurrency = navigator.hardwareConcurrency || 0;
  const memory = navigator.deviceMemory || 0;
  const touchPoints = navigator.maxTouchPoints || 0;
  const colorDepth = window.screen.colorDepth || 0;
  const pixelRatio = window.devicePixelRatio || 1;

  return [
    ua,
    platform,
    language,
    timezone,
    resolution,
    concurrency,
    memory,
    touchPoints,
    colorDepth,
    pixelRatio
  ].join('|');
}

export async function getPublicIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) return '';
    const data = await response.json();
    return data.ip || '';
  } catch (error) {
    return '';
  }
}
