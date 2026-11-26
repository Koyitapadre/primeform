/* ============================================================
   CONTROLADOR · Seguridad
   Arranque (aviso de privacidad / desbloqueo), contraseña con cifrado,
   bloqueo manual y bloqueo automático por inactividad.
   ============================================================ */
PF.Controllers.Security = (function () {
  const V = PF.Views, Store = PF.Store, Vault = PF.Vault, Meta = PF.Meta;
  const IDLE_MS = 10 * 60 * 1000;
  let idleTimer = null, idleBound = false, fails = 0;

  const refresh = () => V.Settings.renderSecurity({ supported: Vault.supported(), enabled: Vault.isEnabled(), active: Vault.active() });

  function startIdle() {
    if (!Vault.active()) return;
    const reset = () => { clearTimeout(idleTimer); idleTimer = setTimeout(lockNow, IDLE_MS); };
    if (!idleBound) { idleBound = true; ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(ev => document.addEventListener(ev, reset, { passive: true })); }
    reset();
  }
  // Recargar borra los datos de la memoria y vuelve a pedir la contraseña
  function lockNow() { location.reload(); }

  function afterLoad() { PF.Controllers.App.renderAll(); startIdle(); PF.Controllers.Sync.start(); }

  function promptUnlock() {
    V.Gate.unlock(async (pass, ctl) => {
      ctl.busy(true);
      try {
        const data = await Vault.unlock(pass);
        Store.load(data); fails = 0;
        V.Gate.hide(); afterLoad();
      } catch (e) {
        fails++; ctl.busy(false);
        ctl.error(fails >= 3 ? 'Contraseña incorrecta. Esperá unos segundos antes de reintentar.' : 'Contraseña incorrecta');
        if (fails >= 3) { ctl.busy(true); setTimeout(() => ctl.busy(false), Math.min(30000, fails * 2000)); }
      }
    });
  }

  function start() {
    Store.onError(() => V.Toast.show('⚠ No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado'));
    if (!PF.Storage.available()) V.Toast.show('⚠ Tu navegador bloquea el almacenamiento: los datos no se guardarán');
    if (Vault.isEnabled()) { promptUnlock(); return; }
    Store.boot();
    afterLoad();
    // Espacio del equipo: tras la bienvenida, la contraseña es OBLIGATORIA (los datos nunca quedan sin cifrar)
    const next = () => { if (PF.Config.requirePassword && !Vault.isEnabled()) forceSetup(); else V.Gate.hide(); };
    if (!Meta.get().accepted || Meta.get().legalV !== PF.Legal.VERSION) V.Gate.welcome(() => { Meta.set({ accepted: PF.Utils.today(), legalV: PF.Legal.VERSION }); next(); });
    else next();
  }
  function forceSetup() {
    V.Gate.setup(async (v, ctl) => {
      const e = validatePass(v), first = e.pass || e.confirm || e.ack;
      if (first) { ctl.error(first); return; }
      ctl.busy(true);
      try { await Store.enableVault(v.pass); V.Gate.hide(); startIdle(); PF.Controllers.Sync.start(); V.Toast.show('Protección activada: los datos se guardan cifrados'); }
      catch (err) { ctl.busy(false); ctl.error('No se pudo activar el cifrado en este navegador'); }
    });
  }

  /* ---- Contraseña ---- */
  function validatePass(v) {
    const e = {};
    if (!v.pass || v.pass.length < 10) e.pass = 'Usá al menos 10 caracteres';
    else if (!/[A-Za-z]/.test(v.pass) || !/[0-9]/.test(v.pass)) e.pass = 'Combiná letras y números';
    if (v.confirm !== v.pass) e.confirm = 'Las contraseñas no coinciden';
    if (!v.ack) e.ack = 'Confirmá que entendés que no hay recuperación';
    return e;
  }
  function enable() {
    V.Forms.passwordSetup({
      async onSubmit(v) {
        const errors = validatePass(v);
        if (Object.keys(errors).length) return PF.Controllers.App.fail('pwSetup', { errors });
        try {
          await Store.enableVault(v.pass);
          V.Modal.close(); startIdle(); V.Toast.show('Contraseña activada: tus datos ahora se guardan cifrados');
        } catch (e) { V.Toast.show('No se pudo activar el cifrado en este navegador'); }
      }
    });
  }
  function disable() {
    if (PF.Config.requirePassword) { V.Toast.show('Este espacio exige contraseña: no se puede quitar'); return; }
    V.Forms.passwordConfirm({
      title: 'Quitar la contraseña', saveLabel: 'Quitar contraseña',
      intro: 'Los datos volverán a guardarse <b>sin cifrar</b> en este navegador. Ingresá tu contraseña para confirmar.',
      async onSubmit(v) {
        if (!v.pass) return PF.Controllers.App.fail('pwConfirm', { errors: { pass: 'Ingresá la contraseña' } });
        if (!(await Vault.verify(v.pass))) return PF.Controllers.App.fail('pwConfirm', { errors: { pass: 'Contraseña incorrecta' } });
        await Store.disableVault(); clearTimeout(idleTimer); V.Modal.close(); V.Toast.show('Contraseña desactivada');
      }
    });
  }

  function init() {
    PF.Events.on('security:enable', enable);
    PF.Events.on('security:disable', disable);
    PF.Events.on('security:lock', lockNow);
  }
  return { init, start, refresh };
})();
