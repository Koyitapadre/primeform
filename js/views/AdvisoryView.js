/* VISTA · Aviso «es una recomendación, no un veredicto» (texto fijo de la app, siempre escapado) */
PF.Views.Advisory = (function () {
  const { esc } = PF.Utils, A = PF.Advisory;
  // Cuadro completo (arriba de los paneles de progreso, del informe y del enlace del cliente)
  const box = self => `<aside class="advisory" role="note" aria-label="Aviso importante"><div class="adv-ico" aria-hidden="true">i</div><div class="adv-body"><strong>${esc(A.TITLE)}</strong><ul>${A.points(!!self).map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></aside>`;
  // Línea breve (formularios, tarjetas, metas)
  const line = text => `<p class="adv-line" role="note"><span class="adv-dot" aria-hidden="true">i</span><span>${esc(text)}</span></p>`;
  return { box, line };
})();
