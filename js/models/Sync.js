/* ============================================================
   MODELO · Sync (sincronización en la nube con Supabase)
   - Sincroniza las colecciones locales (clients, exercises, workouts, measures,
     nutrition, checkins) con Postgres mediante PF.Supabase.
   - Si el usuario tiene rol 'admin': baja cambios remotos, combina si aplica y sube
     los cambios locales tras cada edición (con debounce) o periódicamente.
   - Si el usuario tiene rol 'client': solo descarga su plan autorizado por RLS en
     modo efímero (solo lectura).
   ============================================================ */
PF.Sync = (function () {
  const TABLES = ['clients', 'exercises', 'workouts', 'measures', 'nutrition', 'checkins'];
  const MIN_PASS = 16, ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const cfg = { pollMs: 25000, debounceMs: 1500 };
  const st = { status: 'off', error: '', last: 0, busy: false, dirty: false, seq: 0, running: false, timer: null, poll: null, fails: 0, hooks: false };
  const subs = [];
  const Store = () => PF.Store;
  const isSupabaseReady = () => !!(PF.Supabase && PF.Supabase.ready() && PF.Supabase.role());
  const state = () => ({
    status: st.status,
    error: st.error,
    last: st.last,
    connected: isSupabaseReady(),
    rev: st.seq
  });
  const setStatus = (s, e = '') => { st.status = s; st.error = e; subs.forEach(fn => fn(state())); };

  function genKey(n = 24) {
    const out = [], max = 256 - (256 % ALPHA.length), buf = new Uint8Array(64);
    while (out.length < n) { crypto.getRandomValues(buf); for (const b of buf) if (b < max && out.length < n) out.push(ALPHA[b % ALPHA.length]); }
    return out.join('');
  }

  /* ---------- Un ciclo de sincronización con Supabase ---------- */
  async function cycle() {
    if (!isSupabaseReady()) { setStatus('off'); return; }
    const role = PF.Supabase.role();

    // Modo cliente: solo lectura de su propio plan desde Supabase
    if (role === 'client') {
      const remote = await PF.Supabase.pullAll();
      Store().loadEphemeral(remote);
      return;
    }

    // Modo admin: si no hay cambios locales pendientes, traer estado remoto; si hay cambios, subir
    if (!st.dirty) {
      const remote = await PF.Supabase.pullAll();
      const local = Store().exportForSync().data;
      const remoteHasData = TABLES.some(k => (remote[k] || []).length > 0);
      const localHasData = TABLES.some(k => (local[k] || []).length > 0);

      if (remoteHasData) {
        // Combinar remoto con local para no perder ediciones recientes sin subir
        const merged = { clients: [], workouts: [], measures: [], nutrition: [], checkins: [], exercises: [] };
        TABLES.forEach(k => {
          const byId = new Map();
          (remote[k] || []).forEach(r => byId.set(r.id, r));
          (local[k] || []).forEach(r => { if (!byId.has(r.id)) byId.set(r.id, r); });
          merged[k] = Array.from(byId.values());
        });
        Store().applyRemoteData(merged);
      } else if (localHasData) {
        // Primera subida inicial si la nube está vacía y hay datos locales
        st.dirty = true;
      }
    }

    if (st.dirty) {
      const seqAt = st.seq;
      const current = Store().exportForSync().data;
      // Importante: subir 'clients' primero por las llaves foráneas en Postgres
      await PF.Supabase.pushCollection('clients', current.clients);
      for (const table of TABLES) {
        if (table === 'clients') continue;
        await PF.Supabase.pushCollection(table, current[table]);
      }
      if (st.seq === seqAt) st.dirty = false;
    }
  }

  async function tick() {
    if (!st.running || st.busy) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setStatus('offline'); return; }
    st.busy = true; setStatus('syncing');
    try {
      await cycle();
      st.fails = 0;
      st.last = Date.now();
      setStatus('idle');
    } catch (e) {
      st.fails++;
      const msg = (e && e.message) ? e.message : 'Error de sincronización con Supabase';
      if (/fetch|network|Failed to fetch/i.test(msg)) setStatus('offline');
      else setStatus('error', msg);
    } finally {
      st.busy = false;
      if (st.running && (st.dirty || st.status === 'offline' || st.status === 'error')) {
        schedule(st.status === 'idle' ? cfg.debounceMs : Math.min(120000, 5000 * Math.pow(2, Math.min(st.fails, 5))));
      }
    }
  }

  function schedule(ms) { clearTimeout(st.timer); st.timer = setTimeout(tick, ms); }

  function hooks() {
    if (st.hooks) return; st.hooks = true;
    Store().subscribe(src => {
      if (src === 'sync' || !st.running) return;
      if (PF.Supabase && PF.Supabase.role() !== 'admin') return;
      st.dirty = true;
      st.seq++;
      schedule(cfg.debounceMs);
    });
    window.addEventListener('online', () => { if (st.running) schedule(300); });
    window.addEventListener('offline', () => { if (st.running) setStatus('offline'); });
    document.addEventListener('visibilitychange', () => { if (st.running && !document.hidden) schedule(300); });
  }

  function start() {
    stop(); hooks();
    if (!isSupabaseReady()) { setStatus('off'); return; }
    st.running = true;
    setStatus('syncing');
    schedule(100);
    st.poll = setInterval(() => { if (!document.hidden) tick(); }, cfg.pollMs);
  }

  function stop() { st.running = false; clearTimeout(st.timer); clearInterval(st.poll); st.poll = null; }

  /* ---------- Acciones públicas compatibles con SyncController ---------- */
  async function connect() {
    if (!isSupabaseReady()) throw new Error('Iniciá sesión primero para sincronizar con la nube');
    start();
    await tick();
    return { created: false };
  }
  function disconnect() { stop(); setStatus('off'); }
  const syncNow = () => {
    if (!isSupabaseReady()) return Promise.resolve();
    st.running = true;
    if (PF.Supabase.role() === 'admin') { st.dirty = true; st.seq++; }
    return tick();
  };
  async function versions() { return []; }
  async function restoreVersion() { throw new Error('El historial de versiones se administra desde los respaldos o Supabase'); }
  const configure = o => Object.assign(cfg, o);
  const onStatus = fn => { subs.push(fn); };

  return { state, onStatus, start, stop, connect, disconnect, syncNow, versions, restoreVersion, genKey, configure, MIN_PASS };
})();
