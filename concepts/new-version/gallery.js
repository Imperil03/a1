(() => {
  'use strict';

  const cards = [...document.querySelectorAll('.variant')];
  const variants = cards.map(card => ({
    number: card.dataset.number,
    title: card.querySelector('h2').textContent,
    description: card.querySelector('.description').textContent,
    image: card.querySelector('img').getAttribute('src'),
    alt: card.querySelector('img').alt,
    card,
  }));
  const dialog = document.querySelector('.viewer');
  const stage = dialog.querySelector('.viewer-stage');
  const image = dialog.querySelector('.viewer-image');
  const imageError = dialog.querySelector('.image-error');
  const zoomButton = dialog.querySelector('.zoom-button');
  const previousButton = dialog.querySelector('.previous-variant');
  const nextButton = dialog.querySelector('.next-variant');
  const viewerChoose = dialog.querySelector('.viewer-choose');
  const panel = document.querySelector('.selection-panel');
  const copyButton = document.querySelector('#copy-choice');
  const manualCopy = document.querySelector('#manual-copy');
  const messageField = document.querySelector('#choice-message');
  const announcement = document.querySelector('.announcement');
  const storageKey = 'a1-design-choice-2026';
  let currentIndex = -1;
  let selectedNumber = null;
  let returnFocus = null;
  let announceTimer;
  let copyVersion = 0;

  function announce(message) {
    clearTimeout(announceTimer);
    announcement.textContent = '';
    announceTimer = setTimeout(() => { announcement.textContent = message; }, 30);
  }

  function variantUrl(number) {
    const url = new URL(location.href);
    url.hash = `variant-${number}`;
    return url.href;
  }

  function choiceMessage(variant) {
    return `Мне нравится вариант ${Number(variant.number)} «${variant.title}».\n${variantUrl(variant.number)}`;
  }

  function updateChoice() {
    const chosen = variants.find(variant => variant.number === selectedNumber);
    document.querySelectorAll('[data-choose]').forEach(button => {
      const active = button.dataset.choose === selectedNumber;
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? 'Выбран' : 'Выбрать';
    });
    panel.hidden = !chosen;
    document.body.classList.toggle('has-choice', Boolean(chosen));
    manualCopy.hidden = true;
    copyButton.textContent = 'Скопировать выбор';
    copyButton.disabled = false;
    copyVersion += 1;
    if (chosen) {
      document.querySelector('#selection-title').textContent = `${Number(chosen.number)} · ${chosen.title}`;
      messageField.value = choiceMessage(chosen);
    }
    if (currentIndex >= 0) {
      const isSelected = variants[currentIndex].number === selectedNumber;
      viewerChoose.textContent = isSelected ? 'Вариант выбран' : 'Выбрать вариант';
      viewerChoose.setAttribute('aria-pressed', String(isSelected));
    }
  }

  function choose(number) {
    if (!variants.some(variant => variant.number === number)) return;
    selectedNumber = number;
    try { localStorage.setItem(storageKey, number); } catch { /* Choice still works for this visit. */ }
    updateChoice();
    announce(`Выбран вариант ${Number(number)}. Скопируйте выбор и отправьте команде проекта.`);
  }

  function setZoom(enabled) {
    stage.classList.toggle('is-zoomed', enabled);
    zoomButton.setAttribute('aria-pressed', String(enabled));
    zoomButton.setAttribute('aria-label', enabled ? 'Вместить макет в окно' : 'Показать в масштабе 100%');
    zoomButton.textContent = enabled ? 'Вместить' : '100%';
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  }

  function openVariant(index, trigger = null) {
    if (index < 0 || index >= variants.length) return;
    const variant = variants[index];
    if (typeof dialog.showModal !== 'function') {
      location.href = variant.image;
      return;
    }
    if (!dialog.open) returnFocus = trigger || variant.card.querySelector('[data-open]');
    currentIndex = index;
    document.querySelector('#viewer-number').textContent = `Вариант ${Number(variant.number)}`;
    document.querySelector('#viewer-title').textContent = variant.title;
    document.querySelector('#viewer-description').textContent = variant.description;
    dialog.querySelector('.viewer-position').textContent = `${index + 1} / ${variants.length}`;
    dialog.querySelector('.original-link').href = variant.image;
    imageError.hidden = true;
    image.hidden = false;
    image.alt = variant.alt;
    image.src = variant.image;
    previousButton.disabled = index === 0;
    nextButton.disabled = index === variants.length - 1;
    viewerChoose.textContent = variant.number === selectedNumber ? 'Вариант выбран' : 'Выбрать вариант';
    viewerChoose.setAttribute('aria-pressed', String(variant.number === selectedNumber));
    setZoom(false);
    history.replaceState(null, '', `#variant-${variant.number}`);
    if (!dialog.open) {
      dialog.showModal();
      document.body.classList.add('viewer-open');
    }
  }

  function closeViewer() { if (dialog.open) dialog.close(); }

  function openFromHash() {
    const index = variants.findIndex(variant => location.hash === `#variant-${variant.number}`);
    if (index >= 0) openVariant(index);
    else closeViewer();
  }

  image.addEventListener('error', () => { image.hidden = true; imageError.hidden = false; });
  image.addEventListener('load', () => { image.hidden = false; imageError.hidden = true; });
  document.querySelectorAll('[data-open]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openVariant(variants.findIndex(variant => variant.number === link.dataset.open), link);
    });
  });
  document.querySelectorAll('[data-choose]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => choose(button.dataset.choose));
  });
  document.querySelector('.js-instruction').hidden = false;
  dialog.querySelector('.close-viewer').addEventListener('click', closeViewer);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeViewer();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    if (variants.some(variant => location.hash === `#variant-${variant.number}`)) history.replaceState(null, '', location.pathname + location.search);
    returnFocus?.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || stage.classList.contains('is-zoomed')) return;
    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      event.preventDefault();
      openVariant(currentIndex - 1);
    }
    if (event.key === 'ArrowRight' && currentIndex < variants.length - 1) {
      event.preventDefault();
      openVariant(currentIndex + 1);
    }
  });
  previousButton.addEventListener('click', () => openVariant(currentIndex - 1));
  nextButton.addEventListener('click', () => openVariant(currentIndex + 1));
  zoomButton.addEventListener('click', () => setZoom(zoomButton.getAttribute('aria-pressed') !== 'true'));
  viewerChoose.addEventListener('click', () => {
    const variant = variants[currentIndex];
    choose(variant.number);
    returnFocus = variant.card.querySelector('[data-choose]');
    closeViewer();
  });
  window.addEventListener('hashchange', openFromHash);
  document.querySelector('#clear-choice').addEventListener('click', () => {
    const priorNumber = selectedNumber;
    selectedNumber = null;
    try { localStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
    updateChoice();
    document.querySelector(`[data-choose="${priorNumber}"]`)?.focus({ preventScroll: true });
    announce('Выбор снят.');
  });
  copyButton.addEventListener('click', async () => {
    const version = copyVersion;
    const chosen = variants.find(variant => variant.number === selectedNumber);
    if (!chosen) return;
    const message = choiceMessage(chosen);
    copyButton.disabled = true;
    try {
      await navigator.clipboard.writeText(message);
      if (version !== copyVersion) return;
      copyButton.textContent = 'Скопировано';
      announce('Сообщение скопировано. Отправьте его команде проекта.');
    } catch {
      if (version !== copyVersion) return;
      manualCopy.hidden = false;
      messageField.value = message;
      messageField.focus();
      messageField.select();
      announce('Не удалось скопировать автоматически. Выделенный текст можно скопировать вручную.');
    } finally {
      if (version === copyVersion) copyButton.disabled = false;
    }
  });

  try {
    const saved = localStorage.getItem(storageKey);
    if (variants.some(variant => variant.number === saved)) selectedNumber = saved;
  } catch { /* Private browsing may disallow storage. */ }
  updateChoice();
  openFromHash();
})();
