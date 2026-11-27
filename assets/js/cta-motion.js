(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = 'абвгдеиклнопрстухч0123456789';
  const duration = 500;

  for (const button of document.querySelectorAll('.cta-motion')) {
    const label = button.querySelector('.cta-motion__label');
    if (!label?.textContent.trim()) continue;

    const words = [];
    const fragment = document.createDocumentFragment();
    let letterCount = 0;
    let timer = 0;

    for (const part of label.textContent.split(/(\s+)/u)) {
      if (!part || /^\s+$/u.test(part)) {
        fragment.append(part);
        continue;
      }

      const word = document.createElement('span');
      const text = document.createElement('span');
      const scrambled = document.createElement('span');
      word.className = 'cta-motion__word';
      text.className = 'cta-motion__text';
      text.textContent = part;
      scrambled.className = 'cta-motion__scramble';
      scrambled.setAttribute('aria-hidden', 'true');
      word.append(text, scrambled);
      fragment.append(word);
      const letters = [...part];
      words.push({ letters, scrambled, offset: letterCount });
      letterCount += letters.length;
    }
    label.replaceChildren(fragment);

    function stop() {
      clearTimeout(timer);
      timer = 0;
      button.removeAttribute('data-scrambling');
    }

    function start() {
      if (timer || reducedMotion.matches || document.hidden) return;
      const started = performance.now();
      button.setAttribute('data-scrambling', '');

      function update() {
        const elapsed = performance.now() - started;
        if (elapsed >= duration || reducedMotion.matches || document.hidden) {
          stop();
          return;
        }

        const visible = Math.floor(letterCount * elapsed / duration);
        for (const { letters, scrambled, offset } of words) {
          const revealed = Math.max(0, visible - offset);
          scrambled.textContent = letters.map((letter, index) =>
            index < revealed ? letter : glyphs[Math.floor(Math.random() * glyphs.length)]
          ).join('');
        }
        timer = setTimeout(update, 30);
      }

      update();
    }

    button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') start(); });
    button.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') start(); });
    button.addEventListener('focus', () => { if (button.matches(':focus-visible')) start(); });
    button.addEventListener('pointerleave', () => { if (!button.matches(':focus-visible')) stop(); });
    button.addEventListener('blur', () => { if (!button.matches(':hover')) stop(); });
    button.addEventListener('pointercancel', stop);
  }
})();
