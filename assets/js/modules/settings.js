import { settingsService } from '../services/settingsService.js';
import { success, error } from './notifications.js';
import { createCard, createEmptyState } from './components.js';

export async function initSettingsPage(container) {
  if (!container) return;
  const result = await settingsService.getLocationSettings();
  const settings = result?.status === 'success' ? result.data : null;
  if (!settings) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('لا توجد إعدادات', 'تعذر تحميل الإعدادات الحالية.'));
    return;
  }

  const form = document.createElement('form');
  form.className = 'settings-form';
  const departmentsValue = Array.isArray(settings.departments)
    ? settings.departments.join('\n')
    : String(settings.departments || '');
  const levelsValue = Array.isArray(settings.levels)
    ? settings.levels.join('\n')
    : String(settings.levels || '');
  form.innerHTML = `
    <div class="form-grid">
      <label>Latitude الجامعة<input id="universityLatitude" type="number" step="any" value="${settings.university_latitude || ''}" /></label>
      <label>Longitude الجامعة<input id="universityLongitude" type="number" step="any" value="${settings.university_longitude || ''}" /></label>
      <label>نصف قطر GPS (متر)<input id="gpsRadius" type="number" value="${settings.gps_radius || 300}" /></label>
      <label>سماح لأجهزة متعددة<input id="allowMultipleDevices" type="checkbox" ${settings.allow_multiple_devices ? 'checked' : ''} /></label>
      <label>مدة الجلسة (ساعات)<input id="sessionDurationHours" type="number" value="${settings.session_duration_hours || 24}" /></label>
      <label>الأقسام المتاحة<textarea id="departments" rows="4" placeholder="قسم 1\nقسم 2\nقسم 3">${departmentsValue}</textarea></label>
      <label>المستويات المتاحة<textarea id="levels" rows="4" placeholder="المستوى 1\nالمستوى 2\nالمستوى 3">${levelsValue}</textarea></label>
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
      university_latitude: Number(form.querySelector('#universityLatitude').value) || '',
      university_longitude: Number(form.querySelector('#universityLongitude').value) || '',
      gps_radius: Number(form.querySelector('#gpsRadius').value) || 300,
      allow_multiple_devices: form.querySelector('#allowMultipleDevices').checked,
      session_duration_hours: Number(form.querySelector('#sessionDurationHours').value) || 24,
      departments: String(form.querySelector('#departments').value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      levels: String(form.querySelector('#levels').value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    };

    const saveResult = await settingsService.saveSettings(payload);
    if (saveResult?.status === 'success') {
      success('تم حفظ الإعدادات بنجاح.');
    } else {
      error(saveResult?.error?.message || 'تعذر حفظ الإعدادات. حاول مرة أخرى.');
    }
  });
}
