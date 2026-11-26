/* VISTA · Ilustraciones de ejercicios en 3D (generadas por código, sin imágenes externas).
   Cada ejercicio es un modelo 3D del cuerpo + equipo (barra, discos, banco, rack, poleas, máquinas) proyectado con
   una cámara 3/4 propia: [giro, inclinación]. Dos posiciones lado a lado: INICIO → FINAL.
   Ejes del mundo: x = hacia adelante de la persona · y = arriba · z = su derecha.
   Ángulos (grados) en el plano sagital: t torso desde la vertical (-90 = acostado) · a brazo desde "abajo"
   (90 al frente, 180 arriba) · e codo (antebrazo = a+e) · h muslo desde "abajo" · k flexión de rodilla (espinilla = h-k).
   Ancho del cuerpo: gr = mitad del agarre · ef = codos hacia afuera · ab/fb = abducción de brazo/antebrazo ·
   la/la2 = abducción de muslo/espinilla · st = apertura de pies · sy = hombros arriba · tw = giro del torso ·
   gc = desplazamiento lateral de manos · rx = rodar el cuerpo (plancha lateral) · y = salto.
   Segundo juego (a2,e2,h2,k2,fa2) = lado izquierdo. */
PF.Views.ExerciseArt = (function () {
  const r = d => d * Math.PI / 180, S = d => Math.sin(r(d)), C = d => Math.cos(r(d));
  const DS = { t: 0, a: 0, e: 0, h: 0, k: 0, fa: 90, y: 0 };
  const LIE = { t: -90, h: 95, k: 95, st: 14 };      // acostado en banco, pies en el suelo
  const SEAT = { h: 90, k: 90, st: 8 };              // sentado

  /* [inicio, final, escenario]   escenario: cam, al, bench, rack, cab, bars, bar, step, stepbox, box, post, roller, pad2, kb, mid, db, one, eqAt, fd, lbl, off1 */
  const T = {
    benchPress:   [{ ...LIE, a: 180, gr: 21 }, { ...LIE, a: 70, e: 110, gr: 21, ef: 4 }, { bench: 'pad', rack: 1, al: 'hip', cam: [135, 30] }],
    inclinePress: [{ t: -50, h: 100, k: 95, st: 14, a: 175, e: 5, gr: 17 }, { t: -50, h: 100, k: 95, st: 14, a: 70, e: 110, gr: 17, ef: 3 }, { bench: 'pad', al: 'hip', cam: [135, 26] }],
    declinePress: [{ t: -108, h: 108, k: 80, st: 8, a: 180, gr: 21 }, { t: -108, h: 108, k: 80, st: 8, a: 70, e: 110, gr: 21, ef: 4 }, { bench: 'pad', rack: 1, al: 'hip', cam: [135, 28] }],
    machinePress: [{ t: -8, ...SEAT, a: -70, e: 160, gr: 20 }, { t: -8, ...SEAT, a: 88, e: 2, gr: 20 }, { bench: 'seat', al: 'hip', cam: [38, 14] }],
    flyFlat:      [{ ...LIE, a: 180, ab: 8, fb: 8, e: 0 }, { ...LIE, a: 180, ab: 95, fb: 80 }, { bench: 'pad', al: 'hip', cam: [135, 30] }],
    cableFly:     [{ t: 8, a: -10, ab: 100, fb: 100, h: 14, k: 4, h2: -14, k2: 4 }, { t: 8, a: 62, e: 5, gr: 3, h: 14, k: 4, h2: -14, k2: 4 }, { cab: 'F', cam: [82, 8] }],
    pushup:       [{ t: 70, h: -70, fa: 25, gr: 18 }, { t: 77, h: -77, a: -60, e: 60, fa: 25, gr: 18, ef: 6 }, { cam: [14, 12] }],
    dipBars:      [{ t: 10, k: 70, gr: 19 }, { t: 28, a: -60, e: 60, k: 70, gr: 19, ef: 5 }, { bars: 1, al: 'wr', fd: 34, cam: [42, 14] }],
    pullup:       [{ a: 180, k: 30, gr: 26 }, { a: 28, e: 152, t: -6, k: 30, gr: 26, ef: 6 }, { bar: 1, al: 'wr', fd: 24, cam: [-35, 12] }],
    chinup:       [{ a: 180, k: 30, gr: 12 }, { a: 10, e: 170, t: -12, k: 30, gr: 12 }, { bar: 1, al: 'wr', fd: 24, big: 1, cam: [38, 8] }],
    latPulldown:  [{ t: -12, ...SEAT, a: 172, gr: 30 }, { t: -12, ...SEAT, a: 20, e: 130, gr: 30, ef: 6 }, { bench: 'seat', cab: 'T', al: 'hip', cam: [-35, 12] }],
    bentRow:      [{ t: 65, h: 15, k: 35, gr: 19 }, { t: 65, h: 15, k: 35, a: -112, e: 112, gr: 19, ef: 6 }, { cam: [-32, 20] }],
    dbRow:        [{ t: 75, h: 10, k: 20, a2: 0, e2: 0, h2: 0, k2: 90, gr: 11 }, { t: 75, h: 10, k: 20, a: -95, e: 95, a2: 0, e2: 0, h2: 0, k2: 90, gr: 11 }, { bench: 'hand', one: 1, cam: [-42, 18] }],
    seatedRow:    [{ t: 18, h: 88, k: 28, st: 8, a: 88, gr: 4 }, { t: -8, h: 88, k: 28, st: 8, a: -60, e: 145, gr: 4 }, { bench: 'seat', cab: 'L', al: 'hip', cam: [-35, 12] }],
    machineRow:   [{ t: 0, ...SEAT, a: 88, gr: 20 }, { t: 0, ...SEAT, a: -70, e: 155, gr: 20 }, { bench: 'seat', pad2: 1, al: 'hip', cam: [-35, 12] }],
    deadlift:     [{ t: 54, h: 81, k: 90, gr: 13 }, { t: -3, gr: 13 }, { cam: [-38, 14] }],
    hyper:        [{ t: 160, h: -88, gr: 8 }, { t: 88, h: -88, gr: 8 }, { bench: 'hyper', al: 'hip', cam: [-28, 12] }],
    ohp:          [{ a: 30, e: 150, gr: 19 }, { t: -3, a: 178, e: 2, gr: 17 }, { cam: [35, 12] }],
    dbPress:      [{ t: -6, ...SEAT, a: 35, e: 145, gr: 17 }, { t: -6, ...SEAT, a: 175, e: 5, gr: 17 }, { bench: 'seat', al: 'hip', cam: [35, 12] }],
    arnold:       [{ t: -6, ...SEAT, a: 75, e: 95, gr: 9 }, { t: -6, ...SEAT, a: 175, e: 5, gr: 17 }, { bench: 'seat', al: 'hip', cam: [35, 12] }],
    lateralRaise: [{ ab: 4, fb: 4 }, { ab: 88, fb: 88 }, { cam: [32, 10] }],
    frontRaise:   [{ a: 0, gr: 11 }, { a: 90, e: -5, gr: 11 }, { cam: [58, 10] }],
    rearDelt:     [{ t: 70, h: 15, k: 25, a: 0, gr: 10 }, { t: 70, h: 15, k: 25, ab: 85, fb: 85 }, { cam: [-35, 16] }],
    facePull:     [{ t: -5, a: 85, gr: 4 }, { t: -5, a: 70, e: 100, ab: 60, fb: -60 }, { cab: 'A', cam: [-55, 10] }],
    shrug:        [{ a: 0, gr: 12 }, { a: 0, gr: 12, sy: 12 }, { cam: [-30, 8] }],
    barbellCurl:  [{ gr: 13 }, { a: 5, e: 145, gr: 13 }, { cam: [40, 10] }],
    dbCurl:       [{ a2: 0, e2: 0, gr: 11 }, { a: 5, e: 145, a2: 0, e2: 0, gr: 11 }, { cam: [38, 10] }],
    hammerCurl:   [{ gr: 11 }, { a: 5, e: 145, gr: 11 }, { db: 'x', cam: [38, 10] }],
    preacher:     [{ t: 8, ...SEAT, a: 45, gr: 10 }, { t: 8, ...SEAT, a: 45, e: 150, gr: 10 }, { bench: 'preacher', al: 'hip', cam: [40, 14] }],
    cableCurl:    [{ gr: 8 }, { a: 5, e: 145, gr: 8 }, { cab: 'L', cam: [38, 10] }],
    pushdown:     [{ t: 8, e: 95, gr: 6 }, { t: 8, gr: 6 }, { cab: 'T', cam: [35, 12] }],
    skull:        [{ ...LIE, a: 175, gr: 10 }, { ...LIE, a: 175, e: 95, gr: 10 }, { bench: 'pad', al: 'hip', cam: [135, 30] }],
    ohExt:        [{ ...SEAT, a: 166, gr: 4 }, { ...SEAT, a: 166, e: 165, gr: 4 }, { mid: 'y', bench: 'seat', al: 'hip', cam: [22, 8] }],
    kickback:     [{ t: 75, h: 12, k: 20, a: -80, e: 80, a2: 15, e2: 0, gr: 12 }, { t: 75, h: 12, k: 20, a: -80, a2: 15, e2: 0, gr: 12 }, { one: 1, cam: [8, 8] }],
    benchDip:     [{ t: -4, h: 62, a: -22, gr: 17, st: 6 }, { t: -4, h: 82, a: -85, e: 85, gr: 17, ef: 5, st: 6 }, { bench: 'dip', al: 'wr', cam: [52, 14] }],
    backSquat:    [{ a: -70, e: 192, gr: 27 }, { t: 40, h: 95, k: 125, a: -70, e: 192, gr: 27, st: 10 }, { rack: 1, cam: [35, 12] }],
    frontSquat:   [{ a: 70, e: 145, gr: 17 }, { t: 25, h: 100, k: 120, a: 70, e: 145, gr: 17, st: 10 }, { rack: 1, cam: [35, 12] }],
    goblet:       [{ a: 25, e: 140, gr: 3 }, { t: 22, h: 110, k: 135, a: 25, e: 140, gr: 3, st: 12 }, { mid: 'y', cam: [35, 12] }],
    sumo:         [{ la: 26, gr: 4 }, { h: 22, k: 22, la: 62, la2: 0, gr: 4 }, { mid: 'y', cam: [80, 12] }],
    hack:         [{ t: -20, h: 15, a: 10, e: 60, gr: 18 }, { t: -20, h: 58, k: 90, a: 10, e: 60, gr: 18, st: 8 }, { bench: 'sled', knAng: 1, cam: [14, 10] }],
    legPress:     [{ t: -45, h: 175, k: 80, a: 40, e: 60, gr: 18, st: 10 }, { t: -45, h: 135, k: 0, a: 40, e: 60, gr: 18, st: 10 }, { bench: 'press', al: 'hip', fd: 20, cam: [26, 12] }],
    lunge:        [{ h: 6, h2: -6, gr: 12 }, { t: 2, h: 90, k: 90, h2: -10, k2: 100, fa2: 40, gr: 12 }, { al: 'an2', cam: [12, 10] }],
    bulgarian:    [{ h2: -5, k2: 75, gr: 12 }, { t: 8, h: 95, k: 95, h2: -35, k2: 103, gr: 12 }, { bench: 'rear', cam: [32, 12] }],
    stepUp:       [{ t: 8, h: 80, k: 95, h2: 0, k2: 0, gr: 12 }, { h: 0, k: 0, h2: 85, k2: 90, gr: 12 }, { stepbox: 1, cam: [28, 10] }],
    rdl:          [{ gr: 14 }, { t: 70, h: 18, k: 5, a: -32, gr: 14 }, { cam: [-38, 14] }],
    legExt:       [{ t: -12, ...SEAT, a: 40, e: 60, gr: 14 }, { t: -12, h: 90, k: 0, a: 40, e: 60, gr: 14, st: 8 }, { bench: 'seat', rol: 'front', al: 'hip', cam: [28, 12] }],
    legCurl:      [{ t: -10, h: 88, k: 0, a: 40, e: 60, gr: 14, st: 8 }, { t: -10, h: 88, k: 95, a: 40, e: 60, gr: 14, st: 8 }, { bench: 'seat', rol: 'back', holdpad: 1, al: 'hip', cam: [28, 12] }],
    calf:         [{ fa: 135, fl: 12, st: 8 }, { fa: 28, fl: 12, st: 8 }, { step: 1, fd: 20, al: 'toe', cam: [-38, 10] }],
    hipThrust:    [{ t: -65, h: 115, k: 87, a: 70, gr: 22, st: 14 }, { t: -90, h: 90, k: 75, a: 70, gr: 22, st: 14 }, { bench: 'shoulder', eqAt: 'hip', al: 'sh', cam: [18, 10] }],
    bridge:       [{ t: -90, h: 120, k: 60, a: 90, gr: 12, st: 12 }, { t: -111, h: 111, k: 76, a: 75, gr: 12, st: 12 }, { al: 'sh', cam: [18, 10] }],
    gluteKick:    [{ t: 20, a: 60, h: 12, k: 8, h2: 0, k2: 0, gr: 12 }, { t: 20, a: 60, h: -38, k: 0, h2: 0, k2: 0, gr: 12 }, { cab: 'LA', post: 1, cuff: 1, al: 'an2', cam: [-50, 12] }],
    goodMorning:  [{ a: -70, e: 192, gr: 27 }, { t: 70, h: 20, k: 10, a: -70, e: 192, gr: 27 }, { cam: [-40, 14] }],
    plank:        [{ t: 100, h: 0, k: 90, e: 90, fa: -90, gr: 11 }, { t: 82, h: -82, e: 90, fa: 25, gr: 11 }, { lbl: ['RODILLAS', 'MANTENER'], cam: [12, 10] }],
    sidePlank:    [{ rx: 90, t: 82, h: -82, a: 0, e: 90, ab: 90, fb: 0, a2: 0, e2: 0, ab2: 0, fb2: 0, fa: 25 }, { rx: 90, t: 82, h: -82, a: 0, e: 90, ab: 90, fb: 0, a2: 0, e2: 0, ab2: 90, fb2: 90, fa: 25 }, { lbl: ['MANTENER', 'BRAZO ARRIBA'], cam: [8, 10] }],
    crunch:       [{ t: -90, h: 120, k: 60, a: 200, e: 100, gr: 7, ef: 8, st: 12 }, { t: -50, h: 120, k: 60, a: 240, e: 100, gr: 7, ef: 8, st: 12 }, { al: 'hip', cam: [24, 12] }],
    legRaise:     [{ a: 180, gr: 20 }, { a: 180, t: -8, h: 88, gr: 20 }, { bar: 1, al: 'wr', fd: 24, big: 1, cam: [30, 10] }],
    abWheel:      [{ t: 70, k: 90, gr: 10 }, { t: 80, h: -80, k: 10, a: 74, gr: 10 }, { cam: [14, 12] }],
    mountain:     [{ t: 70, h: -70, fa: 25, h2: -70, k2: 0, gr: 12 }, { t: 70, h: 75, k: 135, fa: 25, h2: -70, k2: 0, gr: 12 }, { al: 'an2', cam: [14, 12] }],
    russian:      [{ t: -40, h: 100, k: 15, a: 55, e: 100, gr: 4, st: 8 }, { t: -40, h: 100, k: 15, a: 40, e: 100, gr: 4, gc: 24, tw: 35, st: 8 }, { mid: 'y', al: 'hip', cam: [35, 18] }],
    kbSwing:      [{ t: 65, h: 25, k: 30, a: -30, gr: 4, st: 10 }, { a: 90, gr: 4, st: 10 }, { kb: 1, cam: [50, 12] }],
    burpee:       [{ t: 70, h: -70, fa: 25, gr: 18 }, { y: 4, a: 150, fa: 35, gr: 11 }, { lbl: ['PLANCHA', 'SALTO'], al: 'floor', cam: [18, 12] }],
    boxJump:      [{ t: 45, h: 100, k: 120, a: -50, gr: 10, st: 8 }, { t: 25, h: 55, k: 80, a: 70, gr: 10, st: 8 }, { box: 1, al: 'floor', off1: [58, 26, 0], cam: [48, 14] }],
    thruster:     [{ t: 25, h: 100, k: 120, a: 70, e: 145, gr: 17, st: 10 }, { t: -3, a: 178, e: 2, gr: 17 }, { cam: [35, 12] }]
  };
  // nombres antiguos de plantilla (ejercicios propios ya guardados)
  const ALIAS = { squat: 'backSquat', hinge: 'rdl', pressH: 'benchPress', pressV: 'ohp', row: 'bentRow', curl: 'barbellCurl', raise: 'frontRaise', fly: 'flyFlat', dip: 'dipBars', swing: 'kbSwing', kick: 'kickback', legext: 'legExt', legcurl: 'legCurl', hipthrust: 'hipThrust' };

  /* ---------- paleta y músculos ---------- */
  const COL = { limb: '#c5cee6', torso: '#9fadcf', head: '#d9e0f2' };
  const HL = '#ff7a1f', EQL = '#f3f6fc', EQD = '#262e47', FRAME = '#8d9bbb', PADC = '#3a4768', EDGE = '#0b1220';
  const MNAME = { chest: 'Pecho', back: 'Espalda', lats: 'Dorsales', lowback: 'Zona lumbar', abs: 'Abdomen', traps: 'Trapecios', shoulders: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos', quads: 'Cuádriceps', hams: 'Isquiotibiales', glutes: 'Glúteos', calves: 'Pantorrillas' };
  /* tpl: [principales, secundarios] */
  const MUS = {
    benchPress: [['chest'], ['shoulders', 'triceps']], inclinePress: [['chest', 'shoulders'], ['triceps']], declinePress: [['chest'], ['triceps']], machinePress: [['chest'], ['triceps', 'shoulders']],
    flyFlat: [['chest'], ['shoulders']], cableFly: [['chest'], ['shoulders']], pushup: [['chest'], ['triceps', 'shoulders', 'abs']], dipBars: [['chest', 'triceps'], ['shoulders']],
    pullup: [['lats'], ['biceps', 'forearms']], chinup: [['lats', 'biceps'], ['forearms']], latPulldown: [['lats'], ['biceps']], bentRow: [['back'], ['lats', 'biceps']], dbRow: [['lats'], ['biceps', 'back']],
    seatedRow: [['back'], ['biceps', 'lats']], machineRow: [['back'], ['biceps']], deadlift: [['hams', 'glutes', 'lowback'], ['back', 'forearms']], hyper: [['lowback'], ['glutes', 'hams']],
    ohp: [['shoulders'], ['triceps']], dbPress: [['shoulders'], ['triceps']], arnold: [['shoulders'], ['triceps']], lateralRaise: [['shoulders'], []], frontRaise: [['shoulders'], ['chest']],
    rearDelt: [['shoulders', 'back'], []], facePull: [['shoulders', 'traps'], ['back']], shrug: [['traps'], []],
    barbellCurl: [['biceps'], ['forearms']], dbCurl: [['biceps'], ['forearms']], hammerCurl: [['biceps', 'forearms'], []], preacher: [['biceps'], []], cableCurl: [['biceps'], ['forearms']],
    pushdown: [['triceps'], []], skull: [['triceps'], []], ohExt: [['triceps'], []], kickback: [['triceps'], []], benchDip: [['triceps'], ['chest', 'shoulders']],
    backSquat: [['quads', 'glutes'], ['hams', 'lowback']], frontSquat: [['quads'], ['glutes', 'abs']], goblet: [['quads', 'glutes'], []], sumo: [['quads', 'glutes'], []], hack: [['quads'], ['glutes']],
    legPress: [['quads', 'glutes'], ['hams']], lunge: [['quads', 'glutes'], ['hams']], bulgarian: [['quads', 'glutes'], ['hams']], stepUp: [['quads', 'glutes'], ['calves']],
    rdl: [['hams', 'glutes'], ['lowback']], legExt: [['quads'], []], legCurl: [['hams'], ['calves']], calf: [['calves'], []],
    hipThrust: [['glutes'], ['hams']], bridge: [['glutes'], ['hams']], gluteKick: [['glutes'], ['hams']], goodMorning: [['hams', 'lowback'], ['glutes']],
    plank: [['abs'], ['shoulders']], sidePlank: [['abs'], ['shoulders']], crunch: [['abs'], []], legRaise: [['abs'], []], abWheel: [['abs'], ['shoulders', 'lats']], mountain: [['abs'], ['quads', 'shoulders']], russian: [['abs'], []],
    kbSwing: [['glutes', 'hams'], ['shoulders', 'lowback']], burpee: [['quads', 'chest'], ['abs']], boxJump: [['quads', 'glutes'], ['calves']], thruster: [['quads', 'shoulders'], ['glutes', 'triceps']]
  };
  /* tpl: [principales, secundarios] */
  function muscles(tpl) { const m = MUS[ALIAS[tpl] || tpl] || [[], []]; return { main: m[0].map(c => MNAME[c]), sec: m[1].map(c => MNAME[c]) }; }

  /* ---------- vectores 3D ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = a => { const d = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / d, a[1] / d, a[2] / d]; };
  const mid = (a, b) => mul(add(a, b), 0.5), lerp = (a, b, t) => add(a, mul(sub(b, a), t)), avg = ps => mul(ps.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / ps.length);
  const f2 = n => (+n).toFixed(1);
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = i => Math.max(0, Math.min(255, Math.round(((n >> i) & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; };
  const LIGHT = nrm([0.35, 0.85, 0.45]), FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  const boxC = (c, sz, rz = 0) => {
    const hx = sz[0] / 2, hy = sz[1] / 2, hz = sz[2] / 2, cs = C(rz), sn = S(rz);
    return [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz], [-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]].map(q => [c[0] + q[0] * cs - q[1] * sn, c[1] + q[0] * sn + q[1] * cs, c[2] + q[2]]);
  };

  /* ---------- esqueleto 3D ---------- */
  const SK = ['sh', 'el', 'wr', 'hp', 'kn', 'an', 'toe'];
  const allPts = J => [J.hip, J.shc, J.head].concat(SK.map(k => J.R[k]), SK.map(k => J.L[k]));
  function xf(J, fp, fv) {
    const o = { P: J.P };
    ['hip', 'shc', 'head'].forEach(k => { o[k] = fp(J[k]); });
    ['ez', 'fr', 'up', 'hf', 'hu'].forEach(k => { o[k] = fv(J[k]); });
    ['R', 'L'].forEach(sd => { o[sd] = {}; SK.forEach(k => { o[sd][k] = fp(J[sd][k]); }); });
    o.pts = allPts(o);
    return o;
  }
  function fk3(P) {
    const sw = 9, hw = 5.5, up = [S(P.t), C(P.t), 0], fr = [C(P.t), -S(P.t), 0], ez = [0, 0, 1];
    const shc = add(mul(up, 34), [0, P.sy || 0, 0]), tw = P.tw || 0, twv = add(mul(ez, C(tw)), mul(fr, S(tw)));
    const side = s => {
      const sec = s < 0, a = sec ? (P.a2 ?? P.a) : P.a, e = sec ? (P.e2 ?? P.e) : P.e, h = sec ? (P.h2 ?? P.h) : P.h, k = sec ? (P.k2 ?? P.k) : P.k, fa = sec ? (P.fa2 ?? P.fa) : P.fa;
      const ab = sec ? (P.ab2 ?? P.ab) : P.ab, fb = sec ? (P.fb2 ?? P.fb) : P.fb;
      const sh = add(shc, mul(twv, s * sw)), hp = [0, 0, s * hw];
      let el, wr;
      if (ab != null) {
        const b = ab, f = fb ?? b;
        el = add(sh, [20 * S(a) * C(b), -20 * C(a) * C(b), s * 20 * S(b)]);
        wr = add(el, [18 * S(a + e) * C(f), -18 * C(a + e) * C(f), s * 18 * S(f)]);
      } else {
        const gr = P.gr ?? 11, ef = P.ef || 0, gc = P.gc || 0;
        el = [sh[0] + 20 * S(a), sh[1] - 20 * C(a), s * (sw + (gr - sw) * 0.45 + ef) + gc * 0.55];
        wr = [el[0] + 18 * S(a + e), el[1] - 18 * C(a + e), s * gr + gc];
      }
      const la = P.la || 0, la2 = P.la2 ?? la, st = P.st ?? 3;
      const kn = [hp[0] + 26 * S(h) * C(la), hp[1] - 26 * C(h) * C(la), hp[2] + s * (26 * S(la) + st * 0.5)];
      const an = [kn[0] + 26 * S(h - k) * C(la2), kn[1] - 26 * C(h - k) * C(la2), kn[2] + s * (26 * S(la2) + st * 0.5)];
      const fl = P.fl || 9;
      return { sh, el, wr, hp, kn, an, toe: [an[0] + fl * S(fa), an[1] - fl * C(fa), an[2]] };
    };
    const ho = P.ho != null ? P.ho : (P.t < 0 ? P.t : P.t * 0.45);
    let J = { P, hip: [0, 0, 0], shc, head: [shc[0] + 11 * S(P.t), shc[1] + 11 * C(P.t), 0], ez, fr, up, hf: [C(ho), -S(ho), 0], hu: [S(ho), C(ho), 0], R: side(1), L: side(-1) };
    if (P.rx) { const q = P.rx, rp = p => [p[0], p[1] * C(q) - p[2] * S(q), p[1] * S(q) + p[2] * C(q)]; J = xf(J, rp, rp); }
    return xf(J, p => [p[0], p[1] + (P.y || 0), p[2]], v => v);
  }
  const anchor = (J, al) => al === 'hip' ? J.hip : al === 'sh' ? J.shc : al === 'wr' ? J.R.wr : al === 'an2' ? J.L.an : al === 'toe' ? J.R.toe : J.R.an;

  /* ---------- una posición dibujada (panel) ---------- */
  const VH = 126;
  let uid = 0;
  function figure(tpl, eq, pi, ox) {
    const [p0, p1, sc = {}] = T[tpl] || T.backSquat;
    const shiftJ = (J, d) => xf(J, p => add(p, d), v => v), minY = J => Math.min(...J.pts.map(q => q[1]));
    let J0 = fk3({ ...DS, ...p0 }), J1 = fk3({ ...DS, ...p1 });
    if (sc.al === 'floor') { J0 = shiftJ(J0, [0, -minY(J0), 0]); J1 = shiftJ(J1, [0, -minY(J1), 0]); }
    else if (sc.al !== 'none') { const al = sc.al || 'an'; J1 = shiftJ(J1, sub(anchor(J0, al), anchor(J1, al))); }
    if (sc.off1) J1 = shiftJ(J1, sc.off1);
    const J = pi ? J1 : J0, gy = Math.min(minY(J0), minY(J1)) - (sc.fd || 0);

    /* cámara */
    const cam = sc.cam || [35, 14], yaw = cam[0], pitch = cam[1];
    const Rv = [C(yaw), 0, -S(yaw)], Vv = [S(yaw), 0, C(yaw)], cp = C(pitch), sp = S(pitch);
    const camD = p => p[0] * Vv[0] + p[2] * Vv[2], pr = p => [p[0] * Rv[0] + p[2] * Rv[2], p[1] * cp - camD(p) * sp];
    const depth = p => camD(p) * cp + p[1] * sp, viewDir = [Vv[0] * cp, sp, Vv[2] * cp];
    const sv = v => [v[0] * Rv[0] + v[2] * Rv[2], -(v[1] * cp - camD(v) * sp)];
    let k = 1, cxu = 0, minYu = 0, yb = VH - 22;
    const P3 = p => { const q = pr(p); return [ox + 50 + k * (q[0] - cxu), yb - k * (q[1] - minYu)]; };

    /* ---- primitivas ---- */
    const poly = (pts, fill, stroke, sw = 0.7) => `<polygon points="${pts.map(q => f2(q[0]) + ',' + f2(q[1])).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    const cap2 = (a, b, w1, w2, c, outline = true) => {
      const one = (x1, x2, col) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; const q = [[a[0] + nx * x1 / 2, a[1] + ny * x1 / 2], [b[0] + nx * x2 / 2, b[1] + ny * x2 / 2], [b[0] - nx * x2 / 2, b[1] - ny * x2 / 2], [a[0] - nx * x1 / 2, a[1] - ny * x1 / 2]]; return `<polygon points="${q.map(z => f2(z[0]) + ',' + f2(z[1])).join(' ')}" fill="${col}"/><circle cx="${f2(a[0])}" cy="${f2(a[1])}" r="${f2(x1 / 2)}" fill="${col}"/><circle cx="${f2(b[0])}" cy="${f2(b[1])}" r="${f2(x2 / 2)}" fill="${col}"/>`; };
      return (outline ? one(w1 + 1.6, w2 + 1.6, EDGE) : '') + one(w1, w2, c);
    };
    const postSvg = (a, b, w, col) => { const A = P3(a), B = P3(b); return `<line x1="${f2(A[0])}" y1="${f2(A[1])}" x2="${f2(B[0])}" y2="${f2(B[1])}" stroke="${EDGE}" stroke-width="${f2(w * k + 1.4)}" stroke-linecap="round"/><line x1="${f2(A[0])}" y1="${f2(A[1])}" x2="${f2(B[0])}" y2="${f2(B[1])}" stroke="${col}" stroke-width="${f2(w * k)}" stroke-linecap="round"/>`; };
    const solidSvg = (cs, col) => {
      const cen = avg(cs), out = [];
      FACES.forEach(f => {
        const p = f.map(i => cs[i]), fc = avg(p); let n = nrm(cross(sub(p[1], p[0]), sub(p[2], p[0])));
        if (dot(n, sub(fc, cen)) < 0) n = mul(n, -1);
        if (dot(n, viewDir) <= 0.001) return;
        out.push({ d: depth(fc), s: poly(p.map(P3), shade(col, 0.6 + 0.4 * Math.max(0, dot(n, LIGHT))), shade(col, 0.4)) });
      });
      return out.sort((a, b) => a.d - b.d).map(o => o.s).join('');
    };
    const disc3 = (c, n, rad, fill, stroke, sw = 0.9, hub = 0) => {
      const nn = nrm(n), hv = Math.abs(nn[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u = nrm(cross(nn, hv)), v = cross(nn, u), ring = rr => { const q = []; for (let i = 0; i < 18; i++) { const a = r(i * 20); q.push(P3(add(c, add(mul(u, rr * Math.cos(a)), mul(v, rr * Math.sin(a)))))); } return q; };
      return poly(ring(rad), fill, stroke, sw) + (hub ? poly(ring(rad * hub), 'none', stroke, 0.6) : '');
    };

    /* ---- escenario ---- */
    const items = [];
    const addBox = (c, sz, rz, col) => { const cs = boxC(c, sz, rz); items.push({ pts: cs, c, draw: () => solidSvg(cs, col) }); };
    const addPost = (a, b, w, col = FRAME) => items.push({ pts: [a, b], c: mid(a, b), draw: () => postSvg(a, b, w, col) });
    const addDisc = (c, n, rad, fill, stroke) => items.push({ pts: [add(c, [rad, rad, rad]), sub(c, [rad, rad, rad])], c, draw: () => disc3(c, n, rad, fill, stroke, 1) });
    const R0 = J0.R, L0 = J0.L, hip0 = J0.hip, sh0 = J0.shc, up0 = J0.up, fr0 = J0.fr, ang = v => Math.atan2(v[1], v[0]) * 180 / Math.PI;
    const legs = (p, zs = [-9, 9]) => zs.forEach(z => addPost([p[0], p[1], z], [p[0], gy, z], 2.4));
    const anchors = [], wb = mid(R0.wr, L0.wr), bench = sc.bench;
    if (sc.rack) {
      const rx0 = (bench ? sh0[0] : wb[0]) - 24, top = wb[1] + 24;
      [-36, 36].forEach(z => { addBox([rx0, (gy + top) / 2, z], [5, top - gy, 5], 0, FRAME); addBox([rx0 + 6, gy + 1.5, z], [30, 3, 7], 0, FRAME); addBox([rx0 + 10, wb[1] - 4, z], [16, 3, 4], 0, FRAME); });
    }
    if (bench === 'pad') {
      const A = add(sh0, mul(up0, 14)), B = add(hip0, mul(up0, -12)), cen = add(mid(A, B), mul(fr0, -9.5)), len = Math.hypot(A[0] - B[0], A[1] - B[1]);
      addBox(cen, [len, 8, 26], ang(up0), PADC);
      [A, B].forEach(e => legs(add(e, mul(fr0, -13))));
    } else if (bench === 'seat' || bench === 'press') {
      const lg = bench === 'press' ? 62 : 48;
      addBox(add(add(hip0, mul(up0, lg / 2 - 3)), mul(fr0, -8)), [lg, 6, 26], ang(up0), PADC);
      if (bench === 'seat') { addBox(add(hip0, [8, -7, 0]), [28, 6, 26], 0, PADC); legs([hip0[0] + 18, hip0[1] - 10]); legs([hip0[0] - 8, hip0[1] - 12]); }
      else { legs([hip0[0] + 4, hip0[1] - 12]); [-14, 14].forEach(z => { addBox([hip0[0] + 6 + 24, hip0[1] - 12 + 24, z], [72, 3, 5], 45, FRAME); addBox([hip0[0] + 22, gy + 1.5, z], [96, 3, 6], 0, FRAME); addPost([hip0[0] + 56, hip0[1] + 36, z], [hip0[0] + 56, gy, z], 2.6); }); }
    } else if (bench === 'sled') {
      const bc = add(add(hip0, mul(up0, 14)), mul(fr0, -8));
      addBox(bc, [78, 6, 26], ang(up0), PADC);
      [-1, 1].forEach(s => legs(add(add(bc, mul(up0, 39 * s)), [0, -4, 0]), [-11, 11])); [-15, 15].forEach(z => addBox([bc[0] - fr0[0] * 6, bc[1] - fr0[1] * 6, z], [100, 3, 5], ang(up0), FRAME));
      addBox([R0.an[0] + 6, R0.an[1] - 4, 0], [40, 4, 46], 0, FRAME);
    } else if (bench === 'preacher') {
      const dA = nrm(sub(R0.el, R0.sh)), n = [dA[1], -dA[0], 0], cp0 = add(mid(R0.sh, R0.el), mul(n, 5));
      addBox(cp0, [36, 6, 24], ang(dA), PADC); legs(add(add(cp0, mul(dA, 18)), [0, -3, 0]));
      addBox(add(hip0, [2, -7, 0]), [24, 6, 24], 0, PADC); legs([hip0[0] + 2, hip0[1] - 10]);
    } else if (bench === 'shoulder') {
      addBox([sh0[0] - 2, (gy + sh0[1] - 5) / 2, 0], [26, sh0[1] - 5 - gy, 32], 0, PADC);
    } else if (bench === 'hand') {
      const cx = (L0.an[0] + L0.wr[0]) / 2, w = Math.abs(L0.wr[0] - L0.an[0]) + 34;
      addBox([cx, L0.wr[1] - 4, -2], [w, 6, 26], 0, PADC); legs([cx - w / 2 + 4, L0.wr[1] - 7], [-9, 9]); legs([cx + w / 2 - 4, L0.wr[1] - 7], [-9, 9]);
    } else if (bench === 'dip') {
      addBox([R0.wr[0] - 14, R0.wr[1] - 4, 0], [34, 6, 38], 0, PADC); legs([R0.wr[0] - 26, R0.wr[1] - 7], [-15, 15]);
    } else if (bench === 'rear') {
      addBox([L0.an[0] - 2, L0.an[1] - 4, 0], [40, 5, 36], 0, PADC); [-16, 14].forEach(dx => legs([L0.an[0] + dx, L0.an[1] - 6], [-14, 14]));
    } else if (bench === 'hyper') {
      addBox([hip0[0] + 2, hip0[1] - 8, 0], [28, 8, 30], 0, PADC); [-11, 11].forEach(z => addPost([hip0[0] + 2, hip0[1] - 12, z], [hip0[0] + 2, gy, z], 2.6));
      addPost([R0.an[0], R0.an[1], -15], [R0.an[0], R0.an[1], 15], 3.4, PADC); [-13, 13].forEach(z => addPost([R0.an[0], R0.an[1] - 2, z], [R0.an[0], gy, z], 2.4));
    }
    if (sc.bars) { const x = R0.wr[0], y = R0.wr[1], z = Math.abs(R0.wr[2]); [-z, z].forEach(zz => { addPost([x - 22, y, zz], [x + 22, y, zz], 2.6); [-18, 18].forEach(dx => addPost([x + dx, y, zz], [x + dx, gy, zz], 2.6)); addBox([x, gy + 1.5, zz], [46, 3, 7], 0, FRAME); }); }
    if (sc.bar) { const x = R0.wr[0], y = R0.wr[1]; addPost([x, y, -40], [x, y, 40], 2.8); [-40, 40].forEach(zz => { addPost([x, y, zz], [x, y + 9, zz], 2.8); addBox([x, y + 10, zz], [14, 3, 8], 0, FRAME); }); }
    if (sc.step) addBox([R0.toe[0] + 14, (gy + R0.toe[1] - 1) / 2, 0], [46, R0.toe[1] - 1 - gy, 42], 0, PADC);
    if (sc.stepbox) { const top = R0.an[1] - 2; addBox([R0.an[0] + 9, (gy + top) / 2, 0], [30, top - gy, 40], 0, PADC); }
    if (sc.mat) { const mx = J0.pts.concat(J1.pts).map(q => q[0]), mc = (Math.min(...mx) + Math.max(...mx)) / 2, ml = Math.max(...mx) - Math.min(...mx) + 10; addBox([mc, gy - 1.6, 0], [ml, 3.2, 38], 0, '#35507a'); }
    if (sc.box) addBox([58, 13, 0], [36, 26, 44], 0, PADC);
    if (sc.holdpad) { const c = add(lerp(hip0, R0.kn, 0.7), [0, 7, 0]); addBox(c, [18, 4.5, 28], 0, PADC); addPost([c[0], c[1], -12], [c[0] - 12, c[1] + 24, -12], 2.4); addPost([c[0], c[1], 12], [c[0] - 12, c[1] + 24, 12], 2.4); }
    if (sc.pad2) addBox(add(add(sh0, mul(fr0, 9)), [0, -10, 0]), [5, 24, 26], 0, PADC);
    if (sc.post) { addPost([R0.wr[0], gy, 0], [R0.wr[0], R0.wr[1], 0], 3.2); addPost([R0.wr[0], R0.wr[1], -15], [R0.wr[0], R0.wr[1], 15], 2.6); addBox([R0.wr[0], gy + 1.5, 0], [30, 3, 20], 0, FRAME); }
    const cab = sc.cab;
    if (cab) {
      const ax = wb[0], top = gy + 112;
      if (cab === 'T') { const A = [ax, top, 0]; anchors.push(A); addPost([ax - 16, gy, 0], [ax - 16, top, 0], 3.2); addPost([ax - 16, top, 0], A, 3.2); addDisc(A, [0, 0, 1], 3.6, EQD, EQL); addBox([ax - 12, gy + 1.5, 0], [34, 3, 18], 0, FRAME); }
      else if (cab === 'F') { [-58, 58].forEach(z => { const A = [ax - 6, top, z]; anchors.push(A); addPost([ax - 10, gy, z], [ax - 10, top, z], 3.2); addPost([ax - 10, top, z], A, 3.2); addDisc(A, [0, 0, 1], 3.6, EQD, EQL); addBox([ax - 8, gy + 1.5, z], [26, 3, 14], 0, FRAME); }); }
      else { const bx = cab === 'LA' ? R0.an[0] : ax, A = [bx + 74, gy + (cab === 'A' ? 88 : 10), 0]; anchors.push(A); addPost([A[0] + 7, gy, 0], [A[0] + 7, gy + (cab === 'A' ? 112 : 64), 0], 3.2); addDisc(A, [0, 0, 1], 3.4, EQD, EQL); addBox([A[0] + 4, gy + 1.5, 0], [24, 3, 16], 0, FRAME); }
    }

    /* ---- encuadre automático ---- */
    const eqExtent = JJ => {
      const o = [], c = sc.eqAt === 'hip' ? JJ.hip : mid(JJ.R.wr, JJ.L.wr), Wd = sc.eqAt === 'hip' ? 38 : Math.abs(JJ.R.wr[2] - JJ.L.wr[2]) / 2 + 22;
      if (/barra/i.test(eq) && !/fija/i.test(eq)) [-1, 1].forEach(g => [[0, 12, 0], [0, -12, 0], [12, 0, 0], [-12, 0, 0]].forEach(d => o.push(add(add(c, mul(JJ.ez, g * Wd)), d))));
      return o;
    };
    const bodyPts = J0.pts.concat(J1.pts, eqExtent(J0), eqExtent(J1)), scenePts = items.reduce((a, i) => a.concat(i.pts), []).concat(anchors);
    const ptsAll = bodyPts.concat(scenePts);
    const ex = ptsAll.map(q => q[0]), ez_ = ptsAll.map(q => q[2]), xc = (Math.min(...ex) + Math.max(...ex)) / 2, zc = (Math.min(...ez_) + Math.max(...ez_)) / 2;
    const hx = (Math.max(...ex) - Math.min(...ex)) / 2 + 7, hz = Math.max(30, (Math.max(...ez_) - Math.min(...ez_)) / 2 + 5);
    const floor = [[xc - hx, gy, zc - hz], [xc + hx, gy, zc - hz], [xc + hx, gy, zc + hz], [xc - hx, gy, zc + hz]];
    const proj = ptsAll.map(pr), xs = proj.map(q => q[0]), ys = proj.map(q => q[1]);
    const W = Math.max(...xs) - Math.min(...xs), H = Math.max(...ys) - Math.min(...ys);
    k = Math.min(1.15, (VH - (sc.big ? 28 : 38)) / H, 80 / W); cxu = (Math.max(...xs) + Math.min(...xs)) / 2; minYu = Math.min(...ys); yb = (VH - 22) - Math.max(0, (VH - 36 - k * H) / 2);

    /* ---- cuerpo ---- */
    const parts = [];
    const capPart = (p, q, r1, r2, col, bias = 0) => parts.push({ d: depth(mid(p, q)) + bias, s: cap2(P3(p), P3(q), 2 * r1 * k, 2 * r2 * k, col) });
    const ring = (JJ, c, wl, dd) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(q => add(add(c, mul(JJ.ez, q[0] * wl)), mul(JJ.fr, q[1] * dd)));
    const joint = (p, rad, col, bias = 0.06) => { const q = P3(p); parts.push({ d: depth(p) + bias, s: `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(rad * k + 0.8)}" fill="${EDGE}"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(rad * k)}" fill="${col}"/>` }); };
    ['R', 'L'].forEach(sd => {
      const s = J[sd];
      capPart(s.hp, s.kn, 4.2, 3.4, COL.limb); capPart(s.kn, s.an, 3.2, 2.5, COL.limb); capPart(s.an, s.toe, 2.6, 2.4, COL.limb, 0.03);
      capPart(s.sh, s.el, 3.0, 2.6, COL.limb); capPart(s.el, s.wr, 2.5, 2.0, COL.limb);
      joint(s.kn, 3.5, COL.limb); joint(s.el, 2.9, COL.limb); joint(s.sh, 4.0, COL.limb); joint(s.wr, 2.5, COL.limb); joint(s.an, 2.8, COL.limb, 0.04);
    });
    const tc = ring(J, J.hip, 6.4, 4.2).concat(ring(J, J.shc, 10, 4.9));
    parts.push({ d: depth(avg(tc)), s: solidSvg(tc, COL.torso) });
    capPart(J.shc, lerp(J.shc, J.head, 0.6), 2.2, 2.2, COL.limb, 0.02);
    { const hc = P3(J.head), R = 5.6 * k; parts.push({ d: depth(J.head) + 0.1, s: `<circle cx="${f2(hc[0])}" cy="${f2(hc[1])}" r="${f2(R + 0.8)}" fill="${EDGE}"/><circle cx="${f2(hc[0])}" cy="${f2(hc[1])}" r="${f2(R)}" fill="${COL.head}"/>` }); }

    /* ---- equipo ---- */
    const barbell = /barra/i.test(eq) && !/fija/i.test(eq), dumb = /mancuerna|disco/i.test(eq), wheel = /rueda/i.test(eq);
    const bdisc = (c, n, rad, bias = 0.1) => parts.push({ d: depth(c) + bias, s: disc3(c, n, rad, EQD, EQL, 1.1, 0.4) });
    const bpost = (a, b, w, col, bias = 0.1) => parts.push({ d: depth(mid(a, b)) + bias, s: postSvg(a, b, w, col) });
    const hands = sc.one ? [J.R.wr] : [J.R.wr, J.L.wr];
    if (sc.kb) { const c = add(mid(J.R.wr, J.L.wr), [0, -7, 0]), q = P3(c); bpost(J.R.wr, J.L.wr, 1.5, EQL); parts.push({ d: depth(c) + 0.1, s: `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(6.8 * k)}" fill="#3b4670" stroke="${EQL}" stroke-width="1.1"/>` }); }
    else if (sc.mid) { const c = mid(J.R.wr, J.L.wr), ax = sc.mid === 'y' ? [0, 1, 0] : [0, 0, 1]; bpost(add(c, mul(ax, -5)), add(c, mul(ax, 5)), 1.5, EQL); [-5, 5].forEach(o => bdisc(add(c, mul(ax, o)), ax, 4.8)); }
    else if (wheel) { const c = mid(J.R.wr, J.L.wr); bpost(J.R.wr, J.L.wr, 1.6, EQL); bdisc(c, [0, 0, 1], 7.5); }
    else if (barbell) {
      const c = sc.eqAt === 'hip' ? J.hip : mid(J.R.wr, J.L.wr), Wd = sc.eqAt === 'hip' ? 38 : Math.abs(J.R.wr[2] - J.L.wr[2]) / 2 + 22, ez = J.ez;
      bpost(add(c, mul(ez, -Wd)), add(c, mul(ez, Wd)), 1.7, '#cfd6e6');
      [-1, 1].forEach(g => { bdisc(add(c, mul(ez, g * (Wd - 7))), ez, 11.5); bdisc(add(c, mul(ez, g * (Wd - 11))), ez, 9.5, 0.09); bdisc(add(c, mul(ez, g * (Wd - 2))), ez, 2.4, 0.12); });
    } else if (dumb) hands.forEach(h => { const ax = sc.db === 'x' ? [1, 0, 0] : [0, 0, 1]; bpost(add(h, mul(ax, -5)), add(h, mul(ax, 5)), 1.5, EQL); [-5, 5].forEach(o => bdisc(add(h, mul(ax, o)), ax, 4.6)); });
    else if (/polea/i.test(eq)) [J.R.wr, J.L.wr].forEach(h => bdisc(h, [0, 0, 1], 2.6));
    else if (/máquina/i.test(eq)) bpost(J.R.wr, J.L.wr, 1.8, EQL);
    if (sc.rol) {
      const An = a => [C(a), S(a), 0], Pq = J.P, n = An(Pq.h - Pq.k), pos = lerp(J.R.kn, J.R.an, 0.9), c = add(pos, mul(n, sc.rol === 'front' ? 3.6 : -3.6)), pv = add(hip0, [22, -13, 0]);
      parts.push({ d: depth(c) + 0.06, s: postSvg([c[0], c[1], -11], [c[0], c[1], 11], 5.2, PADC) });
      [-12, 12].forEach(z => parts.push({ d: depth(c) - 0.5, s: postSvg([c[0], c[1], z], [pv[0], pv[1], z], 2.4, FRAME) }));
      parts.push({ d: depth(pv) - 0.5, s: postSvg([pv[0], pv[1], -12], [pv[0], pv[1], 12], 2.4, FRAME) });
    }
    if (sc.cuff) { const c = lerp(J.R.kn, J.R.an, 0.92), n = nrm(sub(J.R.an, J.R.kn)); parts.push({ d: depth(c) + 0.12, s: disc3(c, n, 3.9, 'none', EQL, 1.9) }); }
    if (bench === 'press') { const c = add(mid(J.R.an, J.L.an), [3.5, 3.5, 0]); const cs = boxC(c, [3, 36, 48], 45); parts.push({ d: depth(c) + 0.05, s: solidSvg(cs, FRAME) }); }
    if (anchors.length) {
      const src = cab => cab === 'LA' ? [J.R.an] : (anchors.length > 1 ? [J.R.wr, J.L.wr] : [J.R.wr, J.L.wr]);
      anchors.forEach((A, i) => src(sc.cab).forEach((s, j) => { if (anchors.length > 1 && j !== (A[2] > 0 ? 0 : 1)) return; parts.push({ d: depth(mid(s, A)), s: `<line x1="${f2(P3(s)[0])}" y1="${f2(P3(s)[1])}" x2="${f2(P3(A)[0])}" y2="${f2(P3(A)[1])}" stroke="#8fb8ff" stroke-width="${f2(Math.max(0.8, 0.5 * k))}" stroke-linecap="round"/>` }); }));
    }

    /* ---- músculos resaltados ---- */
    const [MN, MS] = MUS[tpl] || [[], []];
    const hlA = (n, w) => { if (!n) return w; const v = dot(n, viewDir); if (v < 0.06) return w >= 0.7 ? 0.26 : 0; return w * (0.62 + 0.38 * Math.min(1, v * 1.5)); };
    const hlPoly = (pts, n, w) => { const al = hlA(n, w); if (al <= 0) return; parts.push({ d: depth(avg(pts)) + 0.3, s: `<polygon points="${pts.map(P3).map(q => f2(q[0]) + ',' + f2(q[1])).join(' ')}" fill="${HL}" opacity="${f2(al)}" stroke-linejoin="round"/>` }); };
    const hlCap = (p, q, rad, n, w) => { const al = hlA(n, w); if (al <= 0) return; parts.push({ d: depth(mid(p, q)) + 0.3, s: `<g opacity="${f2(al)}">${cap2(P3(p), P3(q), 2 * rad * k, 2 * rad * k, HL, false)}</g>` }); };
    const hlDisc = (c, rad, n, w) => { const al = hlA(n, w); if (al <= 0) return; const q = P3(c); parts.push({ d: depth(c) + 0.3, s: `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(rad * k)}" fill="${HL}" opacity="${f2(al)}"/>` }); };
    const wl = u => 6.4 + 3.6 * u, dd = u => 4.2 + 0.7 * u, Fz = u => dd(u) + 0.5, Bz = u => -(dd(u) + 0.5);
    const tp = (u, l, d) => add(add(add(J.hip, mul(J.up, 34 * u)), mul(J.ez, l)), mul(J.fr, d)), nF = J.fr, nB = mul(J.fr, -1);
    const An = a => [C(a), S(a), 0], Pp = J.P, sideFn = fn => [['R', false], ['L', true]].forEach(q => fn(J[q[0]], q[1]));
    const doHl = (code, w) => {
      switch (code) {
        case 'chest': [-1, 1].forEach(s => hlPoly([tp(0.56, s * 1.5, Fz(0.56)), tp(0.56, s * (wl(0.56) - 1.2), Fz(0.56)), tp(0.9, s * (wl(0.9) - 1.2), Fz(0.9)), tp(0.9, s * 1.5, Fz(0.9))], nF, w)); break;
        case 'abs': hlPoly([tp(0.1, -4.2, Fz(0.1)), tp(0.1, 4.2, Fz(0.1)), tp(0.5, 4.2, Fz(0.5)), tp(0.5, -4.2, Fz(0.5))], nF, w); break;
        case 'back': hlPoly([tp(0.48, -(wl(0.48) - 1.5), Bz(0.48)), tp(0.48, wl(0.48) - 1.5, Bz(0.48)), tp(0.9, wl(0.9) - 1.5, Bz(0.9)), tp(0.9, -(wl(0.9) - 1.5), Bz(0.9))], nB, w); break;
        case 'lats': [-1, 1].forEach(s => hlPoly([tp(0.22, s * 3.5, Bz(0.22)), tp(0.22, s * (wl(0.22) + 0.3), Bz(0.22)), tp(0.72, s * (wl(0.72) + 0.3), Bz(0.72)), tp(0.72, s * 3.5, Bz(0.72))], nB, w)); break;
        case 'lowback': hlPoly([tp(0.02, -5, Bz(0.02)), tp(0.02, 5, Bz(0.02)), tp(0.3, 5, Bz(0.3)), tp(0.3, -5, Bz(0.3))], nB, w); break;
        case 'traps': hlPoly([tp(0.78, -2, Bz(0.8)), tp(1.0, -10.5, Bz(1)), tp(1.0, 10.5, Bz(1)), tp(0.78, 2, Bz(0.8))], nB, w); break;
        case 'shoulders': sideFn(s => hlDisc(add(s.sh, mul(J.up, 1)), 4.8, null, w)); break;
        case 'biceps': case 'triceps': sideFn((s, sec) => { const n = An(sec ? (Pp.a2 ?? Pp.a) : Pp.a), nn = code === 'biceps' ? n : mul(n, -1); hlCap(add(lerp(s.sh, s.el, 0.14), mul(nn, 2.5)), add(lerp(s.sh, s.el, 0.86), mul(nn, 2.2)), 1.9, nn, w); }); break;
        case 'forearms': sideFn((s, sec) => { const a = sec ? (Pp.a2 ?? Pp.a) : Pp.a, e = sec ? (Pp.e2 ?? Pp.e) : Pp.e, nn = An(a + e); hlCap(add(lerp(s.el, s.wr, 0.12), mul(nn, 2)), add(lerp(s.el, s.wr, 0.88), mul(nn, 1.8)), 1.7, nn, w); }); break;
        case 'quads': case 'hams': sideFn((s, sec) => { const n = An(sec ? (Pp.h2 ?? Pp.h) : Pp.h), nn = code === 'quads' ? n : mul(n, -1); hlCap(add(lerp(s.hp, s.kn, 0.14), mul(nn, 3.4)), add(lerp(s.hp, s.kn, 0.88), mul(nn, 2.8)), 2.8, nn, w); }); break;
        case 'calves': sideFn((s, sec) => { const h = sec ? (Pp.h2 ?? Pp.h) : Pp.h, kk = sec ? (Pp.k2 ?? Pp.k) : Pp.k, nn = mul(An(h - kk), -1); hlCap(add(lerp(s.kn, s.an, 0.1), mul(nn, 2.6)), add(lerp(s.kn, s.an, 0.62), mul(nn, 2.2)), 2.1, nn, w); }); break;
        case 'glutes': sideFn(s => hlDisc(add(s.hp, mul(J.fr, -3.2)), 5.3, nB, w)); break;
      }
    };
    MS.forEach(c => doHl(c, 0.38)); MN.forEach(c => doHl(c, 0.88));

    if (sc.knAng && pi) {
      const K = P3(J.R.kn), A = P3(J.R.hp), B = P3(J.R.an), un = v => { const d = Math.hypot(v[0], v[1]) || 1; return [v[0] / d, v[1] / d]; };
      const ua = un([A[0] - K[0], A[1] - K[1]]), ub = un([B[0] - K[0], B[1] - K[1]]), rr = 8, sw = (ua[0] * ub[1] - ua[1] * ub[0]) > 0 ? 1 : 0, bi = un([ua[0] + ub[0], ua[1] + ub[1]]);
      const p1 = [K[0] + ua[0] * rr, K[1] + ua[1] * rr], p2 = [K[0] + ub[0] * rr, K[1] + ub[1] * rr], tx = [K[0] + bi[0] * (rr + 8), K[1] + bi[1] * (rr + 8) + 2];
      parts.push({ d: 1e9, s: `<path d="M${f2(p1[0])} ${f2(p1[1])} A${rr} ${rr} 0 0 ${sw} ${f2(p2[0])} ${f2(p2[1])}" fill="none" stroke="#fff" stroke-width="1.3"/><text x="${f2(tx[0])}" y="${f2(tx[1])}" font-size="6.6" font-weight="700" fill="#fff" text-anchor="middle">90°</text>` });
    }

    /* ---- flecha de movimiento (solo en INICIO) ---- */
    let arrow = '';
    if (!pi && !sc.ng) {
      const cand = JJ => [JJ.R.wr, JJ.R.kn, JJ.R.an, JJ.head, JJ.hip], wts = [1, 0.9, 0.9, 0.8, 0.7], c0 = cand(J0), c1 = cand(J1);
      let best = 0, bi = -1;
      c0.forEach((c, i) => { const a = P3(c), b = P3(c1[i]), d = Math.hypot(a[0] - b[0], a[1] - b[1]) * wts[i]; if (d > best) { best = d; bi = i; } });
      if (bi >= 0) {
        const a = P3(c0[bi]), b = P3(c1[bi]), d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (d > 9) {
          const nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d, qx = (a[0] + b[0]) / 2 + nx * d * 0.28, qy = (a[1] + b[1]) / 2 + ny * d * 0.28, an = Math.atan2(b[1] - qy, b[0] - qx);
          const hp = [0.45, -0.45].map(da => f2(b[0] - 6 * Math.cos(an + da)) + ',' + f2(b[1] - 6 * Math.sin(an + da))).join(' ');
          arrow = `<path d="M${f2(a[0])} ${f2(a[1])} Q${f2(qx)} ${f2(qy)} ${f2(b[0])} ${f2(b[1])}" fill="none" stroke="#fff" stroke-width="1.3" stroke-dasharray="3.2 2.6" stroke-linecap="round" opacity=".9"/><polygon points="${f2(b[0])},${f2(b[1])} ${hp}" fill="#fff" opacity=".95"/>`;
        }
      }
    }

    /* ---- ensamblado: suelo → escenario → cuerpo y equipo (por profundidad) → flecha ---- */
    let out = poly(floor.map(P3), '#0f1830', '#2a3b61', 0.9);
    items.sort((a, b) => depth(a.c) - depth(b.c)).forEach(i => { out += i.draw(); });
    parts.sort((a, b) => a.d - b.d).forEach(p => { out += p.s; });
    return out + arrow;
  }

  function svg(tpl, eq) {
    tpl = ALIAS[tpl] || tpl;
    const lb = (T[tpl] && T[tpl][2] && T[tpl][2].lbl) || ['INICIO', 'FINAL'];
    const pill = (cx, txt, hot) => { const w = txt.length * 3.9 + 10; return `<rect x="${cx - w / 2}" y="${VH - 13}" width="${w}" height="9.6" rx="4.8" fill="${hot ? '#3a1d0a' : '#16213a'}" stroke="${hot ? '#ff8a2b' : '#2b3a55'}" stroke-width=".6"/><text x="${cx}" y="${VH - 6.2}" font-size="5.6" font-weight="700" letter-spacing=".4" fill="${hot ? '#ff8a2b' : '#8a99b8'}" text-anchor="middle">${txt}</text>`; };
    const my = (VH - 14) / 2;
    return `<svg class="exart" viewBox="0 0 200 ${VH}" role="img" aria-label="Posición inicial y final"><defs><linearGradient id="pfbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233f"/><stop offset="1" stop-color="#0a1020"/></linearGradient></defs><rect width="200" height="${VH}" rx="10" fill="url(#pfbg)"/><clipPath id="pfc0"><rect x="1" y="1" width="98" height="${VH - 15}" rx="9"/></clipPath><clipPath id="pfc1"><rect x="101" y="1" width="98" height="${VH - 15}" rx="9"/></clipPath><g clip-path="url(#pfc0)">${figure(tpl, eq, 0, 0)}</g><g clip-path="url(#pfc1)">${figure(tpl, eq, 1, 100)}</g><path d="M95.5 ${my} h9 m-3.2 -3.2 l3.2 3.2 l-3.2 3.2" fill="none" stroke="#687894" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>${pill(50, lb[0], 0)}${pill(150, lb[1], 1)}</svg>`;
  }

  function render(ex) {
    if (ex.image) return `<img class="exart" src="${PF.Utils.esc(ex.image)}" alt="${PF.Utils.esc(ex.name)}" loading="lazy">`;
    return svg(ex.tpl, ex.equip || '');
  }
  return { render, muscles, templates: Object.keys(T) };
})();
