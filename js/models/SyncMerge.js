/* ============================================================
   MODELO · SyncMerge (combinar los cambios de dos administradores)
   Función pura: merge(a, b) con a, b = { data, ts, del, org, orgTs }.
   - ts[«tipo:id»]  = cuándo se creó/modificó ese registro por última vez.
   - del[«tipo:id»] = cuándo se borró (lápida), para que el borrado también se propague.
   Regla por registro: gana el evento más reciente (modificación o borrado).
   Es conmutativa e idempotente: ambos dispositivos terminan con el MISMO resultado.
   Un borrado gana en empate. Con la misma marca de tiempo y contenidos distintos
   gana el JSON mayor (determinista).
   ============================================================ */
PF.SyncMerge = (function () {
  const KINDS = ['clients', 'workouts', 'measures', 'nutrition', 'checkins', 'exercises'];
  const TOMB_DAYS = 90;
  const blank = () => ({ clients: [], workouts: [], measures: [], nutrition: [], checkins: [], exercises: [] });
  const order = r => String(r.created || r.date || r.start || '');
  const byOrder = (x, y) => order(y).localeCompare(order(x)) || String(x.id).localeCompare(String(y.id));
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;

  function merge(a, b, now = Date.now()) {
    const out = { data: blank(), ts: {}, del: {}, org: null, orgTs: 0 };
    const index = s => { const m = {}; KINDS.forEach(k => (s.data[k] || []).forEach(r => { m[k + ':' + r.id] = r; })); return m; };
    const A = index(a), B = index(b), cutoff = now - TOMB_DAYS * 86400000;
    const keys = new Set([...Object.keys(A), ...Object.keys(B), ...Object.keys(a.del || {}), ...Object.keys(b.del || {})]);
    keys.forEach(key => {
      const kind = key.slice(0, key.indexOf(':'));
      const ta = A[key] ? (num(a.ts[key]) ?? 0) : -1, tb = B[key] ? (num(b.ts[key]) ?? 0) : -1;
      const rec = Math.max(ta, tb), del = Math.max(num((a.del || {})[key]) ?? -1, num((b.del || {})[key]) ?? -1);
      if (del >= 0 && del >= rec) { if (del >= cutoff) out.del[key] = del; return; }          // gana el borrado (y también en empate)
      let win;
      if (ta > tb) win = A[key]; else if (tb > ta) win = B[key];
      else if (!A[key]) win = B[key]; else if (!B[key]) win = A[key];
      else win = JSON.stringify(A[key]) >= JSON.stringify(B[key]) ? A[key] : B[key];     // empate: determinista
      out.data[kind].push(win); out.ts[key] = rec;
    });
    KINDS.forEach(k => out.data[k].sort(byOrder));
    const oa = num(a.orgTs) ?? 0, ob = num(b.orgTs) ?? 0;
    if (oa > ob) { out.org = a.org; out.orgTs = oa; }
    else if (ob > oa) { out.org = b.org; out.orgTs = ob; }
    else { out.orgTs = oa; out.org = JSON.stringify(a.org || null) >= JSON.stringify(b.org || null) ? (a.org || null) : (b.org || null); }
    return out;
  }
  // Representación canónica (para saber si dos estados son idénticos)
  const sortObj = o => Object.keys(o || {}).sort().reduce((r, k) => (r[k] = o[k], r), {});
  const canon = s => JSON.stringify({ d: KINDS.map(k => (s.data[k] || []).slice().sort((x, y) => String(x.id).localeCompare(String(y.id)))), ts: sortObj(s.ts), del: sortObj(s.del), org: s.org || null, orgTs: s.orgTs || 0 });
  return { KINDS, TOMB_DAYS, blank, merge, canon };
})();
