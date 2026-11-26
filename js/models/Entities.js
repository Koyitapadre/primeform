/* ============================================================
   MODELO · Entidades
   Construyen y VALIDAN registros a partir de los valores crudos de un
   formulario. Devuelven { ok:true, record } o
   { ok:false, errors:{campo:mensaje}, error:primerMensaje }.
   ============================================================ */
PF.Entities = (function () {
  const V = PF.Validate, U = PF.Utils, Ls = PF.Lists;
  const collect = pairs => { const errors = {}, out = {}; pairs.forEach(([k, r]) => { if (r.error) errors[k] = r.error; else out[k] = r.value; }); return { errors, out }; };
  const done = (errors, out, extra = {}) => Object.keys(errors).length ? { ok: false, errors, error: Object.values(errors)[0] } : { ok: true, record: { ...out, ...extra } };
  const clientRef = v => { const r = V.id(v); if (r.error) return { error: 'Elegí un cliente' }; return PF.Store.find('clients', r.value) ? r : { error: 'Ese cliente ya no existe' }; };
  const notes = v => V.text(v, { max: 500, multiline: true, label: 'Las notas' });

  /* ---- Cliente: todos los datos son obligatorios (excepto notas) ---- */
  function client(v, opt = {}) {
    const t = U.today();
    const { errors, out } = collect([
      ['name', V.fullName(v.name)],
      ['email', V.email(v.email)],
      ['age', V.num(v.age, { min: 14, max: 99, int: true, label: 'La edad', decimals: 0 })],
      ['weight', V.num(v.weight, { min: 25, max: 350, label: 'El peso' })],
      ['height', V.num(v.height, { min: 100, max: 250, int: true, label: 'La altura', decimals: 0 })],
      ['goal', V.oneOf(v.goal, Ls.GOALS, { label: 'un objetivo' })],
      ['experience', V.oneOf(v.experience, Ls.LEVELS, { label: 'el nivel de experiencia' })],
      ['status', V.oneOf(v.status || 'Activo', Ls.STATUS, { label: 'un estado' })],
      ['start', V.date(v.start, { label: 'La fecha de inicio', min: U.shift(t, { years: -5 }), max: U.shift(t, { years: 1 }), maxMsg: 'La fecha de inicio no puede ser tan lejana' })],
      ['sex', V.optOne(v.sex, Ls.SEX)],
      ['activity', V.optOne(v.activity, Ls.ACTIVITY)],
      ['goalWeight', V.num(v.goalWeight, { min: 25, max: 350, required: false, label: 'La meta de peso' })],
      ['goalFat', V.num(v.goalFat, { min: 3, max: 60, required: false, label: 'La meta de % de grasa' })],
      ['goalDate', V.date(v.goalDate, { required: false, label: 'La fecha objetivo', max: U.shift(t, { years: 5 }), maxMsg: 'La fecha objetivo es demasiado lejana' })],
      ['notes', notes(v.notes)]
    ]);
    if (!errors.goalDate && out.goalDate && out.start && out.goalDate <= out.start) errors.goalDate = 'La fecha objetivo debe ser posterior al inicio';
    if (!errors.email) {
      const dup = PF.Store.list('clients').some(c => c.id !== opt.existingId && (c.email || '').toLowerCase() === out.email);
      if (dup) errors.email = 'Ya existe un cliente con ese correo';
    }
    const minor = out.age != null && out.age < 18, gName = String(v.guardianName ?? '').replace(/\s+/g, ' ').trim();
    if (minor) {
      if (gName.length < 2 || gName.length > 80) errors.guardianName = 'Ingresá el nombre del padre, madre o tutor (2 a 80 caracteres)';
      if (v.guardianConsent !== true) errors.guardianConsent = 'El padre, madre o tutor debe autorizar el registro de los datos';
    }
    out.guardianName = minor ? gName.slice(0, 80) : ''; out.guardianConsent = minor && v.guardianConsent === true;
    if (!opt.existingId && !v.consent) errors.consent = 'Confirmá que el cliente aceptó el registro de sus datos';
    return done(errors, out, opt.existingId ? {} : { id: U.uid(), created: t, consent: true, consentDate: t });
  }

  /* ---- Rutina ---- */
  function workout(v) {
    const t = U.today();
    const { errors, out } = collect([
      ['clientId', clientRef(v.clientId)],
      ['name', V.text(v.name, { min: 3, max: 60, required: true, label: 'El nombre de la rutina' })],
      ['day', V.oneOf(v.day, Ls.DAYS, { label: 'el día o enfoque' })],
      ['start', V.date(v.start, { label: 'La fecha de inicio', min: U.shift(t, { years: -1 }), max: U.shift(t, { years: 2 }) })],
      ['notes', notes(v.notes)]
    ]);
    const exercises = [];
    (Array.isArray(v.exercises) ? v.exercises : []).forEach((e, i) => {
      if (!V.clean(e.name)) return;                       // fila vacía: se ignora
      const r = collect([
        [`ex${i}_name`, V.text(e.name, { min: 2, max: 80, required: true, label: 'El nombre del ejercicio' })],
        [`ex${i}_sets`, V.num(e.sets, { min: 1, max: 20, int: true, label: 'Las series', decimals: 0 })],
        [`ex${i}_reps`, V.text(e.reps, { max: 12, required: true, label: 'Las repeticiones' })],
        [`ex${i}_rir`, V.num(e.rir, { min: 0, max: 10, int: true, label: 'El RIR', decimals: 0 })]
      ]);
      Object.assign(errors, r.errors);
      if (!Object.keys(r.errors).length) exercises.push({ name: r.out[`ex${i}_name`], sets: r.out[`ex${i}_sets`], reps: r.out[`ex${i}_reps`], rir: r.out[`ex${i}_rir`], rest: Math.max(0, Math.min(600, +e.rest || 120)) });
    });
    if (!exercises.length && !Object.keys(errors).some(k => k.startsWith('ex'))) errors.exercises = 'Agregá al menos un ejercicio';
    else if (Object.keys(errors).some(k => k.startsWith('ex'))) errors.exercises = 'Revisá los ejercicios marcados';
    if (exercises.length > 30) errors.exercises = 'Máximo 30 ejercicios por rutina';
    return done(errors, out, { id: U.uid(), exercises });
  }

  /* ---- Evaluación (composición corporal, contornos y signos vitales) ---- */
  const MEASURE_NUM = [
    ['weight', 'El peso', 25, 350, 1, false], ['fat', 'El % de grasa corporal', 2, 70, 1, false], ['muscle', 'La masa muscular', 10, 80, 1, false],
    ['water', 'El agua corporal', 30, 80, 1, false], ['visceral', 'La grasa visceral', 1, 59, 0, true], ['bone', 'La masa ósea', 0.5, 8, 1, false],
    ['bmr', 'El metabolismo basal', 800, 4500, 0, true], ['metAge', 'La edad metabólica', 10, 99, 0, true],
    ['neck', 'El cuello', 20, 70, 1, false], ['chest', 'El pecho', 40, 250, 1, false], ['arm', 'El brazo', 10, 80, 1, false], ['waist', 'La cintura', 30, 250, 1, false],
    ['hip', 'La cadera', 30, 250, 1, false], ['thigh', 'El muslo', 20, 120, 1, false], ['calf', 'La pantorrilla', 15, 70, 1, false], ['rhr', 'La frecuencia cardíaca en reposo', 30, 140, 0, true]
  ];
  function measure(v) {
    const t = U.today();
    const nums = MEASURE_NUM.map(([k, label, min, max, dec, int]) => [k, V.num(v[k], { min, max, label, required: false, decimals: dec, int })]);
    const { errors, out } = collect([
      ['clientId', clientRef(v.clientId)],
      ['date', V.date(v.date, { label: 'La fecha', min: U.shift(t, { years: -10 }), max: t, maxMsg: 'La fecha no puede ser futura' })],
      ['method', V.optOne(v.method, Ls.METHOD)],
      ...nums,
      ['notes', notes(v.notes)]
    ]);
    if (!Object.keys(errors).length) {
      const keys = MEASURE_NUM.map(x => x[0]);
      if (keys.every(k => out[k] == null)) errors.general = 'Registrá al menos un dato (peso, composición corporal o contornos)';
      // Coherencia clínica entre datos
      if (out.weight != null && out.muscle != null) {
        if (out.fat != null) { const lean = out.weight * (1 - out.fat / 100); if (out.muscle > lean + 0.05) errors.muscle = `La masa muscular (${out.muscle} kg) no puede superar la masa magra (${lean.toFixed(1)} kg)`; }
        else if (out.muscle >= out.weight) errors.muscle = 'La masa muscular no puede ser igual o mayor al peso';
      }
      if (out.weight != null && out.bone != null && out.bone >= out.weight) errors.bone = 'La masa ósea no puede ser igual o mayor al peso';
    }
    return done(errors, out, { id: U.uid() });
  }

  /* ---- Objetivo nutricional ---- */
  function nutrition(v) {
    const o = { required: false, int: true, decimals: 0 };
    const { errors, out } = collect([
      ['clientId', clientRef(v.clientId)],
      ['cal', V.num(v.cal, { min: 800, max: 8000, int: true, decimals: 0, label: 'Las calorías' })],
      ['protein', V.num(v.protein, { ...o, min: 0, max: 500, label: 'La proteína' })],
      ['carbs', V.num(v.carbs, { ...o, min: 0, max: 1200, label: 'Los carbohidratos' })],
      ['fat', V.num(v.fat, { ...o, min: 0, max: 400, label: 'Las grasas' })],
      ['adherence', V.oneOf(v.adherence, Ls.NUT_ADH, { label: 'la adherencia' })],
      ['notes', notes(v.notes)]
    ]);
    return done(errors, out, { id: U.uid(), date: U.today() });
  }

  /* ---- Revisión ---- */
  function checkin(v) {
    const t = U.today();
    const { errors, out } = collect([
      ['clientId', clientRef(v.clientId)],
      ['date', V.date(v.date, { label: 'La fecha', min: U.shift(t, { years: -1 }), max: t, maxMsg: 'La fecha no puede ser futura' })],
      ['adherence', V.oneOf(v.adherence, Ls.CHK_ADH, { label: 'la adherencia' })],
      ['energy', V.oneOf(v.energy, Ls.ENERGY, { label: 'la energía' })],
      ['sleep', V.oneOf(v.sleep, Ls.SLEEP, { label: 'el sueño' })],
      ['fatigue', V.oneOf(v.fatigue, Ls.FATIGUE, { label: 'la fatiga' })],
      ['notes', notes(v.notes)]
    ]);
    return done(errors, out, { id: U.uid(), done: true });
  }

  /* ---- Ejercicio propio ---- */
  function exercise(v) {
    const { errors, out } = collect([
      ['name', V.text(v.name, { min: 3, max: 60, required: true, label: 'El nombre del ejercicio' })],
      ['group', V.oneOf(v.group, PF.ExerciseLibrary.GROUPS, { label: 'un grupo muscular' })],
      ['equip', V.text(v.equip, { max: 60, label: 'El equipo' })],
      ['tpl', V.oneOf(v.tpl, Object.keys(PF.ExerciseLibrary.TEMPLATES), { label: 'una ilustración' })],
      ['image', V.imageUrl(v.image)],
      ['desc', V.text(v.desc, { max: 400, multiline: true, label: 'La descripción' })]
    ]);
    if (!errors.name && PF.ExerciseLibrary.find(out.name)) errors.name = 'Ese ejercicio ya existe en la biblioteca';
    return done(errors, { ...out, equip: out.equip || 'Peso corporal', desc: out.desc || 'Sin descripción.' }, { id: U.uid() });
  }

  return { client, workout, measure, nutrition, checkin, exercise };
})();
