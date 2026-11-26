/* ============================================================
   PRIMEFORM · Bus de eventos de interfaz
   Reemplaza los onclick/oninput/onchange inline. Las vistas solo
   declaran data-action / data-input / data-change en el HTML y los
   controladores se suscriben con PF.Events.on('nombre', handler).
   El handler recibe (dataset, elemento, evento).
   ============================================================ */
PF.Events = (function () {
  const handlers = {};

  function on(name, fn) { handlers[name] = fn; }

  function dispatch(name, el, ev) {
    const fn = handlers[name];
    if (fn) fn(el.dataset, el, ev);
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (el) dispatch(el.dataset.action, el, e);
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    if (el) dispatch(el.dataset.input, el, e);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (el) dispatch(el.dataset.change, el, e);
  });

  return { on };
})();
