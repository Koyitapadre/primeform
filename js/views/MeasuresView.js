/* VISTA · Progreso físico: panel del cliente + tabla de evaluaciones
   renderFilter(clients) · selectedClient() · renderPanel(html) · render(measures) */
PF.Views.Measures = (function () {
  const { esc, fmtDate } = PF.Utils, fmt = PF.Metrics.fmt;
  const $ = id => document.getElementById(id);

  function renderFilter(clients) { PF.Views.FormFields.fillClientFilter('measureClientFilter', clients); }
  function selectedClient() { return ($('measureClientFilter') && $('measureClientFilter').value) || ''; }
  function renderPanel(html) { const el = $('progressPanel'); if (el) el.innerHTML = html; }

  const COLS = [['weight', 'Peso', 'kg', 1], ['fat', '% grasa', '%', 1], ['muscle', 'M. muscular', 'kg', 1], ['water', 'Agua', '%', 1], ['visceral', 'G. visc.', '', 0], ['waist', 'Cintura', 'cm', 1], ['hip', 'Cadera', 'cm', 1], ['chest', 'Pecho', 'cm', 1], ['arm', 'Brazo', 'cm', 1], ['thigh', 'Muslo', 'cm', 1]];
  const row = m => `<tr><td>${fmtDate(m.date)}</td><td>${esc(m.clientName)}</td>${COLS.map(([k, , , d]) => `<td>${fmt(m[k], d)}</td>`).join('')}<td>${esc(m.method || '—')}</td><td>${esc(m.notes || '—')}</td><td><button class="btn small" data-action="measure:delete" data-id="${esc(m.id)}" aria-label="Eliminar evaluación">×</button></td></tr>`;

  function render(measures) {
    const el = $('measuresList');
    if (!el) return;
    el.innerHTML = measures.length
      ? `<div class="card tablewrap"><table><thead><tr><th>Fecha</th><th>Cliente</th>${COLS.map(([, l, u]) => `<th>${esc(l)}${u ? `<small> ${esc(u)}</small>` : ''}</th>`).join('')}<th>Método</th><th>Notas</th><th></th></tr></thead><tbody>${measures.map(row).join('')}</tbody></table></div>`
      : '<div class="empty">No hay evaluaciones registradas. Registrá peso, composición corporal y contornos periódicamente, siempre con el mismo método y en condiciones parecidas.</div>';
  }
  return { renderFilter, selectedClient, renderPanel, render };
})();
