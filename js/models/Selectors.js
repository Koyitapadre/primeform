/* ============================================================
   MODELO · Selectors
   Consultas de solo lectura: datos derivados, filtros, estadísticas.
   Los controladores las usan para armar lo que reciben las vistas.
   ============================================================ */
PF.Selectors = (function () {
  const Store = PF.Store;

  function clientName(id) {
    const c = Store.find('clients', id);
    return c ? c.name : 'Cliente eliminado';
  }

  function withClientName(list) {
    return list.map(x => ({ ...x, clientName: clientName(x.clientId) }));
  }

  // Cupos: solo los clientes «Activo» ocupan lugar (En espera, En pausa y Finalizado no)
  function slotInfo() {
    const all = Store.list('clients'), active = all.filter(c => c.status === 'Activo').length, limit = PF.Legal.slots() || 0;
    return { mode: limit ? 'limited' : 'unlimited', limit, active, waiting: all.filter(c => c.status === 'En espera').length, free: limit ? Math.max(0, limit - active) : null, full: !!limit && active >= limit };
  }
  const activeClients = () => Store.list('clients').filter(c => c.status === 'Activo');

  function dashboardStats() {
    const clients = activeClients(), info = slotInfo();
    const since = PF.Utils.daysAgo(7);
    const recentCheckins = Store.list('checkins').filter(k => k.date >= since).length;
    return {
      clients: Store.list('clients').length, active: info.active, limit: info.limit, free: info.free, waiting: info.waiting,
      workouts: Store.list('workouts').length,
      measures: Store.list('measures').length,
      pendingCheckins: clients.length ? Math.max(0, clients.length - recentCheckins) : 0
    };
  }

  function recentClients(n = 4) { return Store.list('clients').slice(0, n); }

  function weightSeries(limit = 8) {
    return Store.list('measures')
      .filter(m => m.weight != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limit);
  }

  function filterClients({ query = '', goal = '', status = '' } = {}) {
    const q = query.toLowerCase();
    return Store.list('clients').filter(c => c.name.toLowerCase().includes(q) && (!goal || c.goal === goal) && (!status || c.status === status));
  }

  function workoutsFor(clientId = '') {
    return withClientName(Store.list('workouts').filter(w => !clientId || w.clientId === clientId));
  }

  function measuresFor(clientId = '') {
    return withClientName(Store.list('measures').filter(m => !clientId || m.clientId === clientId));
  }

  function nutritionList() { return withClientName(Store.list('nutrition')); }
  function checkinList() { return withClientName(Store.list('checkins')); }

  function clientProfile(id) {
    const client = Store.find('clients', id);
    if (!client) return null;
    const byDateDesc = (a, b) => b.date.localeCompare(a.date);
    const measures = Store.list('measures').filter(m => m.clientId === id).sort(byDateDesc);
    return {
      client,
      workoutCount: Store.list('workouts').filter(w => w.clientId === id).length,
      measureCount: measures.length,
      lastMeasure: measures[0] || null,
      nutrition: Store.list('nutrition').filter(n => n.clientId === id)[0] || null,
      lastCheckin: Store.list('checkins').filter(k => k.clientId === id).sort(byDateDesc)[0] || null
    };
  }

  // Datos para la vista de cliente: rutinas con cada ejercicio enlazado a la biblioteca.
  function portalFor(id) {
    const p = clientProfile(id);
    if (!p) return null;
    const workouts = Store.list('workouts').filter(w => w.clientId === id)
      .map(w => ({ ...w, exercises: w.exercises.map(e => ({ ...e, lib: PF.ExerciseLibrary.find(e.name) })) }));
    const measures = Store.list('measures').filter(m => m.clientId === id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    return { ...p, workouts, measures, progress: progressFor(id) };
  }

  // Panel de progreso físico (indicadores, tendencias, metas) de un cliente
  function progressFor(id) {
    const client = Store.find('clients', id);
    return client ? PF.Metrics.progress(client, Store.list('measures').filter(m => m.clientId === id)) : null;
  }
  // Clientes que necesitan atención (semáforo de retención), de mayor a menor riesgo
  function priorityClients() {
    return activeClients().map(c => ({
      client: c,
      risk: PF.Metrics.risk(c, { checkins: Store.list('checkins').filter(k => k.clientId === c.id), measures: Store.list('measures').filter(m => m.clientId === c.id), workouts: Store.list('workouts').filter(w => w.clientId === c.id) })
    })).sort((a, b) => b.risk.score - a.risk.score);
  }
  // Evaluaciones y revisiones registradas por semana (la última barra es la semana actual)
  function weeklyActivity(weeks = 8) {
    const t = PF.Utils.today(), out = Array.from({ length: weeks }, (_, i) => ({ label: PF.Utils.shift(t, { days: -(weeks - 1 - i) * 7 }), evals: 0, checks: 0 }));
    const bucket = d => { const k = Math.floor(PF.Metrics.dayDiff(d, t) / 7); return k >= 0 && k < weeks ? weeks - 1 - k : -1; };
    Store.list('measures').forEach(m => { const i = bucket(m.date); if (i >= 0) out[i].evals++; });
    Store.list('checkins').forEach(k => { const i = bucket(k.date); if (i >= 0) out[i].checks++; });
    return out;
  }

  return { slotInfo, weeklyActivity, progressFor, priorityClients, portalFor, clientName, dashboardStats, recentClients, weightSeries, filterClients, workoutsFor, measuresFor, nutritionList, checkinList, clientProfile };
})();
