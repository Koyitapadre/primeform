/* CONTROLADOR · Vista de cliente */
PF.Controllers.Portal = (function () {
  const V = PF.Views;
  function render() { V.Portal.renderPicker(PF.Store.list('clients')); V.Portal.render(PF.Selectors.portalFor(V.Portal.selected())); }
  function init() { PF.Events.on('portal:select', render); }
  return { init, render };
})();
