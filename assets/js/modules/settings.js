import { settingsService } from '../services/settingsService.js';
import { APP_CONFIG } from '../config.js';
import { success, error } from './notifications.js';
import { createCard, createEmptyState, createLoader, createErrorState } from './components.js';

export async function initSettingsPage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(createLoader('جاري جلب البيانات لعرضها. الرجاء الانتظار...'));

  try {
    const result = await settingsService.getLocationSettings();
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
        <label>Latitude الجامعة<input id="universityLatitude" type="number" step="any" value="${settings.university_latitude || ''}" /></label>
        <label>Longitude الجامعة<input id="universityLongitude" type="number" step="any" value="${settings.university_longitude || ''}" /></label>
        <label>نصف قطر GPS (متر)<input id="gpsRadius" type="number" value="${settings.gps_radius || APP_CONFIG.gpsRadiusMeters}" /></label>
        <label>سماح لأجهزة متعددة<input id="allowMultipleDevices" type="checkbox" ${settings.allow_multiple_devices ? 'checked' : ''} /></label>
        <label>مدة الجلسة (ساعات)<input id="sessionDurationHours" type="number" value="${settings.session_duration_hours || 24}" /></label>
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
        university_latitude: Number(form.querySelector('#universityLatitude').value),
        university_longitude: Number(form.querySelector('#universityLongitude').value),
        gps_radius: Number(form.querySelector('#gpsRadius').value) || APP_CONFIG.gpsRadiusMeters,
        allow_multiple_devices: form.querySelector('#allowMultipleDevices').checked,
        session_duration_hours: Number(form.querySelector('#sessionDurationHours').value) || 24
      };

      const saveResult = await settingsService.saveSettings(payload);
      if (saveResult?.status === 'success') {
        success('تم حفظ إعدادات الموقع في الشيت بنجاح.');
      } else {
        error(saveResult?.error?.message || 'تعذر حفظ الإعدادات. حاول مرة أخرى.');
      }
    });
  } catch (error) {
    container.innerHTML = '';
    container.appendChild(createErrorState('تعذر جلب البيانات. يرجى المحاولة مرة أخرى.'));
  }
}
