export const notificationService = {
  showToast(message, type = 'info') {
    // Services must not manipulate DOM — dispatch an event handled by UI modules
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  },
  showLoading(message = 'جاري التحميل...') {
    window.dispatchEvent(new CustomEvent('app:loading:show', { detail: { message } }));
  },
  hideLoading() {
    window.dispatchEvent(new CustomEvent('app:loading:hide'));
  }
};
