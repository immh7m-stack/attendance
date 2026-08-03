export function validateID(value) {
  return typeof value === 'string' && value.trim().length >= 3;
}

export function validateName(value) {
  return typeof value === 'string' && value.trim().length >= 3;
}

export function validateDepartment(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateGPS(location) {
  return location && typeof location.latitude === 'number' && typeof location.longitude === 'number';
}

export function validateAttendance(student) {
  return validateID(student.studentId) && validateName(student.name) && validateDepartment(student.department) && validateName(student.level);
}

export function validateSession(session) {
  return session && session.sessionId && session.subject;
}
