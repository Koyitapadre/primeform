/* VISTA · Instalar como aplicación (tutorial por plataforma) */
PF.Views.Install = (function () {
  const { esc } = PF.Utils;
  const GUIDE = {
    ios: { title: 'iPhone o iPad (Safari)', steps: ['Abrí esta página en <b>Safari</b>. Si la abriste desde WhatsApp u otra app, tocá «Abrir en Safari».', 'Tocá el botón <b>Compartir</b> (el cuadrado con una flecha hacia arriba) en la barra de abajo.', 'Deslizá hacia abajo y tocá <b>«Añadir a pantalla de inicio»</b>.', 'Dejá el nombre y tocá <b>«Añadir»</b>.'], note: 'Con Chrome en iPhone: menú ⋯ → Compartir → «Añadir a pantalla de inicio».' },
    android: { title: 'Android (Chrome)', steps: ['Abrí esta página en <b>Chrome</b>.', 'Tocá el menú <b>⋮</b> (arriba a la derecha).', 'Tocá <b>«Instalar aplicación»</b> (o «Añadir a la pantalla de inicio»).', 'Confirmá con <b>«Instalar»</b>. El ícono aparece en tus aplicaciones.'], note: 'En Samsung Internet: menú ≡ → «Añadir página a» → «Pantalla de inicio».' },
    desktop: { title: 'Computadora (Chrome o Edge)', steps: ['Abrí esta página en <b>Chrome</b> o <b>Edge</b>.', 'En la barra de direcciones tocá el ícono de <b>instalar</b> (una pantalla con una flecha) o el menú <b>⋮ → «Instalar»</b>.', 'Confirmá con <b>«Instalar»</b>: se abre en su propia ventana, como una aplicación.'], note: 'En Safari (Mac): menú Archivo → «Añadir al Dock».' }
  };
  const ORDER = { ios: ['ios', 'android', 'desktop'], android: ['android', 'ios', 'desktop'], desktop: ['desktop', 'android', 'ios'] };
  const isClients = () => PF.Config.mode === 'clientes';
  const BENEFITS = () => isClients()
    ? ['Se abre con un toque, a pantalla completa, sin la barra del navegador', 'Tiene su propio ícono en tu pantalla de inicio', 'Si guardás tu plan en el dispositivo, lo ves aunque no tengas internet']
    : ['Se abre con un toque, a pantalla completa, sin la barra del navegador', 'Tiene su propio ícono en tu pantalla de inicio o en tus aplicaciones', 'Carga al instante y abre aunque no haya internet'];
  const block = (key, open) => { const g = GUIDE[key]; return `<details class="inst-plat"${open ? ' open' : ''}><summary>${esc(g.title)}</summary><ol class="guide-steps">${g.steps.map(s => `<li>${s}</li>`).join('')}</ol><p class="learn-note">${esc(g.note)}</p></details>`; };   // los pasos son texto fijo de la app (con <b>), no datos de usuario
  function body() {
    const plat = PF.Pwa.platform(), done = PF.Pwa.isStandalone();
    return `<div class="inst">${done ? '<div class="notice">✅ Ya estás usando PRIMEFORM como aplicación.</div>' : ''}
      <ul class="inst-ben">${BENEFITS().map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      ${PF.Pwa.canInstall() ? '<div class="inst-actions"><button class="btn primary" data-action="pwa:install">📲 Instalar ahora</button></div>' : ''}
      ${ORDER[plat].map((k, i) => block(k, i === 0 && !PF.Pwa.canInstall())).join('')}
      <p class="learn-note">Es una instalación ligera desde el navegador: no pasa por la tienda de aplicaciones ni ocupa casi espacio. Más adelante podrá existir también como app de tienda.</p></div>`;
  }
  function open() { PF.Views.Modal.open({ title: isClients() ? 'Guardá tu plan como app' : 'Instalar PRIMEFORM como app', saveLabel: 'Entendido', body: body(), onSave: () => PF.Views.Modal.close() }); }
  function renderCard() {
    const el = document.getElementById('installCard'); if (!el) return;
    el.innerHTML = `<h2 style="margin-top:0">📲 ${isClients() ? 'Guardá tu plan como app' : 'Instalar como aplicación'}</h2>${body()}`;
  }
  function renderBanner(show) {
    const el = document.getElementById('installBanner'); if (!el) return;
    el.hidden = !show;
    el.innerHTML = show ? '<span>📲 <b>Instalá PRIMEFORM</b> en tu pantalla de inicio y abrila como una app.</span><div><button class="btn small primary" data-action="pwa:help">Ver cómo</button><button class="btn small" data-action="pwa:dismiss">Ahora no</button></div>' : '';
  }
  return { open, renderCard, renderBanner };
})();
