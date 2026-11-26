/* ============================================================
   VISTA · Nutrición
   render(items)
   ============================================================ */
PF.Views.Nutrition = (function () {
  const { esc, fmtDate } = PF.Utils;

  function card(n) {
    return `<div class="client-card"><div class="row"><div class="client-avatar">◉</div><div><h3>${esc(n.clientName)}</h3><p>Actualizado ${fmtDate(n.date)}</p></div></div><div class="meta"><div class="mini"><small>Energía</small><strong>${n.cal ?? '—'} kcal</strong></div><div class="mini"><small>Proteína</small><strong>${n.protein ?? '—'} g</strong></div><div class="mini"><small>Carbohidratos</small><strong>${n.carbs ?? '—'} g</strong></div><div class="mini"><small>Grasas</small><strong>${n.fat ?? '—'} g</strong></div></div><p>Adherencia: <span class="tag">${esc(n.adherence)}</span></p><p>${esc(n.notes || 'Sin notas adicionales.')}</p><button class="btn small" data-action="nutrition:delete" data-id="${n.id}">Eliminar objetivo</button></div>`;
  }

  function render(items) {
    const el = document.getElementById('nutritionList');
    if (!el) return;
    el.innerHTML = items.length
      ? `<div style="grid-column:1/-1">${PF.Views.Advisory.line(PF.Advisory.nutrition(false))}</div>` + items.map(card).join('')
      : '<div class="empty" style="grid-column:1/-1">Todavía no hay objetivos nutricionales.</div>';
  }

  return { render };
})();
