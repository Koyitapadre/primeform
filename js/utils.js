/* ============================================================
   PRIMEFORM · Utilidades compartidas
   Funciones puras: sin acceso al DOM ni al estado de la app.
   ============================================================ */
window.PF = window.PF || { Views: {}, Controllers: {} };

PF.Utils = (function () {
  function uid() { const a = new Uint8Array(8); crypto.getRandomValues(a); return Array.from(a, b => (b % 36).toString(36)).join(''); }

  function esc(s = '') {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function initials(name) {
    return (name || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  }

  function fmtDate(d) {
    if (!d) return '—';
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return d; }
  }

  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());   // fecha LOCAL (no UTC)
  function today() { return iso(new Date()); }
  function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function shift(isoDate, o = {}) { const [y, m, d] = isoDate.split('-').map(Number), x = new Date(y + (o.years || 0), m - 1, d + (o.days || 0)); return iso(x); }

  function toNumber(v) { return v === '' || v == null ? null : Number(v); }

  return { uid, esc, initials, fmtDate, today, daysAgo, shift, toNumber };
})();
