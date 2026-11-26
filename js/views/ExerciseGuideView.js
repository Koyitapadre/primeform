/* VISTA · Guía completa de un ejercicio (ventana) y botón para abrirla */
PF.Views.ExerciseGuide = (function () {
  const { esc } = PF.Utils;
  const sec = (h, html) => html ? `<section class="learn-sec"><h4>${h}</h4>${html}</section>` : '';
  const ul = a => a && a.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';

  function body(e) {
    const g = e.builtin ? PF.ExerciseGuides.get(e.tpl) : null, m = PF.Views.ExerciseArt.muscles(e.tpl);
    const muscles = m.main.length ? `<div class="muscles">Trabaja: <b>${m.main.map(esc).join(', ')}</b>${m.sec.length ? ' · ' + m.sec.map(esc).join(', ') : ''}</div>` : '';
    const head = `<div class="guide-art">${PF.Views.ExerciseArt.render(e)}</div><div class="guide-tags"><span class="tag green">${esc(e.group)}</span> <span class="tag">${esc(e.equip)}</span></div>${muscles}<p class="guide-sum">${esc(e.desc)}</p>`;
    if (!g) return `<div class="learn">${head}<p class="learn-note">Es un ejercicio propio: la guía detallada paso a paso está disponible para los ejercicios de la biblioteca.</p></div>`;
    return `<div class="learn">${head}`
      + sec('Posición inicial', `<p>${esc(g.pos)}</p>`)
      + sec('Paso a paso', `<ol class="guide-steps">${g.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`)
      + sec('Respiración', `<p>${esc(g.breath)}</p>`)
      + sec('Errores comunes', ul(g.mistakes))
      + sec('Claves para hacerlo bien', ul(g.cues))
      + sec('Seguridad', `<p class="guide-safe">${esc(g.safety)}</p>`)
      + `<div class="guide-levels"><div><h4>Más fácil</h4><p>${esc(g.easier)}</p></div><div><h4>Más difícil</h4><p>${esc(g.harder)}</p></div></div>`
      + `<p class="learn-caution">Guía educativa y orientativa. Ajustá la carga a tu nivel y consultá con tu entrenador ante cualquier duda o molestia.</p></div>`;
  }
  function open(e) { PF.Views.Modal.open({ title: e.name, saveLabel: 'Entendido', body: body(e), onSave: () => PF.Views.Modal.close() }); }
  const btn = (name, label = 'Ver guía completa') => `<button type="button" class="btn small" data-action="exercise:guide" data-name="${esc(name)}">📖 ${esc(label)}</button>`;
  return { open, body, btn };
})();
