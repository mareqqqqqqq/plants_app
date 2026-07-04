const PLANTS_API = '/plants';

let PLANTS = [];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function safeUrl(url) {
  return String(url).replace(/["'<>()\\]/g, '');
}

const myPlantsGrid = document.getElementById('myPlantsGrid');
const emptyState = document.getElementById('emptyState');
const loadErrorState = document.getElementById('loadErrorState');
const authRequired = document.getElementById('authRequired');
const authRequiredBtn = document.getElementById('authRequiredBtn');
const addPlantBtn = document.getElementById('addPlantBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');

const formOverlay = document.getElementById('formOverlay');
const formModal = document.getElementById('plantFormModal');
const formClose = document.getElementById('plantFormClose');
const plantForm = document.getElementById('plantForm');
const pfTitle = document.getElementById('pfTitle');
const pfSubmit = document.getElementById('pfSubmit');
const existsCheckbox = document.getElementById('existsInCatalog');
const linkedSection = document.getElementById('linkedSection');
const customSection = document.getElementById('customSection');
const catalogPick = document.getElementById('catalogPick');
const catalogOptions = document.getElementById('catalogOptions');
const customNameInput = document.getElementById('customName');
const customImageInput = document.getElementById('customImage');
const photoUpload = document.getElementById('photoUpload');
const photoPreview = document.getElementById('photoPreview');
const photoRemove = document.getElementById('photoRemove');
const wateringDaysInput = document.getElementById('wateringDays');
const repottingMonthsInput = document.getElementById('repottingMonths');
const lastWateredInput = document.getElementById('lastWatered');
const isToxicInput = document.getElementById('isToxic');
const plantNotesInput = document.getElementById('plantNotes');
const formError = document.getElementById('formError');

const viewOverlay = document.getElementById('viewOverlay');
const viewModal = document.getElementById('plantViewModal');
const viewClose = document.getElementById('viewClose');
const viewContent = document.getElementById('viewContent');

let editingId = null;
let pendingImageUrl = null;
let myPlantsCache = [];

function linkedPlantFor(rec) {
  return rec.plant_id ? PLANTS.find((p) => p.id === rec.plant_id) : null;
}

function plantImageHtml(rec, altText) {
  const linkedPlant = linkedPlantFor(rec);
  const url = rec.img_url || (linkedPlant && linkedPlant.image_url) || null;
  const emoji = (linkedPlant && linkedPlant.photo_emoji) || '🪴';
  if (url) {
    const u = safeUrl(url);
    return `<span class="img-blur" style="background-image:url('${u}')"></span><img src="${u}" alt="${escapeHtml(altText)}" onerror="var b=this.previousElementSibling;if(b&&b.classList.contains('img-blur'))b.remove();this.replaceWith(document.createTextNode('${emoji}'))">`;
  }
  return emoji;
}

function nextWatering(rec) {
  if (!rec.watering_interval_days) return null;
  const last = new Date(rec.last_watered_date || rec.date_added);
  const next = new Date(last.getTime() + rec.watering_interval_days * 86400000);
  return Math.ceil((next - Date.now()) / 86400000);
}

function wateringBadge(rec) {
  const diff = nextWatering(rec);
  if (diff === null) return '';
  if (diff <= 0) return `<span class="due-badge due">💧 Пора полить</span>`;
  return `<span class="due-badge">💧 Полив через ${diff} дн.</span>`;
}

function cardHtml(rec) {
  const notes = rec.notes ? `<p class="my-plant-notes">${escapeHtml(rec.notes)}</p>` : '';
  return `
    <div class="plant-card my-plant-card" data-rec-id="${rec.id}" role="button" tabindex="0">
      <div class="plant-card-image">
        ${plantImageHtml(rec, rec.custom_name)}
      </div>
      <div class="my-plant-body">
        <div class="plant-card-name">${escapeHtml(rec.custom_name)}</div>
        ${wateringBadge(rec)}
        ${notes}
      </div>
    </div>`;
}

function setState(state) {
  authRequired.hidden = state !== 'auth-required';
  loadErrorState.hidden = state !== 'error';
  emptyState.hidden = state !== 'empty';
  myPlantsGrid.hidden = state !== 'list';
  addPlantBtn.hidden = state === 'auth-required' || state === 'error';
}

async function fetchMyPlants() {
  const res = await fetch(`${PLANTS_API}/my`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

async function renderMyPlants() {
  if (!getCurrentUser()) {
    setState('auth-required');
    return;
  }

  try {
    myPlantsCache = await fetchMyPlants();
  } catch (err) {
    myPlantsGrid.innerHTML = '';
    setState('error');
    return;
  }

  updateReminderBadge(computeNotifications(myPlantsCache).length);

  if (!myPlantsCache.length) {
    myPlantsGrid.innerHTML = '';
    setState('empty');
    return;
  }
  setState('list');
  myPlantsGrid.innerHTML = myPlantsCache.map(cardHtml).join('');
}

function setSectionEnabled(section, enabled) {
  section.classList.toggle('is-disabled', !enabled);
  section.querySelectorAll('input, textarea, button').forEach((el) => {
    el.disabled = !enabled;
  });
}

function applyMode() {
  const linked = existsCheckbox.checked;
  setSectionEnabled(linkedSection, linked);
  setSectionEnabled(customSection, !linked);
  formError.hidden = true;
}

function setPhotoPreview(url) {
  pendingImageUrl = url;
  if (url) {
    photoPreview.innerHTML = `<img src="${safeUrl(url)}" alt="Фото растения">`;
    photoUpload.classList.add('has-photo');
    photoRemove.hidden = false;
  } else {
    photoPreview.innerHTML = `<span class="pf-upload-icon">📷</span><span class="pf-upload-text">Загрузить фото с устройства</span>`;
    photoUpload.classList.remove('has-photo');
    photoRemove.hidden = true;
  }
}

function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

async function parseApiError(res, fallback) {
  try {
    const data = await res.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]) return data.detail[0].msg || fallback;
  } catch {}
  return fallback;
}

function fillFormForEdit(rec) {
  const linked = !!rec.plant_id;
  existsCheckbox.checked = linked;
  applyMode();
  if (linked) {
    const plant = linkedPlantFor(rec);
    catalogPick.value = plant ? plant.name : '';
  } else {
    customNameInput.value = rec.custom_name || '';
    wateringDaysInput.value = rec.watering_interval_days || 7;
    repottingMonthsInput.value = rec.repotting_interval_months || 12;
    isToxicInput.checked = !!rec.is_toxic;
    plantNotesInput.value = rec.notes || '';
    if (rec.last_watered_date) {
      lastWateredInput.value = new Date(rec.last_watered_date).toISOString().slice(0, 10);
    }
    setPhotoPreview(rec.img_url || null);
  }
}

function openForm(rec) {
  plantForm.reset();
  editingId = rec ? rec.id : null;
  setPhotoPreview(null);
  catalogPick.value = '';
  existsCheckbox.checked = false;
  applyMode();

  if (rec) {
    pfTitle.textContent = 'Редактировать растение';
    pfSubmit.textContent = 'Сохранить изменения';
    fillFormForEdit(rec);
  } else {
    pfTitle.textContent = 'Новое растение';
    pfSubmit.textContent = 'Добавить растение';
  }

  formOverlay.classList.add('visible');
  formModal.classList.add('open');
  formModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => formModal.classList.add('visible'));
}

function closeForm() {
  formOverlay.classList.remove('visible');
  formModal.classList.remove('visible');
  formModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => formModal.classList.remove('open'), 250);
}

