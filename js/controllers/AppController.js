/* CONTROLADOR · App: navegación, re-dibujado general y utilidades compartidas */
PF.Controllers.App = (function () {
  const V = PF.Views;

  function renderAll() {
    const C = PF.Controllers;
    [C.Dashboard, C.Clients, C.Workouts, C.Measures, C.Nutrition, C.Checkins, C.Library, C.Portal].forEach(c => c.render());
    C.Settings.render();
  }
  function navigate(page) { V.Layout.showPage(page); renderAll(); }

  function requireClients() {
    if (PF.Store.hasClients()) return true;
    V.Toast.show('Primero agregá un cliente');
    return false;
  }
  /* Borrado seguro: confirmación propia (+ palabra a escribir si es muy destructivo) y «Deshacer» durante 10 s.
     o: { title, message, items, warning, typed, okLabel, done, run } */
  function confirmDelete(o) {
    V.Confirm.ask({
      title: o.title, message: o.message, items: o.items, warning: o.warning, typed: o.typed, okLabel: o.okLabel || 'Eliminar',
      onConfirm() {
        const snap = PF.Store.snapshot();
        o.run();
        const rev = PF.Store.revision();
        V.Toast.show(o.done || 'Eliminado', { action: { label: 'Deshacer', run() {
          if (PF.Store.revision() !== rev) { V.Toast.show('No se puede deshacer: hubo otros cambios después'); return; }
          PF.Store.restore(snap); V.Toast.show('Eliminación deshecha');
        } } });
      }
    });
  }
  const who = r => { const c = PF.Store.find('clients', r.clientId); return c ? c.name : 'Cliente'; };
  function deleteRecord(kind, id) {
    const r = PF.Store.find(kind, id); if (!r) return;
    const U = PF.Utils;
    const T = {
      workouts: { title: 'Eliminar rutina', message: `«${r.name}» de ${who(r)}`, items: [`${(r.exercises || []).length} ejercicios`], okLabel: 'Eliminar rutina', done: 'Rutina eliminada' },
      nutrition: { title: 'Eliminar objetivo nutricional', message: `${who(r)} · actualizado ${U.fmtDate(r.date)}`, okLabel: 'Eliminar objetivo', done: 'Objetivo nutricional eliminado' },
      checkins: { title: 'Eliminar revisión', message: `${who(r)} · ${U.fmtDate(r.date)}`, okLabel: 'Eliminar revisión', done: 'Revisión eliminada' },
      measures: { title: 'Eliminar evaluación', message: `${who(r)} · ${U.fmtDate(r.date)}`, warning: 'El progreso y los gráficos del cliente se recalcularán sin este registro.', okLabel: 'Eliminar evaluación', done: 'Evaluación eliminada' },
      exercises: { title: 'Eliminar ejercicio propio', message: `«${r.name}»`, warning: 'Las rutinas que ya lo usan conservarán el nombre, pero sin la guía de la biblioteca.', okLabel: 'Eliminar ejercicio', done: 'Ejercicio eliminado' }
    }[kind];
    if (!T) return;
    confirmDelete({ ...T, run: () => PF.Store.remove(kind, id) });
  }
  // Pinta los errores debajo de cada campo del formulario abierto
  function fail(form, result) {
    V.Forms.showErrors(form, result.errors || {});
    V.Toast.show('Revisá los campos marcados en rojo');
    return false;
  }

  function init() {
    PF.Store.subscribe(renderAll);
    PF.Events.on('nav', d => navigate(d.page));
    PF.Events.on('menu:toggle', () => V.Layout.toggleMenu());
    PF.Events.on('modal:close', () => V.Modal.close());
    PF.Events.on('toast:action', () => V.Toast.runAction());
  }
  return { init, renderAll, navigate, requireClients, deleteRecord, confirmDelete, fail };
})();
