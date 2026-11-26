/* CONTROLADOR · Enlaces para clientes (lado del entrenador y modo «enlace de cliente») */
PF.Controllers.Share = (function () {
  const V = PF.Views, Store = PF.Store, ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';   // sin caracteres ambiguos (0/O, 1/l/I)
  const isLink = () => PF.Share.isLink();
  let last = null;

  function genPassword(n = 12) {
    const out = []; const max = 256 - (256 % ALPHA.length), buf = new Uint8Array(32);
    while (out.length < n) { crypto.getRandomValues(buf); for (const b of buf) { if (b < max && out.length < n) out.push(ALPHA[b % ALPHA.length]); } }   // sin sesgo
    return out.join('');
  }
  function openDialog(id) {
    const c = Store.find('clients', id); if (!c) return;
    if (!PF.Legal.isConfigured()) { V.Toast.show('Primero completá los datos del responsable en «Datos y ajustes»'); return; }
    if (PF.Config.requirePlanUrl && !PF.Legal.org().planUrl) { V.Toast.show('Primero configurá la dirección pública de los planes en «Datos y ajustes»'); return; }
    last = null;
    V.Share.dialog({ client: c, onSubmit: v => generate(c, v) });
  }
  async function generate(c, v) {
    const errors = {};
    if (v.password.length < 10) errors.password = 'Usá al menos 10 caracteres (podés generar una segura)';
    else if (v.password.length > 64) errors.password = 'Máximo 64 caracteres';
    if (!v.workouts && !v.progress && !v.nutrition) errors.include = 'Elegí al menos un tipo de información para compartir';
    if (!v.ok) errors.ok = 'Confirmá que el cliente aceptó recibir sus datos por este medio';
    if (Object.keys(errors).length) return PF.Controllers.App.fail('share', { errors });
    try {
      const r = await PF.Share.build(c.id, v);
      last = { link: r.link, password: v.password };
      V.Share.showResult({ link: r.link, password: v.password, client: c, length: r.length, expires: r.expires });
    } catch (e) {
      V.Toast.show(e.code === 'nocrypto' ? 'Hace falta una conexión segura (https) para generar enlaces' : e.code === 'toolarge' ? 'Hay demasiada información para un enlace: desmarcá alguna opción' : 'No se pudo generar el enlace');
      return false;
    }
  }
  function copy(what) {
    if (!last) return;
    const text = what === 'pass' ? last.password : last.link, done = () => V.Toast.show(what === 'pass' ? 'Contraseña copiada' : 'Enlace copiado');
    const fallback = () => { const el = document.getElementById(what === 'pass' ? 'sPass' : 'shareLink'); if (el) { el.select(); try { document.execCommand('copy'); done(); } catch (e) { V.Toast.show('Seleccioná y copiá manualmente'); } } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  /* ---------- Modo «enlace de cliente»: solo lectura, en memoria ---------- */
  const MSG = {
    password: 'Contraseña incorrecta. Revisala e intentá de nuevo.',
    expired: e => `Este enlace venció el ${PF.Utils.fmtDate(e.expires)}. Pedile a tu entrenador uno nuevo.`,
    format: 'El enlace está incompleto o dañado. Pedile a tu entrenador que te lo envíe de nuevo.',
    version: 'Este enlace es de una versión no compatible. Pedile a tu entrenador uno nuevo.',
    nocrypto: 'Tu navegador no permite abrir este enlace de forma segura (se necesita una conexión https).',
    unsupported: 'Tu navegador es muy antiguo para abrir este enlace: actualizalo e intentá de nuevo.'
  };
  /* ---------- Plan guardado en el dispositivo del cliente (para abrirlo como app con un toque) ---------- */
  const PLAN_KEY = 'pf_plan_v1';                                   // solo guarda el enlace CIFRADO + la fecha de vencimiento; la contraseña nunca se guarda
  let viewing = null, bound = false;
  function savedPlan() {
    try { const o = JSON.parse(localStorage.getItem(PLAN_KEY)); return o && /^#s=[A-Za-z0-9_-]+$/.test(o.hash || '') && /^\d{4}-\d{2}-\d{2}$/.test(o.expires || '') ? o : null; } catch (e) { return null; }
  }
  function planBindings() {
    if (bound) return; bound = true;
    PF.Events.on('plan:save', () => {
      if (!viewing) return;
      try { localStorage.setItem(PLAN_KEY, JSON.stringify({ hash: location.hash, expires: viewing.expires, name: String((PF.Store.list('clients')[0] || {}).name || '').split(' ')[0].slice(0, 40), saved: PF.Utils.today() })); V.Toast.show('Plan guardado: ya puedes abrirlo desde el ícono'); }
      catch (e) { V.Toast.show('No se pudo guardar en este dispositivo'); }
      V.Share.banner(viewing, savedPlan());
    });
    PF.Events.on('plan:forget', () => { try { localStorage.removeItem(PLAN_KEY); } catch (e) {} V.Toast.show('Plan olvidado en este dispositivo'); if (viewing) V.Share.banner(viewing, null); else renderSaved(); });
    PF.Events.on('plan:open', () => { const s = savedPlan(); if (s) location.hash = s.hash; });
  }
  function renderSaved() {                                           // pantalla de inicio (sin enlace): ofrece abrir el plan guardado
    const el = document.getElementById('planSaved'); if (!el) return;
    const s = savedPlan(); if (!s) { el.innerHTML = ''; return; }
    const expired = PF.Utils.today() > s.expires, esc = PF.Utils.esc;
    el.innerHTML = expired
      ? `<div class="card plansaved"><p>Tu plan guardado en este dispositivo <b>venció el ${esc(PF.Utils.fmtDate(s.expires))}</b>. Pedile a tu entrenador un enlace nuevo.</p><button class="btn" data-action="plan:forget">Quitar el plan guardado</button></div>`
      : `<div class="card plansaved"><p>${s.name ? '¡Hola, ' + esc(s.name) + '! ' : ''}Tu plan está guardado en este dispositivo (vigente hasta el ${esc(PF.Utils.fmtDate(s.expires))}).</p><div class="planbtns"><button class="btn primary" data-action="plan:open">Abrir mi plan</button><button class="btn" data-action="plan:forget">Olvidar</button></div></div>`;
  }

  function startViewer() {
    const C = PF.Controllers; planBindings(); if (C.Pwa) C.Pwa.init();
    document.body.classList.add('viewer-mode');
    [C.Learn, C.Legal, C.Report].forEach(c => c && c.init && c.init());           // solo lo necesario: nunca se carga ni se escribe el almacenamiento del entrenador
    PF.Events.on('exercise:guide', d => { const e = PF.ExerciseLibrary.find(d.name); if (e) V.ExerciseGuide.open(e); });
    PF.Events.on('modal:close', () => V.Modal.close());
    PF.Events.on('toast:action', () => V.Toast.runAction());
    let fails = 0;
    V.Gate.unlock(async (pass, ctl) => {
      ctl.busy(true);
      if (fails >= 5) await new Promise(r => setTimeout(r, Math.min(30000, 2000 * (fails - 4))));   // freno ante intentos repetidos
      try {
        const r = await PF.Share.open(location.hash, pass);
        Store.loadEphemeral(r.db); PF.Legal.useOrg(r.org);
        viewing = r; V.Gate.hide(); if (V.Layout) V.Layout.showPage('portal'); V.Share.banner(r, savedPlan());
        V.Portal.render(PF.Selectors.portalFor(r.clientId), { viewer: true });
        document.title = 'Mi plan · PRIMEFORM';
      } catch (e) {
        fails++; ctl.busy(false);
        const m = MSG[e.code] || MSG.format; ctl.error(typeof m === 'function' ? m(e) : m);
      }
    }, '', { title: 'Tu plan de entrenamiento', text: 'Ingresá la contraseña que te dio tu entrenador para abrir tu plan.', button: 'Abrir mi plan' });
  }
  function init() {
    PF.Events.on('share:open', d => openDialog(d.id));
    PF.Events.on('share:gen', () => V.Share.setPassword(genPassword()));
    PF.Events.on('share:copy', d => copy(d.what));
  }
  return { init, isLink, startViewer, planBindings, renderSaved, genPassword, render() { } };
})();