function resolveCatalogPlant() {
  const val = catalogPick.value.trim();
  if (!val) return null;
  const linkMatch = val.match(/#plant-(\d+)/);
  if (linkMatch) return PLANTS.find((p) => p.id === Number(linkMatch[1])) || null;
  return PLANTS.find((p) => p.name.toLowerCase() === val.toLowerCase()) || null;
}

existsCheckbox.addEventListener('change', applyMode);

photoUpload.addEventListener('click', () => customImageInput.click());

customImageInput.addEventListener('change', async () => {
  const file = customImageInput.files && customImageInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${PLANTS_API}/upload-image`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    if (!res.ok) {
      showFormError(await parseApiError(res, 'Не удалось загрузить фото'));
      return;
    }
    const data = await res.json();
    setPhotoPreview(data.url);
  } catch {
    showFormError('Сервер недоступен, не удалось загрузить фото');
  }
});

photoRemove.addEventListener('click', () => {
  customImageInput.value = '';
  setPhotoPreview(null);
});

plantForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  let payload;

  if (existsCheckbox.checked) {
    const plant = resolveCatalogPlant();
    if (!plant) {
      showFormError('Выберите растение из справочника или вставьте корректную ссылку на карточку');
      return;
    }
    payload = {
      plant_id: plant.id,
      custom_name: plant.name,
      is_toxic: plant.is_toxic,
    };
  } else {
    const name = customNameInput.value.trim();
    if (!name) {
      showFormError('Укажите название растения');
      return;
    }
    payload = {
      plant_id: null,
      custom_name: name,
      notes: plantNotesInput.value.trim() || null,
      watering_interval_days: Math.max(1, Math.min(365, Number(wateringDaysInput.value) || 7)),
      repotting_interval_months: Math.max(1, Math.min(120, Number(repottingMonthsInput.value) || 12)),
      is_toxic: isToxicInput.checked,
      img_url: pendingImageUrl || null,
      last_watered_date: lastWateredInput.value || null,
    };
  }

  try {
    const url = editingId ? `${PLANTS_API}/my/${editingId}` : `${PLANTS_API}/add`;
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      showFormError(await parseApiError(res, 'Не удалось сохранить растение'));
      return;
    }
  } catch {
    showFormError('Сервер недоступен, попробуйте позже');
    return;
  }

  await renderMyPlants();
  closeForm();
});

function viewTemplate(rec) {
  const linkedPlant = linkedPlantFor(rec);
  const dateStr = new Date(rec.date_added).toLocaleDateString('ru-RU');
  const toxic = rec.is_toxic
    ? `<span class="toxic-badge danger">Ядовито</span>`
    : `<span class="toxic-badge safe">Неядовито</span>`;

  const wateringText = rec.watering_interval_days
    ? `Раз в ${rec.watering_interval_days} дн. ${wateringBadge(rec)}`
    : '—';

  let repottingText = '';
  if (linkedPlant && linkedPlant.replanting_info) {
    repottingText = escapeHtml(linkedPlant.replanting_info);
  } else if (rec.repotting_interval_months) {
    repottingText = `Раз в ${rec.repotting_interval_months} мес.`;
  }
  const repottingSection = repottingText
    ? `<div class="pv-section"><p class="pv-section-title">🌱 Пересадка</p><p class="pv-text">${repottingText}</p></div>`
    : '';

  const lightSection = linkedPlant && linkedPlant.light_info
    ? `<div class="pv-section"><p class="pv-section-title">☀️ Освещение</p><p class="pv-text">${escapeHtml(linkedPlant.light_info)}</p></div>`
    : '';

  const notesSection = rec.notes
    ? `<div class="pv-section"><p class="pv-section-title">📝 Заметки</p><p class="pv-text">${escapeHtml(rec.notes)}</p></div>`
    : '';

  const catalogRef = linkedPlant
    ? `<a class="pv-link" href="catalog.html#plant-${linkedPlant.id}">Открыть в справочнике →</a>`
    : '';

  return `
    <div class="pv-image">${plantImageHtml(rec, rec.custom_name)}</div>
    <div class="pv-body">
      <h2>${escapeHtml(rec.custom_name)}</h2>
      <div class="pv-badges">${toxic}<span class="pv-date">Добавлено ${dateStr}</span></div>
      <div class="pv-section"><p class="pv-section-title">💧 Полив</p><p class="pv-text">${wateringText}</p></div>
      ${repottingSection}
      ${lightSection}
      ${notesSection}
      ${catalogRef}
      <div class="pv-actions">
        <button class="btn btn-outline" data-edit-id="${rec.id}">Редактировать</button>
        <button class="btn btn-danger" data-del-id="${rec.id}">Удалить</button>
      </div>
    </div>`;
}

function openView(rec) {
  viewContent.innerHTML = viewTemplate(rec);
  viewOverlay.classList.add('visible');
  viewModal.classList.add('open');
  viewModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => viewModal.classList.add('visible'));
}

function closeView() {
  viewOverlay.classList.remove('visible');
  viewModal.classList.remove('visible');
  viewModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => viewModal.classList.remove('open'), 250);
}

async function deletePlant(recId) {
  const rec = myPlantsCache.find((r) => r.id === recId);
  if (!rec) return;
  if (!confirm(`Удалить «${rec.custom_name}» из вашей коллекции?`)) return;

  try {
    const res = await fetch(`${PLANTS_API}/my/${recId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      alert(await parseApiError(res, 'Не удалось удалить растение'));
      return;
    }
  } catch {
    alert('Сервер недоступен, попробуйте позже');
    return;
  }

  await renderMyPlants();
}

myPlantsGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.my-plant-card');
  if (!card) return;
  const rec = myPlantsCache.find((r) => r.id === Number(card.dataset.recId));
  if (rec) openView(rec);
});

