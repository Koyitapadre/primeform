/* VISTA · Informe de progreso imprimible (se guarda como PDF desde el diálogo de impresión) */
PF.Views.Report = (function () {
  const $ = id => document.getElementById(id);
  function open(html) {
    $('report').innerHTML = `<div class="report-toolbar"><button class="btn primary" data-action="report:print">🖨 Imprimir / Guardar PDF</button><button class="btn" data-action="report:close">Cerrar</button></div><article class="report-page">${html}</article>`;
    $('report').hidden = false; document.body.classList.add('reporting'); $('report').scrollTop = 0;
  }
  function close() { $('report').hidden = true; $('report').innerHTML = ''; document.body.classList.remove('reporting'); }
  const isOpen = () => !$('report').hidden;
  return { open, close, isOpen };
})();
