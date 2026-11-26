/* VISTA · Gráficos SVG propios (sin librerías ni red). Todo texto se escapa. */
PF.Views.Charts = (function () {
  const { esc } = PF.Utils;
  const shortDate = d => new Date(d + 'T12:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }).replace('.', '');

  // points: [{date, value}] ordenados por fecha
  function line({ points, unit = '', dec = 1, color = '#2ea8ff', light = false, title = '' }) {
    const pts = (points || []).filter(p => p.value != null);
    if (pts.length < 2) return `<div class="chart-empty">Registrá una segunda evaluación para ver la tendencia.</div>`;
    const W = 320, H = 136, L = 42, R = 16, T = 18, B = 28;
    const ink = light ? '#64748b' : '#8fa3c4', grid = light ? '#e2e8f0' : '#1f3258', bg = light ? '#ffffff' : '#0b162d';
    const vals = pts.map(p => p.value), min = Math.min(...vals), max = Math.max(...vals), pad = (max - min) || Math.max(1, Math.abs(max) * 0.05), lo = min - pad * 0.18, hi = max + pad * 0.18;
    const t0 = Date.parse(pts[0].date), t1 = Date.parse(pts[pts.length - 1].date), span = (t1 - t0) || 1;
    const X = p => L + (Date.parse(p.date) - t0) / span * (W - L - R), Y = v => H - B - (v - lo) / (hi - lo) * (H - B - T);
    const f = v => Number(v).toFixed(dec);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ' ' + Y(p.value).toFixed(1)).join(' ');
    const area = path + ` L${X(pts[pts.length - 1]).toFixed(1)} ${H - B} L${X(pts[0]).toFixed(1)} ${H - B} Z`;
    const ticks = [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1];
    const gid = 'cg' + Math.random().toString(36).slice(2, 8), last = pts[pts.length - 1];
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}: de ${f(pts[0].value)} a ${f(last.value)} ${esc(unit)}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map(v => `<line x1="${L}" y1="${Y(v).toFixed(1)}" x2="${W - R}" y2="${Y(v).toFixed(1)}" stroke="${grid}" stroke-dasharray="3 4"/><text x="${L - 6}" y="${(Y(v) + 3).toFixed(1)}" font-size="9" fill="${ink}" text-anchor="end">${f(v)}</text>`).join('')}
      <path d="${area}" fill="url(#${gid})"/><path d="${path}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((p, i) => `<circle cx="${X(p).toFixed(1)}" cy="${Y(p.value).toFixed(1)}" r="${i === pts.length - 1 ? 4.2 : 2.6}" fill="${i === pts.length - 1 ? color : bg}" stroke="${color}" stroke-width="1.8"/>`).join('')}
      <text x="${Math.min(W - R - 2, X(last)).toFixed(1)}" y="${(Y(last.value) - 8).toFixed(1)}" font-size="10" font-weight="700" fill="${light ? '#0f172a' : '#f5f8ff'}" text-anchor="end">${f(last.value)} ${esc(unit)}</text>
      <text x="${L}" y="${H - 9}" font-size="9" fill="${ink}">${shortDate(pts[0].date)}</text><text x="${W - R}" y="${H - 9}" font-size="9" fill="${ink}" text-anchor="end">${shortDate(last.date)}</text></svg>`;
  }
  return { line };
})();
