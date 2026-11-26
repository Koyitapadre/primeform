/* CONTROLADOR · Sincronización del equipo */
PF.Controllers.Sync = (function () {
  const V = PF.Views, S = PF.Sync;
  const MSG = { key: 'Esa no es la clave del equipo. Revisala (distingue mayúsculas) o pedísela a quien creó el espacio.', nosite: 'Este sitio no tiene la sincronización habilitada (falta el servidor). Revisá la guía de publicación.', config: null, network: 'No hay conexión con el servidor. Probá de nuevo cuando vuelva internet.', session: null, weak: null };
  const paint = s => { V.Sync.renderChip(s); V.Sync.renderCard(s); };
  function connect() {
    V.Sync.connectDialog({ onSubmit: async v => {
      const errors = {};
      if (v.key.length < S.MIN_PASS) errors.key = `Usá al menos ${S.MIN_PASS} caracteres (podés generar una)`;
      if (!v.ack) errors.ack = 'Confirmá que entendés que la clave no se puede recuperar';
      if (Object.keys(errors).length) return PF.Controllers.App.fail('sync', { errors });
      try {
        const r = await S.connect(v.key);
        V.Modal.close(); V.Toast.show(r.created ? 'Equipo creado: este dispositivo ya sincroniza' : 'Dispositivo unido al equipo: datos combinados');
      } catch (e) { PF.Controllers.App.fail('sync', { errors: { key: MSG[e.code] || e.message } }); return false; }
    } });
  }
  function disconnect() {
    V.Confirm.ask({ title: 'Desconectar este dispositivo', message: 'Este dispositivo dejará de sincronizar. Sus datos locales se conservan, pero los cambios nuevos no llegarán al equipo ni viceversa.', okLabel: 'Desconectar', onConfirm() { S.disconnect(); V.Toast.show('Dispositivo desconectado del equipo'); } });
  }
  async function versions() {
    try { V.Sync.versionsDialog(await S.versions()); } catch (e) { V.Toast.show(e.message); }
  }
  function restore(rev) {
    V.Confirm.ask({ title: 'Restaurar la versión ' + rev, message: 'Los datos de todos los dispositivos pasarán a ser los de esa versión. Lo posterior se reemplaza (queda en el historial).', okLabel: 'Restaurar', onConfirm: async () => {
      try { V.Modal.close(); await S.restoreVersion(rev); V.Toast.show('Versión restaurada'); } catch (e) { V.Toast.show(e.message); }
    } });
  }
  function init() {
    S.onStatus(paint);
    PF.Events.on('sync:open', () => { PF.Controllers.App.navigate('settings'); });
    PF.Events.on('sync:connect', connect);
    PF.Events.on('sync:genkey', () => V.Sync.setKey(S.genKey()));
    PF.Events.on('sync:now', async () => { await S.syncNow(); const s = S.state(); V.Toast.show(s.status === 'idle' ? 'Sincronizado' : s.error || 'No se pudo sincronizar'); });
    PF.Events.on('sync:disconnect', disconnect);
    PF.Events.on('sync:versions', versions);
    PF.Events.on('sync:restore', d => restore(d.rev));
    setInterval(() => paint(S.state()), 15000);                                // refresca «hace 10 s»
  }
  const start = () => { S.start(); paint(S.state()); };
  return { init, start, render() { paint(S.state()); } };
})();
