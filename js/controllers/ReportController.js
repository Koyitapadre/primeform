/* CONTROLADOR · Informe de progreso imprimible (se guarda como PDF desde el diálogo de impresión) */
PF.Controllers.Report = (function () {
  const V = PF.Views, S = PF.Selectors, Store = PF.Store, { esc, fmtDate, today } = PF.Utils;

  function open(id) {
    const p = S.progressFor(id); if (!p) return;
    const org = PF.Legal.org(), orgLine = org.name ? `<br>Responsable: ${esc(org.name)}${org.email ? ' · ' + esc(org.email) : ''}${org.phone ? ' · ' + esc(org.phone) : ''}` : '';
    const c = p.client, workouts = Store.list('workouts').filter(w => w.clientId === id), nut = Store.list('nutrition').find(n => n.clientId === id);
    const info = [['Edad', c.age ? c.age + ' años' : '—'], ['Altura', c.height ? c.height + ' cm' : '—'], ['Objetivo', c.goal], ['Nivel', c.experience], ['Inicio', fmtDate(c.start)], ['Sexo', c.sex || '—']];
    const html = `<header class="rp-head"><img src="assets/logo-mark.webp" width="54" height="54" alt=""><div><div class="rp-brand"><b>PRIME</b>FORM</div><div class="rp-sub">Informe de progreso físico</div></div><div class="rp-date">Fecha del informe<br><b>${fmtDate(today())}</b></div></header>
      <section class="rp-client"><h1>${esc(c.name)}</h1><div class="rp-grid">${info.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div></section>
      ${V.Progress.render(p, { light: true, report: true, noHistory: true, self: true })}
      <section class="rp-plan"><h3>Plan actual</h3>${workouts.length ? `<p><b>Rutinas:</b> ${workouts.map(w => esc(w.name)).join(' · ')}</p>` : '<p>Sin rutinas asignadas.</p>'}${nut ? `<p><b>Nutrición (recomendación orientativa, consultala con tu nutricionista):</b> ${nut.cal ?? '—'} kcal · proteína ${nut.protein ?? '—'} g · carbohidratos ${nut.carbs ?? '—'} g · grasas ${nut.fat ?? '—'} g</p>` : ''}</section>
      <footer class="rp-foot">Informe generado con PRIMEFORM · Personalized Workout Tracking. ${esc(PF.Advisory.FOOTER)} Documento confidencial: contiene datos de salud.${orgLine}</footer>`;
    V.Report.open(html);
  }
  function init() {
    PF.Events.on('report:open', d => open(d.id));
    PF.Events.on('report:print', () => window.print());
    PF.Events.on('report:close', () => V.Report.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && V.Report.isOpen() && !V.Modal.isOpen()) V.Report.close(); });
  }
  return { init, render() { } };
})();
