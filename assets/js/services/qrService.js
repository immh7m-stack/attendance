export const qrService = {
  generatePayload(data) {
    return JSON.stringify(data);
  },
  parsePayload(payload) {
    try { return JSON.parse(payload); } catch { return null; }
  },
  validatePayload(data) {
    return Boolean(data?.sessionId && data?.subjectId && data?.date);
  }
};
