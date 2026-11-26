/* CONTROLADOR · Instalar como aplicación */
PF.Controllers.Pwa = (function () {
  const V = PF.Views; let ready = false;
  const dismissed = () => !!(PF.Meta && PF.Meta.get().installDismissed);
  function render() {
    V.Install.renderCard();
    V.Install.renderBanner(PF.Config.mode !== 'clientes' && PF.Pwa.platform() !== 'desktop' && !PF.Pwa.isStandalone() && !dismissed() && PF.Config.mode !== 'dev');
  }
  function init() {
    if (ready) return; ready = true;
    PF.Events.on('pwa:help', () => V.Install.open());
    PF.Events.on('pwa:install', async () => { const r = await PF.Pwa.install(); if (r === 'accepted') { V.Modal.close(); V.Toast.show('Instalando… buscá el ícono de PRIMEFORM'); } });
    PF.Events.on('pwa:dismiss', () => { PF.Meta.set({ installDismissed: PF.Utils.today() }); V.Install.renderBanner(false); });
    PF.Pwa.onChange(render);
  }
  return { init, render };
})();
