import { APP_CONFIG } from '../config.js';
import { mockApiProvider } from './providers/mockApiProvider.js';
import { googleApiProvider } from './providers/googleApiProvider.js';

const providers = {
  mock: mockApiProvider,
  google: googleApiProvider,
  future: null
};

function getProvider() {
  const providerKey = APP_CONFIG.apiProvider || 'mock';
  const provider = providers[providerKey];
  if (!provider) {
    throw new Error(`API provider not configured: ${providerKey}`);
  }
  return provider;
}

export async function get(endpoint, params = {}) {
  const provider = getProvider();
  return provider.get(endpoint, params);
}

export async function post(endpoint, body = {}) {
  const provider = getProvider();
  return provider.post(endpoint, body);
}

export function getProviderName() {
  return APP_CONFIG.apiProvider || 'mock';
}
