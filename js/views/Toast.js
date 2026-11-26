/* ============================================================
   VISTA · Toast (aviso breve, con acción opcional como «Deshacer»)
   show(mensaje, { action: { label, run }, ms }) · runAction()
   ============================================================ */
PF.Views.Toast = (function () {
  let timer = null, action = null;
  const el = () => document.getElementById('toast');
  function hide() { el().style.display = 'none'; el().classList.remove('has-action'); action = null; }
  function show(msg, o = {}) {
    const t = el();
    t.textContent = '';
    const s = document.createElement('span'); s.textContent = msg; t.appendChild(s);
    action = null;
    t.classList.toggle('has-action', !!o.action);
    if (o.action) {
      action = o.action.run;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'toast-btn'; b.setAttribute('data-action', 'toast:action'); b.textContent = o.action.label;
      t.appendChild(b);
    }
    t.style.display = 'block';
    clearTimeout(timer);
    timer = setTimeout(hide, o.ms || (o.action ? 10000 : 2400));
  }
  function runAction() { const fn = action; hide(); if (fn) fn(); }
  return { show, runAction };
})();
