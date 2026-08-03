export const gpsService = {
  async requestPermission() {
    return true;
  },
  async getCurrentLocation() {
    return { latitude: 30.0444, longitude: 31.2357, accuracy: 20 };
  },
  calculateDistance(coordA, coordB) {
    const toRad = (deg) => deg * (Math.PI / 180);
    const R = 6371e3;
    const φ1 = toRad(coordA.latitude);
    const φ2 = toRad(coordB.latitude);
    const Δφ = toRad(coordB.latitude - coordA.latitude);
    const Δλ = toRad(coordB.longitude - coordA.longitude);
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
  isInsideRadius(coordA, coordB, radius = 300) {
    const distance = this.calculateDistance(coordA, coordB);
    return { inside: distance <= radius, distance };
  }
};
