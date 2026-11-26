/* CONTROLADOR · Datos y ajustes: respaldo, importación, datos de ejemplo, borrar todo */
PF.Controllers.Settings = (function () {
  const V = PF.Views, Store = PF.Store, Meta = PF.Meta;

  function render() {
    const m = Meta.get();
    V.Settings.renderBackup(m.lastBackup ? 'Último respaldo: ' + PF.Utils.fmtDate(m.lastBackup) : 'Todavía no hiciste ningún respaldo.');
    PF.Controllers.Security.refresh();
    PF.Controllers.Legal.render();
  }
  function exportData() {
    V.Settings.download('primeform-respaldo-' + PF.Utils.today() + '.json', Store.serialize());
    Meta.set({ lastBackup: PF.Utils.today() });
    V.Toast.show('Respaldo descargado. Guardalo en un lugar seguro.');
    PF.Controllers.App.renderAll();
  }
  function importData(file) {
    if (!file) return;
    V.Settings.readFile(file, (text, readErr) => {
      V.Settings.resetFileInput();
      if (readErr) { V.Toast.show(readErr); return; }
      let obj;
      try { obj = JSON.parse(text); } catch (e) { V.Toast.show('El archivo no es un respaldo válido'); return; }
      if (!PF.Schema.isBackup(obj)) { V.Toast.show('El archivo no es un respaldo de PRIMEFORM'); return; }
      PF.Controllers.App.confirmDelete({
        title: 'Importar respaldo', message: 'Importar REEMPLAZARÁ todos los datos actuales por los del archivo.', warning: 'Si querés conservar lo actual, descargá un respaldo antes.', okLabel: 'Reemplazar con el respaldo', done: 'Respaldo importado',
        run: () => { try { const r = Store.importData(obj); if (obj._org) PF.Legal.save(obj._org); if (r.dropped) V.Toast.show(`Respaldo importado (${r.dropped} registros inválidos descartados)`); } catch (err) { V.Toast.show('No se pudo importar el respaldo'); } }
      });
    });
  }
  function seedDemo() {
    const add = () => { Store.append(PF.DemoData.create()); V.Toast.show('Datos de ejemplo añadidos'); };
    if (!Store.hasClients()) { add(); return; }
    V.Confirm.ask({ title: 'Agregar datos de ejemplo', message: 'Ya hay datos guardados. Los ejemplos (ficticios) se sumarán a los clientes actuales.', okLabel: 'Agregar ejemplos', danger: false, onConfirm: add });
  }
  function clearData() {
    PF.Controllers.App.confirmDelete({
      title: 'Borrar TODOS los datos', message: 'Se eliminarán todos los clientes, rutinas, evaluaciones, nutrición, revisiones y ejercicios propios de este navegador.',
      warning: 'Descargá un respaldo antes: sin él, no hay forma de recuperarlos pasado el aviso de «Deshacer».', typed: 'BORRAR TODO', okLabel: 'Borrar todo definitivamente', done: 'Todos los datos fueron eliminados', run: () => Store.reset()
    });
  }
  function init() {
    PF.Events.on('settings:export', exportData);
    PF.Events.on('backup:now', exportData);
    PF.Events.on('settings:pick-file', () => V.Settings.pickFile());
    PF.Events.on('settings:import', (d, el) => importData(el.files[0]));
    PF.Events.on('settings:seed', seedDemo);
    PF.Events.on('settings:clear', clearData);
  }
  return { init, render };
})();
