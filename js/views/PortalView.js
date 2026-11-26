/* VISTA · Vista de cliente (lo que vería la persona entrenada, solo lectura) */
PF.Views.Portal = (function () {
  const { esc, fmtDate, initials } = PF.Utils, $ = id => document.getElementById(id);

  function renderPicker(clients) { const el = $('portalClient'); PF.Views.FormFields.fillClientFilter('portalClient', clients); el.remove(0); if (!el.value && clients[0]) el.value = clients[0].id; }
  function selected() { return $('portalClient') ? $('portalClient').value : ''; }

  function exercise(e) {
    const lib = e.lib || { name: e.name, tpl: 'squat', equip: '', desc: 'Sin descripción en la biblioteca.' };
    return `<details class="card" style="padding:12px;margin-bottom:8px"><summary style="cursor:pointer;display:flex;gap:12px;align-items:center"><div style="width:110px;flex:none">${PF.Views.ExerciseArt.render(lib)}</div><div><strong>${esc(e.name)}</strong><div class="muted" style="font-size:12px">${e.sets} series · ${esc(e.reps)} reps · RIR ${e.rir} · descanso ${e.rest || 120} s</div></div></summary><p class="muted" style="margin:12px 0 0">${esc(lib.desc)}</p><div style="margin-top:10px">${PF.Views.ExerciseGuide.btn(e.name, 'Ver cómo hacerlo paso a paso')}</div>${(() => { const m = PF.Views.ExerciseArt.muscles(lib.tpl); return m.main.length ? `<div class="muscles" style="margin-top:8px">Trabaja: <b>${m.main.join(', ')}</b>${m.sec.length ? ' · ' + m.sec.join(', ') : ''}</div>` : ''; })()}</details>`;
  }

  function render(d, o = {}) {
    const el = $('portalBody');
    if (!d) { el.innerHTML = '<div class="empty">Agregá un cliente para ver su portal.</div>'; return; }
    const c = d.client, n = d.nutrition, k = d.lastCheckin, p = d.progress;
    const stat = (label, value, foot) => `<div class="stat"><div class="stat-top"><span>${esc(label)}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`;
    el.innerHTML = `<div class="card" style="margin-bottom:16px"><div class="row" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div class="client-avatar" style="width:54px;height:54px">${esc(initials(c.name))}</div><div style="flex:1;min-width:200px"><div class="eyebrow">TU PLAN</div><h2 style="margin:4px 0">¡Hola, ${esc(c.name.split(' ')[0])}!</h2><span class="tag green">${esc(c.goal)}</span> <span class="tag">${esc(c.experience)}</span></div><button class="btn primary" data-action="report:open" data-id="${esc(c.id)}">📄 Descargar informe</button></div></div>
    <div class="stats">${stat('Evaluaciones', p.count, p.count ? 'última: ' + fmtDate(p.last.date) : 'todavía sin evaluar')}${stat('En el programa', Math.max(0, PF.Metrics.dayDiff(c.start, PF.Utils.today())), 'días desde el ' + fmtDate(c.start))}${stat('Calorías objetivo', n ? (n.cal ?? '—') : '—', n ? `P ${n.protein ?? '—'} · C ${n.carbs ?? '—'} · G ${n.fat ?? '—'} g<span class="adv-mini">Recomendación orientativa: consultala con tu nutricionista</span>` : 'Sin objetivo')}${o.viewer ? '' : stat('Última revisión', k ? fmtDate(k.date) : '—', k ? 'Adherencia ' + esc(k.adherence) : 'Sin revisiones')}</div>
    <h2 class="sectiontitle">Mi progreso físico</h2>${PF.Views.Progress.render(p, { self: true })}
    <h2 class="sectiontitle">Mis rutinas</h2>${d.workouts.length ? d.workouts.map(w => `<div class="card" style="margin-bottom:14px"><div class="cardhead"><div><h2>${esc(w.name)}</h2><div class="muted" style="font-size:12px;margin-top:4px">${esc(w.day)} · Inicio ${fmtDate(w.start)}</div></div></div>${w.exercises.map(exercise).join('')}${w.notes ? `<p class="note">${esc(w.notes)}</p>` : ''}</div>`).join('') : '<div class="empty">Todavía no tenés rutinas asignadas.</div>'}`;
  }
  return { renderPicker, selected, render };
})();
