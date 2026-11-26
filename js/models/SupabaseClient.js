/* ============================================================
   MODELO · SupabaseClient
   Autenticación (admin / cliente) y sincronización con Postgres.
   ============================================================ */
PF.Supabase = (function () {
  const TABLES = ['clients', 'exercises', 'workouts', 'measures', 'nutrition', 'checkins'];
  const CLIENT_SCOPED = new Set(['workouts', 'measures', 'nutrition', 'checkins']);
  let client = null;
  let session = null;
  let profile = null; // { id, role: 'admin' | 'client', client_id }

  function ready() {
    if (client) return client;
    const url = PF.Config && PF.Config.supabaseUrl;
    const key = PF.Config && PF.Config.supabaseAnonKey;
    if (!url || !key || !window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    return client;
  }

  async function loadSessionAndRole() {
    const sb = ready();
    if (!sb) return { session: null, profile: null };
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    session = data.session || null;
    if (!session) { profile = null; return { session: null, profile: null }; }

    const { data: prof, error: pErr } = await sb
      .from('profiles')
      .select('id, role, client_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (pErr) throw pErr;
    profile = prof || { id: session.user.id, role: 'client', client_id: null };
    return { session, profile };
  }

  async function signIn(email, password) {
    const sb = ready();
    if (!sb) throw new Error('Supabase no está configurado en config.js');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    session = data.session;
    return loadSessionAndRole();
  }

  async function signOut() {
    const sb = ready();
    if (sb) await sb.auth.signOut();
    session = null;
    profile = null;
  }

  function role() {
    return profile ? profile.role : null;
  }

  function currentUser() {
    return session && session.user ? session.user : null;
  }

  async function pullAll() {
    const sb = ready();
    if (!sb || !session) throw new Error('Sin sesión activa');
    const out = { clients: [], workouts: [], measures: [], nutrition: [], checkins: [], exercises: [] };

    for (const table of TABLES) {
      let q = sb.from(table).select('id, payload');
      if (profile && profile.role === 'client') {
        if (table === 'clients' && profile.client_id) q = q.eq('id', profile.client_id);
        else if (CLIENT_SCOPED.has(table) && profile.client_id) q = q.eq('client_id', profile.client_id);
      }
      const { data: rows, error } = await q;
      if (error) throw error;
      out[table] = (rows || []).map(r => r.payload).filter(Boolean);
    }

    return PF.Schema.sanitizeDb(out).data;
  }

  async function pushCollection(kind, records) {
    const sb = ready();
    if (!sb || !session) throw new Error('Sin sesión activa');
    if (profile && profile.role !== 'admin') throw new Error('Solo el administrador puede modificar datos');

    const rows = (records || []).map(rec => {
      const row = {
        id: rec.id,
        payload: rec,
        updated_at: new Date().toISOString()
      };
      if (CLIENT_SCOPED.has(kind)) row.client_id = rec.clientId;
      return row;
    });

    if (!rows.length) return;
    const { error } = await sb.from(kind).upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }

  async function deleteRecord(kind, id) {
    const sb = ready();
    if (!sb || !session) return;
    if (profile && profile.role !== 'admin') return;
    const { error } = await sb.from(kind).delete().eq('id', id);
    if (error) throw error;
  }

  return { ready, loadSessionAndRole, signIn, signOut, role, currentUser, pullAll, pushCollection, deleteRecord };
})();
