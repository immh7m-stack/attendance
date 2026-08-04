import { APP_CONFIG } from '../../config.js';

function buildUrl(endpoint) {
  const url = APP_CONFIG.googleScriptUrl || APP_CONFIG.apiUrl;
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

async function request(endpoint, { method = 'GET', body, params = {}, headers = {} } = {}) {
  const url = method === 'GET' && Object.keys(params).length
    ? `${buildUrl(endpoint)}&${buildQueryString(params)}`
    : buildUrl(endpoint);

  const requestHeaders = {
    ...headers
  };

  const options = { method, headers: requestHeaders };

  if (body && method !== 'GET') {
    if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
      options.body = new URLSearchParams(body).toString();
    } else if (requestHeaders['Content-Type'] === 'application/json' || requestHeaders['content-type'] === 'application/json') {
      options.body = JSON.stringify(body);
    } else {
      options.body = new URLSearchParams(body).toString();
    }
  }

  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (error) {
    throw new Error('Invalid JSON response from API');
  }

  if (!response.ok) {
    const message = data?.error?.message || response.statusText || 'Request failed';
    throw new Error(message);
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
