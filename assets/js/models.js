export const StudentModel = {
  id: '',
  studentId: '',
  name: '',
  department: '',
  faculty: '',
  level: '',
  phone: '',
  email: '',
  status: 'active'
};

export const SessionModel = {
  id: '',
  subjectId: '',
  subjectName: '',
  date: '',
  start: '',
  end: '',
  location: { latitude: 0, longitude: 0, radius: 300 },
  room: '',
  status: 'open'
};

export const AttendanceModel = {
  id: '',
  studentId: '',
  sessionId: '',
  date: '',
  time: '',
  status: 'present',
  distance: 0,
  device: '',
  browser: ''
};
