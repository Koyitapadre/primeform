/* ============================================================
   VISTA · Entrenamientos
   renderFilter(clients) · selectedClient() · render(workouts)
   ============================================================ */
PF.Views.Workouts = (function () {
  const { esc, fmtDate } = PF.Utils;
  const $ = id => document.getElementById(id);

  function renderFilter(clients) { PF.Views.FormFields.fillClientFilter('workoutClientFilter', clients); }
  function selectedClient() { return ($('workoutClientFilter') && $('workoutClientFilter').value) || ''; }

  function item(w) {
    return `<div class="card" style="margin-bottom:12px"><div class="cardhead"><div><h2>${esc(w.name)}</h2><div class="muted" style="font-size:12px;margin-top:5px">${esc(w.clientName)} · ${esc(w.day)} · Inicio ${fmtDate(w.start)}</div></div><button class="btn small" data-action="workout:delete" data-id="${esc(w.id)}">Eliminar rutina</button></div><div class="tablewrap"><table><thead><tr><th>Ejercicio</th><th>Series</th><th>Repeticiones</th><th>RIR</th><th>Descanso</th><th></th></tr></thead><tbody>${w.exercises.map((e, i) => `<tr><td>${esc(e.name)} <button type="button" class="linkbtn" data-action="exercise:guide" data-name="${esc(e.name)}">guía</button></td><td>${e.sets}</td><td>${esc(e.reps)}</td><td>${e.rir}</td><td>${e.rest || 120} s</td><td><button type="button" class="linkbtn danger" data-action="workout:removeEx" data-id="${esc(w.id)}" data-index="${i}" aria-label="Quitar ${esc(e.name)} de la rutina" title="Quitar de la rutina">quitar</button></td></tr>`).join('')}</tbody></table></div>${w.notes ? `<p class="note">${esc(w.notes)}</p>` : ''}</div>`;
  }

  function render(workouts, clientId = '') {
    const el = $('workoutsList');
    if (!el) return;
    const bulk = clientId && workouts.length ? `<div class="toolbar"><button class="btn danger" data-action="workout:deleteAll" data-id="${esc(clientId)}">🗑 Eliminar todas las rutinas de este cliente (${workouts.length})</button></div>` : '';
    el.innerHTML = workouts.length
      ? bulk + workouts.map(item).join('')
      : '<div class="empty">Todavía no hay rutinas. Creá la primera y asignala a un cliente.</div>';
  }

  return { renderFilter, selectedClient, render };
})();
