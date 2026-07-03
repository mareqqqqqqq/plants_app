const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const burgerBtn = document.getElementById('burgerBtn');
const sidebarClose = document.getElementById('sidebarClose');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
  sidebar.setAttribute('aria-hidden', 'false');
  burgerBtn.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
  sidebar.setAttribute('aria-hidden', 'true');
  burgerBtn.setAttribute('aria-expanded', 'false');
}

burgerBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

document.querySelectorAll('.sidebar-link').forEach((link) => {
  link.addEventListener('click', closeSidebar);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSidebar();
});

const USERS_API = '/users';

const authOverlay = document.getElementById('authOverlay');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const authModals = [loginModal, registerModal];
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const userChip = document.getElementById('userChip');
const userChipName = document.getElementById('userChipName');
const logoutBtn = document.getElementById('logoutBtn');

let authOpenState = 'closed';

function openAuthModal(modal) {
  authModals.forEach((m) => {
    m.classList.remove('open', 'visible');
    m.setAttribute('aria-hidden', 'true');
  });
  loginError.hidden = true;
  registerError.hidden = true;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  authOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    modal.classList.add('visible');
  });

  authOpenState = 'open';
  document.addEventListener('keydown', onAuthEscClose);
}

function closeAuthModal() {
  if (authOpenState !== 'open') return;
  authOpenState = 'closed';

  authOverlay.classList.remove('visible');
  authModals.forEach((m) => {
    m.classList.remove('visible');
    m.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onAuthEscClose);

  setTimeout(() => {
    if (authOpenState === 'closed') {
      authModals.forEach((m) => m.classList.remove('open'));
    }
  }, 250);
}

function onAuthEscClose(e) {
  if (e.key === 'Escape') closeAuthModal();
}

document.getElementById('loginBtn').addEventListener('click', () => openAuthModal(loginModal));
document.getElementById('registerBtn').addEventListener('click', () => openAuthModal(registerModal));
document.getElementById('loginModalClose').addEventListener('click', closeAuthModal);
document.getElementById('registerModalClose').addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', closeAuthModal);

document.getElementById('switchToRegister').addEventListener('click', (e) => {
  e.preventDefault();
  openAuthModal(registerModal);
});
document.getElementById('switchToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  openAuthModal(loginModal);
});

function showAuthError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

async function parseAuthError(res, fallback) {
  try {
    const data = await res.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]) return data.detail[0].msg || fallback;
  } catch {}
  return fallback;
}

function refreshAuthUI() {
  const user = getCurrentUser();
  const loggedIn = !!user;
  document.getElementById('loginBtn').hidden = loggedIn;
  document.getElementById('registerBtn').hidden = loggedIn;
  userChip.hidden = !loggedIn;
  if (loggedIn) userChipName.textContent = user.username;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    const res = await fetch(`${USERS_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      showAuthError(loginError, await parseAuthError(res, 'Не удалось войти'));
      return;
    }
    const user = await res.json();
    setCurrentUser(user);
    refreshAuthUI();
    form.reset();
    closeAuthModal();
  } catch {
    showAuthError(loginError, 'Сервер недоступен, попробуйте позже');
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.hidden = true;
  const form = e.target;
  const username = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    const res = await fetch(`${USERS_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      showAuthError(registerError, await parseAuthError(res, 'Не удалось зарегистрироваться'));
      return;
    }
    const user = await res.json();
    setCurrentUser(user);
    refreshAuthUI();
    form.reset();
    closeAuthModal();
  } catch {
    showAuthError(registerError, 'Сервер недоступен, попробуйте позже');
  }
});

logoutBtn.addEventListener('click', () => {
  clearCurrentUser();
  refreshAuthUI();
});

refreshAuthUI();
