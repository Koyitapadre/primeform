/* ============================================================
   VISTA · Layout (navegación lateral, migas de pan, menú móvil)
   ============================================================ */
PF.Views.Layout = (function () {
  const LABELS = {
    dashboard: 'Resumen', clients: 'Clientes', workouts: 'Entrenamientos',
    progress: 'Progreso físico', nutrition: 'Nutrición', checkins: 'Revisiones', library: 'Biblioteca de ejercicios', portal: 'Vista de cliente', settings: 'Datos y ajustes'
  };
  const $ = id => document.getElementById(id);

  function showPage(page) {
    if (!$('page-' + page)) return;
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    $('page-' + page).classList.add('active');
    document.querySelectorAll('.nav button, .tabbar button[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $('crumb').textContent = LABELS[page];
    closeMenu();
  }

  function toggleMenu() { $('sidebar').classList.toggle('open'); }
  function closeMenu() { $('sidebar').classList.remove('open'); }

  return { showPage, toggleMenu, closeMenu };
})();
