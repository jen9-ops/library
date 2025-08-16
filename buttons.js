/*! BtnKit 1.0.0 – tiny button factory (UMD) */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BtnKit = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /** Генератор id/class/name */
  const rand = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().split("-")[0]
      : Math.random().toString(36).slice(2, 10));

  /** Безопасно получить DOM-узел родителя */
  function resolveParent(parent) {
    if (!parent) return document.body;
    if (parent instanceof Element) return parent;
    if (typeof parent === "string") {
      const el = document.querySelector(parent);
      if (el) return el;
      throw new Error(`Parent selector not found: "${parent}"`);
    }
    throw new Error("Invalid 'parent' option: must be selector or Element");
  }

  /** Валидация базовых строковых опций */
  function ensureStrOrUndef(val, key) {
    if (val == null) return;
    if (typeof val !== "string") throw new Error(`Option '${key}' must be string`);
  }

  /** Повесить набор событий */
  function attachEvents(el, events) {
    const registry = [];
    if (!events) return registry;

    // Поддержка шорткатов onClick / onDblClick ...
    const shortcuts = Object.entries(events)
      .filter(([k]) => /^on[A-Z]/.test(k))
      .map(([k, v]) => [k.slice(2).toLowerCase(), v]); // onClick -> click

    // Поле events: { click(){}, mouseenter(){} }
    const map = new Map([
      ...Object.entries(events).filter(([k]) => !/^on[A-Z]/.test(k)),
      ...shortcuts
    ]);

    for (const [type, handler] of map) {
      if (typeof handler === "function") {
        el.addEventListener(type, handler);
        registry.push({ type, handler });
      }
    }
    return registry;
  }

  /** Применить стилевые свойства */
  function applyStyles(el, styles) {
    if (!styles) return;
    Object.entries(styles).forEach(([k, v]) => {
      // допускаем camelCase и CSS переменные
      if (v != null) el.style.setProperty(k.startsWith("--") ? k : k.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), String(v));
    });
  }

  /** Применить атрибуты (включая aria-*) */
  function applyAttrs(el, attrs) {
    if (!attrs) return;
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    });
  }

  /** Применить dataset */
  function applyDataset(el, dataset) {
    if (!dataset) return;
    Object.entries(dataset).forEach(([k, v]) => {
      if (v != null) el.dataset[k] = String(v);
    });
  }

  /**
   * Создать кнопку
   * @param {Object} options
   * @param {string} [options.name]   – button.name
   * @param {string} [options.id]     – button.id
   * @param {string} [options.className] – button.className
   * @param {string} [options.text]   – внутренний текст (по умолчанию = name)
   * @param {Element|string} [options.parent] – контейнер (элемент или селектор)
   * @param {Object} [options.events] – { click: fn, mouseenter: fn, onClick: fn, ... }
   * @param {Object} [options.styles] – inline-стили: { backgroundColor:"#09f", ... }
   * @param {Object} [options.attrs]  – доп. атрибуты: { type:"button", title:"...", "aria-label":"..." }
   * @param {Object} [options.dataset] – data-* атрибуты: { test:"123" } -> data-test="123"
   * @returns {{
   *  el: HTMLButtonElement,
   *  id: string,
   *  className: string,
   *  name: string,
   *  on(type:string, h:EventListener): void,
   *  off(type:string, h:EventListener): void,
   *  update(patch:Object): void,
   *  destroy(): void
   * }}
   */
  function createButton(options = {}) {
    if (typeof document === "undefined") {
      throw new Error("createButton requires a browser DOM");
    }

    const {
      name,
      id,
      className,
      text,
      parent,
      events,
      styles,
      attrs,
      dataset
    } = options;

    // Валидация строк
    ensureStrOrUndef(name, "name");
    ensureStrOrUndef(id, "id");
    ensureStrOrUndef(className, "className");
    ensureStrOrUndef(text, "text");

    // Автогенерация
    const _id = id || `btn_${rand()}`;
    const _class = className || `class_${rand()}`;
    const _name = name || `name_${rand()}`;

    // Создание
    const btn = document.createElement("button");
    btn.id = _id;
    btn.className = _class;
    btn.name = _name;
    btn.type = "button";
    btn.textContent = text ?? _name;

    applyAttrs(btn, attrs);
    applyStyles(btn, styles);
    applyDataset(btn, dataset);

    // Родитель
    resolveParent(parent).appendChild(btn);

    // События (реестр для последующего off/destroy)
    let listeners = attachEvents(btn, events);

    // Публичное API для этой кнопки
    function on(type, handler) {
      if (typeof type !== "string" || typeof handler !== "function") return;
      btn.addEventListener(type, handler);
      listeners.push({ type, handler });
    }

    function off(type, handler) {
      btn.removeEventListener(type, handler);
      listeners = listeners.filter(x => !(x.type === type && x.handler === handler));
    }

    function update(patch = {}) {
      // частичное обновление: текст/стили/атрибуты/датасет/события
      if ("text" in patch) {
        if (patch.text == null) btn.textContent = "";
        else btn.textContent = String(patch.text);
      }
      if ("styles" in patch) applyStyles(btn, patch.styles);
      if ("attrs" in patch) applyAttrs(btn, patch.attrs);
      if ("dataset" in patch) applyDataset(btn, patch.dataset);

      if ("events" in patch) {
        // Снимаем старые и ставим новые
        listeners.forEach(({ type, handler }) => btn.removeEventListener(type, handler));
        listeners = attachEvents(btn, patch.events);
      }
    }

    function destroy() {
      // снять все слушатели и удалить из DOM
      listeners.forEach(({ type, handler }) => btn.removeEventListener(type, handler));
      listeners = [];
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    }

    return {
      el: btn,
      id: _id,
      className: _class,
      name: _name,
      on,
      off,
      update,
      destroy
    };
  }

  return {
    version: "1.0.0",
    createButton
  };
});



/**
 * Включает перетаскивание элемента по странице.
 * @param {string} id - обязателен. ID элемента.
 * @returns {{disable:Function}} объект с методом disable() чтобы снять обработчики
 */
function enableDrag(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`enableDrag: элемент с id="${id}" не найден`);
  }

  // Гарантируем корректное позиционирование и drag на мобильных
  if (getComputedStyle(el).position === 'static') el.style.position = 'absolute';
  el.style.touchAction = 'none'; // отключает жесты браузера (скролл/зум) над элементом

  let startX = 0, startY = 0, origLeft = 0, origTop = 0, dragging = false;

  function onPointerDown(e) {
    dragging = true;

    // Фиксируем стартовые позиции курсора/пальца
    startX = e.clientX;
    startY = e.clientY;

    // Вычисляем текущие left/top относительно документа
    const rect = el.getBoundingClientRect();
    origLeft = (parseFloat(el.style.left) || rect.left + window.scrollX);
    origTop  = (parseFloat(el.style.top)  || rect.top  + window.scrollY);

    // Захватываем указатель, чтобы не терять событие при быстром движении
    if (el.setPointerCapture && e.pointerId !== undefined) {
      try { el.setPointerCapture(e.pointerId); } catch {}
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = (origLeft + dx) + 'px';
    el.style.top  = (origTop  + dy) + 'px';
  }

  function onPointerUp() {
    dragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  el.addEventListener('pointerdown', onPointerDown);

  return {
    disable() {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
  };
}

