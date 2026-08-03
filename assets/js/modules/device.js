export function getDeviceFingerprint() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const language = navigator.language || navigator.userLanguage || '';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const resolution = `${window.screen.width || 0}x${window.screen.height || 0}`;
  const concurrency = navigator.hardwareConcurrency || 0;
  const memory = navigator.deviceMemory || 0;
  return `${ua}|${platform}|${language}|${timezone}|${resolution}|${concurrency}|${memory}`;
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
