import { createCard } from './components.js';
import { success, error } from './notifications.js';

export async function initProfilePage(container) {
  if (!container) return;
  const card = createCard('الملف الشخصي', '');
  card.querySelector('.card-body').innerHTML = `
    <div class="profile-grid">
      <div><strong>اسم المشرف</strong><p>أحمد محمد</p></div>
      <div><strong>البريد الإلكتروني</strong><p>admin@example.com</p></div>
      <div><strong>الصلاحيات</strong><p>Admin / Manager</p></div>
      <div><strong>آخر تسجيل دخول</strong><p>2026-08-02 09:30</p></div>
    </div>
    <form class="settings-form">
      <label>كلمة المرور الجديدة<input id="newPassword" type="password" /></label>
      <button type="button" class="btn btn-primary">تغيير كلمة المرور</button>
    </form>
  `;
  container.innerHTML = '';
  container.appendChild(card);

  const passwordInput = card.querySelector('#newPassword');
  const changeButton = card.querySelector('button');
  if (changeButton) {
    changeButton.addEventListener('click', (event) => {
      event.preventDefault();
      const password = passwordInput?.value?.trim();
      if (!password) {
        error('يرجى إدخال كلمة مرور جديدة.');
        return;
      }
      passwordInput.value = '';
      success('تم تغيير كلمة المرور مؤقتًا في وضع Mock.');
    });
  }
}
