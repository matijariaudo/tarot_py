/* Selection engine for TarotGPT. Keeps the original createCardGroup API,
   unique selected indices and the document-level "cards" completion event. */
(function (global) {
  'use strict';
  const groups = new WeakMap();
  const CATALOG_URL = '/static/tarot-images.json';
  let catalogPromise, loadedCatalog;

  // Rejection sampling avoids modulo bias; no card is favored by its position.
  function randomIndex(max) {
    const range = 4294967296;
    const limit = range - range % max;
    const bytes = new Uint32Array(1);
    do { global.crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
    return bytes[0] % max;
  }

  function generarCadenaAleatoria(length) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length}, () => alphabet[randomIndex(alphabet.length)]).join('');
  }

  function shuffleCards(source) {
    const result = [...source];
    for (let index = result.length - 1; index > 0; index--) {
      const other = randomIndex(index + 1);
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  async function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = (async () => {
        const response = await fetch(CATALOG_URL);
        if (!response.ok) throw new Error('Could not load the deck.');
        const data = await response.json();
        if (!Array.isArray(data.cards) || data.cards.length < 3) throw new Error('The card catalog is incomplete.');
        const names = new Set(), images = new Set();
        const catalog = data.cards.map(card => {
          if (!card || typeof card.name !== 'string' || !card.name.trim() ||
              typeof card.img !== 'string' || !/^[\w .-]+\.(png|jpe?g|webp|gif)$/i.test(card.img) ||
              names.has(card.name) || images.has(card.img)) throw new Error('The catalog contains invalid or duplicate cards.');
          names.add(card.name); images.add(card.img);
          return Object.freeze({...card});
        });
        loadedCatalog = Object.freeze(catalog);
        return loadedCatalog;
      })().catch(error => { catalogPromise = undefined; throw error; });
    }
    return catalogPromise;
  }

  function sizeCards(target) {
    const containers = target ? [typeof target === 'string' ? document.querySelector(target) : target] : document.querySelectorAll('[data-card-group]');
    containers.forEach(container => {
      const group = groups.get(container);
      if (!group) return;
      const span = Math.min(405, Math.max(160, container.clientWidth - 78));
      container.style.setProperty('--start-x', `${-span / 2}px`);
      [...container.children].forEach((button, index) => {
        const position = index / (group.deck.length - 1) - .5;
        button.style.setProperty('--x', `${position * span}px`);
        button.style.setProperty('--y', `${Math.abs(position) * 55}px`);
        button.style.setProperty('--r', `${position * 33}deg`);
      });
    });
  }

  function createCardGroup(target, cardsReady = [], options = {}) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('Card container not found.');
    const catalog = options.catalog || loadedCatalog;
    if (!Array.isArray(catalog) || catalog.length < 3) throw new Error('Load the catalog before creating a deck.');
    const id = generarCadenaAleatoria(5);
    // Original layout: forty positions. Shuffle all 78 cards before taking
    // forty, so every card in the full deck can appear in any selected slot.
    const deck = shuffleCards(catalog).slice(0, Math.min(40, catalog.length));
    const selected = [];
    let interactive = true;
    const group = {
      id, deck,
      get selectedIndices() { return [...selected]; },
      get selectedCards() { return selected.map(index => deck[index]); },
      setEnabled(enabled) {
        interactive = enabled;
        [...container.children].forEach((button, index) => { button.disabled = !enabled || selected.includes(index) || selected.length === 3; });
      }
    };
    groups.set(container, group);
    container.dataset.cardGroup = id;
    container.replaceChildren();
    deck.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `deck-card card_${id} card_${id}_${index}`;
      button.dataset.deckCard = index;
      button.style.setProperty('--i', index);
      button.style.zIndex = index + 1;
      button.setAttribute('aria-label', `Choose card ${index + 1} of ${deck.length}`);
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = '<img class="deck-back" src="/static/cards/blank.png" alt="" aria-hidden="true" draggable="false">';
      button.addEventListener('click', () => {
        if (!interactive || selected.length >= 3 || selected.includes(index)) return;
        selected.push(index);
        button.classList.add('picked');
        button.setAttribute('aria-pressed', 'true');
        group.setEnabled(interactive);
        const detail = {cards: [...selected], selectedCards: group.selectedCards, groupId: id, container};
        container.dispatchEvent(new CustomEvent('cardselected', {detail}));
        if (selected.length === 3) {
          // Preserve original event payload: cards contains the chosen indices.
          document.dispatchEvent(new CustomEvent('cards', {detail}));
        } else {
          const buttons = [...container.children];
          const next = buttons.slice(index + 1).find(item => !item.disabled) || buttons.find(item => !item.disabled);
          next?.focus({preventScroll: true});
        }
      });
      container.append(button);
    });
    sizeCards(container);
    // Compatibility with the original cardsReady argument (three indices).
    if (Array.isArray(cardsReady) && cardsReady.length === 3 && new Set(cardsReady).size === 3 && cardsReady.every(index => Number.isInteger(index) && index >= 0 && index < deck.length)) {
      cardsReady.forEach(index => container.children[index].click());
    }
    return group;
  }

  global.addEventListener('resize', () => sizeCards());
  global.TarotCards = Object.freeze({loadCatalog, shuffleCards, createCardGroup, sizeCards, generarCadenaAleatoria});
  global.createCardGroup = createCardGroup;
  global.sizeCards = sizeCards;
  global.generarCadenaAleatoria = generarCadenaAleatoria;
})(window);
