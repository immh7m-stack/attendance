export function generateQR(payload) {
  console.warn('QR generation not implemented. Payload:', payload);
  return null;
}

export function readQR() {
  console.warn('QR scanning not implemented yet.');
  return null;
}

export function validateQR(data) {
  return data && data.sessionId;
}
