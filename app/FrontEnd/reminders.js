const notifList = document.getElementById('notifList');
const emptyState = document.getElementById('emptyState');
const authRequired = document.getElementById('authRequired');
const loadErrorState = document.getElementById('loadErrorState');
const authRequiredBtn = document.getElementById('authRequiredBtn');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function notifCardHtml(n) {
  if (n.type === 'water') {
    return `
      <div class="notif-card notif-water">
        <div class="notif-icon">💧</div>
        <div class="notif-body">
          <div class="notif-title">Пора полить</div>
          <div class="notif-plant">${escapeHtml(n.plantName)}</div>
        </div>
        <button class="notif-btn" data-action="water" data-plant-id="${n.plantId}">Полил</button>
      </div>`;
  }
  return `
    <div class="notif-card notif-repot">
      <div class="notif-icon">🪴</div>
      <div class="notif-body">
        <div class="notif-title">Пора пересадить</div>
        <div class="notif-plant">${escapeHtml(n.plantName)}</div>
      </div>
      <button class="notif-btn" data-action="repot" data-plant-id="${n.plantId}">Пересадил</button>
    </div>`;
}

function setState(state) {
  authRequired.hidden = state !== 'auth-required';
  loadErrorState.hidden = state !== 'error';
  emptyState.hidden = state !== 'empty';
  notifList.hidden = state !== 'list';
}

async function renderReminders() {
  if (!getCurrentUser()) {
    notifList.innerHTML = '';
    setState('auth-required');
    updateReminderBadge(0);
    return;
  }

  const plants = await fetchUserPlants();
  if (!plants) {
    notifList.innerHTML = '';
    setState('error');
    updateReminderBadge(0);
    return;
  }

  const notifs = computeNotifications(plants);
  updateReminderBadge(notifs.length);

  if (!notifs.length) {
    notifList.innerHTML = '';
    setState('empty');
    return;
  }

  setState('list');
  notifList.innerHTML = notifs.map(notifCardHtml).join('');
}

notifList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.notif-btn');
  if (!btn) return;
  const plantId = Number(btn.dataset.plantId);
  const action = btn.dataset.action;
  btn.disabled = true;

  const nowIso = new Date().toISOString();

  if (action === 'water') {
    try {
      const res = await fetch(`${NOTIF_API}/my/${plantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ last_watered_date: nowIso.slice(0, 10) }),
      });
      if (!res.ok) throw new Error('patch failed');
    } catch {
      btn.disabled = false;
      return;
    }
  } else {
    setRepotted(plantId, nowIso);
  }

  await renderReminders();
});

authRequiredBtn.addEventListener('click', () => document.getElementById('loginBtn').click());

document.addEventListener('plantcare:authchange', renderReminders);

renderReminders();
