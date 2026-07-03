const AUTH_USER_KEY = 'plantcare_user';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  document.dispatchEvent(new CustomEvent('plantcare:authchange'));
}

function clearCurrentUser() {
  localStorage.removeItem(AUTH_USER_KEY);
  document.dispatchEvent(new CustomEvent('plantcare:authchange'));
}

function authHeaders() {
  const user = getCurrentUser();
  return user ? { 'X-User-Id': String(user.id) } : {};
}
