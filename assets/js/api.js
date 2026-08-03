import { APP_CONFIG } from './config.js';

const buildUrl = (endpoint) => endpoint.startsWith('http') ? endpoint : `${APP_CONFIG.apiUrl}?action=${endpoint}`;

const handleResponse = async (response) => {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error('Invalid JSON response');
  }
  if (!response.ok) {
    const message = data?.message || response.statusText || 'Request failed';
    throw new Error(message);
  }
  return data;
};

export async function request(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const url = buildUrl(endpoint);
  const options = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
}

export function get(endpoint) {
  return request(endpoint, { method: 'GET' });
}

export function post(endpoint, body) {
  return request(endpoint, { method: 'POST', body });
}
