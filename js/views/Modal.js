/* VISTA · Modal accesible: open({title, body, onSave, saveLabel}) · close()
   Escape cierra, Enter envía, el foco queda dentro y se devuelve al cerrar. */
PF.Views.Modal = (function () {
  const $ = id => document.getElementById(id);
  let onSave = null, lastFocus = null, busy = false;
  const isOpen = () => $('modal').classList.contains('show');
  const focusables = () => Array.from($('modal').querySelectorAll('button:not([disabled]),input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);

  function open(o) {
    lastFocus = document.activeElement;
    busy = false;
    $('modalTitle').textContent = o.title;
    $('modalBody').innerHTML = o.body;
    $('modalSave').textContent = o.saveLabel || 'Guardar';
    onSave = o.onSave || null;
    $('modal').classList.add('show');
    const f = $('modalBody').querySelector('input:not([type=hidden]),select,textarea');
    setTimeout(() => { if (f) f.focus(); }, 30);
  }
  function close() {
    $('modal').classList.remove('show');
    onSave = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Evita dobles envíos (doble clic) mientras se procesa
  $('modalSave').addEventListener('click', () => {
    if (!onSave || busy) return;
    busy = true;
    // Si el envío falló la validación (devuelve false) se libera de inmediato; si fue exitoso, se bloquea el doble clic un instante.
    Promise.resolve().then(() => onSave()).then(r => { if (r === false) busy = false; else setTimeout(() => { busy = false; }, 350); }, () => { busy = false; });
  });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); $('modalSave').click(); return; }
    if (e.key === 'Tab') {
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  ['input', 'change'].forEach(ev => $('modalBody').addEventListener(ev, e => PF.Views.FormFields.clearError(e.target)));

  return { open, close, isOpen };
})();
