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

const authOverlay = document.getElementById('authOverlay');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const authModals = [loginModal, registerModal];

let authOpenState = 'closed';

function openAuthModal(modal) {
  authModals.forEach((m) => {
    m.classList.remove('open', 'visible');
    m.setAttribute('aria-hidden', 'true');
  });

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

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Вход появится, когда будет готов бэкенд');
  closeAuthModal();
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Регистрация появится, когда будет готов бэкенд');
  closeAuthModal();
});
