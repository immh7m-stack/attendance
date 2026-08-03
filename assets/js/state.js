export const appState = {
  currentPage: 'home',
  currentUser: null,
  settings: null,
  appStatus: 'idle',
  errors: null,
  isLoading: false,
  toast: null,
  modal: null,
  lastAction: null
};

export const studentState = {
  studentProfile: null,
  activeSession: null,
  location: null,
  attendanceStatus: 'idle',
  qrData: null
};

export const adminState = {
  summary: null,
  recentCheckIns: [],
  filters: {},
  activePage: 'dashboard'
};

export const sessionState = {
  activeSession: null,
  sessionList: [],
  sessionDetails: null,
  sessionStatus: 'idle'
};

export const attendanceState = {
  currentAttendance: null,
  duplicateCheck: false,
  submissionResult: null,
  validationErrors: []
};

export function setState(section, patch) {
  const targetMap = {
    app: appState,
    student: studentState,
    admin: adminState,
    session: sessionState,
    attendance: attendanceState
  };
  const target = targetMap[section] || appState;
  Object.assign(target, patch);
  return target;
}

export function getState(section) {
  const targetMap = {
    app: appState,
    student: studentState,
    admin: adminState,
    session: sessionState,
    attendance: attendanceState
  };
  return targetMap[section] || appState;
}

export function resetState() {
  Object.assign(appState, {
    currentUser: null,
    settings: null,
    appStatus: 'idle',
    errors: null,
    isLoading: false,
    toast: null,
    modal: null,
    lastAction: null
  });
  Object.assign(studentState, {
    studentProfile: null,
    activeSession: null,
    location: null,
    attendanceStatus: 'idle',
    qrData: null
  });
  Object.assign(adminState, {
    summary: null,
    recentCheckIns: [],
    filters: {},
    activePage: 'dashboard'
  });
  Object.assign(sessionState, {
    activeSession: null,
    sessionList: [],
    sessionDetails: null,
    sessionStatus: 'idle'
  });
  Object.assign(attendanceState, {
    currentAttendance: null,
    duplicateCheck: false,
    submissionResult: null,
    validationErrors: []
  });
}
