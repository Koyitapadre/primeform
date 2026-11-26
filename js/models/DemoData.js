/* ============================================================
   MODELO · Datos de ejemplo (FICTICIOS)
   ============================================================ */
PF.DemoData = {
  create() {
    const { uid, daysAgo, shift, today } = PF.Utils, t = today();

    const andrea = { id: uid(), name: 'Andrea Vargas', email: 'andrea.demo@example.com', age: 27, weight: 64.8, height: 166, goal: 'Pérdida de grasa', experience: 'Intermedio', start: daysAgo(70), notes: 'Ejemplo ficticio. Disponibilidad: 4 días por semana.', created: daysAgo(70), consent: true, consentDate: daysAgo(70), sex: 'Femenino', activity: 'Moderado', goalWeight: 60, goalFat: 24, goalDate: shift(t, { days: 110 }) };
    const daniel = { id: uid(), name: 'Daniel Rojas', email: 'daniel.demo@example.com', age: 31, weight: 84, height: 178, goal: 'Fuerza', experience: 'Avanzado', start: daysAgo(30), notes: 'Ejemplo ficticio.', created: daysAgo(30), consent: true, consentDate: daysAgo(30), sex: 'Masculino', activity: 'Alto', goalWeight: null, goalFat: 15, goalDate: '' };

    const m = (cid, d, o) => ({ id: uid(), clientId: cid, date: daysAgo(d), method: 'Bioimpedancia', weight: null, fat: null, muscle: null, water: null, visceral: null, bone: null, bmr: null, metAge: null, neck: null, chest: null, arm: null, waist: null, hip: null, thigh: null, calf: null, rhr: null, notes: '', ...o });
    // Andrea: 8 evaluaciones semanales
    const aw = [68.4, 67.9, 67.3, 66.8, 66.1, 65.6, 65.1, 64.8], af = [31.2, 30.6, 30.1, 29.4, 28.8, 28.2, 27.6, 27.0], am = [24.1, 24.2, 24.2, 24.4, 24.4, 24.5, 24.6, 24.6], aws = [82, 81.2, 80.5, 79.6, 78.8, 78, 77.2, 76.4];
    const andreaM = aw.map((w, i) => m(andrea.id, 49 - i * 7, { weight: w, fat: af[i], muscle: am[i], water: 49.5 + i * 0.25, visceral: 5 - Math.floor(i / 4), bone: 2.4, bmr: 1380 + i * 6, metAge: 31 - Math.floor(i / 3), neck: 31.5, chest: 91 - i * 0.2, arm: 27.5 + i * 0.1, waist: aws[i], hip: 100.5 - i * 0.4, thigh: 57.5 - i * 0.2, calf: 36, rhr: 72 - Math.floor(i / 2), notes: i === 7 ? 'Muy buena adherencia al plan.' : '' }));
    // Daniel: 4 evaluaciones
    const dw = [82.4, 83.0, 83.5, 84.0], df = [18.5, 18.1, 17.6, 17.2], dm = [36.4, 36.8, 37.2, 37.6];
    const danielM = dw.map((w, i) => m(daniel.id, 28 - i * 9, { weight: w, fat: df[i], muscle: dm[i], water: 58 + i * 0.2, visceral: 6, bone: 3.2, bmr: 1850 + i * 8, metAge: 29, neck: 38, chest: 101 + i * 0.4, arm: 36 + i * 0.3, waist: 84 - i * 0.5, hip: 99, thigh: 58.5 + i * 0.2, calf: 38, rhr: 58 }));

    const ck = (cid, d, o) => ({ id: uid(), clientId: cid, date: daysAgo(d), adherence: 'Alta', energy: 'Normal', sleep: 'Bueno', fatigue: 'Baja', notes: '', done: true, ...o });
    return {
      clients: [andrea, daniel],
      workouts: [{
        id: uid(), clientId: andrea.id, name: 'Tren superior A', day: 'Día 1 · Tren superior', start: daysAgo(60), notes: 'Mantener técnica controlada.',
        exercises: [
          { name: 'Press de banca con barra', sets: 3, reps: '6–8', rir: 2, rest: 150 },
          { name: 'Remo con barra', sets: 3, reps: '8–12', rir: 2, rest: 120 },
          { name: 'Elevaciones laterales', sets: 3, reps: '12–15', rir: 1, rest: 75 }
        ]
      }],
      measures: andreaM.concat(danielM),
      nutrition: [{ id: uid(), clientId: andrea.id, cal: 1850, protein: 130, carbs: 190, fat: 55, adherence: 'Alta', notes: 'Ejemplo ilustrativo, no prescripción.', date: daysAgo(40) }],
      checkins: [
        ck(andrea.id, 3, { notes: 'Ejemplo de revisión semanal.' }),
        ck(andrea.id, 10, { adherence: 'Media', sleep: 'Regular', fatigue: 'Moderada' }),
        ck(daniel.id, 19, { adherence: 'Media', sleep: 'Regular', fatigue: 'Moderada' })
      ]
    };
  }
};
