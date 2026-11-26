/* ============================================================
   VISTA · Clientes
   render(clients) · filters() → { query, goal }
   ============================================================ */
PF.Views.Clients = (function () {
  const { esc, initials, fmtDate } = PF.Utils;
  const $ = id => document.getElementById(id);

  function filters() {
    return {
      query: ($('clientSearch') && $('clientSearch').value) || '',
      goal: ($('goalFilter') && $('goalFilter').value) || '',
      status: ($('statusFilter') && $('statusFilter').value) || ''
    };
  }

  function card(c) {
    return `<div class="client-card"><div class="row"><div class="client-avatar">${esc(initials(c.name))}</div><div><h3>${esc(c.name)}</h3><p>${esc(c.email || 'Sin correo registrado')}</p></div></div><div style="margin-top:12px">${c.status && c.status !== 'Activo' ? `<span class="tag warn">${esc(c.status)}</span> ` : ''}<span class="tag green">${esc(c.goal)}</span> <span class="tag">${esc(c.experience)}</span></div><div class="meta"><div class="mini"><small>Peso actual</small><strong>${c.weight ?? '—'}${c.weight ? ' kg' : ''}</strong></div><div class="mini"><small>Altura</small><strong>${c.height ?? '—'}${c.height ? ' cm' : ''}</strong></div></div><p>${c.age ? esc(c.age) + ' años · ' : ''}Inicio: ${fmtDate(c.start)}</p><div class="client-actions"><button class="btn small" data-action="measure:new" data-client-id="${c.id}">＋ Evaluación</button><button class="btn small" data-action="workout:new" data-client-id="${c.id}">＋ Rutina</button><button class="btn small" data-action="client:profile" data-id="${c.id}">Ver perfil</button><button class="btn small" data-action="client:edit" data-id="${c.id}">Editar</button><button class="btn small" data-action="client:delete" data-id="${c.id}">Eliminar</button></div><div class="client-actions" style="margin-top:6px"><button class="btn small" data-action="share:open" data-id="${c.id}" title="Enlace cifrado para que el cliente vea su plan">🔗 Compartir con el cliente</button><button class="btn small" data-action="client:export" data-id="${c.id}" title="Descargar todos los datos de este cliente (derecho de acceso)">⬇ Descargar sus datos</button></div></div>`;
  }

  function render(clients) {
    const el = $('clientsGrid');
    if (!el) return;
    el.innerHTML = clients.length
      ? clients.map(card).join('')
      : '<div class="empty" style="grid-column:1/-1">No hay clientes que coincidan. Añadí un cliente para empezar.</div>';
  }

  function renderSlots(i) {
    const el = $('slotBar'); if (!el) return;
    if (!i.limit) { el.innerHTML = `<div class="slotpanel"><div><b>${i.active}</b> ${i.active === 1 ? 'cliente activo' : 'clientes activos'} · cupos ilimitados${i.waiting ? ` · ${i.waiting} en espera` : ''}</div></div>`; return; }
    const pct = Math.min(100, Math.round(i.active / i.limit * 100));
    el.innerHTML = `<div class="slotpanel ${i.full ? 'full' : ''}"><div><b>${i.active} de ${i.limit}</b> cupos ocupados · ${i.full ? '<strong>Cupos completos</strong>' : `${i.free} ${i.free === 1 ? 'libre' : 'libres'}`}${i.waiting ? ` · ${i.waiting} en espera` : ''}</div><div class="slotbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>`;
  }
  return { render, filters, renderSlots };
})();
