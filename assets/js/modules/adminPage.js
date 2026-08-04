import { createNavbar, createSidebar, createTopbar, createBreadcrumb } from './components.js';

function getPageMeta(page) {
  const map = {
    dashboard: { title: 'لوحة التحكم', subtitle: 'ملخص حيوي وعمليات حديثة', breadcrumb: ['الرئيسية', 'لوحة التحكم'] },
    students: { title: 'الطلاب', subtitle: 'إدارة الطلاب ومتابعة الحالة', breadcrumb: ['الرئيسية', 'الطلاب'] },
    sessions: { title: 'الجلسات', subtitle: 'إدارة الجلسات وتفعيلها', breadcrumb: ['الرئيسية', 'الجلسات'] },
    attendance: { title: 'الحضور', subtitle: 'سجلات الحضور والتتبع', breadcrumb: ['الرئيسية', 'الحضور'] },
    departments: { title: 'الأقسام', subtitle: 'إدارة الأقسام في النظام', breadcrumb: ['الرئيسية', 'الأقسام'] },
    levels: { title: 'الفرق', subtitle: 'إدارة الفرق وربطها بالأقسام', breadcrumb: ['الرئيسية', 'الفرق'] },
    reports: { title: 'التقارير', subtitle: 'تقارير يومية وأسبوعية وشهرية', breadcrumb: ['الرئيسية', 'التقارير'] },
    settings: { title: 'الإعدادات', subtitle: 'ضبط النظام والخيارات', breadcrumb: ['الرئيسية', 'الإعدادات'] },
    logs: { title: 'السجلات', subtitle: 'سجل الأنشطة والنظام', breadcrumb: ['الرئيسية', 'السجلات'] },
    profile: { title: 'الملف الشخصي', subtitle: 'بيانات المشرف وإعداداته', breadcrumb: ['الرئيسية', 'الملف الشخصي'] },
  };
  return map[page] || map.dashboard;
}

export function renderAdminPage(page) {
  const body = document.body;
  body.innerHTML = '';
  body.dataset.page = page;

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const sidebar = createSidebar(page);
  const main = document.createElement('main');
  main.className = 'app-main';
  main.appendChild(createNavbar('Smart Attendance'));

  const meta = getPageMeta(page);
  main.appendChild(createTopbar(meta.title, meta.subtitle));
  main.appendChild(createBreadcrumb(meta.breadcrumb));

  const content = document.createElement('section');
  content.className = 'content-panel';
  content.id = 'admin-content';
  main.appendChild(content);

  shell.appendChild(sidebar);
  shell.appendChild(main);
  body.appendChild(shell);

  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.className = 'loader';
  loader.textContent = 'جاري التحميل...';
  body.appendChild(loader);

  return content;
}
