/* ============================================================
   CONTROLADOR · Revisiones
   ============================================================ */
PF.Controllers.Checkins = (function () {
  const V = PF.Views, S = PF.Selectors, Store = PF.Store;

  function render() { V.Checkins.render(S.checkinList()); }

  function create(clientId = '') {
    if (!PF.Controllers.App.requireClients()) return;
    V.Forms.checkin({
      clients: Store.list('clients'),
      clientId,
      onSubmit(values) {
        const r = PF.Entities.checkin(values);
        if (!r.ok) return PF.Controllers.App.fail('checkin', r);
        V.Modal.close();
        Store.add('checkins', r.record);
        V.Toast.show('Revisión guardada');
      }
    });
  }

  function init() {
    PF.Events.on('checkin:new', d => create(d.clientId || ''));
    PF.Events.on('checkin:delete', d => PF.Controllers.App.deleteRecord('checkins', d.id));
  }

  return { init, render };
})();
