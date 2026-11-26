/* ============================================================
   MODELO · Schema (saneamiento)
   TODO dato que entra desde afuera (almacenamiento, respaldo importado,
   descifrado) pasa por aquí: ids seguros, textos limpios y acotados,
   números dentro de rango, listas cerradas y URLs de imagen seguras.
   Lo inválido se descarta. Así un archivo manipulado no puede inyectar
   código ni romper la aplicación.
   ============================================================ */
PF.Schema = (function () {
  const V = PF.Validate, L = PF.Lists, today = () => PF.Utils.today();
  const str = (v, max) => V.clean(v).slice(0, max);
  const mstr = (v, max) => V.cleanMulti(v).slice(0, max);
  const numOr = (v, min, max, dec = 1) => { const r = V.num(v, { min, max, required: false, decimals: dec, int: dec === 0 }); return r.error ? null : r.value; };
  const pick = (v, list, def) => { const s = V.clean(v); return list.includes(s) ? s : def; };
  const dateOr = (v, def) => { const r = V.date(v, { required: false }); return (r.error || !r.value) ? def : r.value; };
  const LIMIT = 5000;

  function sanitizeDb(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = { clients: [], workouts: [], measures: [], nutrition: [], checkins: [], exercises: [] };
    let dropped = 0;
    const arr = k => (Array.isArray(src[k]) ? src[k].slice(0, LIMIT) : []);
    const valid = o => o && typeof o === 'object' && !Array.isArray(o);

    const clientIds = new Set();
    arr('clients').forEach(c => {
      if (!valid(c)) { dropped++; return; }
      const id = V.id(c.id), name = str(c.name, 80), em = V.email(c.email, { required: false });
      if (id.error || !name || clientIds.has(id.value)) { dropped++; return; }
      clientIds.add(id.value);
      out.clients.push({
        id: id.value, name, email: em.error ? '' : em.value,
        age: numOr(c.age, 0, 120, 0), weight: numOr(c.weight, 0, 400), height: numOr(c.height, 0, 260, 0),
        goal: pick(c.goal, L.GOALS, 'Salud general'), experience: pick(c.experience, L.LEVELS, 'Principiante'), status: pick(c.status, L.STATUS, 'Activo'),
        start: dateOr(c.start, today()), notes: mstr(c.notes, 500), created: dateOr(c.created, today()),
        consent: c.consent === true, consentDate: dateOr(c.consentDate, ''), guardianName: str(c.guardianName, 80), guardianConsent: c.guardianConsent === true,
        sex: pick(c.sex, L.SEX, ''), activity: pick(c.activity, L.ACTIVITY, ''), goalWeight: numOr(c.goalWeight, 20, 400), goalFat: numOr(c.goalFat, 1, 70), goalDate: dateOr(c.goalDate, '')
      });
    });

    const seen = {};
    const common = (kind, o) => {
      if (!valid(o)) return null;
      const id = V.id(o.id), cid = V.id(o.clientId);
      seen[kind] = seen[kind] || new Set();
      if (id.error || cid.error || !clientIds.has(cid.value) || seen[kind].has(id.value)) return null;
      seen[kind].add(id.value);
      return { id: id.value, clientId: cid.value };
    };

    arr('workouts').forEach(w => {
      const base = common('w', w); if (!base) { dropped++; return; }
      const exercises = (Array.isArray(w.exercises) ? w.exercises.slice(0, 40) : []).filter(valid).map(e => ({
        name: str(e.name, 80), sets: numOr(e.sets, 1, 50, 0) ?? 3, reps: str(e.reps, 12) || '8–12', rir: numOr(e.rir, 0, 10, 0) ?? 2, rest: numOr(e.rest, 0, 900, 0) ?? 120
      })).filter(e => e.name);
      const name = str(w.name, 60);
      if (!name || !exercises.length) { dropped++; return; }
      out.workouts.push({ ...base, name, day: pick(w.day, L.DAYS, 'Personalizada'), start: dateOr(w.start, today()), notes: mstr(w.notes, 500), exercises });
    });

    arr('measures').forEach(m => {
      const base = common('m', m); if (!base) { dropped++; return; }
      out.measures.push({ ...base, date: dateOr(m.date, today()), method: pick(m.method, L.METHOD, ''), weight: numOr(m.weight, 0, 400), fat: numOr(m.fat, 0, 80), muscle: numOr(m.muscle, 0, 120), water: numOr(m.water, 0, 90), visceral: numOr(m.visceral, 0, 60, 0), bone: numOr(m.bone, 0, 15), bmr: numOr(m.bmr, 0, 6000, 0), metAge: numOr(m.metAge, 0, 120, 0), neck: numOr(m.neck, 0, 100), waist: numOr(m.waist, 0, 300), chest: numOr(m.chest, 0, 300), arm: numOr(m.arm, 0, 120), thigh: numOr(m.thigh, 0, 200), hip: numOr(m.hip, 0, 300), calf: numOr(m.calf, 0, 100), rhr: numOr(m.rhr, 0, 250, 0), notes: mstr(m.notes, 500) });
    });

    arr('nutrition').forEach(n => {
      const base = common('n', n); if (!base) { dropped++; return; }
      out.nutrition.push({ ...base, cal: numOr(n.cal, 0, 10000, 0), protein: numOr(n.protein, 0, 800, 0), carbs: numOr(n.carbs, 0, 2000, 0), fat: numOr(n.fat, 0, 600, 0), adherence: pick(n.adherence, L.NUT_ADH, 'Sin registrar'), notes: mstr(n.notes, 500), date: dateOr(n.date, today()) });
    });

    arr('checkins').forEach(k => {
      const base = common('k', k); if (!base) { dropped++; return; }
      out.checkins.push({ ...base, date: dateOr(k.date, today()), adherence: pick(k.adherence, L.CHK_ADH, 'Media'), energy: pick(k.energy, L.ENERGY, 'Normal'), sleep: pick(k.sleep, L.SLEEP, 'Regular'), fatigue: pick(k.fatigue, L.FATIGUE, 'Moderada'), notes: mstr(k.notes, 500), done: k.done !== false });
    });

    const tpls = Object.keys(PF.ExerciseLibrary.TEMPLATES), exSeen = new Set();
    arr('exercises').forEach(x => {
      if (!valid(x)) { dropped++; return; }
      const id = V.id(x.id), name = str(x.name, 60), img = V.imageUrl(x.image);
      if (id.error || !name || exSeen.has(id.value)) { dropped++; return; }
      exSeen.add(id.value);
      out.exercises.push({ id: id.value, name, group: pick(x.group, PF.ExerciseLibrary.GROUPS, 'Funcional'), equip: str(x.equip, 60) || 'Peso corporal', tpl: pick(x.tpl, tpls, 'backSquat'), desc: str(x.desc, 400) || 'Sin descripción.', image: img.error ? '' : img.value });
    });

    return { data: out, dropped };
  }

  const isBackup = o => !!o && typeof o === 'object' && Array.isArray(o.clients) && Array.isArray(o.workouts);
  return { sanitizeDb, isBackup };
})();
