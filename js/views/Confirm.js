/* ============================================================
   VISTA · Confirmación de acciones destructivas (ventana propia)
   No usa window.confirm (muchos entornos lo bloquean en silencio).
   ask({ title, message, items, warning, typed, okLabel, danger, onConfirm })
   - El foco inicia en «Cancelar»; Escape o clic fuera cancelan.
   - Con `typed` (p. ej. "ELIMINAR") hay que escribir la palabra para habilitar el botón.
   ============================================================ */
PF.Views.Confirm = (function () {
  const $ = id => document.getElementById(id), { esc } = PF.Utils;
  let onOk = null, lastFocus = null, needed = '', done = false;
  const isOpen = () => !$('confirm').hidden;
  const valid = () => !needed || $('confirmInput').value.trim().toUpperCase() === needed;
  const focusables = () => Array.from($('confirm').querySelectorAll('button:not([disabled]),input')).filter(el => el.offsetParent !== null);

  function ask(o) {
    lastFocus = document.activeElement; onOk = o.onConfirm || null; done = false;
    needed = (o.typed || '').toUpperCase();
    $('confirmTitle').textContent = o.title;
    $('confirmBody').innerHTML = (o.message ? `<p>${esc(o.message)}</p>` : '')
      + (o.items && o.items.length ? `<ul class="confirm-list">${o.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : '')
      + (o.warning ? `<p class="confirm-warn">${esc(o.warning)}</p>` : '');
    $('confirmType').hidden = !needed;
    $('confirmTypeLabel').textContent = needed ? `Para confirmar, escribí ${needed}` : '';
    $('confirmInput').value = '';
    const ok = $('confirmOk');
    ok.textContent = o.okLabel || 'Eliminar';
    ok.className = 'btn ' + (o.danger === false ? 'primary' : 'danger-solid');
    ok.disabled = !!needed;
    $('confirm').hidden = false;
    setTimeout(() => { (needed ? $('confirmInput') : $('confirmCancel')).focus(); }, 30);
  }
  function close() { $('confirm').hidden = true; onOk = null; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function accept() {
    if (done || !onOk || !valid()) return;
    done = true;                                   // evita ejecutar la acción dos veces (doble clic)
    const fn = onOk; close(); fn();
  }

  $('confirmOk').addEventListener('click', accept);
  $('confirmCancel').addEventListener('click', close);
  $('confirm').addEventListener('click', e => { if (e.target === $('confirm')) close(); });
  $('confirmInput').addEventListener('input', () => { $('confirmOk').disabled = !valid(); });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Enter' && e.target === $('confirmInput')) { e.preventDefault(); accept(); return; }   // Enter solo confirma desde el campo, ya validado
    if (e.key === 'Tab') {
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
  return { ask, isOpen };
})();
