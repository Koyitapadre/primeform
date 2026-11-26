/* ============================================================
   PRIMEFORM · Service worker
   Permite abrir la app al instante y sin conexión (solo el «cascarón»: código, estilos e imágenes).
   NUNCA intercepta ni guarda llamadas a Supabase ni datos de clientes.
   ============================================================ */
const VERSION = 'pf-v1';
const CACHE = 'pf-shell-' + VERSION;
const PRECACHE = [
  './',
  'index.html',
  '404.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/utils.js',
  'js/events.js',
  'js/config.js',
  'js/pwa.js',
  'js/models/Storage.js',
  'js/models/Validate.js',
  'js/models/Vault.js',
  'js/models/SyncMerge.js',
  'js/models/SupabaseClient.js',
  'js/models/Store.js',
  'js/models/Schema.js',
  'js/models/Metrics.js',
  'js/models/Advisory.js',
  'js/models/Learn.js',
  'js/models/Legal.js',
  'js/models/Share.js',
  'js/models/Sync.js',
  'js/models/Entities.js',
  'js/models/Selectors.js',
  'js/models/DemoData.js',
  'js/models/ExerciseGuides.js',
  'js/models/ExerciseLibrary.js',
  'js/views/Layout.js',
  'js/views/Toast.js',
  'js/views/Confirm.js',
  'js/views/Modal.js',
  'js/views/FormFields.js',
  'js/views/ExerciseArt.js',
  'js/views/Charts.js',
  'js/views/AdvisoryView.js',
  'js/views/ProgressView.js',
  'js/views/ReportView.js',
  'js/views/LearnView.js',
  'js/views/LegalView.js',
  'js/views/ShareView.js',
  'js/views/InstallView.js',
  'js/views/SyncView.js',
  'js/views/ExerciseGuideView.js',
  'js/views/Forms.js',
  'js/views/DashboardView.js',
  'js/views/ClientsView.js',
  'js/views/WorkoutsView.js',
  'js/views/MeasuresView.js',
  'js/views/NutritionView.js',
  'js/views/CheckinsView.js',
  'js/views/SettingsView.js',
  'js/views/Gate.js',
  'js/views/LibraryView.js',
  'js/views/PortalView.js',
  'js/controllers/AppController.js',
  'js/controllers/DashboardController.js',
  'js/controllers/ClientsController.js',
  'js/controllers/WorkoutsController.js',
  'js/controllers/MeasuresController.js',
  'js/controllers/NutritionController.js',
  'js/controllers/CheckinsController.js',
  'js/controllers/LibraryController.js',
  'js/controllers/PortalController.js',
  'js/controllers/LearnController.js',
  'js/controllers/LegalController.js',
  'js/controllers/ShareController.js',
  'js/controllers/PwaController.js',
  'js/controllers/SyncController.js',
  'js/controllers/ReportController.js',
  'js/controllers/SettingsController.js',
  'js/controllers/SecurityController.js',
  'js/app.js'
];
const scope = self.registration.scope;
const abs = u => new URL(u, scope).href;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(PRECACHE.map(u => c.add(new Request(abs(u), { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('pf-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('/sw.js') || url.pathname.startsWith('/__test')) return;
  e.respondWith(req.mode === 'navigate' ? navigate(req) : asset(req));
});

async function navigate(req) {
  try { return await fetch(req); }
  catch (err) {
    const c = await caches.open(CACHE);
    return (await c.match(abs('index.html'))) || (await c.match(abs('./'))) || Response.error();
  }
}

async function asset(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  const net = fetch(req).then(r => { if (r.ok && r.type === 'basic') c.put(req, r.clone()); return r; }).catch(() => null);
  return hit || (await net) || Response.error();
}
