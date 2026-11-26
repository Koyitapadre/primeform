/* ============================================================
   CONTROLADOR · Progreso físico (evaluaciones)
   ============================================================ */
PF.Controllers.Measures = (function () {
  const V = PF.Views, S = PF.Selectors, Store = PF.Store;

  function render() {
    V.Measures.renderFilter(Store.list('clients'));
    const id = V.Measures.selectedClient();
    V.Measures.renderPanel(id
      ? `<div class="toolbar"><button class="btn" data-action="report:open" data-id="${PF.Utils.esc(id)}">📄 Informe imprimible (PDF)</button></div>${V.Progress.render(S.progressFor(id), { noHistory: true, self: false })}`
      : '<div class="notice">Elegí un cliente en el filtro para ver su <b>panel de progreso</b>: indicadores, gráficos de tendencia, composición corporal, metas y comparativa. Todo es una recomendación orientativa, no un veredicto.</div>');
    V.Measures.render(S.measuresFor(id));
  }
  function preview() {
    const v = V.Forms.readMeasure();
    V.Forms.showMeasurePreview(PF.Metrics.preview(Store.find('clients', v.clientId), v));
  }

  function create(clientId = '') {
    if (!PF.Controllers.App.requireClients()) return;
    V.Forms.measure({
      clients: Store.list('clients'),
      clientId,
      onSubmit(values) {
        const r = PF.Entities.measure(values);
        if (!r.ok) return PF.Controllers.App.fail('measure', r);
        V.Modal.close();
        Store.addMeasure(r.record);
        V.Toast.show('Evaluación registrada');
      }
    });
  }

  function init() {
    PF.Events.on('measure:new', d => create(d.clientId || ''));
    PF.Events.on('measure:delete', d => PF.Controllers.App.deleteRecord('measures', d.id));
    PF.Events.on('measures:filter', render);
    PF.Events.on('measure:preview', preview);
  }

  return { init, render };
})();
