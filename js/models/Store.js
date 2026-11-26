/* ============================================================
   MODELO · Store
   Fuente única de verdad. Guarda las colecciones, las persiste (en claro
   o cifradas si hay contraseña) y avisa a los suscriptores.
   Todo lo que entra pasa por PF.Schema (saneamiento).
   Incluye soporte para eliminación remota en Supabase.
   ============================================================ */
PF.Store = (function () {
  const OWNED_BY_CLIENT = ['workouts', 'measures', 'nutrition', 'checkins'];
  const listeners = [], errorHandlers = [];
  const blank = () => ({ clients: [], workouts: [], measures: [], nutrition: [], checkins: [], exercises: [] });
  let data = blank();

  /* ---- Metadatos de sincronización ---- */
  // ts[«tipo:id»] = último cambio · del[«tipo:id»] = lápida de borrado · conn = conexión con el equipo (clave, versión)
  const KINDS = PF.SyncMerge.KINDS, KEY_RE = /^(clients|workouts|measures|nutrition|checkins|exercises):[A-Za-z0-9_-]{1,64}$/;
  const freshSync = () => ({ ts: {}, del: {}, orgTs: 0, conn: null });
  let sync = freshSync(), shadow = {}, lastNow = 0;
  const nowTs = () => (lastNow = Math.max(Date.now(), lastNow + 1));      // monótona en este dispositivo
  function cleanSync(s) {
    const out = freshSync(); if (!s || typeof s !== 'object') return out;
    const maps = m => { const r = {}; Object.keys(m && typeof m === 'object' ? m : {}).forEach(k => { if (KEY_RE.test(k) && typeof m[k] === 'number' && isFinite(m[k])) r[k] = m[k]; }); return r; };
    out.ts = maps(s.ts); out.del = maps(s.del); out.orgTs = typeof s.orgTs === 'number' && isFinite(s.orgTs) ? s.orgTs : 0;
    const c = s.conn;
    if (c && typeof c === 'object' && typeof c.pass === 'string' && c.pass.length >= 8 && c.pass.length <= 200) out.conn = { pass: c.pass, salt: typeof c.salt === 'string' ? c.salt.slice(0, 64) : '', rev: Number.isInteger(c.rev) && c.rev >= 0 ? c.rev : 0, last: typeof c.last === 'number' ? c.last : 0 };
    return out;
  }
  const rebuildShadow = () => { shadow = {}; KINDS.forEach(k => data[k].forEach(r => { shadow[k + ':' + r.id] = JSON.stringify(r); })); };
  // Compara con la última «foto» y sella lo que cambió (cubre CUALQUIER forma de modificar los datos)
  function stampChanges() {
    const t = nowTs(), seen = {};
    KINDS.forEach(k => data[k].forEach(r => { const key = k + ':' + r.id, js = JSON.stringify(r); seen[key] = 1; if (shadow[key] !== js) { shadow[key] = js; sync.ts[key] = t; delete sync.del[key]; } }));
    Object.keys(shadow).forEach(key => { if (!seen[key]) { delete shadow[key]; delete sync.ts[key]; sync.del[key] = t; } });
  }
  const payload = () => ({ ...data, _sync: sync });                     // lo que se guarda en el dispositivo (cifrado si hay contraseña)

  let ephemeral = false;                                     // enlace de cliente / sesión cliente: datos solo en memoria
  function persist() {
    if (ephemeral) return;
    if (PF.Vault.active()) { PF.Vault.save(payload()); return; }
    if (PF.Vault.isEnabled()) return;                       // bloqueado: nunca escribir en claro
    if (!PF.Storage.write(payload())) errorHandlers.forEach(fn => fn('storage'));
  }
  let rev = 0;                                               // cuenta cada cambio (para validar «Deshacer»)
  function commit(source) { if (source !== 'sync' && !ephemeral) stampChanges(); rev++; persist(); listeners.forEach(fn => fn(source)); }

  /* ---- Sincronización auxiliar con Supabase ---- */
  function sbDelete(kind, id) {
    if (ephemeral || !PF.Supabase || PF.Supabase.role() !== 'admin') return;
    PF.Supabase.deleteRecord(kind, id).catch(() => {});
  }

  /* ---- Arranque ---- */
  function boot() {                                          // sin contraseña: carga en claro
    if (PF.Vault.isEnabled()) return false;
    const raw = PF.Storage.read();
    data = PF.Schema.sanitizeDb(raw).data; sync = cleanSync(raw && raw._sync); rebuildShadow();
    return true;
  }
  // Modo «enlace de cliente» o sesión cliente: NO lee ni escribe el almacenamiento del navegador
  function loadEphemeral(obj) { ephemeral = true; data = PF.Schema.sanitizeDb(obj).data; listeners.forEach(fn => fn('sync')); }
  function load(obj) { ephemeral = false; data = PF.Schema.sanitizeDb(obj).data; sync = cleanSync(obj && obj._sync); rebuildShadow(); listeners.forEach(fn => fn()); }   // tras descifrar

  /* ---- Suscripción ---- */
  const subscribe = fn => { listeners.push(fn); };
  const onError = fn => { errorHandlers.push(fn); };

  /* ---- Lectura ---- */
  const list = kind => data[kind].slice();
  const find = (kind, id) => data[kind].find(x => x.id === id);
  const hasClients = () => data.clients.length > 0;
  const serialize = () => JSON.stringify({ _app: 'primeform', _v: 1, _exported: new Date().toISOString(), _org: PF.Legal.org(), ...data }, null, 2);
  // Derecho de acceso: todos los datos de UN cliente (no es un respaldo: no se puede importar por error)
  function serializeClient(id) {
    const c = find('clients', id); if (!c) return null;
    const own = k => data[k].filter(x => x.clientId === id);
    return JSON.stringify({ _app: 'primeform', _type: 'datos-de-un-cliente', _exported: new Date().toISOString(), client: c, workouts: own('workouts'), measures: own('measures'), nutrition: own('nutrition'), checkins: own('checkins') }, null, 2);
  }

  /* ---- Escritura ---- */
  function add(kind, record) { data[kind].unshift(record); commit(); return record; }
  function update(kind, id, patch) { const r = find(kind, id); if (!r) return null; Object.assign(r, patch); commit(); return r; }
  // Regla de negocio: una evaluación con peso actualiza el peso actual del cliente.
  function addMeasure(record) {
    data.measures.unshift(record);
    const client = find('clients', record.clientId);
    const newest = !data.measures.some(m => m !== record && m.clientId === record.clientId && m.weight != null && m.date > record.date);
    if (client && record.weight && newest) client.weight = record.weight;   // solo si es la evaluación más reciente
    commit(); return record;
  }
  function remove(kind, id) {
    data[kind] = data[kind].filter(x => x.id !== id);
    sbDelete(kind, id);
    commit();
  }
  function removeWhere(kind, fn) {
    const removed = data[kind].filter(fn);
    data[kind] = data[kind].filter(x => !fn(x));
    removed.forEach(r => sbDelete(kind, r.id));
    commit();
  }
  // Quita un ejercicio de una rutina (una rutina debe conservar al menos uno)
  function removeExercise(workoutId, index) {
    const w = find('workouts', workoutId);
    if (!w || !Array.isArray(w.exercises) || w.exercises.length <= 1 || !(index >= 0 && index < w.exercises.length)) return false;
    w.exercises.splice(index, 1); commit(); return true;
  }
  // «Deshacer»: copia profunda de los datos y restauración (siempre pasa por el sanitizador)
  const snapshot = () => JSON.parse(JSON.stringify(data));
  function restore(snap) { data = PF.Schema.sanitizeDb(snap).data; commit(); }
  const revision = () => rev;
  // Regla de negocio: borrar un cliente borra todos sus registros asociados.
  function removeClient(id) {
    data.clients = data.clients.filter(c => c.id !== id);
    OWNED_BY_CLIENT.forEach(k => { data[k] = data[k].filter(x => x.clientId !== id); });
    sbDelete('clients', id); // En Postgres, ON DELETE CASCADE limpia workouts, measures, nutrition y checkins
    commit();
  }
  function append(partial) { Object.keys(partial).forEach(kind => data[kind].push(...partial[kind])); data = PF.Schema.sanitizeDb(data).data; commit(); }
  function importData(obj) {
    if (!PF.Schema.isBackup(obj)) throw new Error('Formato de respaldo no válido');
    const r = PF.Schema.sanitizeDb(obj);
    data = r.data; commit();
    return { dropped: r.dropped, clients: data.clients.length };
  }
  function reset() { data = blank(); commit(); }

  /* ---- Contraseña / cifrado ---- */
  async function enableVault(pass) { await PF.Vault.setup(pass, payload()); PF.Storage.clear(); listeners.forEach(fn => fn()); }
  async function disableVault() { PF.Vault.disable(); PF.Storage.write(payload()); listeners.forEach(fn => fn()); }

  /* ---- Sincronización con el equipo ---- */
  const syncConn = () => sync.conn ? { ...sync.conn } : null;
  function setConn(patch) { sync.conn = patch ? { ...(sync.conn || {}), ...patch } : null; persist(); }       // no es un cambio de datos: no avisa a la interfaz
  const exportForSync = () => ({ data: JSON.parse(JSON.stringify(data)), ts: { ...sync.ts }, del: { ...sync.del }, org: PF.Legal.org(), orgTs: sync.orgTs });
  function touchOrg() { if (ephemeral) return; sync.orgTs = nowTs(); commit('org'); }                          // cambió el responsable / cupos
  // Aplica el resultado de una combinación SIN volver a «sellarlo» como cambio local
  function applyMerged(m) {
    const cutoff = Date.now() - PF.SyncMerge.TOMB_DAYS * 86400000, s = cleanSync({ ts: m.ts, del: m.del, orgTs: m.orgTs });
    Object.keys(s.del).forEach(k => { if (s.del[k] < cutoff) delete s.del[k]; });
    data = PF.Schema.sanitizeDb(m.data).data; sync.ts = s.ts; sync.del = s.del; sync.orgTs = s.orgTs;
    rebuildShadow(); commit('sync');
  }
  // Carga directa desde Supabase (sin disparar subida inmediata ni marcar dirty)
  function applyRemoteData(remoteData) {
    data = PF.Schema.sanitizeDb(remoteData).data;
    rebuildShadow();
    commit('sync');
  }
  return { syncConn, setConn, exportForSync, touchOrg, applyMerged, applyRemoteData, boot, load, subscribe, onError, list, find, hasClients, serialize, loadEphemeral, serializeClient, add, update, addMeasure, remove, removeWhere, removeExercise, snapshot, restore, revision, removeClient, append, importData, reset, enableVault, disableVault };
})();
