/* CONTROLADOR · Biblioteca de ejercicios */
PF.Controllers.Library = (function () {
  const V = PF.Views, L = PF.ExerciseLibrary;
  function render() { V.Library.render(L.search(V.Library.filters())); }
  function create() {
    V.Forms.exercise({ onSubmit(values) {
      const r = PF.Entities.exercise(values);
      if (!r.ok) return PF.Controllers.App.fail('exercise', r);
      V.Modal.close(); PF.Store.add('exercises', r.record); V.Toast.show('Ejercicio añadido a la biblioteca');
    } });
  }
  // Abre el formulario de rutina con el ejercicio ya cargado (nombre, series y reps por defecto).
  function useInWorkout(id) {
    if (!PF.Controllers.App.requireClients()) return;
    const e = L.all().find(x => x.id === id); if (!e) return;
    const compound = ['Piernas', 'Espalda', 'Pecho'].includes(e.group);
    V.Forms.workout({ clients: PF.Store.list('clients'), prefill: [{ name: e.name, sets: 3, reps: compound ? '6–10' : '10–15', rir: 2, rest: compound ? 120 : 75 }], onSubmit: PF.Controllers.Workouts.submit });
  }
  function init() {
    PF.Events.on('library:new', create);
    PF.Events.on('library:use', d => useInWorkout(d.id));
    PF.Events.on('library:delete', d => PF.Controllers.App.deleteRecord('exercises', d.id));
    PF.Events.on('library:filter', render);
    PF.Events.on('exercise:guide', d => { const e = L.find(d.name); if (e) V.ExerciseGuide.open(e); });
  }
  return { init, render };
})();
