/* ============================================================
   VISTA · Formularios modales
   Dibujan el formulario y, al guardar, entregan los valores CRUDOS a
   onSubmit(values). La validación vive en el modelo (PF.Entities);
   showErrors() pinta cada mensaje debajo de su campo.
   ============================================================ */
PF.Views.Forms = (function () {
  const F = PF.Views.FormFields, Modal = PF.Views.Modal, L = PF.Lists;
  const { esc, today, fmtDate, shift } = PF.Utils;
  const { field, selectField, textareaField, clientSelect, checkField, read } = F;

  const MAP = {
    sync: { key: 'sKey', ack: 'sAck' },
    share: { password: 'sPass', include: 'sInclude', ok: 'sOk' },
    org: { planUrl: 'oPlanUrl', slots: 'oSlots', slotsMode: 'oSlotsMode', name: 'oName', email: 'oEmail', id: 'oId', phone: 'oPhone', address: 'oAddress', privacy: 'oPrivacy', terms: 'oTerms' },
    client: { name: 'cName', email: 'cEmail', age: 'cAge', weight: 'cWeight', height: 'cHeight', goal: 'cGoal', experience: 'cExp', start: 'cStart', notes: 'cNotes', consent: 'cConsent', status: 'cStatus', guardianName: 'cGuardian', guardianConsent: 'cGuardianOk', sex: 'cSex', activity: 'cActivity', goalWeight: 'cGoalWeight', goalFat: 'cGoalFat', goalDate: 'cGoalDate' },
    workout: { clientId: 'wClient', name: 'wName', day: 'wDay', start: 'wStart', notes: 'wNotes', exercises: 'exerciseRows' },
    measure: { clientId: 'mClient', date: 'mDate', method: 'mMethod', weight: 'mWeight', fat: 'mFat', muscle: 'mMuscle', water: 'mWater', visceral: 'mVisceral', bone: 'mBone', bmr: 'mBmr', metAge: 'mMetAge', neck: 'mNeck', chest: 'mChest', arm: 'mArm', waist: 'mWaist', hip: 'mHip', thigh: 'mThigh', calf: 'mCalf', rhr: 'mRhr', notes: 'mNotes', general: 'mGeneral' },
    nutrition: { clientId: 'nClient', cal: 'nCal', protein: 'nProtein', carbs: 'nCarbs', fat: 'nFat', adherence: 'nAdh', notes: 'nNotes' },
    checkin: { clientId: 'kClient', date: 'kDate', adherence: 'kAdh', energy: 'kEnergy', sleep: 'kSleep', fatigue: 'kFatigue', notes: 'kNotes' },
    exercise: { name: 'xName', group: 'xGroup', equip: 'xEquip', tpl: 'xTpl', image: 'xImage', desc: 'xDesc' },
    pwSetup: { pass: 'spw1', confirm: 'spw2', ack: 'sack' },
    pwConfirm: { pass: 'dpw' }
  };

  function showErrors(form, errors) {
    F.clearAll();
    let first = null;
    Object.entries(errors).forEach(([k, msg]) => {
      const row = /^ex(\d+)_(name|sets|reps|rir)$/.exec(k);
      if (row) {
        const el = document.querySelector(`#exerciseRows [data-row="${row[1]}"] [data-f="${row[2]}"]`);
        if (el) { el.classList.add('invalid'); el.setAttribute('aria-invalid', 'true'); el.title = msg; first = first || el; }
        return;
      }
      const id = (MAP[form] || {})[k] || k, box = document.getElementById('e-' + id), el = document.getElementById(id);
      if (box) box.textContent = msg;
      if (el) { el.classList.add('invalid'); el.setAttribute('aria-invalid', 'true'); first = first || el; }
    });
    if (first && first.focus && first.tagName !== 'DIV') first.focus();
  }

  /* ---------- Cliente (crear / editar) ---------- */
  function client({ initial = null, onSubmit }) {
    const c = initial || {}, editing = !!initial, t = today();
    Modal.open({
      title: editing ? 'Editar cliente' : 'Añadir cliente',
      saveLabel: editing ? 'Guardar cambios' : 'Crear cliente',
      body: `<p class="formnote">Los campos con <span class="req">*</span> son obligatorios: no se puede crear el cliente si falta alguno.</p><div class="formgrid">
        ${field('Nombre completo', 'cName', 'Nombre y apellido', 'text', c.name || '', { req: true, maxlength: 80, autocomplete: 'off' })}
        ${field('Correo electrónico', 'cEmail', 'correo@ejemplo.com', 'email', c.email || '', { req: true, maxlength: 120, autocomplete: 'off', inputmode: 'email' })}
        ${field('Edad', 'cAge', 'Ej. 28', 'number', c.age ?? '', { req: true, min: 14, max: 99, step: 1, inputmode: 'numeric', 'data-input': 'client:age' })}
        ${field('Peso (kg)', 'cWeight', 'Ej. 72.5', 'number', c.weight ?? '', { req: true, min: 25, max: 350, step: 0.1, inputmode: 'decimal' })}
        ${field('Altura (cm)', 'cHeight', 'Ej. 168', 'number', c.height ?? '', { req: true, min: 100, max: 250, step: 1, inputmode: 'numeric' })}
        ${selectField('Objetivo', 'cGoal', L.GOALS, c.goal || '', { req: true, placeholder: 'Seleccioná un objetivo…' })}
        ${selectField('Experiencia', 'cExp', L.LEVELS, c.experience || '', { req: true, placeholder: 'Seleccioná el nivel…' })}
        ${selectField('Estado del cliente', 'cStatus', L.STATUS, c.status || (PF.Selectors.slotInfo().full ? 'En espera' : 'Activo'), { req: true })}
        ${field('Día de inicio', 'cStart', '', 'date', c.start || t, { req: true, min: shift(t, { years: -5 }), max: shift(t, { years: 1 }) })}
      </div><div class="formsub">Metas y datos opcionales</div><div class="formgrid">
        ${selectField('Sexo (rangos de referencia)', 'cSex', L.SEX, c.sex || '', { placeholder: 'Prefiero no indicar' })}
        ${selectField('Nivel de actividad', 'cActivity', L.ACTIVITY, c.activity || '', { placeholder: 'Sin indicar' })}
        ${field('Meta de peso (kg)', 'cGoalWeight', 'Ej. 60', 'number', c.goalWeight ?? '', { min: 25, max: 350, step: 0.1, inputmode: 'decimal' })}
        ${field('Meta de % de grasa', 'cGoalFat', 'Ej. 22', 'number', c.goalFat ?? '', { min: 3, max: 60, step: 0.1, inputmode: 'decimal' })}
        ${field('Fecha objetivo', 'cGoalDate', '', 'date', c.goalDate || '', { min: t, max: shift(t, { years: 5 }) })}
      </div>${textareaField('Notas iniciales / disponibilidad (opcional)', 'cNotes', 3, 'Días disponibles, preferencias, limitaciones relevantes...', { value: c.notes || '' })}
      <div id="guardianBox" ${c.age && c.age < 18 ? '' : 'hidden'}><div class="formsub">Menor de 18 años: autorización del padre, madre o tutor</div><div class="formnote">Para registrar datos de salud de una persona menor de edad se necesita la autorización de su padre, madre o tutor legal.</div>${field('Nombre del padre, madre o tutor', 'cGuardian', 'Nombre y apellido', 'text', c.guardianName || '', { maxlength: 80, autocomplete: 'off' })}${checkField('El padre, madre o tutor legal autoriza el registro de estos datos', 'cGuardianOk', !!c.guardianConsent)}</div>
       ${editing ? '' : checkField('El cliente leyó el aviso de privacidad (menú «Privacidad») y aceptó expresamente que registre sus datos de salud y de entrenamiento', 'cConsent', false)}`,
      onSave: () => onSubmit({
        name: read('cName'), email: read('cEmail'), age: read('cAge'), weight: read('cWeight'), height: read('cHeight'),
        goal: read('cGoal'), experience: read('cExp'), start: read('cStart'), sex: read('cSex'), activity: read('cActivity'), goalWeight: read('cGoalWeight'), goalFat: read('cGoalFat'), goalDate: read('cGoalDate'), status: read('cStatus'), guardianName: read('cGuardian'), guardianConsent: read('cGuardianOk'), notes: read('cNotes'), consent: editing ? true : read('cConsent')
      })
    });
  }

  /* ---------- Responsable y textos legales ---------- */
  function org({ org: o, onSubmit }) {
    Modal.open({
      title: 'Responsable y textos legales', saveLabel: 'Guardar',
      body: `<p class="formnote">Quién trata los datos y cómo contactarlo. Aparece en el aviso de privacidad, el informe y los enlaces para clientes.</p><div class="formgrid">
        ${field('Nombre o razón social', 'oName', 'Ej. María Pérez Entrenamiento', 'text', o.name, { req: true, maxlength: 100, autocomplete: 'organization' })}
        ${field('Correo de contacto', 'oEmail', 'contacto@tudominio.com', 'email', o.email, { req: true, maxlength: 120, autocomplete: 'off', inputmode: 'email' })}
        ${field('Cédula / identificación (opcional)', 'oId', '', 'text', o.id, { maxlength: 40, autocomplete: 'off' })}
        ${field('Dirección pública de los planes de clientes', 'oPlanUrl', 'https://plan.tuempresa.com/', 'url', o.planUrl || '', { maxlength: 200, autocomplete: 'off', inputmode: 'url' })}
        ${selectField('Cupos de clientes', 'oSlotsMode', ['Limitados', 'Ilimitados'], o.name ? (o.slotsMode === 'unlimited' ? 'Ilimitados' : 'Limitados') : 'Limitados', { req: true })}
        ${field('Cantidad de cupos (solo en modo Limitados)', 'oSlots', 'Ej. 15', 'number', o.slots || '', { min: 0, max: 500, step: 1, inputmode: 'numeric' })}
        ${field('Teléfono (opcional)', 'oPhone', '', 'tel', o.phone, { maxlength: 40, autocomplete: 'tel' })}
      </div>${field('Domicilio (opcional)', 'oAddress', '', 'text', o.address, { maxlength: 160, autocomplete: 'off' })}
      <div class="formsub">Textos propios (opcional)</div><div class="formnote">Si un abogado revisó tu aviso de privacidad o tus términos, pegalos aquí: reemplazan al texto estándar. Separá los párrafos con una línea en blanco. Si lo dejás vacío se usa el texto estándar.</div>
      ${textareaField('Aviso de privacidad propio', 'oPrivacy', 7, 'Pegá aquí el texto revisado…', { maxlength: 8000, value: o.privacy })}
      ${textareaField('Términos de uso propios', 'oTerms', 7, 'Pegá aquí el texto revisado…', { maxlength: 8000, value: o.terms })}`,
      onSave: () => onSubmit({ name: read('oName'), email: read('oEmail'), id: read('oId'), phone: read('oPhone'), address: read('oAddress'), slots: read('oSlots'), slotsMode: read('oSlotsMode') === 'Ilimitados' ? 'unlimited' : 'limited', planUrl: read('oPlanUrl'), privacy: read('oPrivacy'), terms: read('oTerms') })
    });
  }

  /* ---------- Rutina (con filas de ejercicios dinámicas) ---------- */
  let rows = [];
  const blankRow = () => ({ name: '', sets: 3, reps: '8–12', rir: 2, rest: 120 });

  function renderRows() {
    const el = document.getElementById('exerciseRows');
    if (!el) return;
    el.innerHTML = `<div class="exercise" style="color:var(--muted);font-size:10px"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>RIR</span><span></span></div>` +
      rows.map((e, i) => `<div class="exercise" data-row="${i}"><input data-f="name" list="exLib" maxlength="80" aria-label="Ejercicio" placeholder="Buscá en la biblioteca…" value="${esc(e.name)}"><input data-f="sets" aria-label="Series" type="number" min="1" max="20" step="1" inputmode="numeric" value="${esc(e.sets)}"><input data-f="reps" aria-label="Repeticiones" maxlength="12" value="${esc(e.reps)}"><input data-f="rir" aria-label="RIR" type="number" min="0" max="10" step="1" inputmode="numeric" value="${esc(e.rir)}"><button type="button" title="Eliminar ejercicio" aria-label="Eliminar ejercicio" data-action="exercise:remove" data-index="${i}">×</button></div>`).join('');
  }
  function syncRows() {
    document.querySelectorAll('#exerciseRows [data-row]').forEach(el => {
      const r = rows[+el.dataset.row]; if (!r) return;
      const f = k => el.querySelector(`[data-f="${k}"]`).value;
      r.name = f('name'); r.sets = f('sets'); r.reps = f('reps'); r.rir = f('rir');
    });
  }
  PF.Events.on('exercise:add', () => { syncRows(); if (rows.length >= 30) return; rows.push(blankRow()); renderRows(); });
  PF.Events.on('exercise:remove', d => { syncRows(); rows.splice(+d.index, 1); if (!rows.length) rows.push(blankRow()); renderRows(); });

  function workout({ clients, clientId = '', prefill = [], onSubmit }) {
    const t = today();
    rows = prefill.length ? prefill.map(e => ({ ...blankRow(), ...e })) : [blankRow()];
    Modal.open({
      title: 'Crear rutina', saveLabel: 'Crear rutina',
      body: `<div class="formgrid">${clientSelect('wClient', clients, clientId)}${field('Nombre de la rutina', 'wName', 'Ej. Tren superior A', 'text', '', { req: true, maxlength: 60 })}${selectField('Día / enfoque', 'wDay', L.DAYS, L.DAYS[0], { req: true })}${field('Fecha de inicio', 'wStart', '', 'date', t, { req: true, min: shift(t, { years: -1 }), max: shift(t, { years: 2 }) })}</div>
      <div class="cardhead" style="margin-top:20px"><h2>Ejercicios <span class="req">*</span></h2><button class="btn small" type="button" data-action="exercise:add">＋ Ejercicio</button></div>
      <datalist id="exLib">${PF.ExerciseLibrary.all().map(e => `<option value="${esc(e.name)}">`).join('')}</datalist><div id="exerciseRows"></div><div class="err" id="e-exerciseRows" role="alert"></div>
      ${textareaField('Indicaciones del entrenador', 'wNotes', 2, 'Calentamiento, técnica, progresión...')}<div class="note">RIR = repeticiones en reserva (0–10). El descanso se expresa en segundos.</div>`,
      onSave: () => {
        syncRows();
        return onSubmit({ clientId: read('wClient'), name: read('wName'), day: read('wDay'), start: read('wStart'), notes: read('wNotes'), exercises: rows.map(r => ({ ...r })) });
      }
    });
    renderRows();
  }

  /* ---------- Evaluación (composición corporal, contornos y signos vitales) ---------- */
  const MKEYS = [['weight', 'mWeight'], ['fat', 'mFat'], ['muscle', 'mMuscle'], ['water', 'mWater'], ['visceral', 'mVisceral'], ['bone', 'mBone'], ['bmr', 'mBmr'], ['metAge', 'mMetAge'], ['neck', 'mNeck'], ['chest', 'mChest'], ['arm', 'mArm'], ['waist', 'mWaist'], ['hip', 'mHip'], ['thigh', 'mThigh'], ['calf', 'mCalf'], ['rhr', 'mRhr']];
  function readMeasure() {
    const v = { clientId: read('mClient'), date: read('mDate'), method: read('mMethod'), notes: read('mNotes') };
    MKEYS.forEach(([k, id]) => { v[k] = read(id); });
    return v;
  }
  // items: [{label, value, dec, unit, formula, calc, cat}] (PF.Metrics.preview)
  function showMeasurePreview(items) {
    const el = document.getElementById('mPreview'); if (!el) return;
    el.innerHTML = items && items.length ? `<div class="mpreview-t">Cálculo automático · referencia, no un veredicto · así se obtiene cada dato</div>${items.map(i => `<div class="mp-item"><small>${esc(i.label)}</small><b>${Number(i.value).toFixed(i.dec)}${i.unit ? ' ' + esc(i.unit) : ''}</b>${i.cat ? `<span class="chip ${esc(i.cat.tone)}">${esc(i.cat.t)}</span>` : ''}<em>= ${esc(i.formula)}</em><span class="mp-calc">${esc(i.calc)}</span></div>`).join('')}` : '';
  }
  function measure({ clients, clientId = '', onSubmit }) {
    const t = today(), n = (min, max, step = 0.1) => ({ min, max, step, inputmode: 'decimal', 'data-input': 'measure:preview' });
    const ni = (min, max) => ({ min, max, step: 1, inputmode: 'numeric', 'data-input': 'measure:preview' });
    Modal.open({
      title: 'Registrar evaluación', saveLabel: 'Guardar evaluación',
      body: `<div class="err" id="e-mGeneral" role="alert"></div>${PF.Views.Advisory.line(PF.Advisory.short(false))}<div class="formgrid">${clientSelect('mClient', clients, clientId)}${field('Fecha', 'mDate', '', 'date', t, { req: true, min: shift(t, { years: -10 }), max: t })}${selectField('Método de composición corporal', 'mMethod', L.METHOD, '', { placeholder: 'Sin indicar' })}</div>
      <div class="formsub">Composición corporal</div><div class="formnote">Datos de báscula de bioimpedancia, plicómetro o DEXA. Usá siempre el mismo método para poder comparar.</div>
      <div class="formgrid">${field('Peso (kg)', 'mWeight', 'Ej. 75.2', 'number', '', n(25, 350))}${field('% de grasa corporal', 'mFat', 'Ej. 22.5', 'number', '', n(2, 70))}${field('Masa muscular esquelética (kg)', 'mMuscle', 'Ej. 32.4', 'number', '', n(10, 80))}${field('Agua corporal (%)', 'mWater', 'Ej. 55', 'number', '', n(30, 80))}${field('Grasa visceral (nivel)', 'mVisceral', 'Ej. 6', 'number', '', ni(1, 59))}${field('Masa ósea (kg)', 'mBone', 'Ej. 2.9', 'number', '', n(0.5, 8))}${field('Metabolismo basal (kcal)', 'mBmr', 'Ej. 1650', 'number', '', ni(800, 4500))}${field('Edad metabólica (años)', 'mMetAge', 'Ej. 28', 'number', '', ni(10, 99))}</div>
      <div class="formsub">Contornos (cm)</div>
      <div class="formgrid">${field('Cuello', 'mNeck', 'Ej. 36', 'number', '', n(20, 70))}${field('Pecho', 'mChest', 'Ej. 98', 'number', '', n(40, 250))}${field('Brazo', 'mArm', 'Ej. 35', 'number', '', n(10, 80))}${field('Cintura', 'mWaist', 'Ej. 82', 'number', '', n(30, 250))}${field('Cadera', 'mHip', 'Ej. 96', 'number', '', n(30, 250))}${field('Muslo', 'mThigh', 'Ej. 56', 'number', '', n(20, 120))}${field('Pantorrilla', 'mCalf', 'Ej. 38', 'number', '', n(15, 70))}</div>
      <div class="formsub">Signos vitales</div><div class="formgrid">${field('Frecuencia cardíaca en reposo (lpm)', 'mRhr', 'Ej. 62', 'number', '', ni(30, 140))}</div>
      <div class="mpreview" id="mPreview" aria-live="polite"></div>
      <details class="calc-help"><summary>¿Cómo se calculan estos datos?</summary><ul>${PF.Learn.formulas().map(f => `<li><b>${esc(f.name)}</b><code>${esc(f.formula)}</code><span>${esc(f.note)}</span></li>`).join('')}</ul><p class="learn-note">Las categorías (por ejemplo «Peso saludable») se asignan comparando el resultado con rangos de referencia de la OMS y de guías de salud. Son orientativas, no un diagnóstico.</p></details>${textareaField('Observaciones', 'mNotes', 3, 'Cambios observados, condiciones de medición (ayunas, hora, hidratación)...')}<div class="note">Registrá al menos un dato. Los campos vacíos se omiten.</div>`,
      onSave: () => onSubmit(readMeasure())
    });
  }

  /* ---------- Objetivo nutricional (con sugerencia automática) ---------- */
  const readSuggestInputs = () => ({ clientId: read('nClient'), sex: read('nSex'), activity: read('nActivity') });
  function setSuggestNote(html, kind = '') { const el = document.getElementById('nSuggestNote'); if (el) { el.className = 'note ' + kind; el.innerHTML = html; } }
  function fillSuggestion(r, inputs) {
    [['nCal', r.kcal], ['nProtein', r.protein], ['nCarbs', r.carbs], ['nFat', r.fat]].forEach(([id, v]) => { const el = document.getElementById(id); if (el) { el.value = v; F.clearError(el); } });
    if (inputs) { const a = document.getElementById('nSex'), b = document.getElementById('nActivity'); if (a && inputs.sex) a.value = inputs.sex; if (b && inputs.activity) b.value = inputs.activity; }
  }
  function nutrition({ clients, clientId = '', onSubmit }) {
    const n = (min, max) => ({ min, max, step: 1, inputmode: 'numeric' });
    Modal.open({
      title: 'Objetivo nutricional', saveLabel: 'Guardar objetivo',
      body: `${PF.Views.Advisory.line(PF.Advisory.nutrition(false))}<div class="formgrid">${clientSelect('nClient', clients, clientId)}</div>
      <div class="suggest"><div class="suggest-t">✨ Sugerencia automática</div><div class="formgrid">${selectField('Sexo', 'nSex', L.SEX, '', { placeholder: 'Usar el del cliente' })}${selectField('Nivel de actividad', 'nActivity', L.ACTIVITY, '', { placeholder: 'Usar el del cliente' })}</div><button type="button" class="btn small" data-action="nutrition:suggest">Calcular calorías y macros</button><div class="note" id="nSuggestNote">Calcula el gasto energético (Mifflin-St Jeor) y propone calorías y macronutrientes según el objetivo del cliente. Podés editar los valores antes de guardar.</div></div>
      <div class="formgrid">${field('Calorías objetivo (kcal)', 'nCal', 'Ej. 2400', 'number', '', { req: true, ...n(800, 8000) })}${field('Proteína (g/día)', 'nProtein', 'Ej. 150', 'number', '', n(0, 500))}${field('Carbohidratos (g/día)', 'nCarbs', 'Ej. 280', 'number', '', n(0, 1200))}${field('Grasas (g/día)', 'nFat', 'Ej. 70', 'number', '', n(0, 400))}${selectField('Adherencia actual', 'nAdh', L.NUT_ADH, L.NUT_ADH[0], { req: true })}</div>${textareaField('Notas / estrategia', 'nNotes', 3, 'Preferencias, distribución, acuerdos...')}<div class="note">${esc(PF.Advisory.nutrition(false))}</div>`,
      onSave: () => onSubmit({ clientId: read('nClient'), cal: read('nCal'), protein: read('nProtein'), carbs: read('nCarbs'), fat: read('nFat'), adherence: read('nAdh'), notes: read('nNotes') })
    });
  }

  /* ---------- Revisión ---------- */
  function checkin({ clients, clientId = '', onSubmit }) {
    const t = today();
    Modal.open({
      title: 'Nueva revisión', saveLabel: 'Guardar revisión',
      body: `<div class="formgrid">${clientSelect('kClient', clients, clientId)}${field('Fecha', 'kDate', '', 'date', t, { req: true, min: shift(t, { years: -1 }), max: t })}${selectField('Adherencia al plan', 'kAdh', L.CHK_ADH, L.CHK_ADH[0], { req: true })}${selectField('Energía', 'kEnergy', L.ENERGY, L.ENERGY[1], { req: true })}${selectField('Sueño', 'kSleep', L.SLEEP, L.SLEEP[0], { req: true })}${selectField('Fatiga', 'kFatigue', L.FATIGUE, L.FATIGUE[1], { req: true })}</div>${textareaField('Comentarios y acuerdos', 'kNotes', 3, 'Dificultades, cambios, próximos pasos...')}`,
      onSave: () => onSubmit({ clientId: read('kClient'), date: read('kDate'), adherence: read('kAdh'), energy: read('kEnergy'), sleep: read('kSleep'), fatigue: read('kFatigue'), notes: read('kNotes') })
    });
  }

  /* ---------- Ejercicio propio ---------- */
  function exercise({ onSubmit }) {
    const Lib = PF.ExerciseLibrary;
    Modal.open({
      title: 'Añadir ejercicio a la biblioteca', saveLabel: 'Guardar ejercicio',
      body: `<div class="formgrid">${field('Nombre', 'xName', 'Ej. Remo Pendlay', 'text', '', { req: true, maxlength: 60 })}${selectField('Grupo muscular', 'xGroup', Lib.GROUPS, Lib.GROUPS[0], { req: true })}${field('Equipo', 'xEquip', 'Ej. Barra', 'text', '', { maxlength: 60 })}<div class="field"><label for="xTpl">Ilustración (movimiento)</label><select id="xTpl" aria-describedby="e-xTpl">${Object.entries(Lib.TEMPLATES).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('')}</select><div class="err" id="e-xTpl" role="alert"></div></div></div>${field('Enlace de imagen o GIF (opcional)', 'xImage', 'https://… (si lo dejás vacío se genera la ilustración)', 'url', '', { maxlength: 500, inputmode: 'url' })}${textareaField('Descripción / ejecución', 'xDesc', 3, 'Cómo se ejecuta y qué músculos trabaja...', { maxlength: 400 })}`,
      onSave: () => onSubmit({ name: read('xName'), group: read('xGroup'), equip: read('xEquip'), tpl: read('xTpl'), image: read('xImage'), desc: read('xDesc') })
    });
  }

  /* ---------- Contraseña (cifrado) ---------- */
  function passwordSetup({ onSubmit }) {
    Modal.open({
      title: 'Proteger con contraseña', saveLabel: 'Activar cifrado',
      body: `<p class="formnote">Tus datos se guardarán <b>cifrados</b> en este dispositivo y se pedirá la contraseña al abrir la app. <b>No hay forma de recuperarla</b>: si la olvidás, los datos se pierden (por eso conviene hacer respaldos).</p>${field('Contraseña nueva', 'spw1', 'Mínimo 10 caracteres, con letras y números', 'password', '', { req: true, autocomplete: 'new-password', maxlength: 128 })}${field('Repetir contraseña', 'spw2', '', 'password', '', { req: true, autocomplete: 'new-password', maxlength: 128 })}${checkField('Entiendo que si olvido la contraseña no podré recuperar los datos', 'sack', false)}`,
      onSave: () => onSubmit({ pass: read('spw1'), confirm: read('spw2'), ack: read('sack') })
    });
  }
  function passwordConfirm({ title, intro, saveLabel, onSubmit }) {
    Modal.open({ title, saveLabel, body: `<p class="formnote">${intro}</p>${field('Contraseña actual', 'dpw', '', 'password', '', { req: true, autocomplete: 'current-password', maxlength: 128 })}`, onSave: () => onSubmit({ pass: read('dpw') }) });
  }

  /* ---------- Perfil del cliente (solo lectura) ---------- */
  function profile(p) {
    const c = p.client, m = p.lastMeasure, n = p.nutrition, k = p.lastCheckin;
    Modal.open({
      title: 'Perfil de ' + c.name, saveLabel: 'Listo', onSave: () => Modal.close(),
      body: `<div class="grid-cards" style="grid-template-columns:repeat(2,1fr)"><div class="mini"><small>Objetivo</small><strong>${esc(c.goal)}</strong></div><div class="mini"><small>Experiencia</small><strong>${esc(c.experience)}</strong></div><div class="mini"><small>Peso de referencia</small><strong>${c.weight ?? '—'} kg</strong></div><div class="mini"><small>Altura</small><strong>${c.height ?? '—'} cm</strong></div></div><p class="muted">${esc(c.email || 'Sin correo')} · ${c.age ? esc(c.age) + ' años' : 'Edad no indicada'}</p><p>${esc(c.notes || 'Sin notas iniciales.')}</p><hr style="border-color:var(--line)"><p><b>Rutinas:</b> ${p.workoutCount} · <b>Evaluaciones:</b> ${p.measureCount}</p><p><b>Última evaluación:</b> ${m ? fmtDate(m.date) + ' · ' + (m.weight ?? '—') + ' kg' : 'Sin evaluar'}</p><p><b>Nutrición:</b> ${n ? `${n.cal ?? '—'} kcal · proteína ${n.protein ?? '—'} g` : 'Sin objetivo registrado'}</p><p><b>Última revisión:</b> ${k ? fmtDate(k.date) + ' · adherencia ' + esc(k.adherence) : 'Sin revisiones'}</p><p><b>Consentimiento de datos:</b> ${c.consent ? 'registrado' + (c.consentDate ? ' el ' + fmtDate(c.consentDate) : '') : 'no registrado'}</p>`
    });
  }

  return { readMeasure, showMeasurePreview, readSuggestInputs, setSuggestNote, fillSuggestion, showErrors, client, org, workout, measure, nutrition, checkin, exercise, passwordSetup, passwordConfirm, profile };
})();
