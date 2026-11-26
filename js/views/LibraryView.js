/* VISTA · Biblioteca de ejercicios. render(list) · filters() · renderGroups() */
PF.Views.Library = (function () {
  const { esc } = PF.Utils, $ = id => document.getElementById(id);

  function renderGroups() {
    const el = $('libGroup');
    if (!el || el.options.length > 1) return;
    el.innerHTML = '<option value="">Todos los grupos</option>' + PF.ExerciseLibrary.GROUPS.map(g => `<option>${g}</option>`).join('');
  }
  function filters() { return { query: ($('libSearch') || {}).value || '', group: ($('libGroup') || {}).value || '' }; }

  function muscleLine(tpl) {
    const m = PF.Views.ExerciseArt.muscles(tpl);
    if (!m.main.length) return '';
    return `<div class="muscles">Trabaja: <b>${m.main.join(', ')}</b>${m.sec.length ? ' · ' + m.sec.join(', ') : ''}</div>`;
  }

  function card(e) {
    return `<div class="client-card lib-card">${PF.Views.ExerciseArt.render(e)}<h3 style="margin-top:12px">${esc(e.name)}</h3><div style="margin:8px 0"><span class="tag green">${esc(e.group)}</span> <span class="tag">${esc(e.equip)}</span>${e.builtin ? '' : ' <span class="tag orange">Propio</span>'}</div>${muscleLine(e.tpl)}<p>${esc(e.desc)}</p><div class="client-actions">${PF.Views.ExerciseGuide.btn(e.name, 'Guía completa')}<button class="btn small" data-action="library:use" data-id="${e.id}">＋ Añadir a rutina</button>${e.builtin ? '' : `<button class="btn small" data-action="library:delete" data-id="${e.id}">Eliminar</button>`}</div></div>`;
  }
  function render(list) {
    renderGroups();
    $('libCount').textContent = list.length + ' ejercicios';
    $('libList').innerHTML = list.length ? list.map(card).join('') : '<div class="empty" style="grid-column:1/-1">No hay ejercicios que coincidan.</div>';
  }
  return { render, filters };
})();
