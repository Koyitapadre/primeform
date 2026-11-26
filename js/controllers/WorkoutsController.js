/* ============================================================
   CONTROLADOR · Entrenamientos
   ============================================================ */
PF.Controllers.Workouts = (function () {
  const V = PF.Views, S = PF.Selectors, Store = PF.Store;

  function render() {
    V.Workouts.renderFilter(Store.list('clients'));
    V.Workouts.render(S.workoutsFor(V.Workouts.selectedClient()), V.Workouts.selectedClient());
  }

  function create(clientId = '') {
    if (!PF.Controllers.App.requireClients()) return;
    V.Forms.workout({
      clients: Store.list('clients'),
      clientId,
      onSubmit: submit
    });
  }

  function submit(values) {
    const r = PF.Entities.workout(values);
    if (!r.ok) return PF.Controllers.App.fail('workout', r);
    V.Modal.close();
    Store.add('workouts', r.record);
    V.Toast.show('Rutina creada');
  }

  function init() {
    PF.Events.on('workout:new', d => create(d.clientId || ''));
    PF.Events.on('workout:delete', d => PF.Controllers.App.deleteRecord('workouts', d.id));
    PF.Events.on('workouts:filter', render);
    PF.Events.on('workout:removeEx', d => {
      const w = Store.find('workouts', d.id), i = parseInt(d.index, 10); if (!w || !w.exercises[i]) return;
      if (w.exercises.length <= 1) { V.Toast.show('Una rutina necesita al menos un ejercicio: eliminá la rutina completa si querés quitarla'); return; }
      PF.Controllers.App.confirmDelete({ title: 'Quitar ejercicio de la rutina', message: `«${w.exercises[i].name}» en «${w.name}»`, okLabel: 'Quitar ejercicio', done: 'Ejercicio quitado de la rutina', run: () => Store.removeExercise(d.id, i) });
    });
    PF.Events.on('workout:deleteAll', d => {
      const c = Store.find('clients', d.id), list = Store.list('workouts').filter(w => w.clientId === d.id); if (!c || !list.length) return;
      PF.Controllers.App.confirmDelete({ title: `Eliminar todas las rutinas de ${c.name}`, message: `Se eliminarán ${list.length} ${list.length === 1 ? 'rutina' : 'rutinas'}:`, items: list.map(w => w.name), typed: 'ELIMINAR', okLabel: 'Eliminar todas las rutinas', done: 'Rutinas eliminadas', run: () => Store.removeWhere('workouts', w => w.clientId === d.id) });
    });
  }

  return { init, render, submit };
})();
