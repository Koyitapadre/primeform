/* ============================================================
   MODELO · Metrics
   Cálculos puros (sin DOM, sin red): indicadores corporales, tendencias,
   proyección hacia la meta, sugerencia nutricional y riesgo de abandono.
   Todos los resultados son ORIENTATIVOS y no reemplazan a un profesional.
   ============================================================ */
PF.Metrics = (function () {
  const U = PF.Utils;
  const round = (n, d = 1) => { const f = Math.pow(10, d); return Math.round(n * f) / f; };
  const dayDiff = (a, b) => Math.round((Date.UTC(...b.split('-').map((x, i) => i === 1 ? +x - 1 : +x)) - Date.UTC(...a.split('-').map((x, i) => i === 1 ? +x - 1 : +x))) / 864e5);
  const byDateAsc = (a, b) => a.date.localeCompare(b.date), byDateDesc = (a, b) => b.date.localeCompare(a.date);

  /* Campos de progreso físico: etiqueta, unidad, decimales y qué dirección es "mejor" */
  const FIELDS = [
    { key: 'weight', label: 'Peso', short: 'Peso', unit: 'kg', dec: 1, group: 'comp', better: 'goal' },
    { key: 'fat', label: '% de grasa corporal', short: '% grasa', unit: '%', dec: 1, group: 'comp', better: 'down' },
    { key: 'muscle', label: 'Masa muscular esquelética', short: 'M. muscular', unit: 'kg', dec: 1, group: 'comp', better: 'up' },
    { key: 'water', label: 'Agua corporal', short: 'Agua', unit: '%', dec: 1, group: 'comp', better: 'up' },
    { key: 'visceral', label: 'Grasa visceral', short: 'G. visceral', unit: 'nivel', dec: 0, group: 'comp', better: 'down' },
    { key: 'bone', label: 'Masa ósea', short: 'M. ósea', unit: 'kg', dec: 1, group: 'comp', better: 'none' },
    { key: 'bmr', label: 'Metabolismo basal', short: 'TMB', unit: 'kcal', dec: 0, group: 'comp', better: 'up' },
    { key: 'metAge', label: 'Edad metabólica', short: 'Ed. metab.', unit: 'años', dec: 0, group: 'comp', better: 'down' },
    { key: 'neck', label: 'Cuello', short: 'Cuello', unit: 'cm', dec: 1, group: 'cm', better: 'none' },
    { key: 'chest', label: 'Pecho', short: 'Pecho', unit: 'cm', dec: 1, group: 'cm', better: 'none' },
    { key: 'arm', label: 'Brazo', short: 'Brazo', unit: 'cm', dec: 1, group: 'cm', better: 'none' },
    { key: 'waist', label: 'Cintura', short: 'Cintura', unit: 'cm', dec: 1, group: 'cm', better: 'down' },
    { key: 'hip', label: 'Cadera', short: 'Cadera', unit: 'cm', dec: 1, group: 'cm', better: 'none' },
    { key: 'thigh', label: 'Muslo', short: 'Muslo', unit: 'cm', dec: 1, group: 'cm', better: 'none' },
    { key: 'calf', label: 'Pantorrilla', short: 'Pantorrilla', unit: 'cm', dec: 1, group: 'cm', better: 'none' },
    { key: 'rhr', label: 'Frecuencia cardíaca en reposo', short: 'FC reposo', unit: 'lpm', dec: 0, group: 'vit', better: 'down' }
  ];
  const fmt = (v, dec = 1) => v == null ? '—' : (dec ? Number(v).toFixed(dec) : String(Math.round(v)));

  /* ¿El cambio es favorable? (good / bad / neutral) */
  function tone(f, delta, client) {
    if (delta == null || Math.abs(delta) < 1e-9) return 'neutral';
    let better = f.better;
    if (better === 'goal') better = client && client.goal === 'Pérdida de grasa' ? 'down' : client && client.goal === 'Hipertrofia' ? 'up' : 'none';
    if (better === 'down') return delta < 0 ? 'good' : 'bad';
    if (better === 'up') return delta > 0 ? 'good' : 'bad';
    return 'neutral';
  }

  /* ---- Rangos de referencia (orientativos; los usa también la guía educativa) ---- */
  const REF = {
    bmi: [[18.5, 'Bajo peso', 'warn'], [25, 'Peso saludable', 'good'], [30, 'Sobrepeso', 'warn'], [Infinity, 'Obesidad', 'bad']],
    fat: { Femenino: [14, 21, 25, 32], Masculino: [6, 14, 18, 25] },                      // ACE: esencial · atlético · fitness · promedio · alta
    fatLabels: [['Grasa esencial', 'warn'], ['Atlético', 'good'], ['Fitness', 'good'], ['Promedio', 'info'], ['Alta', 'bad']],
    whr: { Masculino: 0.90, Femenino: 0.85 },                                              // OMS
    whtr: [0.5, 0.6],
    waist: { Masculino: [94, 102], Femenino: [80, 88] },                                  // OMS
    visceral: [9, 14],                                                                     // varía según el fabricante de la báscula
    water: { Femenino: [45, 60], Masculino: [50, 65] },
    rhr: [40, 60, 100]
  };

  /* ---- Indicadores derivados y categorías ---- */
  const adult = age => age == null || age >= 18;
  const bmi = (w, h) => (w && h) ? round(w / Math.pow(h / 100, 2), 1) : null;
  function bmiCat(v, age) {
    if (v == null) return null;
    if (!adult(age)) return { t: 'Se interpreta con percentiles', tone: 'info' };       // menores de 18: no aplican los rangos de adultos
    const r = REF.bmi.find(x => v < x[0]); return { t: r[1], tone: r[2] };
  }
  const fatMass = (w, pct) => (w && pct != null) ? round(w * pct / 100, 1) : null;
  const leanMass = (w, pct) => (w && pct != null) ? round(w * (1 - pct / 100), 1) : null;
  const whr = (waist, hip) => (waist && hip) ? round(waist / hip, 2) : null;
  const whtr = (waist, h) => (waist && h) ? round(waist / h, 2) : null;
  const whrCat = (sex, v) => v == null || !sex ? null : (v > REF.whr[sex] ? { t: 'Riesgo aumentado', tone: 'warn' } : { t: 'Rango saludable', tone: 'good' });
  const whtrCat = v => v == null ? null : v < REF.whtr[0] ? { t: 'Saludable', tone: 'good' } : v < REF.whtr[1] ? { t: 'Riesgo aumentado', tone: 'warn' } : { t: 'Riesgo alto', tone: 'bad' };
  function fatCat(sex, p, age) {
    if (p == null || !sex || !adult(age)) return null;
    const r = REF.fat[sex], i = r.findIndex(x => p < x), k = i === -1 ? 4 : i, l = REF.fatLabels[k];
    return { t: l[0], tone: l[1] };
  }
  function waistCat(sex, v) {
    if (v == null || !sex) return null;
    const [a, b] = REF.waist[sex];
    return v >= b ? { t: 'Riesgo alto', tone: 'bad' } : v >= a ? { t: 'Riesgo aumentado', tone: 'warn' } : { t: 'Rango saludable', tone: 'good' };
  }
  const visceralCat = v => v == null ? null : v <= REF.visceral[0] ? { t: 'Saludable', tone: 'good' } : v <= REF.visceral[1] ? { t: 'Alto', tone: 'warn' } : { t: 'Muy alto', tone: 'bad' };
  function waterCat(sex, v) {
    if (v == null || !sex) return null;
    const [a, b] = REF.water[sex];
    return v < a ? { t: 'Por debajo del rango típico', tone: 'warn' } : v > b ? { t: 'Por encima del rango típico', tone: 'info' } : { t: 'Rango típico', tone: 'good' };
  }
  function rhrCat(v) {
    if (v == null) return null;
    const [lo, mid, hi] = REF.rhr;
    return v < lo ? { t: 'Muy baja: consultar a un profesional', tone: 'warn' } : v < mid ? { t: 'Baja (común en personas entrenadas)', tone: 'info' } : v <= hi ? { t: 'Rango normal', tone: 'good' } : { t: 'Elevada', tone: 'warn' };
  }
  const metAgeCat = (v, age) => v == null || !age ? null : v <= age ? { t: 'Igual o menor a la edad real', tone: 'good' } : { t: 'Mayor a la edad real', tone: 'warn' };
  // TMB estimado por Mifflin-St Jeor (requiere sexo, edad, peso y altura)
  const bmrEstimate = (c, weight) => (c.sex && c.age && c.height && weight) ? Math.round(10 * weight + 6.25 * c.height - 5 * c.age + (c.sex === 'Masculino' ? 5 : -161)) : null;
  function bmrCat(c, v, weight) {
    const est = bmrEstimate(c, weight); if (v == null || est == null) return null;
    const d = (v - est) / est;
    return Math.abs(d) <= 0.10 ? { t: 'Cercano a lo esperado', tone: 'good' } : d > 0 ? { t: 'Por encima de lo esperado', tone: 'info' } : { t: 'Por debajo de lo esperado', tone: 'warn' };
  }
  function derived(client, m) {                            // m: una evaluación
    const w = m.weight ?? null, h = client.height || null;
    return { bmi: bmi(w, h), fatMass: fatMass(w, m.fat), leanMass: leanMass(w, m.fat), whr: whr(m.waist, m.hip), whtr: whtr(m.waist, h) };
  }
  // Vista previa mientras se escribe una evaluación: cada indicador con su fórmula y los números sustituidos
  function preview(client, v) {
    const n = x => { const r = Number(String(x ?? '').trim().replace(',', '.')); return String(x ?? '').trim() === '' || !Number.isFinite(r) ? null : r; };
    const w = n(v.weight), fat = n(v.fat), waist = n(v.waist), hip = n(v.hip), h = client && client.height || null, out = [];
    const b = bmi(w, h);
    if (b != null) out.push({ key: 'bmi', label: 'IMC', value: b, dec: 1, unit: '', formula: 'peso ÷ altura²', calc: `${fmt(w, 1)} ÷ (${(h / 100).toFixed(2)} × ${(h / 100).toFixed(2)})`, cat: bmiCat(b, client.age) });
    const fm = fatMass(w, fat), lm = leanMass(w, fat);
    if (fm != null) out.push({ key: 'fatMass', label: 'Masa grasa', value: fm, dec: 1, unit: 'kg', formula: 'peso × % grasa ÷ 100', calc: `${fmt(w, 1)} × ${fmt(fat, 1)} ÷ 100` });
    if (lm != null) out.push({ key: 'leanMass', label: 'Masa magra', value: lm, dec: 1, unit: 'kg', formula: 'peso − masa grasa', calc: `${fmt(w, 1)} − ${fmt(fm, 1)}` });
    const r = whr(waist, hip);
    if (r != null) out.push({ key: 'whr', label: 'Cintura / cadera', value: r, dec: 2, unit: '', formula: 'cintura ÷ cadera', calc: `${fmt(waist, 1)} ÷ ${fmt(hip, 1)}`, cat: whrCat(client && client.sex, r) });
    const t = whtr(waist, h);
    if (t != null) out.push({ key: 'whtr', label: 'Cintura / estatura', value: t, dec: 2, unit: '', formula: 'cintura ÷ altura', calc: `${fmt(waist, 1)} ÷ ${fmt(h, 0)}`, cat: whtrCat(t) });
    return out;
  }

  /* ---- Tendencia y proyección (regresión lineal sobre las últimas 6 mediciones) ---- */
  function projection(points, target) {
    const pts = points.filter(p => p.value != null);
    if (pts.length < 3) return { status: 'pocos-datos' };
    const rec = pts.slice(-6), d0 = rec[0].date, xs = rec.map(p => dayDiff(d0, p.date)), ys = rec.map(p => p.value), n = rec.length;
    if (xs[n - 1] - xs[0] < 14) return { status: 'pocos-datos' };
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    const sxx = xs.reduce((a, x) => a + (x - mx) * (x - mx), 0), sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
    if (!sxx) return { status: 'pocos-datos' };
    const slope = sxy / sxx, cur = ys[n - 1], diff = target - cur, perWeek = round(slope * 7, 2);
    if (Math.abs(diff) < 0.05) return { status: 'meta-alcanzada' };
    if (slope === 0 || Math.sign(slope) !== Math.sign(diff)) return { status: 'sin-tendencia', perWeek };
    const days = diff / slope;
    if (days > 365 * 3) return { status: 'largo-plazo', perWeek };
    return { status: 'ok', weeks: Math.max(1, Math.ceil(days / 7)), date: U.shift(rec[n - 1].date, { days: Math.ceil(days) }), perWeek };
  }

  function goals(client, series) {
    const out = [];
    const add = (key, label, unit, target) => {
      const pts = series[key] || [];
      if (target == null || !pts.length) return;
      const start = pts[0].value, cur = pts[pts.length - 1].value, span = target - start;
      const pct = Math.abs(span) < 1e-9 ? 100 : Math.max(0, Math.min(100, ((cur - start) / span) * 100));
      const g = { key, label, unit, start, current: cur, target, pct: Math.round(pct), remaining: round(Math.abs(target - cur), 1), proj: projection(pts, target) };
      if (client.goalDate && g.proj.status === 'ok') g.onTrack = g.proj.date <= client.goalDate;
      if (client.goalDate) { const left = dayDiff(U.today(), client.goalDate); g.daysLeft = left; if (left > 0) g.neededPerWeek = round((target - cur) / (left / 7), 2); }
      out.push(g);
    };
    add('weight', 'Meta de peso', 'kg', client.goalWeight);
    add('fat', 'Meta de % de grasa', '%', client.goalFat);
    return out;
  }

  /* ---- Panel de progreso completo de un cliente ---- */
  function progress(client, measures) {
    const asc = measures.slice().sort(byDateAsc), series = {};
    FIELDS.forEach(f => { series[f.key] = asc.filter(m => m[f.key] != null).map(m => ({ date: m.date, value: m[f.key] })); });
    const fields = FIELDS.filter(f => series[f.key].length).map(f => {
      const s = series[f.key], first = s[0].value, last = s[s.length - 1].value, delta = round(last - first, f.dec || 1);
      const wNow = series.weight.length ? series.weight[series.weight.length - 1].value : client.weight;
      const cat = f.key === 'fat' ? fatCat(client.sex, last, client.age) : f.key === 'waist' ? waistCat(client.sex, last) : f.key === 'water' ? waterCat(client.sex, last) : f.key === 'visceral' ? visceralCat(last) : f.key === 'rhr' ? rhrCat(last) : f.key === 'metAge' ? metAgeCat(last, client.age) : f.key === 'bmr' ? bmrCat(client, last, wNow) : null;
      return { def: f, series: s, first, last, delta, tone: s.length > 1 ? tone(f, delta, client) : 'neutral', n: s.length, cat };
    });
    const dAsc = asc.map(m => ({ date: m.date, weight: m.weight ?? null, ...derived(client, m) })), dser = k => dAsc.filter(d => d[k] != null);
    const dfield = (key, label, unit, dec, better, cat) => {
      const s = dser(key); if (!s.length) return null;
      const first = s[0][key], last = s[s.length - 1][key], delta = round(last - first, dec);
      return { key, label, unit, dec, first, last, delta, n: s.length, tone: s.length > 1 ? tone({ better }, delta, client) : 'neutral', cat: cat ? cat(last) : null, series: s.map(d => ({ date: d.date, value: d[key] })) };
    };
    const lastFull = dAsc.filter(d => d.fatMass != null).slice(-1)[0] || null, lastM = asc[asc.length - 1] || null;
    const weightNow = series.weight.length ? series.weight[series.weight.length - 1].value : (client.weight || null);
    const fatNow = series.fat.length ? series.fat[series.fat.length - 1].value : null;
    const dvs = [
      dfield('bmi', 'IMC', '', 1, 'none', v => bmiCat(v, client.age)), dfield('fatMass', 'Masa grasa', 'kg', 1, 'down'), dfield('leanMass', 'Masa magra', 'kg', 1, 'up'),
      dfield('whr', 'Índice cintura-cadera', '', 2, 'down', v => whrCat(client.sex, v)), dfield('whtr', 'Índice cintura-estatura', '', 2, 'down', v => whtrCat(v))
    ].filter(Boolean);
    const bmiNow = bmi(weightNow, client.height), highlights = [];
    fields.filter(f => f.n > 1 && ['weight', 'fat', 'muscle', 'waist', 'visceral', 'rhr'].includes(f.def.key) && f.delta !== 0).forEach(f => {
      const verb = f.delta < 0 ? 'bajó' : 'subió', u = f.def.unit === '%' ? 'puntos' : f.def.unit;
      highlights.push({ tone: f.tone, text: `${f.def.label}: ${verb} ${fmt(Math.abs(f.delta), f.def.dec)} ${u} (de ${fmt(f.first, f.def.dec)} a ${fmt(f.last, f.def.dec)})` });
    });
    return {
      client, count: asc.length, asc, series, fields, derived: dvs, goals: goals(client, series), highlights, lastM,
      now: { weight: weightNow, fat: fatNow, bmi: bmiNow, bmiCat: bmiCat(bmiNow, client.age), fatCat: fatCat(client.sex, fatNow, client.age), lastFull },
      first: asc[0] || null, last: lastM
    };
  }

  /* ---- Sugerencia nutricional (Mifflin-St Jeor) ---- */
  const ACT = { Sedentario: 1.2, Ligero: 1.375, Moderado: 1.55, Alto: 1.725, 'Muy alto': 1.9 };
  const ADJ = { 'Pérdida de grasa': -0.2, Hipertrofia: 0.1, Fuerza: 0.05, Rendimiento: 0, 'Salud general': 0 };
  const PROT = { 'Pérdida de grasa': 2.0, Hipertrofia: 1.8, Fuerza: 1.8, Rendimiento: 1.6, 'Salud general': 1.4 };
  function nutrition(client, o) {
    const { age, weight: w, height: h } = client;
    if (!age || !w || !h) return { error: 'Faltan edad, peso o altura del cliente' };
    if (!o.sex) return { error: 'Elegí el sexo para aplicar la fórmula' };
    if (!ACT[o.activity]) return { error: 'Elegí el nivel de actividad' };
    const bmr = 10 * w + 6.25 * h - 5 * age + (o.sex === 'Masculino' ? 5 : -161), tdee = bmr * ACT[o.activity], notes = [];
    let adj = ADJ[client.goal] ?? 0;
    if (adj < 0 && age < 18) { adj = 0; notes.push('Menor de 18 años: no se sugiere déficit calórico.'); }
    const b = bmi(w, h);
    if (adj < 0 && b != null && b < 18.5) { adj = 0; notes.push('IMC bajo: no se sugiere déficit calórico.'); }
    let kcal = tdee * (1 + adj); const floor = o.sex === 'Masculino' ? 1500 : 1200;
    if (kcal < floor) { kcal = floor; notes.push(`Se aplicó el mínimo de seguridad de ${floor} kcal.`); }
    kcal = Math.round(kcal / 10) * 10;
    const protein = Math.round(Math.min(w * (PROT[client.goal] ?? 1.6), w * 2.2)), fat = Math.round(Math.max(w * 0.8, kcal * 0.2 / 9));
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    const male = o.sex === 'Masculino', gkg = PROT[client.goal] ?? 1.6, f1 = x => (Math.round(x * 10) / 10), pct = Math.round(Math.abs(adj) * 100);
    const steps = [
      { title: '1) Metabolismo basal (TMB)', formula: `10 × peso + 6,25 × altura − 5 × edad ${male ? '+ 5' : '− 161'}`, calc: `10 × ${w} + 6,25 × ${h} − 5 × ${age} ${male ? '+ 5' : '− 161'} = ${Math.round(bmr)} kcal`, note: 'Fórmula de Mifflin-St Jeor: calorías que el cuerpo gasta en reposo.' },
      { title: '2) Gasto energético total', formula: 'TMB × factor de actividad', calc: `${Math.round(bmr)} × ${ACT[o.activity]} (${o.activity.toLowerCase()}) = ${Math.round(tdee)} kcal`, note: 'Suma el gasto por moverse y entrenar.' },
      { title: '3) Ajuste según el objetivo', formula: 'gasto total × (1 ± ajuste)', calc: adj ? `${Math.round(tdee)} × (1 ${adj > 0 ? '+' : '−'} ${pct / 100}) → ${kcal} kcal` : `${Math.round(tdee)} kcal (sin ajuste) → ${kcal} kcal`, note: `Objetivo «${client.goal}»: ${adj > 0 ? 'superávit' : adj < 0 ? 'déficit' : 'mantenimiento'} de ${pct}%. Se redondea a 10 kcal y se respeta un mínimo de seguridad.` },
      { title: '4) Proteína', formula: 'peso × gramos por kg', calc: `${w} kg × ${gkg} g/kg = ${protein} g`, note: 'Los g/kg dependen del objetivo (máx. 2,2 g/kg).' },
      { title: '5) Grasas', formula: 'el mayor entre 0,8 g/kg y 20% de las calorías', calc: `máx(${f1(w * 0.8)} g ; ${f1(kcal * 0.2 / 9)} g) = ${fat} g`, note: 'Cada gramo de grasa aporta 9 kcal.' },
      { title: '6) Carbohidratos', formula: '(calorías − proteína × 4 − grasas × 9) ÷ 4', calc: `(${kcal} − ${protein} × 4 − ${fat} × 9) ÷ 4 = ${carbs} g`, note: 'Lo que queda de calorías; cada gramo aporta 4 kcal.' }
    ];
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, carbs, fat, adj, notes, steps };
  }

  /* ---- Riesgo de abandono ("semáforo de retención") ---- */
  const RANK = { Alta: 3, Media: 2, Baja: 1 };
  function risk(client, ctx) {
    const t = U.today(), reasons = []; let score = 0;
    const since = dayDiff(client.start || t, t), ck = ctx.checkins.slice().sort(byDateDesc), ms = ctx.measures.slice().sort(byDateDesc);
    if (!ck.length) { if (since >= 7) { score += 30; reasons.push('Todavía no tiene ninguna revisión'); } }
    else {
      const d = dayDiff(ck[0].date, t);
      if (d >= 21) { score += 40; reasons.push(`Sin revisión hace ${d} días`); } else if (d >= 14) { score += 30; reasons.push(`Sin revisión hace ${d} días`); } else if (d >= 10) { score += 15; reasons.push(`Sin revisión hace ${d} días`); }
      if (ck[0].adherence === 'Baja') { score += 20; reasons.push('Adherencia baja en la última revisión'); }
      if (ck.length > 1 && RANK[ck[0].adherence] < RANK[ck[1].adherence]) { score += 10; reasons.push('La adherencia viene bajando'); }
      if (ck[0].sleep === 'Malo' && ck[0].fatigue === 'Alta') { score += 10; reasons.push('Mal descanso y fatiga alta'); }
    }
    if (!ms.length) { if (since >= 14) { score += 15; reasons.push('Sin ninguna evaluación física'); } }
    else { const d = dayDiff(ms[0].date, t); if (d >= 45) { score += 20; reasons.push(`Sin evaluación física hace ${d} días`); } else if (d >= 30) { score += 10; reasons.push(`Sin evaluación física hace ${d} días`); } }
    if (!ctx.workouts.length) { score += 10; reasons.push('Sin rutina asignada'); }
    score = Math.min(100, score);
    return { score, level: score >= 50 ? 'alta' : score >= 25 ? 'media' : 'ok', reasons };
  }

  return { REF, bmrEstimate, waistCat, visceralCat, waterCat, rhrCat, metAgeCat, bmrCat, preview, FIELDS, fmt, round, dayDiff, tone, bmi, bmiCat, fatMass, leanMass, whr, whtr, whrCat, whtrCat, fatCat, derived, projection, progress, nutrition, risk, ACT };
})();
