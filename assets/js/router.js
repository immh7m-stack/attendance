export function navigateTo(path) {
  window.location.href = path;
}

export function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function getCurrentPage() {
  const page = document.body?.dataset?.page;
  if (page) return page;

  const segments = window.location.pathname.split('/').filter(Boolean);
  if (!segments.length) return 'index';
  const last = segments.pop();
  return last.replace('.html', '');
}
