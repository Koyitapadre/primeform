/* VISTA · Aviso de privacidad y términos de uso (lectura) + tarjeta de ajustes */
PF.Views.Legal = (function () {
  const { esc } = PF.Utils;
  const TITLES = { privacy: 'Aviso de privacidad', terms: 'Términos de uso' };
  function html(kind) {
    return `<div class="legal">${PF.Legal.sections(kind).map(s => `<section>${s.h ? `<h4>${esc(s.h)}</h4>` : ''}${s.p.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}</div>`;
  }
  function open(kind) {
    if (!TITLES[kind]) return;
    PF.Views.Modal.open({ title: TITLES[kind], saveLabel: 'Cerrar', body: html(kind), onSave: () => PF.Views.Modal.close() });
  }
  function renderCard(o, ok) {
    const el = document.getElementById('legalCard'); if (!el) return;
    const std = k => PF.Legal.usesCustom(k) ? 'texto propio' : 'texto estándar de PRIMEFORM';
    el.innerHTML = `<h2 style="margin-top:0">Responsable y textos legales</h2>
      <p class="muted">Estos datos aparecen en el aviso de privacidad, en los términos, en el informe en PDF y en los enlaces para clientes.</p>
      ${ok ? `<div class="legal-sum"><div><small>Responsable</small><b>${esc(o.name)}</b></div><div><small>Correo</small><b>${esc(o.email)}</b></div><div><small>Cupos</small><b>${o.slotsMode === 'limited' && o.slots ? esc(o.slots) + ' (limitados)' : 'Ilimitados'}</b></div>${o.id ? `<div><small>Identificación</small><b>${esc(o.id)}</b></div>` : ''}${o.phone ? `<div><small>Teléfono</small><b>${esc(o.phone)}</b></div>` : ''}</div>` : '<div class="notice">Completá el nombre y el correo del responsable: sin ellos el aviso de privacidad queda incompleto y no se pueden generar enlaces para clientes.</div>'}
      <p class="muted" style="font-size:12.5px">Aviso de privacidad: ${std('privacy')} · Términos: ${std('terms')}. ${PF.Legal.usesCustom('privacy') && PF.Legal.usesCustom('terms') ? '' : 'Hacelos revisar por un abogado antes de abrir la app al público; podés pegar aquí el texto revisado y reemplaza al estándar.'}</p>
      <div class="toolbar" style="justify-content:flex-start"><button class="btn primary" data-action="legal:edit">${ok ? 'Editar datos y textos' : 'Completar datos del responsable'}</button><button class="btn" data-action="legal:open" data-doc="privacy">Ver aviso de privacidad</button><button class="btn" data-action="legal:open" data-doc="terms">Ver términos de uso</button></div>`;
  }
  return { html, open, renderCard };
})();
