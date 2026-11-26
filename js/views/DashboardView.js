/* ============================================================
   VISTA · Resumen (dashboard)
   render({ stats, recent, weights })
   ============================================================ */
PF.Views.Dashboard = (function () {
  const { esc, initials, fmtDate } = PF.Utils;
  const $ = id => document.getElementById(id);

  function renderStats(s) {
    $('statClients').textContent = s.active;
    $('statClientsFoot').textContent = s.limit ? `${s.free} ${s.free === 1 ? 'cupo libre' : 'cupos libres'} de ${s.limit}` : 'Cupos ilimitados';
    $('statClientsBar').innerHTML = s.limit ? `<div class="slotbar"><i style="width:${Math.min(100, Math.round(s.active / s.limit * 100))}%"></i></div>` : '';
    $('statWorkouts').textContent = s.workouts;
    $('statMeasures').textContent = s.measures;
    $('statCheckins').textContent = s.pendingCheckins;
  }

  function renderRecent(list) {
    $('recentClients').innerHTML = list.length
      ? list.map(c => `<div class="client-row"><div class="client-avatar">${esc(initials(c.name))}</div><div class="client-info"><strong>${esc(c.name)}</strong><small>${esc(c.goal)} · ${esc(c.experience)}</small></div><button class="btn small" data-action="measure:new" data-client-id="${c.id}">Evaluar</button></div>`).join('')
      : '<div class="empty">Todavía no hay clientes.<br><button class="btn primary" style="margin-top:12px" data-action="client:new">Añadir primer cliente</button></div>';
  }

  function renderChart(weeks) {
    const ch = $('activityChart'), total = weeks.reduce((a, w) => a + w.evals + w.checks, 0);
    if (!total) { ch.innerHTML = '<div class="empty">Todavía no hay evaluaciones ni revisiones recientes. Registrá una para ver la actividad semanal.</div>'; return; }
    const W = 420, H = 190, L = 28, B = 30, T = 14, max = Math.max(3, ...weeks.map(w => Math.max(w.evals, w.checks))), slot = (W - L - 8) / weeks.length, bw = Math.min(16, slot / 2 - 3);
    const Y = v => H - B - v / max * (H - B - T), short = d => new Date(d + 'T12:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }).replace('.', '');
    const grid = [0, Math.ceil(max / 2), max].map(v => `<line x1="${L}" y1="${Y(v)}" x2="${W}" y2="${Y(v)}" stroke="#1f3258" stroke-dasharray="3 4"/><text x="${L - 6}" y="${Y(v) + 3}" font-size="9" fill="#8fa3c4" text-anchor="end">${v}</text>`).join('');
    const bars = weeks.map((w, i) => { const x = L + i * slot + slot / 2; return `<rect x="${x - bw - 1}" y="${Y(w.evals)}" width="${bw}" height="${H - B - Y(w.evals)}" rx="3" fill="#2ea8ff"/><rect x="${x + 1}" y="${Y(w.checks)}" width="${bw}" height="${H - B - Y(w.checks)}" rx="3" fill="#ff8a2b"/>${i % 2 === weeks.length % 2 || i === weeks.length - 1 ? `<text x="${x}" y="${H - 10}" font-size="9" fill="#8fa3c4" text-anchor="middle">${short(w.label)}</text>` : ''}`; }).join('');
    ch.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evaluaciones y revisiones por semana">${grid}${bars}</svg><div class="chartkey"><span><i class="dot mus"></i>Evaluaciones físicas</span><span><i class="dot fat"></i>Revisiones</span></div>`;
  }

  const LEVEL = { alta: ['Prioridad alta', 'bad'], media: ['Atención', 'warn'] };
  function renderPriority(list, total) {
    const card = $('priorityCard'); if (!card) return;
    card.hidden = total === 0;
    $('priorityTag').textContent = list.length ? `${list.length} de ${total} clientes` : 'Todo en orden';
    $('priorityList').innerHTML = list.length ? list.map(({ client: c, risk }) => {
      const [label, tone] = LEVEL[risk.level];
      return `<div class="prio ${esc(risk.level)}"><span class="dot" aria-hidden="true"></span><div class="prio-main"><div><strong>${esc(c.name)}</strong> <span class="chip ${tone}">${label}</span></div><ul class="prio-reasons">${risk.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div><div class="prio-actions"><button class="btn small" data-action="checkin:new" data-client-id="${esc(c.id)}">＋ Revisión</button><button class="btn small" data-action="measure:new" data-client-id="${esc(c.id)}">＋ Evaluar</button></div></div>`;
    }).join('') : '<div class="prio-ok">🎉 Todos tus clientes van en buen camino: revisiones y evaluaciones al día.</div>';
  }

  function render({ stats, recent, weeks, backupDue, priority, clientCount }) {
    $('backupNotice').hidden = !backupDue;
    renderPriority(priority || [], clientCount || 0);
    renderStats(stats);
    renderRecent(recent);
    renderChart(weeks);
  }

  return { render };
})();
