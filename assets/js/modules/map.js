export function initMap(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  container.textContent = 'Map preview is not available yet.';
  return null;
}

export function showStudentLocation(location) {
  console.log('Show student location:', location);
}

export function showRadius(center, radius) {
  console.log('Show radius on map:', center, radius);
}
