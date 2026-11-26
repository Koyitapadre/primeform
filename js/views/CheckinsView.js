/* ============================================================
   VISTA · Revisiones (check-ins)
   render(items)
   ============================================================ */
PF.Views.Checkins = (function () {
  const { esc, fmtDate } = PF.Utils;

  function row(k) {
    return `<tr><td>${fmtDate(k.date)}</td><td>${esc(k.clientName)}</td><td><span class="tag ${k.adherence === 'Alta' ? 'green' : ''}">${esc(k.adherence)}</span></td><td>${esc(k.energy)}</td><td>${esc(k.sleep)}</td><td>${esc(k.fatigue)}</td><td>${esc(k.notes || '—')}</td><td><button class="btn small" data-action="checkin:delete" data-id="${k.id}">×</button></td></tr>`;
  }

  function render(items) {
    const el = document.getElementById('checkinsList');
    if (!el) return;
    el.innerHTML = items.length
      ? `<div class="card tablewrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Adherencia</th><th>Energía</th><th>Sueño</th><th>Fatiga</th><th>Notas</th><th></th></tr></thead><tbody>${items.map(row).join('')}</tbody></table></div>`
      : '<div class="empty">No hay revisiones registradas. Programá un check-in para revisar adherencia, sueño, energía y fatiga.</div>';
  }

  return { render };
})();
