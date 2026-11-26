/* VISTA · Pantallas a pantalla completa: bienvenida/aviso de privacidad y desbloqueo con contraseña */
PF.Views.Gate = (function () {
  const $ = id => document.getElementById(id);
  const show = html => { const g = $('gate'); g.innerHTML = html; g.hidden = false; document.body.classList.add('gated'); };
  function hide() { const g = $('gate'); g.hidden = true; g.innerHTML = ''; document.body.classList.remove('gated'); }

  function welcome(onAccept) {
    show(`<div class="gatebox" role="dialog" aria-modal="true" aria-labelledby="gTitle"><img class="gatelogo" src="assets/logo-full.webp" alt="PRIMEFORM · Personalized workout tracking" width="320" height="211">
      <h1 id="gTitle">Bienvenido/a</h1>
      <p>PRIMEFORM guarda la información de los clientes <b>solo en este dispositivo y navegador</b>: no se envía a ningún servidor.</p>
      <ul><li>Los datos de salud son sensibles: pedí y registrá el consentimiento de cada cliente.</li><li>Hacé respaldos con frecuencia (<i>Datos y ajustes</i>): si borrás los datos del navegador, se pierden.</li><li>Este espacio es de uso exclusivo de nuestro equipo: no compartas tu contraseña ni tu acceso.</li></ul>
      <details class="gate-doc"><summary>Leer el aviso de privacidad</summary>${PF.Views.Legal.html('privacy')}</details><details class="gate-doc"><summary>Leer los términos de uso</summary>${PF.Views.Legal.html('terms')}</details>
      <label class="check"><input type="checkbox" id="gAccept"><span>Entiendo y acepto estas condiciones de uso, el aviso de privacidad y los términos</span></label>
      <button class="btn primary" id="gGo" disabled>Comenzar</button></div>`);
    const cb = $('gAccept'), go = $('gGo');
    cb.addEventListener('change', () => { go.disabled = !cb.checked; });
    go.addEventListener('click', () => { if (cb.checked) onAccept(); });
    go.focus();
  }

  // onSubmit(pass, ctl) ; ctl.error(msg) · ctl.busy(bool)
  function unlock(onSubmit, note = '', o = {}) {
    const label = o.button || 'Desbloquear';
    show(`<div class="gatebox" role="dialog" aria-modal="true" aria-labelledby="gTitle"><img class="gatelogo" src="assets/logo-full.webp" alt="PRIMEFORM" width="320" height="211">
      <h1 id="gTitle">${PF.Utils.esc(o.title || 'Datos protegidos')}</h1><p>${PF.Utils.esc(o.text || 'Ingresá tu contraseña para abrir PRIMEFORM.')}</p>${note ? `<p class="formnote">${note}</p>` : ''}
      <div class="field"><label for="gPass">Contraseña</label><input id="gPass" type="password" autocomplete="current-password" maxlength="128"><div class="err" id="gErr" role="alert"></div></div>
      <button class="btn primary" id="gGo">${PF.Utils.esc(label)}</button></div>`);
    const pass = $('gPass'), go = $('gGo'), err = $('gErr');
    const ctl = { error: m => { err.textContent = m; pass.classList.add('invalid'); pass.select(); }, busy: b => { go.disabled = b; go.textContent = b ? 'Verificando…' : label; } };
    const submit = () => { err.textContent = ''; pass.classList.remove('invalid'); if (!pass.value) { ctl.error('Ingresá la contraseña'); return; } onSubmit(pass.value, ctl); };
    go.addEventListener('click', submit);
    pass.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    pass.focus();
  }
  // Creación OBLIGATORIA de contraseña (espacio del equipo): no se puede cerrar ni omitir
  function setup(onSubmit) {
    show(`<div class="gatebox" role="dialog" aria-modal="true" aria-labelledby="gTitle"><img class="gatelogo" src="assets/logo-full.webp" alt="PRIMEFORM" width="320" height="211">
      <h1 id="gTitle">Protegé los datos de tu equipo</h1>
      <p>Este espacio exige una contraseña: los datos se guardan <b>cifrados (AES-256)</b> en este dispositivo y se bloquean tras 10 minutos sin actividad.</p>
      <div class="field"><label for="gPass1">Contraseña (mínimo 10 caracteres, con letras y números)</label><input id="gPass1" type="password" autocomplete="new-password" maxlength="128"></div>
      <div class="field"><label for="gPass2">Repetí la contraseña</label><input id="gPass2" type="password" autocomplete="new-password" maxlength="128"><div class="err" id="gErr" role="alert"></div></div>
      <label class="check"><input type="checkbox" id="gAck"><span>Entiendo que <b>no hay recuperación</b>: si la olvido solo podré restaurar desde un respaldo.</span></label>
      <button class="btn primary" id="gGo">Activar protección</button></div>`);
    const p1 = $('gPass1'), p2 = $('gPass2'), ack = $('gAck'), go = $('gGo'), err = $('gErr');
    const ctl = { error: m => { err.textContent = m; }, busy: b => { go.disabled = b; go.textContent = b ? 'Protegiendo…' : 'Activar protección'; } };
    const submit = () => { err.textContent = ''; onSubmit({ pass: p1.value, confirm: p2.value, ack: ack.checked }, ctl); };
    go.addEventListener('click', submit);
    [p1, p2].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
    p1.focus();
  }
  return { welcome, unlock, setup, hide };
})();