myPlantsGrid.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.my-plant-card');
  if (!card) return;
  e.preventDefault();
  const rec = myPlantsCache.find((r) => r.id === Number(card.dataset.recId));
  if (rec) openView(rec);
});

viewContent.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit-id]');
  if (editBtn) {
    const rec = myPlantsCache.find((r) => r.id === Number(editBtn.dataset.editId));
    closeView();
    if (rec) openForm(rec);
    return;
  }
  const delBtn = e.target.closest('[data-del-id]');
  if (delBtn) {
    const id = Number(delBtn.dataset.delId);
    closeView();
    deletePlant(id);
  }
});

addPlantBtn.addEventListener('click', () => openForm());
emptyAddBtn.addEventListener('click', () => openForm());
authRequiredBtn.addEventListener('click', () => document.getElementById('loginBtn').click());
formClose.addEventListener('click', closeForm);
formOverlay.addEventListener('click', closeForm);
viewClose.addEventListener('click', closeView);
viewOverlay.addEventListener('click', closeView);

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (formModal.classList.contains('open')) closeForm();
  else if (viewModal.classList.contains('open')) closeView();
});

document.addEventListener('plantcare:authchange', renderMyPlants);

async function loadCatalogForForm() {
  try {
    const res = await fetch(`${PLANTS_API}/explorer`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) PLANTS = data;
  } catch (err) {
    PLANTS = [];
  }
  catalogOptions.innerHTML = '';
  PLANTS.forEach((p) => {
    const option = document.createElement('option');
    option.value = p.name;
    catalogOptions.appendChild(option);
  });
}

loadCatalogForForm();
renderMyPlants();
