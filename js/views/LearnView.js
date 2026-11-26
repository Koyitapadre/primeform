/* VISTA · Explicación de un indicador (ventana) y botón "i" */
PF.Views.Learn = (function () {
  const { esc } = PF.Utils;
  const chip = c => c ? `<span class="chip ${esc(c.tone)}">${esc(c.t)}</span>` : '';
  const sec = (h, html) => html ? `<section class="learn-sec"><h4>${h}</h4>${html}</section>` : '';

  function body(i) {
    const formula = i.formula ? `<div class="learn-formula"><code>${esc(i.formula.text)}</code>${i.formula.example ? `<div class="learn-example"><small>Con los datos actuales</small><b>${esc(i.formula.example)}</b></div>` : ''}</div>` : '';
    const result = i.result ? `<div class="learn-result"><strong>${esc(i.result.value)}</strong>${chip(i.result.cat)}</div>` : '';
    const ranges = i.ranges ? `<table class="learn-ranges"><tbody>${i.ranges.map(r => `<tr class="${r.current ? 'cur' : ''}"><td><span class="chip ${esc(r.tone)}">${esc(r.label)}</span></td><td>${esc(r.range)}</td><td class="here">${r.current ? '◀ resultado actual' : ''}</td></tr>`).join('')}</tbody></table>${i.rangeNote ? `<p class="learn-note">${esc(i.rangeNote)}</p>` : ''}` : '';
    return `<div class="learn-adv" role="note"><span class="adv-dot" aria-hidden="true">i</span><span>${esc(i.caution)}</span></div>`
      + sec('¿Qué es?', `<p>${esc(i.what)}</p>`)
      + sec('¿Cómo se mide o se calcula?', (i.how ? `<p>${esc(i.how)}</p>` : '') + formula)
      + sec('Resultado actual y por qué', result + (i.why ? `<p>${esc(i.why)}</p>` : ''))
      + sec('Rangos de referencia', ranges)
      + sec('Qué se puede hacer', i.tips.length ? `<ul>${i.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '')
      + sec('Tené en cuenta', i.limits ? `<p>${esc(i.limits)}</p>` : '');
  }
  function open(info) {
    PF.Views.Modal.open({ title: info.title, saveLabel: 'Entendido', body: `<div class="learn">${body(info)}</div>`, onSave: () => PF.Views.Modal.close() });
  }
  const btn = (key, clientId, label) => `<button type="button" class="infobtn" data-action="learn:open" data-key="${esc(key)}" data-id="${esc(clientId)}" aria-label="Qué es y cómo se calcula: ${esc(label)}" title="¿Qué es y cómo se calcula?">i</button>`;
  return { open, btn, body };
})();
