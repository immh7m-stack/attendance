import { APP_CONFIG } from '../../config.js';

function isGoogleScriptUrlConfigured(url) {
  if (!url) return false;
  return String(url).includes('script.google.com/macros/s/') && !url.includes('<DEPLOY_ID>') && !url.includes('placeholder');
}

function getBaseUrl() {
  if (isGoogleScriptUrlConfigured(APP_CONFIG.googleScriptUrl)) {
    return APP_CONFIG.googleScriptUrl;
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
