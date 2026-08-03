import { googleApiProvider } from './providers/googleApiProvider.js';

function getProvider() {
  return googleApiProvider;
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
  return 'google';
}
