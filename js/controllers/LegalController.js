/* CONTROLADOR · Datos del responsable, aviso de privacidad y términos */
PF.Controllers.Legal = (function () {
  const V = PF.Views;
  function render() { V.Legal.renderCard(PF.Legal.org(), PF.Legal.isConfigured()); }
  function edit() {
    V.Forms.org({ org: PF.Legal.org(), onSubmit(values) {
      const r = PF.Legal.validate(values);
      if (!r.ok) return PF.Controllers.App.fail('org', r);
      PF.Legal.save(r.record); V.Modal.close(); V.Toast.show('Datos del responsable guardados'); render();
    } });
  }
  function init() {
    PF.Events.on('legal:open', d => V.Legal.open(d.doc));
    PF.Events.on('legal:edit', edit);
  }
  return { init, render };
})();
