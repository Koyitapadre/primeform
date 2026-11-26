/* ============================================================
   PRIMEFORM · Aplicación instalable (PWA)
   Registro del service worker, detección de plataforma/instalación y aviso de nueva versión.
   ============================================================ */
PF.Pwa = (function () {
  let deferred = null; const subs = [], notify = () => subs.forEach(f => f());
  const ua = navigator.userAgent || '';
  const platform = () => (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop';
  const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; notify(); });         // Chrome/Edge/Android: se ofrece un botón propio
  window.addEventListener('appinstalled', () => { deferred = null; notify(); });
  async function install() {
    if (!deferred) return 'unavailable';
    deferred.prompt(); const r = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' })); deferred = null; notify(); return r.outcome;
  }
  function register() {
    if (!('serviceWorker' in navigator) || PF.Config.mode === 'dev') return;                                  // en desarrollo no se registra (evita archivos viejos)
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (had && PF.Views && PF.Views.Toast) PF.Views.Toast.show('Hay una versión nueva de PRIMEFORM', { action: { label: 'Actualizar', run: () => location.reload() }, ms: 20000 });
    });
  }
  return { platform, isStandalone, canInstall: () => !!deferred, install, register, onChange: f => subs.push(f) };
})();
