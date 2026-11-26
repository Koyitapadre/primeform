/* ============================================================
   PRIMEFORM · Arranque unificado (Admin / Cliente / Enlace)
   ============================================================ */
(function () {
  const C = PF.Controllers;

  function renderAuthGate(onSuccess) {
    PF.Views.Gate.hide();
    const g = document.getElementById('gate');
    if (!g) { onSuccess(); return; }
    g.innerHTML = `
      <div class="gatebox" role="dialog" aria-modal="true" aria-labelledby="gLoginTitle">
        <img class="gatelogo" src="assets/logo-full.webp" alt="PRIMEFORM" width="320" height="211">
        <h1 id="gLoginTitle">Iniciar sesión</h1>
        <p>Ingresá con tu cuenta de <b>administrador</b> o de <b>cliente</b> para acceder a PRIMEFORM.</p>
        <div class="field">
          <label for="pfLoginEmail">Correo electrónico</label>
          <input id="pfLoginEmail" type="email" autocomplete="email" placeholder="correo@ejemplo.com">
        </div>
        <div class="field">
          <label for="pfLoginPass">Contraseña</label>
          <input id="pfLoginPass" type="password" autocomplete="current-password">
          <div class="err" id="pfLoginErr" role="alert"></div>
        </div>
        <button class="btn primary" id="pfLoginBtn" type="button">Entrar</button>
      </div>`;
    g.hidden = false;
    document.body.classList.add('gated');

    const emailEl = document.getElementById('pfLoginEmail');
    const passEl = document.getElementById('pfLoginPass');
    const errEl = document.getElementById('pfLoginErr');
    const btnEl = document.getElementById('pfLoginBtn');

    const submit = async () => {
      errEl.textContent = '';
      const email = (emailEl.value || '').trim();
      const pass = passEl.value || '';
      if (!email || !pass) {
        errEl.textContent = 'Ingresá tu correo y contraseña';
        return;
      }
      btnEl.disabled = true;
      btnEl.textContent = 'Ingresando…';
      try {
        await PF.Supabase.signIn(email, pass);
        g.hidden = true;
        g.innerHTML = '';
        document.body.classList.remove('gated');
        await onSuccess();
      } catch (e) {
        errEl.textContent = (e && e.message) ? e.message : 'No se pudo iniciar sesión';
        btnEl.disabled = false;
        btnEl.textContent = 'Entrar';
      }
    };

    btnEl.addEventListener('click', submit);
    [emailEl, passEl].forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
    emailEl.focus();
  }

  async function bootClient() {
    document.body.classList.add('viewer-mode');
    [C.Portal, C.Learn, C.Legal, C.Share, C.Pwa, C.Report].forEach(c => c.init && c.init());
    if (PF.Supabase && PF.Supabase.ready() && PF.Supabase.role() === 'client') {
      try {
        const remote = await PF.Supabase.pullAll();
        PF.Store.loadEphemeral(remote);
        const portal = document.getElementById('page-portal');
        if (portal) portal.classList.add('active');
        if (C.Portal && C.Portal.render) C.Portal.render();
      } catch (e) {
        if (PF.Views && PF.Views.Toast) PF.Views.Toast.show('No se pudo cargar tu plan desde la nube');
      }
    }
    C.Share.planBindings && C.Share.planBindings();
    C.Share.renderSaved && C.Share.renderSaved();
    PF.Pwa.register();
    C.Pwa.render();
  }

  function bootAdmin() {
    document.body.classList.remove('viewer-mode');
    [C.App, C.Clients, C.Workouts, C.Measures, C.Nutrition, C.Checkins, C.Library, C.Portal, C.Learn, C.Legal, C.Share, C.Sync, C.Pwa, C.Report, C.Settings, C.Security]
      .forEach(c => c.init && c.init());
    C.Security.start();
    PF.Pwa.register();
    C.Pwa.render();
  }

  async function routeByAuth() {
    if (!PF.Supabase || !PF.Supabase.ready()) {
      bootAdmin();
      return;
    }
    const { session, profile } = await PF.Supabase.loadSessionAndRole();
    if (!session) {
      renderAuthGate(routeByAuth);
      return;
    }
    if (profile && profile.role === 'client') {
      await bootClient();
    } else {
      bootAdmin();
    }
  }

  window.addEventListener('hashchange', () => {
    if (C.Share.isLink()) location.reload();
  });

  if (C.Share.isLink()) {
    C.Share.startViewer();
    return;
  }

  routeByAuth();
})();
