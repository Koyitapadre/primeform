/* ============================================================
   VISTA · Panel de progreso físico
   render(progress, { light, report, noHistory }) → HTML (se usa en el panel
   del entrenador, en la vista de cliente y en el informe imprimible).
   Cada indicador tiene un botón "i" con la explicación completa.
   ============================================================ */
PF.Views.Progress = (function () {
  const { esc, fmtDate } = PF.Utils, M = PF.Metrics, fmt = M.fmt;
  const COLORS = { weight: '#2ea8ff', fat: '#ff8a2b', muscle: '#8fd0ff', waist: '#ffb36b' };
  const KEY_CHARTS = ['weight', 'fat', 'muscle', 'waist'];

  const arrow = d => d < 0 ? '▼' : '▲';
  const delta = (d, dec, unit, tone, title = 'desde la primera evaluación') => d == null ? '' : (Math.abs(d) < 1e-9 ? `<span class="delta neutral" title="${title}">= sin cambios</span>` : `<span class="delta ${tone}" title="${title}">${arrow(d)} ${fmt(Math.abs(d), dec)}${unit ? ' ' + esc(unit) : ''}</span>`);
  const chip = c => c ? `<span class="chip ${esc(c.tone)}">${esc(c.t)}</span>` : '';
  const field = (p, k) => p.fields.find(f => f.def.key === k);
  const der = (p, k) => p.derived.find(d => d.key === k);
  // botón "i" (no se imprime en el informe)
  const info = (p, o) => (key, label) => o.report ? '' : PF.Views.Learn.btn(key, p.client.id, label);

  function kpis(p, I) {
    const out = [], w = field(p, 'weight'), fa = field(p, 'fat'), mu = field(p, 'muscle'), wa = field(p, 'waist'), bm = der(p, 'bmi'), wt = der(p, 'whtr');
    const card = (key, label, value, unit, sub, extra = '') => `<div class="kpi"><div class="kpi-top"><small>${esc(label)}</small>${I(key, label)}</div><strong>${value}<em>${esc(unit)}</em></strong><div class="kpi-sub">${sub}${extra}</div></div>`;
    if (p.now.weight != null) out.push(card('weight', 'Peso', fmt(p.now.weight, 1), 'kg', w && w.n > 1 ? delta(w.delta, 1, 'kg', w.tone) : ''));
    if (p.now.bmi != null) out.push(card('bmi', 'IMC', fmt(p.now.bmi, 1), '', chip(p.now.bmiCat), bm && bm.n > 1 ? delta(bm.delta, 1, '', bm.tone) : ''));
    if (fa) out.push(card('fat', '% de grasa', fmt(fa.last, 1), '%', chip(p.now.fatCat), fa.n > 1 ? delta(fa.delta, 1, 'pts', fa.tone) : ''));
    if (mu) out.push(card('muscle', 'Masa muscular', fmt(mu.last, 1), 'kg', mu.n > 1 ? delta(mu.delta, 1, 'kg', mu.tone) : ''));
    if (wa) out.push(card('waist', 'Cintura', fmt(wa.last, 1), 'cm', chip(wa.cat), wa.n > 1 ? delta(wa.delta, 1, 'cm', wa.tone) : ''));
    if (wt) out.push(card('whtr', 'Cintura / estatura', fmt(wt.last, 2), '', chip(wt.cat), wt.n > 1 ? delta(wt.delta, 2, '', wt.tone) : ''));
    return `<div class="kpis">${out.join('')}</div><p class="pv-legend"><span class="delta good">▼▲ verde</span> cambio favorable · <span class="delta bad">▼▲ rojo</span> cambio contrario · <span class="delta neutral">gris</span> neutro ${I('colors', 'colores y flechas')}</p><p class="pv-legend">${esc(PF.Advisory.LABELS)}</p>`;
  }

  function composition(p, I) {
    const lf = p.now.lastFull; if (!lf) return '';
    const muscleF = field(p, 'muscle'), muscle = muscleF && muscleF.last <= lf.leanMass ? muscleF.last : null;
    const fat = lf.fatMass, lean = lf.leanMass, total = fat + lean, pct = v => (v / total * 100);
    const rest = muscle != null ? Math.max(0, lean - muscle) : lean;
    const seg = (cls, v, label) => v > 0 ? `<i class="seg ${cls}" style="width:${pct(v).toFixed(1)}%" title="${esc(label)}"></i>` : '';
    return `<div class="pv-card"><h3>Composición corporal <small>${fmtDate(lf.date)}</small> ${I('composition', 'composición corporal')}</h3>
      <div class="compbar" role="img" aria-label="Masa grasa ${fmt(fat, 1)} kg, masa magra ${fmt(lean, 1)} kg">${seg('fat', fat, 'Masa grasa')}${muscle != null ? seg('mus', muscle, 'Masa muscular esquelética') : ''}${seg('lean', rest, muscle != null ? 'Resto de masa magra' : 'Masa magra')}</div>
      <ul class="complegend"><li><i class="dot fat"></i>Masa grasa <b>${fmt(fat, 1)} kg</b> · ${pct(fat).toFixed(0)}% ${I('fatMass', 'masa grasa')}</li>${muscle != null ? `<li><i class="dot mus"></i>Masa muscular <b>${fmt(muscle, 1)} kg</b> · ${pct(muscle).toFixed(0)}% ${I('muscle', 'masa muscular')}</li>` : ''}<li><i class="dot lean"></i>${muscle != null ? 'Resto de masa magra' : 'Masa magra'} <b>${fmt(rest, 1)} kg</b> · ${pct(rest).toFixed(0)}% ${I('leanMass', 'masa magra')}</li></ul></div>`;
  }

  function goals(p, I) {
    if (!p.goals.length) return '';
    const text = g => {
      const j = g.proj, u = g.unit === '%' ? ' pts' : ' ' + g.unit;
      if (g.pct >= 100 || j.status === 'meta-alcanzada') return '🎉 ¡Meta alcanzada!';
      let t = `Faltan <b>${fmt(g.remaining, 1)}${u}</b>. `;
      if (j.status === 'ok') t += `Al ritmo actual (${j.perWeek > 0 ? '+' : ''}${fmt(j.perWeek, 2)}${u}/semana) se alcanzaría en ~<b>${j.weeks} ${j.weeks === 1 ? 'semana' : 'semanas'}</b> (≈ ${fmtDate(j.date)}).`;
      else if (j.status === 'sin-tendencia') t += 'La tendencia reciente todavía no va hacia la meta: conviene revisar el plan.';
      else if (j.status === 'largo-plazo') t += 'Al ritmo actual la meta quedaría a más de 3 años: conviene ajustar el plan.';
      else t += 'Se necesitan al menos 3 evaluaciones en 2 semanas para proyectar la fecha.';
      if (g.daysLeft > 0 && g.neededPerWeek != null) t += ` Para la fecha objetivo (${fmtDate(p.client.goalDate)}) haría falta ${g.neededPerWeek > 0 ? '+' : ''}${fmt(g.neededPerWeek, 2)}${u}/semana${g.onTrack === true ? ' · ✅ va a tiempo' : g.onTrack === false ? ' · ⚠ va con retraso' : ''}.`;
      return t;
    };
    return `<div class="pv-card"><h3>Metas ${I('goals', 'metas y proyección')}</h3><div class="goals">${PF.Views.Advisory.line(PF.Advisory.GOALS)}${p.goals.map(g => `<div class="goal"><div class="goal-top"><b>${esc(g.label)}: ${fmt(g.target, 1)} ${esc(g.unit)}</b><span>${g.pct}%</span></div><div class="progressbar" role="progressbar" aria-valuenow="${g.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${g.pct}%"></i></div><p class="goal-text">Inicio ${fmt(g.start, 1)} → Actual ${fmt(g.current, 1)} ${esc(g.unit)}. ${text(g)}</p></div>`).join('')}</div></div>`;
  }

  function charts(p, light, report, I) {
    const mk = f => `<div class="chartcard"><div class="chart-title"><b>${esc(f.def.label)} ${I(f.def.key, f.def.label)}</b>${f.n > 1 ? delta(f.delta, f.def.dec, f.def.unit === '%' ? 'pts' : f.def.unit, f.tone) : ''}</div>${PF.Views.Charts.line({ points: f.series, unit: f.def.unit, dec: f.def.dec, color: COLORS[f.def.key] || '#2ea8ff', light, title: f.def.label })}</div>`;
    const main = KEY_CHARTS.map(k => field(p, k)).filter(Boolean), more = p.fields.filter(f => !KEY_CHARTS.includes(f.def.key) && f.n > 1);
    if (!main.length && !more.length) return '';
    return `<div class="pv-card"><h3>Tendencias</h3><div class="charts">${main.map(mk).join('')}</div>${more.length && !report ? `<details class="pv-more"${light ? ' open' : ''}><summary>Ver más gráficos (${more.length})</summary><div class="charts">${more.map(mk).join('')}</div></details>` : ''}</div>`;
  }

  function compare(p, I) {
    if (!p.fields.length) return '';
    const two = p.count > 1, rows = [];
    const row = (key, label, first, last, d, dec, unit, tn, cat) => rows.push(`<tr><td>${esc(label)} ${I(key, label)}</td><td>${two ? fmt(first, dec) : '—'}</td><td><b>${fmt(last, dec)}</b> ${esc(unit)} ${chip(cat)}</td><td>${two ? delta(d, dec, unit === '%' ? 'pts' : unit, tn) : '—'}</td></tr>`);
    p.fields.forEach(f => row(f.def.key, f.def.label, f.first, f.last, f.delta, f.def.dec, f.def.unit, f.tone, f.cat));
    p.derived.forEach(d => row(d.key, d.label, d.first, d.last, d.delta, d.dec, d.unit, d.tone, d.cat));
    return `<div class="pv-card"><h3>${two ? 'Primera vs. última evaluación' : 'Datos de la evaluación'} <small>${two ? fmtDate(p.first.date) + ' → ' + fmtDate(p.last.date) : fmtDate(p.last.date)}</small></h3><div class="tablewrap"><table class="cmp"><thead><tr><th>Indicador</th><th>Inicio</th><th>Actual</th><th>Cambio</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`;
  }

  // Guía: qué significa cada indicador (en pantalla) / cómo leer el informe (impreso)
  function guide(p, o) {
    const g = PF.Learn.glossary(p); if (!g.length) return '';
    if (o.report) return `<div class="pv-card"><h3>Cómo leer este informe</h3><dl class="rp-gloss">${g.map(x => `<div><dt>${esc(x.title)}</dt><dd>${esc(x.line)}${x.formula ? ` <code>${esc(x.formula)}</code>` : ''}</dd></div>`).join('')}</dl></div>`;
    return `<details class="pv-card pv-guide"><summary>📘 Guía: qué significa cada indicador (${g.length})</summary><p class="pv-note">Tocá «Ver detalle» para saber cómo se calcula, qué rangos existen y por qué cada resultado cae en su categoría.</p><ul class="guide">${g.map(x => `<li><div><b>${esc(x.title)}</b><span>${esc(x.line)}</span></div><button type="button" class="btn small" data-action="learn:open" data-key="${esc(x.key)}" data-id="${esc(p.client.id)}">Ver detalle</button></li>`).join('')}</ul></details>`;
  }

  function history(p, open) {
    if (!p.count) return '';
    const cols = M.FIELDS.filter(f => p.series[f.key].length);
    const rows = p.asc.slice().reverse().map(m => `<tr><td>${fmtDate(m.date)}</td><td>${esc(m.method || '—')}</td>${cols.map(f => `<td>${fmt(m[f.key], f.dec)}</td>`).join('')}</tr>`).join('');
    return `<details class="pv-card pv-history"${open ? ' open' : ''}><summary>Historial completo (${p.count} ${p.count === 1 ? 'evaluación' : 'evaluaciones'})</summary><div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Método</th>${cols.map(f => `<th title="${esc(f.label)}">${esc(f.short)}<small> ${esc(f.unit)}</small></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }

  function render(p, o = {}) {
    if (!p) return '<div class="empty">Sin datos.</div>';
    const I = info(p, o);
    const adv = PF.Views.Advisory.box(o.self);
    if (!p.count) return `<div class="pv ${o.light ? 'pv-light' : ''}">${p.now.bmi != null ? adv : ''}<div class="empty">Todavía no hay evaluaciones registradas. Registrá la primera para ver indicadores, gráficos y metas.</div>${p.now.bmi != null ? `<div class="kpis"><div class="kpi"><div class="kpi-top"><small>IMC (con el peso inicial)</small>${I('bmi', 'IMC')}</div><strong>${fmt(p.now.bmi, 1)}</strong><div class="kpi-sub">${chip(p.now.bmiCat)}</div></div></div>` : ''}</div>`;
    const hl = p.highlights.length ? `<div class="pv-card"><h3>Resumen automático ${I('summary', 'resumen automático')}</h3><ul class="pv-hl">${p.highlights.map(h => `<li class="${esc(h.tone)}">${esc(h.text)}</li>`).join('')}</ul></div>` : '';
    return `<div class="pv ${o.light ? 'pv-light' : ''}">${adv}${kpis(p, I)}${hl}${goals(p, I)}${composition(p, I)}${charts(p, o.light, o.report, I)}${compare(p, I)}${guide(p, o)}${o.noHistory ? '' : history(p, o.report)}<p class="pv-note">${esc(PF.Advisory.short(o.self))}</p></div>`;
  }
  return { render };
})();
