import { settingsService } from '../services/settingsService.js';
import { success, error } from './notifications.js';
import { createCard, createEmptyState } from './components.js';

export async function initSettingsPage(container) {
  if (!container) return;
  const result = await settingsService.getSettings();
  const settings = result?.status === 'success' ? result.data : null;
  if (!settings) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('لا توجد إعدادات', 'تعذر تحميل الإعدادات الحالية.'));
    return;
  }

  const form = document.createElement('form');
  form.className = 'settings-form';
  form.innerHTML = `
    <div class="form-grid">
      <label>نصف قطر GPS<input id="gpsRadius" type="number" value="${settings.defaultRadius || 300}" /></label>
      <label>اسم الجامعة<input id="university" type="text" value="${settings.university || ''}" /></label>
      <label>الكلية<input id="faculty" type="text" value="${settings.faculty || ''}" /></label>
      <label>الأقسام<input id="department" type="text" value="${settings.department || ''}" /></label>
      <label>مدة الجلسة<input id="attendanceEnd" type="text" value="${settings.attendanceEnd || ''}" /></label>
      <label>المظهر<input id="theme" type="text" value="${settings.theme || 'light'}" /></label>
      <label>اللغة<input id="language" type="text" value="${settings.language || 'ar'}" /></label>
      <label>الإشعارات<input id="notifications" type="checkbox" ${settings.notifications !== false ? 'checked' : ''} /></label>
    </div>
    <button type="submit" class="btn btn-primary">حفظ الإعدادات</button>
  `;

  const card = createCard('إعدادات النظام', '');
  card.querySelector('.card-body').appendChild(form);
  container.innerHTML = '';
  container.appendChild(card);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      defaultRadius: Number(form.querySelector('#gpsRadius').value) || 300,
      university: form.querySelector('#university').value.trim(),
      faculty: form.querySelector('#faculty').value.trim(),
      department: form.querySelector('#department').value.trim(),
      attendanceEnd: form.querySelector('#attendanceEnd').value.trim(),
      // mockInterface removed; settings come from server
      theme: form.querySelector('#theme').value.trim(),
      language: form.querySelector('#language').value.trim(),
      notifications: form.querySelector('#notifications').checked
    };

    const saveResult = await settingsService.saveSettings(payload);
    if (saveResult?.status === 'success') {
      success('تم حفظ الإعدادات بنجاح.');
    } else {
      error(saveResult?.error?.message || 'تعذر حفظ الإعدادات. حاول مرة أخرى.');
    }
  });
}
