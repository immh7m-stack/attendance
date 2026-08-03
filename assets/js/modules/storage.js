export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

export function removeData(key) {
  localStorage.removeItem(key);
}

export function clearData() {
  localStorage.clear();
}
