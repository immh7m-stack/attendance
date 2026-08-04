import { APP_CONFIG } from '../../config.js';

function isGoogleScriptUrlConfigured(url) {
  if (!url) return false;
  const normalized = String(url).trim();
  return normalized.includes('script.google.com/macros/s/') && !normalized.includes('<DEPLOY_ID>') && !normalized.includes('placeholder');
}

function isGoogleLibraryUrl(url) {
  if (!url) return false;
  const normalized = String(url).trim();
  return normalized.includes('googleusercontent.com/macros/echo') || normalized.includes('script.googleusercontent.com/macros/echo');
}

function getBaseUrl() {
  if (isGoogleScriptUrlConfigured(APP_CONFIG.googleScriptUrl)) {
    return APP_CONFIG.googleScriptUrl;
  }
  if (APP_CONFIG.googleScriptUrl && isGoogleLibraryUrl(APP_CONFIG.googleScriptUrl)) {
    throw new Error('Google Apps Script URL is configured as a library/echo URL, not a deployed Web App exec URL. Update APP_CONFIG.googleScriptUrl in assets/js/config.js to the published exec URL.');
  }
  if (APP_CONFIG.apiUrl) {
    return APP_CONFIG.apiUrl;
  }
  throw new Error('Google Apps Script URL is not configured. Set APP_CONFIG.googleScriptUrl to the deployed Web App URL in assets/js/config.js.');
}

function buildUrl(endpoint) {
  const url = getBaseUrl();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}action=${encodeURIComponent(endpoint)}`;
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

function cleanBody(body) {
  const cleaned = {};
  Object.entries(body || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    cleaned[key] = value;
  });
  return cleaned;
}

async function request(endpoint, { method = 'GET', body, params = {}, headers = {} } = {}) {
  const url = method === 'GET' && Object.keys(params).length
    ? `${buildUrl(endpoint)}&${buildQueryString(params)}`
    : buildUrl(endpoint);

  const requestHeaders = {
    Accept: 'application/json',
    ...headers
  };

  const options = {
    method,
    headers: requestHeaders,
    mode: 'cors',
    cache: 'no-store'
  };

  if (body && method !== 'GET') {
    const filteredBody = cleanBody(body);
    options.body = new URLSearchParams(filteredBody);
  }

  if (method === 'GET' && Object.keys(params).length) {
    options.body = undefined;
  }

  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    const snippet = String(text || '').slice(0, 300).replace(/\s+/g, ' ').trim();
    console.error('Google API provider received non-JSON response', { url, status: response.status, body: snippet });
    throw new Error(`Invalid JSON response from API${snippet ? `: ${snippet}` : ''}`);
  }

  if (!response.ok) {
    const message = data?.error?.message || response.statusText || 'Request failed';
    const snippet = String(text || '').slice(0, 300).replace(/\s+/g, ' ').trim();
    throw new Error(`${message} (status ${response.status})${snippet ? `: ${snippet}` : ''}`);
  }

  return data;
}

export const googleApiProvider = {
  async get(endpoint, params = {}) {
    return request(endpoint, { method: 'GET', params });
  },
  async post(endpoint, body = {}) {
    return request(endpoint, { method: 'POST', body });
  }
};
