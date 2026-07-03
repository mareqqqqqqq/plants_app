const TEXT_LIMIT = 150;
const VIEWPORT_MARGIN = 24;
const FAVORITES_KEY = 'plantcare_favorites';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isFavorite(id) {
  return getFavoriteIds().includes(id);
}

function toggleFavorite(id) {
  const ids = getFavoriteIds();
  const idx = ids.indexOf(id);
  if (idx === -1) ids.push(id);
  else ids.splice(idx, 1);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  return ids.includes(id);
}

function renderTextBlock(text) {
  const safe = escapeHtml(text);
  if (text.length <= TEXT_LIMIT) {
    return `<p class="modal-text">${safe}</p>`;
  }
  const shortSafe = escapeHtml(text.slice(0, TEXT_LIMIT).trimEnd()) + '…';
  return `
    <div class="text-block">
      <p class="modal-text short-text">${shortSafe}</p>
      <p class="modal-text full-text">${safe}</p>
      <button class="expand-toggle" type="button">Показать ещё</button>
    </div>`;
}

function imageOrEmojiHtml(plant) {
  const emoji = plant.photo_emoji || '🌿';
  if (plant.image_url) {
    const url = String(plant.image_url).replace(/["'<>()\\]/g, '');
    return `<span class="img-blur" style="background-image:url('${url}')"></span><img src="${url}" alt="${escapeHtml(plant.name)}" onerror="var b=this.previousElementSibling;if(b&&b.classList.contains('img-blur'))b.remove();this.replaceWith(document.createTextNode('${emoji}'))">`;
  }
  return emoji;
}

function cardTemplate(plant) {
  const favActive = isFavorite(plant.id) ? ' active' : '';
  return `
    <div class="plant-card" data-id="${plant.id}">
      <div class="plant-card-image">
        ${imageOrEmojiHtml(plant)}
        <button class="favorite-star${favActive}" data-fav-id="${plant.id}" type="button" aria-label="Добавить в избранное">★</button>
      </div>
      <div class="plant-card-name">${escapeHtml(plant.name)}</div>
    </div>`;
}

function modalTemplate(plant) {
  const toxicBadge = plant.is_toxic
    ? `<span class="toxic-badge danger">Ядовито</span>`
    : `<span class="toxic-badge safe">Неядовито</span>`;

  const replantingSection = plant.replanting_info
    ? `
      <div class="modal-section">
        <p class="modal-section-title">🌱 Пересадка</p>
        ${renderTextBlock(plant.replanting_info)}
      </div>`
    : '';

  const extraSection = plant.extra_notes
    ? `
      <div class="modal-section">
        <p class="modal-section-title">ℹ️ Особенности ухода</p>
        ${renderTextBlock(plant.extra_notes)}
      </div>`
    : '';

  return `
    <div class="modal-image">${imageOrEmojiHtml(plant)}</div>
    <div class="modal-body">
      <h2>${escapeHtml(plant.name)}</h2>
      ${toxicBadge}
      <div class="modal-section">
        <p class="modal-section-title">💧 Полив</p>
        ${renderTextBlock(plant.watering_info)}
      </div>
      <div class="modal-section">
        <p class="modal-section-title">☀️ Освещение</p>
        ${renderTextBlock(plant.light_info)}
      </div>
      ${replantingSection}
      ${extraSection}
    </div>`;
}

const catalogGrid = document.getElementById('catalogGrid');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('plantModal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const modalCopyLink = document.getElementById('modalCopyLink');

const IS_FAVORITES_PAGE = catalogGrid.dataset.mode === 'favorites';
const API_BASE = '/api/v1';

let activeCard = null;
let currentPlantId = null;
let modalState = 'closed';
let pendingCleanup = null;

function getPlantsToRender() {
  if (!IS_FAVORITES_PAGE) return PLANTS;
  const favIds = getFavoriteIds();
  return PLANTS.filter((p) => favIds.includes(p.id));
}

function renderCatalog() {
  const list = getPlantsToRender();
  if (IS_FAVORITES_PAGE && list.length === 0) {
    catalogGrid.innerHTML = `<p class="catalog-empty">Пока нет избранных растений. Откройте <a href="catalog.html">справочник</a> и нажмите на звёздочку у понравившихся растений.</p>`;
    return;
  }
  catalogGrid.innerHTML = list.map(cardTemplate).join('');
}

function computeMaxHeight() {
  return window.innerHeight - VIEWPORT_MARGIN * 2;
}

function resizeModalToContent() {
  if (modalState !== 'open') return;
  const maxHeight = computeMaxHeight();
  modal.style.height = 'auto';
  const naturalHeight = modal.scrollHeight;
  const newHeight = Math.min(naturalHeight, maxHeight);
  const newTop = Math.max(VIEWPORT_MARGIN, (window.innerHeight - newHeight) / 2);
  modal.style.height = newHeight + 'px';
  modal.style.top = newTop + 'px';
}

function openModal(plant, card) {
  if (modalState === 'open') return;

  if (pendingCleanup) {
    pendingCleanup();
    pendingCleanup = null;
  }

  modalState = 'open';
  activeCard = card;
  const startRect = card.getBoundingClientRect();

  modal.classList.add('open');
  modal.style.top = startRect.top + 'px';
  modal.style.left = startRect.left + 'px';
  modal.style.width = startRect.width + 'px';
  modal.style.height = startRect.height + 'px';
  modal.style.borderRadius = '14px';
  modal.style.overflow = 'hidden';

  modalContent.innerHTML = modalTemplate(plant);
  card.style.visibility = 'hidden';
  document.body.style.overflow = 'hidden';

  const targetWidth = Math.min(600, window.innerWidth * 0.9);
  const maxHeight = computeMaxHeight();

  modal.style.width = targetWidth + 'px';
  modal.style.height = 'auto';
  const naturalHeight = modal.scrollHeight;
  const targetHeight = Math.min(naturalHeight, maxHeight);

  modal.style.width = startRect.width + 'px';
  modal.style.height = startRect.height + 'px';

  const targetTop = Math.max(VIEWPORT_MARGIN, (window.innerHeight - targetHeight) / 2);
  const targetLeft = Math.max(16, (window.innerWidth - targetWidth) / 2);

  modal.getBoundingClientRect();

  requestAnimationFrame(() => {
    if (modalState !== 'open') return;
    modal.style.top = targetTop + 'px';
    modal.style.left = targetLeft + 'px';
    modal.style.width = targetWidth + 'px';
    modal.style.height = targetHeight + 'px';
    modal.style.borderRadius = '16px';
    modalOverlay.classList.add('visible');
  });

  modal.setAttribute('aria-hidden', 'false');
  currentPlantId = plant.id;
  resetCopyButton();
  history.replaceState(null, '', `#plant-${plant.id}`);
  document.addEventListener('keydown', onEscClose);
}

function resetCopyButton() {
  modalCopyLink.classList.remove('copied');
  modalCopyLink.querySelector('.copy-label').textContent = 'Ссылка';
}

async function copyPlantLink() {
  if (!currentPlantId) return;
  const url = `${location.origin}${location.pathname}#plant-${currentPlantId}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const tmp = document.createElement('textarea');
    tmp.value = url;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
  }
  modalCopyLink.classList.add('copied');
  modalCopyLink.querySelector('.copy-label').textContent = 'Скопировано';
  setTimeout(resetCopyButton, 1800);
}

function closeModal() {
  if (modalState !== 'open') return;
  modalState = 'closing';
  document.removeEventListener('keydown', onEscClose);

  const currentRect = modal.getBoundingClientRect();
  modal.style.top = currentRect.top + 'px';
  modal.style.left = currentRect.left + 'px';
  modal.style.width = currentRect.width + 'px';
  modal.style.height = currentRect.height + 'px';
  modal.style.overflow = 'hidden';

  const cardRect = activeCard ? activeCard.getBoundingClientRect() : null;
  const cardToRestore = activeCard;
  activeCard = null;

  requestAnimationFrame(() => {
    if (modalState !== 'closing') return;
    if (cardRect) {
      modal.style.top = cardRect.top + 'px';
      modal.style.left = cardRect.left + 'px';
      modal.style.width = cardRect.width + 'px';
      modal.style.height = cardRect.height + 'px';
      modal.style.borderRadius = '14px';
    }
    modalOverlay.classList.remove('visible');
  });

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    modal.classList.remove('open');
    modal.removeAttribute('style');
    modal.setAttribute('aria-hidden', 'true');
    if (cardToRestore) cardToRestore.style.visibility = '';
    document.body.style.overflow = '';
    modal.removeEventListener('transitionend', handler);
    if (pendingCleanup === finish) pendingCleanup = null;
    if (modalState === 'closing') modalState = 'closed';
    history.replaceState(null, '', location.pathname + location.search);
  };
  const handler = (e) => {
    if (e.target === modal) finish();
  };
  modal.addEventListener('transitionend', handler);
  setTimeout(finish, 400);
  pendingCleanup = finish;
}

function onEscClose(e) {
  if (e.key === 'Escape') closeModal();
}

catalogGrid.addEventListener('click', (e) => {
  const star = e.target.closest('.favorite-star');
  if (star) {
    e.stopPropagation();
    const id = Number(star.dataset.favId);
    const nowFavorite = toggleFavorite(id);
    star.classList.toggle('active', nowFavorite);
    if (IS_FAVORITES_PAGE && !nowFavorite) {
      renderCatalog();
    }
    return;
  }

  const card = e.target.closest('.plant-card');
  if (!card) return;
  const plant = PLANTS.find((p) => p.id === Number(card.dataset.id));
  if (plant) openModal(plant, card);
});

modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
modalCopyLink.addEventListener('click', copyPlantLink);

modalContent.addEventListener('click', (e) => {
  if (!e.target.matches('.expand-toggle')) return;
  const block = e.target.closest('.text-block');
  block.classList.toggle('expanded');
  e.target.textContent = block.classList.contains('expanded') ? 'Скрыть' : 'Показать ещё';
  resizeModalToContent();
});

async function loadPlants() {
  try {
    const res = await fetch(`${API_BASE}/explorer`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      PLANTS = data;
    }
  } catch (err) {
    console.warn('Не удалось загрузить растения с сервера, используются моковые данные', err);
  }
  renderCatalog();

  const hashMatch = location.hash.match(/^#plant-(\d+)$/);
  if (hashMatch) {
    const plant = PLANTS.find((p) => p.id === Number(hashMatch[1]));
    const card = catalogGrid.querySelector(`.plant-card[data-id="${hashMatch[1]}"]`);
    if (plant && card) openModal(plant, card);
  }
}

loadPlants();
