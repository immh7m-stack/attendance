export function renderLayout({ title, pageTitle, children }) {
  const shell = document.createElement('div');
  shell.className = 'page-shell';
  shell.innerHTML = `
    <div class="hero-card">
      <div class="header-bar">
        <div>
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">${pageTitle}</p>
        </div>
      </div>
      <div class="content-area">${children}</div>
    </div>
  `;
  return shell;
}
