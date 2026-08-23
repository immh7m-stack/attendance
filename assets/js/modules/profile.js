import { createCard, createLoader, createErrorState } from './components.js';
import { success, error } from './notifications.js';
import { authService } from '../services/authService.js';

export async function initProfilePage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(createLoader('جاري جلب البيانات لعرضها. الرجاء الانتظار...'));

  try {
    const currentUser = authService.getCurrentUser() || {};
    const card = createCard('الملف الشخصي', '');
    card.querySelector('.card-body').innerHTML = `
      <div class="profile-grid">
        <div><strong>اسم المشرف</strong><p>${currentUser.user?.username || 'غير معروف'}</p></div>
        <div><strong>البريد الإلكتروني</strong><p>${currentUser.user?.email || 'غير متوفر'}</p></div>
        <div><strong>الصلاحيات</strong><p>${currentUser.user?.role || 'Admin'}</p></div>
        <div><strong>تاريخ الجلسة</strong><p>${new Date(currentUser.createdAt || Date.now()).toLocaleString('ar-EG')}</p></div>
      </div>
    `;
    container.innerHTML = '';
    container.appendChild(card);
  } catch (err) {
    container.innerHTML = '';
    container.appendChild(createErrorState('تعذر جلب البيانات. يرجى المحاولة مرة أخرى.'));
  }
}
