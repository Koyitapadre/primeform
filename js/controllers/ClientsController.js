/* CONTROLADOR · Clientes (crear, editar, eliminar, perfil) */
PF.Controllers.Clients = (function () {
  const V = PF.Views, S = PF.Selectors, Store = PF.Store, App = () => PF.Controllers.App;

  function render() { V.Clients.render(S.filterClients(V.Clients.filters())); V.Clients.renderSlots(S.slotInfo()); }
  // Solo los clientes «Activo» ocupan cupo; si no queda lugar se ofrece dejar a la persona «En espera»
  function slotError(status, id) {
    const s = S.slotInfo(); if (status !== 'Activo' || !s.limit) return null;
    const cur = id && Store.find('clients', id), active = s.active - (cur && cur.status === 'Activo' ? 1 : 0);
    return active >= s.limit ? `No hay cupos libres (${s.active} de ${s.limit} ocupados). Elegí «En espera» o ampliá los cupos en Datos y ajustes.` : null;
  }

  function create() {
    V.Forms.client({
      onSubmit(values) {
        const r = PF.Entities.client(values);
        if (!r.ok) return App().fail('client', r);
        const se = slotError(r.record.status); if (se) return App().fail('client', { errors: { status: se } });
        V.Modal.close();
        Store.add('clients', r.record);
        V.Toast.show('Cliente creado correctamente');
      }
    });
  }
  function edit(id) {
    const c = Store.find('clients', id); if (!c) return;
    V.Forms.client({
      initial: c,
      onSubmit(values) {
        const r = PF.Entities.client(values, { existingId: id });
        if (!r.ok) return App().fail('client', r);
        const se = slotError(r.record.status, id); if (se) return App().fail('client', { errors: { status: se } });
        V.Modal.close();
        Store.update('clients', id, r.record);
        V.Toast.show('Datos del cliente actualizados');
      }
    });
  }
  function remove(id) {
    const c = Store.find('clients', id); if (!c) return;
    const n = k => Store.list(k).filter(x => x.clientId === id).length, pl = (v, one, many) => `${v} ${v === 1 ? one : many}`;
    const items = [[n('workouts'), 'rutina', 'rutinas'], [n('measures'), 'evaluación física', 'evaluaciones físicas'], [n('nutrition'), 'objetivo nutricional', 'objetivos nutricionales'], [n('checkins'), 'revisión', 'revisiones']].filter(x => x[0] > 0).map(x => pl(x[0], x[1], x[2]));
    PF.Controllers.App.confirmDelete({
      title: `Eliminar a ${c.name}`, message: 'Se eliminará el cliente y TODOS sus registros asociados:',
      items: items.length ? items : ['No tiene registros asociados'], typed: 'ELIMINAR', okLabel: 'Eliminar cliente definitivamente',
      warning: 'Se borra también todo su progreso. Si querés conservarlo, descargá un respaldo antes (Datos y ajustes).',
      done: 'Cliente eliminado', run: () => Store.removeClient(id)
    });
  }
  function showProfile(id) { const p = S.clientProfile(id); if (p) V.Forms.profile(p); }

  function init() {
    PF.Events.on('client:new', create);
    PF.Events.on('client:edit', d => edit(d.id));
    PF.Events.on('client:delete', d => remove(d.id));
    PF.Events.on('client:profile', d => showProfile(d.id));
    PF.Events.on('client:age', () => { const a = parseInt((document.getElementById('cAge') || {}).value, 10), b = document.getElementById('guardianBox'); if (b) b.hidden = !(a > 0 && a < 18); });
    PF.Events.on('client:export', d => {
      const c = Store.find('clients', d.id), text = c && Store.serializeClient(d.id); if (!text) return;
      const slug = c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'cliente';
      V.Settings.download('primeform-datos-' + slug + '-' + PF.Utils.today() + '.json', text);
      V.Toast.show('Datos del cliente descargados');
    });
    PF.Events.on('clients:filter', render);
  }
  return { init, render };
})();
