const REPOTTED_KEY = 'plantcare_repotted';
const NOTIF_API = '/plants';

function getRepottedMap() {
  try {
    const raw = localStorage.getItem(REPOTTED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setRepotted(plantId, iso) {
  const map = getRepottedMap();
  map[plantId] = iso;
  localStorage.setItem(REPOTTED_KEY, JSON.stringify(map));
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function computeNotifications(plants) {
  const now = Date.now();
  const repotted = getRepottedMap();
  const list = [];
  plants.forEach((rec) => {
    if (rec.watering_interval_days) {
      const last = new Date(rec.last_watered_date || rec.date_added);
      const nextWater = last.getTime() + rec.watering_interval_days * 86400000;
      if (nextWater <= now) {
        list.push({ type: 'water', plantId: rec.id, plantName: rec.custom_name, rec });
      }
    }
    if (rec.repotting_interval_months) {
      const base = repotted[rec.id] ? new Date(repotted[rec.id]) : new Date(rec.date_added);
      const nextRepot = addMonths(base, rec.repotting_interval_months);
      if (nextRepot.getTime() <= now) {
        list.push({ type: 'repot', plantId: rec.id, plantName: rec.custom_name, rec });
      }
    }
  });
  return list;
}

async function fetchUserPlants() {
  if (!getCurrentUser()) return null;
  try {
    const res = await fetch(`${NOTIF_API}/my`, { headers: authHeaders() });
    if (!res.ok) throw new Error('request failed');
    return await res.json();
  } catch {
    return null;
  }
}

function updateReminderBadge(count) {
  const badge = document.getElementById('reminderBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

async function refreshReminderBadge() {
  const plants = await fetchUserPlants();
  if (!plants) {
    updateReminderBadge(0);
    return;
  }
  updateReminderBadge(computeNotifications(plants).length);
}

document.addEventListener('plantcare:authchange', refreshReminderBadge);
refreshReminderBadge();
