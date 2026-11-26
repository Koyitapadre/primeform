/* ============================================================
   MODELO · Learn (guía educativa de indicadores)
   Para cada indicador explica: qué es, cómo se mide/calcula (con los números
   del propio cliente), los rangos de referencia, por qué su resultado cae en
   esa categoría y qué tener en cuenta. Devuelve TEXTO PLANO (la vista lo escapa).
   Información educativa y orientativa: no es un diagnóstico.
   ============================================================ */
PF.Learn = (function () {
  const M = PF.Metrics, R = M.REF, fmt = M.fmt;
  const fld = (p, k) => p.fields.find(f => f.def.key === k), drv = (p, k) => p.derived.find(d => d.key === k);
  const dec = x => String(x).replace('.', ',');                      // 18.5 → 18,5 (texto en español)
  const signed = (d, n = 1) => (d > 0 ? '+' : d < 0 ? '−' : '') + fmt(Math.abs(d), n);
  const trend = (f, unit, pts = false) => { if (!f || f.n < 2) return ''; const d = f.def ? f.def.dec : f.dec; return ` Desde la primera evaluación cambió ${signed(f.delta, d)} ${pts ? 'puntos' : unit} (de ${fmt(f.first, d)} a ${fmt(f.last, d)}).`; };
  const SEX_NEEDED = 'Para clasificar este valor hace falta indicar el sexo en los datos del cliente (los rangos son distintos para mujeres y hombres).';
  const CAUTION = PF.Advisory.short();                 // «es una recomendación, no un veredicto» (se muestra ARRIBA de cada explicación)
  const rows = (list, cur) => list.map(r => ({ ...r, current: cur === r.label }));

  const TITLES = { weight: 'Peso corporal', bmi: 'Índice de masa corporal (IMC)', fat: '% de grasa corporal', fatMass: 'Masa grasa', leanMass: 'Masa magra', muscle: 'Masa muscular esquelética', water: 'Agua corporal', visceral: 'Grasa visceral', bone: 'Masa ósea', bmr: 'Metabolismo basal (TMB)', metAge: 'Edad metabólica', whr: 'Índice cintura-cadera', whtr: 'Índice cintura-estatura', waist: 'Cintura', neck: 'Cuello', chest: 'Pecho', arm: 'Brazo', hip: 'Cadera', thigh: 'Muslo', calf: 'Pantorrilla', rhr: 'Frecuencia cardíaca en reposo', composition: 'Composición corporal', goals: 'Metas y proyección', colors: 'Colores y flechas', summary: 'Resumen automático' };
  const LINES = { weight: 'Masa total del cuerpo.', bmi: 'Relaciona el peso con la altura: peso ÷ altura².', fat: 'Porcentaje del peso que es grasa.', fatMass: 'Kilos de grasa: peso × % de grasa.', leanMass: 'Todo lo que no es grasa: peso − masa grasa.', muscle: 'Músculos que movemos voluntariamente.', water: 'Porcentaje del peso que es agua.', visceral: 'Grasa que rodea los órganos del abdomen.', bone: 'Estimación del peso de los minerales de los huesos.', bmr: 'Calorías que el cuerpo gasta en reposo.', metAge: 'Compara el metabolismo con el promedio por edad.', whr: 'Cintura ÷ cadera: dónde se acumula la grasa.', whtr: 'Cintura ÷ altura: la cintura debería ser menos de la mitad de la altura.', waist: 'Contorno del abdomen: marcador de riesgo cardiometabólico.', neck: 'Contorno del cuello.', chest: 'Contorno del pecho.', arm: 'Contorno del brazo relajado.', hip: 'Contorno de la cadera.', thigh: 'Contorno del muslo.', calf: 'Contorno de la pantorrilla.', rhr: 'Pulsaciones por minuto en reposo.' };

  // Fórmulas que se muestran junto a "Cálculo automático" al registrar una evaluación
  const formulas = () => [
    { name: 'IMC', formula: 'peso (kg) ÷ altura (m)²', note: 'Relaciona el peso con la altura (rangos de la OMS).' },
    { name: 'Masa grasa', formula: 'peso × % de grasa ÷ 100', note: 'Kilos de grasa corporal.' },
    { name: 'Masa magra', formula: 'peso − masa grasa', note: 'Músculos, huesos, órganos y agua.' },
    { name: 'Cintura / cadera', formula: 'cintura ÷ cadera', note: 'Indica dónde se acumula la grasa.' },
    { name: 'Cintura / estatura', formula: 'cintura ÷ altura', note: 'Lo saludable es menos de 0,5 (cintura menor que la mitad de la altura).' },
    { name: 'Metabolismo basal (estimado)', formula: '10 × peso + 6,25 × altura − 5 × edad + 5 (hombres) o − 161 (mujeres)', note: 'Fórmula de Mifflin-St Jeor; se usa en la sugerencia nutricional.' }
  ];

  function explain(key, p) {
    const c = p.client, hm = c.height ? c.height / 100 : null, w = p.now.weight, f = fld(p, key), adultAge = c.age == null || c.age >= 18;
    const out = { key, title: TITLES[key] || key, what: '', how: '', formula: null, ranges: null, rangeNote: '', result: null, why: '', tips: [], limits: '', caution: CAUTION };
    const last = f ? f.last : null, sexOf = () => c.sex || '';
    switch (key) {
      case 'weight': {
        out.what = 'Es la masa total del cuerpo: incluye grasa, músculo, huesos, agua y órganos. Por sí solo no dice cuánto es grasa y cuánto es músculo, por eso se lee junto con el % de grasa, la masa muscular y las medidas.';
        out.how = 'Se mide con una báscula, idealmente en ayunas, a la misma hora y con ropa parecida.';
        if (w != null) out.result = { value: fmt(w, 1) + ' kg' };
        out.why = (w != null ? `El peso actual es ${fmt(w, 1)} kg.` : '') + trend(f, 'kg');
        if (hm && adultAge) out.why += ` Como referencia, para una altura de ${hm.toFixed(2)} m el rango de peso con IMC saludable va de ${fmt(18.5 * hm * hm, 1)} a ${fmt(25 * hm * hm, 1)} kg (no es una meta: depende de la composición corporal).`;
        out.tips = ['Pesate siempre en las mismas condiciones.', 'El peso fluctúa 1–2 kg en un día por líquidos y comidas: mirá la tendencia de varias semanas, no un solo día.'];
        out.limits = 'Un peso estable no significa que no haya cambios: se puede perder grasa y ganar músculo a la vez.';
        break;
      }
      case 'bmi': {
        const v = p.now.bmi, cat = p.now.bmiCat;
        out.what = 'El índice de masa corporal (IMC) relaciona el peso con la altura. Es una forma rápida de ubicar el peso dentro de rangos definidos por la Organización Mundial de la Salud (OMS).';
        out.how = 'Se calcula solo con el peso y la altura; no mide la grasa directamente.';
        out.formula = { text: 'IMC = peso (kg) ÷ altura (m)²', example: v != null ? `${fmt(w, 1)} kg ÷ (${hm.toFixed(2)} m × ${hm.toFixed(2)} m) = ${fmt(w, 1)} ÷ ${(hm * hm).toFixed(2)} = ${fmt(v, 1)}` : '' };
        if (adultAge) {
          out.ranges = rows([{ label: 'Bajo peso', range: 'menos de 18,5', tone: 'warn' }, { label: 'Peso saludable', range: '18,5 a 24,9', tone: 'good' }, { label: 'Sobrepeso', range: '25 a 29,9', tone: 'warn' }, { label: 'Obesidad', range: '30 o más', tone: 'bad' }], cat && cat.t);
          out.rangeNote = 'Rangos de la OMS para personas adultas.';
        }
        if (v != null) out.result = { value: fmt(v, 1), cat };
        if (v != null && !adultAge) out.why = 'En menores de 18 años el IMC no se interpreta con los rangos de adultos: se compara con curvas de crecimiento por edad y sexo (percentiles). Consultá con un profesional de la salud.';
        else if (v != null) {
          const lo = fmt(18.5 * hm * hm, 1), hi = fmt(25 * hm * hm, 1);
          out.why = cat.t === 'Peso saludable' ? `El IMC es ${fmt(v, 1)}: está entre 18,5 y 24,9, por eso se clasifica como «Peso saludable». Para una altura de ${hm.toFixed(2)} m, ese rango corresponde a un peso de ${lo} a ${hi} kg.`
            : cat.t === 'Bajo peso' ? `El IMC es ${fmt(v, 1)}: es menor que 18,5, por eso se clasifica como «Bajo peso». Para una altura de ${hm.toFixed(2)} m, el rango saludable empieza en ${lo} kg. Conviene consultar si esto no es lo habitual para la persona.`
              : `El IMC es ${fmt(v, 1)}: ${cat.t === 'Sobrepeso' ? 'está entre 25 y 29,9' : 'es 30 o más'}, por eso se clasifica como «${cat.t}». Para una altura de ${hm.toFixed(2)} m, el rango saludable llega hasta ${hi} kg. Ojo: el IMC no distingue músculo de grasa, así que conviene mirar también el % de grasa y la cintura.`;
        }
        out.tips = ['Tomalo como un punto de partida, no como un diagnóstico.', 'Combinalo con el % de grasa, la cintura y cómo se siente la persona.'];
        out.limits = 'No distingue músculo de grasa: una persona con mucha masa muscular puede tener un IMC alto sin exceso de grasa. Tampoco indica dónde se acumula la grasa y se interpreta distinto en menores de 18 años y en adultos mayores.';
        break;
      }
      case 'fat': {
        const cat = p.now.fatCat, lf = p.now.lastFull, sex = sexOf();
        out.what = 'El % de grasa corporal es la proporción del peso que corresponde a tejido graso. Una parte es necesaria: da energía, ayuda a regular hormonas y protege los órganos. Lo importante no es llegar a cero, sino estar en un rango saludable.';
        out.how = 'Se estima con bioimpedancia (una corriente eléctrica muy leve que atraviesa el cuerpo), con plicómetro (pliegues de la piel) o con DEXA. Cada método da valores algo distintos y la hidratación influye: conviene usar siempre el mismo método y condiciones similares.';
        out.formula = { text: '% de grasa = masa grasa ÷ peso × 100', example: lf ? `${fmt(lf.fatMass, 1)} kg ÷ ${fmt(lf.weight ?? w, 1)} kg × 100 = ${fmt(p.now.fat, 1)} %` : '' };
        if (sex && adultAge) {
          const t = R.fat[sex], pc = x => dec(x);
          out.ranges = rows([{ label: 'Grasa esencial', range: `menos de ${pc(t[0])}%`, tone: 'warn' }, { label: 'Atlético', range: `${pc(t[0])}% a ${pc(t[1] - 0.1)}%`, tone: 'good' }, { label: 'Fitness', range: `${pc(t[1])}% a ${pc(t[2] - 0.1)}%`, tone: 'good' }, { label: 'Promedio', range: `${pc(t[2])}% a ${pc(t[3] - 0.1)}%`, tone: 'info' }, { label: 'Alta', range: `${pc(t[3])}% o más`, tone: 'bad' }], cat && cat.t);
          out.rangeNote = `Rangos de referencia para ${sex === 'Femenino' ? 'mujeres' : 'hombres'} adultos (American Council on Exercise).`;
        }
        if (p.now.fat != null) out.result = { value: fmt(p.now.fat, 1) + ' %', cat };
        if (p.now.fat == null) out.why = 'Todavía no hay una evaluación con % de grasa.';
        else if (!adultAge) out.why = 'Los rangos de referencia son para adultos; en menores de 18 años deben interpretarse con un profesional.';
        else if (!sex) out.why = SEX_NEEDED;
        else { const t = R.fat[sex], i = t.findIndex(x => p.now.fat < x), k = i === -1 ? 4 : i, lo = k === 0 ? null : t[k - 1], hi = k === 4 ? null : t[k]; out.why = `El valor actual es ${fmt(p.now.fat, 1)}%: ${lo == null ? `es menor que ${dec(hi)}%` : hi == null ? `es ${dec(lo)}% o más` : `está entre ${dec(lo)}% y ${dec(hi - 0.1)}%`}, por eso se ubica en «${cat.t}».`; }
        out.why += trend(f, '%', true);
        out.tips = ['El entrenamiento de fuerza y una alimentación con suficiente proteína ayudan a perder grasa conservando músculo.', 'Los cambios sanos suelen ser graduales: lo importante es la tendencia de semanas, no un valor aislado.', 'Dormir bien y manejar el estrés también influyen.'];
        out.limits = 'Los rangos son referencias generales y no un diagnóstico. Un valor más bajo no siempre es mejor: por debajo del rango de grasa esencial puede afectar la salud.';
        break;
      }
      case 'fatMass': case 'leanMass': {
        const d = drv(p, key), lf = p.now.lastFull, isFat = key === 'fatMass';
        out.what = isFat ? 'Es la cantidad de kilos de grasa del cuerpo. Se calcula a partir del peso y del % de grasa.' : 'Es todo lo que no es grasa: músculos, huesos, órganos y agua. Ojo: masa magra no es lo mismo que músculo; el músculo es solo una parte.';
        out.how = 'No se mide directamente: se calcula con el peso y el % de grasa de la misma evaluación.';
        out.formula = isFat ? { text: 'Masa grasa (kg) = peso × % de grasa ÷ 100', example: lf ? `${fmt(lf.weight ?? w, 1)} kg × ${fmt(p.now.fat, 1)} ÷ 100 = ${fmt(lf.fatMass, 1)} kg` : '' } : { text: 'Masa magra (kg) = peso − masa grasa', example: lf ? `${fmt(lf.weight ?? w, 1)} kg − ${fmt(lf.fatMass, 1)} kg = ${fmt(lf.leanMass, 1)} kg` : '' };
        if (d) out.result = { value: fmt(d.last, 1) + ' kg' };
        out.why = d ? (isFat ? `De ${fmt(w, 1)} kg de peso, ${fmt(d.last, 1)} kg son grasa.` : `De ${fmt(w, 1)} kg de peso, ${fmt(d.last, 1)} kg son masa magra.`) + (d.n > 1 ? ` Desde la primera evaluación cambió ${signed(d.delta, 1)} kg (de ${fmt(d.first, 1)} a ${fmt(d.last, 1)} kg).` : '') : 'Hace falta una evaluación con peso y % de grasa.';
        out.tips = isFat ? ['Perder grasa y mantener la masa magra es lo que mejora la composición corporal.'] : ['Una masa magra estable o en aumento mientras baja la grasa es una excelente señal.'];
        out.limits = 'Depende de la exactitud del % de grasa, que es una estimación.';
        break;
      }
      case 'muscle': {
        const pct = f && w ? last / w * 100 : null;
        out.what = 'Es el músculo que movemos de forma voluntaria (brazos, piernas, espalda, abdomen). No incluye el músculo del corazón ni el de los órganos.';
        out.how = 'La estiman las básculas de bioimpedancia segmental o el DEXA; es una estimación, no una medición directa.';
        if (f) out.result = { value: fmt(last, 1) + ' kg' };
        out.why = f ? `El valor actual es ${fmt(last, 1)} kg${pct ? `, un ${fmt(pct, 0)}% del peso corporal` : ''}.` + trend(f, 'kg') : 'Todavía no hay una evaluación con masa muscular.';
        out.tips = ['El entrenamiento de fuerza progresivo, suficiente proteína y buen descanso favorecen el músculo.', 'Si baja el peso pero el músculo se mantiene o sube, el proceso va por buen camino.'];
        out.limits = 'Los valores varían según el equipo y la hidratación, y no hay un rango único aceptado por todos los fabricantes: lo más útil es comparar la evolución usando siempre el mismo método.';
        break;
      }
      case 'water': {
        const sex = sexOf(), cat = f && f.cat;
        out.what = 'Es el porcentaje del peso corporal que corresponde a agua. El agua participa en la temperatura, la digestión y el transporte de nutrientes.';
        out.how = 'La estiman las básculas de bioimpedancia; cambia con la hidratación, la comida, el ejercicio y el calor.';
        if (sex) { const t = R.water[sex]; out.ranges = rows([{ label: 'Por debajo del rango típico', range: `menos de ${t[0]}%`, tone: 'warn' }, { label: 'Rango típico', range: `${t[0]}% a ${t[1]}%`, tone: 'good' }, { label: 'Por encima del rango típico', range: `más de ${t[1]}%`, tone: 'info' }], cat && cat.t); out.rangeNote = `Valores típicos en ${sex === 'Femenino' ? 'mujeres' : 'hombres'} adultos; varían según el equipo.`; }
        if (f) out.result = { value: fmt(last, 1) + ' %', cat };
        out.why = f ? (sex ? `El valor actual es ${fmt(last, 1)}%, ${cat.t.toLowerCase()} (${R.water[sex][0]}–${R.water[sex][1]}% para ${sex === 'Femenino' ? 'mujeres' : 'hombres'}).` : SEX_NEEDED) + trend(f, '%', true) : 'Todavía no hay una evaluación con agua corporal.';
        out.tips = ['Mantenete hidratado a lo largo del día.', 'Medí siempre a la misma hora y con hidratación parecida.'];
        out.limits = 'Una sola medición puede variar mucho por la hidratación. El músculo contiene más agua que la grasa, por eso un % más alto suele acompañar a más masa magra.';
        break;
      }
      case 'visceral': {
        const cat = f && f.cat;
        out.what = 'Es la grasa que se acumula alrededor de los órganos dentro del abdomen. A diferencia de la grasa bajo la piel, un exceso se asocia con mayor riesgo cardiometabólico.';
        out.how = 'Las básculas de bioimpedancia la estiman en una escala de 1 a 59.';
        out.ranges = rows([{ label: 'Saludable', range: '1 a 9', tone: 'good' }, { label: 'Alto', range: '10 a 14', tone: 'warn' }, { label: 'Muy alto', range: '15 o más', tone: 'bad' }], cat && cat.t);
        out.rangeNote = 'La escala puede variar según el fabricante de la báscula.';
        if (f) out.result = { value: fmt(last, 0), cat };
        out.why = f ? `El nivel actual es ${fmt(last, 0)}: ${last <= 9 ? 'está entre 1 y 9' : last <= 14 ? 'está entre 10 y 14' : 'es 15 o más'}, por eso se clasifica como «${cat.t}».` + trend(f, 'niveles') : 'Todavía no hay una evaluación con grasa visceral.';
        out.tips = ['El ejercicio regular (de fuerza y aeróbico), dormir bien y reducir ultraprocesados y alcohol ayudan a bajarla.', 'La cintura es un buen complemento para seguirla.'];
        out.limits = 'Es una estimación: solo una resonancia o tomografía la mide con exactitud.';
        break;
      }
      case 'bone': {
        out.what = 'Es una estimación del peso de los minerales de los huesos (sobre todo calcio y fósforo).';
        out.how = 'La estiman las básculas de bioimpedancia; cambia muy lentamente.';
        if (f) out.result = { value: fmt(last, 1) + ' kg' };
        out.why = f ? `El valor actual es ${fmt(last, 1)} kg.` + trend(f, 'kg') + ' Pequeñas variaciones entre mediciones son normales y suelen deberse al error del equipo.' : 'Todavía no hay una evaluación con masa ósea.';
        out.tips = ['El entrenamiento de fuerza y de impacto, una alimentación con calcio y proteína y la vitamina D favorecen huesos fuertes.'];
        out.limits = 'No sirve para diagnosticar osteoporosis: eso requiere una densitometría ósea (DEXA) indicada por un profesional.';
        break;
      }
      case 'bmr': {
        const est = M.bmrEstimate(c, w), cat = f && f.cat, male = c.sex === 'Masculino';
        out.what = 'Es la cantidad de energía (calorías) que el cuerpo gasta en reposo para mantenerse vivo: respirar, circular la sangre, mantener la temperatura. Es la base para calcular cuántas calorías se necesitan al día.';
        out.how = 'Las básculas de bioimpedancia lo estiman; también se puede calcular con la fórmula de Mifflin-St Jeor, que usa peso, altura, edad y sexo.';
        out.formula = { text: 'TMB = 10 × peso (kg) + 6,25 × altura (cm) − 5 × edad (años) + 5 (hombres) o − 161 (mujeres)', example: est ? `10 × ${fmt(w, 1)} + 6,25 × ${fmt(c.height, 0)} − 5 × ${c.age} ${male ? '+ 5' : '− 161'} = ${est} kcal` : '' };
        if (f) out.result = { value: fmt(last, 0) + ' kcal', cat };
        out.why = f ? `El valor medido es ${fmt(last, 0)} kcal` + (est ? `; la fórmula estima ${est} kcal (${signed((last - est) / est * 100, 0)}%). ${cat ? '«' + cat.t + '»: una diferencia de hasta ±10% es normal.' : ''}` : '. ' + SEX_NEEDED) + trend(f, 'kcal') : 'Todavía no hay una evaluación con metabolismo basal.';
        out.tips = ['Mantener o aumentar la masa muscular ayuda a sostener el metabolismo.', 'Evitá dietas muy bajas en calorías: pueden reducir el gasto y el rendimiento.'];
        out.limits = 'Es una estimación: el gasto real varía entre personas. El gasto total del día es mayor, porque incluye la actividad.';
        break;
      }
      case 'metAge': {
        const cat = f && f.cat;
        out.what = 'Compara el metabolismo basal con el promedio de personas de cada edad y devuelve la edad cuyo promedio se parece más.';
        out.how = 'La calcula la propia báscula a partir de su estimación del metabolismo basal.';
        if (f) out.result = { value: fmt(last, 0) + ' años', cat };
        out.why = f ? `El valor actual es ${fmt(last, 0)} años y la edad real es ${c.age}: ${last <= c.age ? 'igual o menor, lo que sugiere un metabolismo acorde o mejor que el promedio de su edad.' : 'mayor, lo que sugiere un metabolismo más lento que el promedio de su edad.'}` + trend(f, 'años') : 'Todavía no hay una evaluación con edad metabólica.';
        out.tips = ['Suele mejorar al aumentar la masa muscular y la actividad física.'];
        out.limits = 'No es una edad biológica real ni un diagnóstico: es una comparación que depende del equipo.';
        break;
      }
      case 'waist': {
        const sex = sexOf(), cat = f && f.cat;
        out.what = 'La cintura mide el contorno del abdomen. Es un marcador sencillo de grasa abdominal, que se asocia con riesgo cardiometabólico (presión, glucosa, colesterol).';
        out.how = 'Con cinta flexible, en el punto medio entre la última costilla y la cresta de la cadera, al final de una exhalación normal y sin apretar la cinta.';
        if (sex) { const t = R.waist[sex]; out.ranges = rows([{ label: 'Rango saludable', range: `menos de ${t[0]} cm`, tone: 'good' }, { label: 'Riesgo aumentado', range: `${t[0]} a ${t[1] - 0.1} cm`, tone: 'warn' }, { label: 'Riesgo alto', range: `${t[1]} cm o más`, tone: 'bad' }], cat && cat.t); out.rangeNote = `Referencias de la OMS para ${sex === 'Femenino' ? 'mujeres' : 'hombres'} adultos.`; }
        if (f) out.result = { value: fmt(last, 1) + ' cm', cat };
        out.why = f ? (sex ? `La cintura actual es ${fmt(last, 1)} cm: ${last >= R.waist[sex][1] ? `es ${R.waist[sex][1]} cm o más` : last >= R.waist[sex][0] ? `está entre ${R.waist[sex][0]} y ${R.waist[sex][1] - 0.1} cm` : `es menor de ${R.waist[sex][0]} cm`}, por eso se clasifica como «${cat.t}».` : SEX_NEEDED) + trend(f, 'cm') : 'Todavía no hay una evaluación con cintura.';
        out.tips = ['Medí siempre en el mismo punto y a la misma hora.', 'Una cintura que baja suele reflejar menos grasa abdominal, aunque el peso no cambie mucho.'];
        out.limits = 'Los umbrales son para adultos; la altura también importa (ver el índice cintura-estatura).';
        break;
      }
      case 'whr': {
        const d = drv(p, 'whr'), sex = sexOf(), cat = d && d.cat, lm = p.lastM;
        out.what = 'Compara el contorno de la cintura con el de la cadera. Indica cómo se distribuye la grasa: acumularla en el abdomen se asocia con más riesgo que en las caderas.';
        out.how = 'Se calcula con las medidas de cintura y cadera de la misma evaluación.';
        out.formula = { text: 'Índice cintura-cadera = cintura (cm) ÷ cadera (cm)', example: d && lm && lm.waist && lm.hip ? `${fmt(lm.waist, 1)} ÷ ${fmt(lm.hip, 1)} = ${fmt(d.last, 2)}` : '' };
        if (sex) { out.ranges = rows([{ label: 'Rango saludable', range: `${dec(R.whr[sex].toFixed(2))} o menos`, tone: 'good' }, { label: 'Riesgo aumentado', range: `más de ${dec(R.whr[sex].toFixed(2))}`, tone: 'warn' }], cat && cat.t); out.rangeNote = `Referencia de la OMS para ${sex === 'Femenino' ? 'mujeres' : 'hombres'}.`; }
        if (d) out.result = { value: fmt(d.last, 2), cat };
        out.why = d ? (sex ? `El índice es ${fmt(d.last, 2)}: ${d.last > R.whr[sex] ? 'supera' : 'no supera'} ${dec(R.whr[sex].toFixed(2))}, por eso se clasifica como «${cat.t}».` : SEX_NEEDED) : 'Hacen falta las medidas de cintura y cadera.';
        out.tips = ['Reducir la grasa abdominal con ejercicio regular y buena alimentación mejora este índice.'];
        out.limits = 'Es una referencia general para adultos; no es un diagnóstico.';
        break;
      }
      case 'whtr': {
        const d = drv(p, 'whtr'), cat = d && d.cat, lm = p.lastM;
        out.what = 'Compara la cintura con la altura. La idea es simple: la cintura debería ser menor que la mitad de la altura. Es un marcador de riesgo cardiometabólico que no depende del sexo.';
        out.how = 'Se calcula con la cintura de la evaluación y la altura del cliente.';
        out.formula = { text: 'Índice cintura-estatura = cintura (cm) ÷ altura (cm)', example: d && lm && lm.waist && c.height ? `${fmt(lm.waist, 1)} ÷ ${fmt(c.height, 0)} = ${fmt(d.last, 2)}` : '' };
        out.ranges = rows([{ label: 'Saludable', range: 'menos de 0,50', tone: 'good' }, { label: 'Riesgo aumentado', range: '0,50 a 0,59', tone: 'warn' }, { label: 'Riesgo alto', range: '0,60 o más', tone: 'bad' }], cat && cat.t);
        if (d) out.result = { value: fmt(d.last, 2), cat };
        out.why = d ? `El índice es ${fmt(d.last, 2)}: ${d.last < 0.5 ? 'es menor de 0,50' : d.last < 0.6 ? 'está entre 0,50 y 0,59' : 'es 0,60 o más'}, por eso se clasifica como «${cat.t}». Para una altura de ${fmt(c.height, 0)} cm, la mitad es ${fmt(c.height / 2, 1)} cm: una cintura menor que ese valor es lo ideal.` + trend(d, '') : 'Hace falta la cintura de una evaluación.';
        out.tips = ['Si la cintura se acerca a la mitad de la altura, conviene cuidar la alimentación y mantener actividad física regular.'];
        out.limits = 'Es una referencia para adultos; en menores de 18 años y personas muy bajas o muy altas debe interpretarse con cautela.';
        break;
      }
      case 'rhr': {
        const cat = f && f.cat;
        out.what = 'Es el número de latidos del corazón por minuto cuando el cuerpo está en reposo. Un corazón más entrenado suele necesitar menos latidos para bombear la misma sangre.';
        out.how = 'Se mide al despertar, acostado y antes de levantarte, contando las pulsaciones durante 60 segundos (o con un reloj/pulsera).';
        out.ranges = rows([{ label: 'Baja (común en personas entrenadas)', range: '40 a 59 lpm', tone: 'info' }, { label: 'Rango normal', range: '60 a 100 lpm', tone: 'good' }, { label: 'Elevada', range: 'más de 100 lpm', tone: 'warn' }], cat && cat.t);
        out.rangeNote = 'Valores de referencia para adultos en reposo.';
        if (f) out.result = { value: fmt(last, 0) + ' lpm', cat };
        out.why = f ? `El valor actual es ${fmt(last, 0)} lpm, dentro de «${cat.t.toLowerCase()}».` + trend(f, 'lpm') : 'Todavía no hay una evaluación con frecuencia cardíaca.';
        out.tips = ['El ejercicio aeróbico regular y dormir bien tienden a bajarla con las semanas.'];
        out.limits = 'El café, el estrés, la falta de sueño, el calor y las enfermedades la aumentan. Si es persistentemente alta, o muy baja con mareos o desmayos, consultá con un profesional.';
        break;
      }
      case 'neck': case 'chest': case 'arm': case 'hip': case 'thigh': case 'calf': {
        const how = { neck: 'Con cinta flexible, justo debajo de la nuez, con la mirada al frente y los hombros relajados.', chest: 'A la altura de los pezones, con los brazos relajados y al final de una exhalación normal.', arm: 'Brazo relajado, en el punto medio entre el hombro y el codo.', hip: 'En la parte más ancha de los glúteos, con los pies juntos.', thigh: 'En el punto medio entre la ingle y la rodilla, de pie y con el peso repartido.', calf: 'En la parte más ancha de la pantorrilla, de pie.' }[key];
        out.what = 'Los contornos sirven para ver en qué zonas del cuerpo cambia la composición corporal, algo que la báscula no muestra.';
        out.how = how + ' Usá siempre el mismo punto, a la misma hora y sin apretar la cinta.';
        if (f) out.result = { value: fmt(last, 1) + ' cm' };
        out.why = f ? `La medida actual es ${fmt(last, 1)} cm.` + trend(f, 'cm') + ' Si un contorno muscular (brazo, muslo, pecho) sube mientras la cintura baja, suele indicar ganancia de músculo con pérdida de grasa; si todos bajan, suele reflejar pérdida de grasa.' : 'Todavía no hay una evaluación con esta medida.';
        out.tips = ['Medí en el mismo punto y con ropa mínima.', 'Una cinta métrica de costura (flexible, sin elástico) da medidas más consistentes.'];
        out.limits = 'Los cambios son pequeños (milímetros a pocos centímetros): importa la tendencia, no una sola medición.';
        break;
      }
      case 'composition': {
        const lf = p.now.lastFull;
        out.what = 'Muestra de qué está hecho el peso corporal: masa grasa, masa muscular esquelética y el resto de la masa magra (huesos, órganos y agua).';
        out.how = 'Se calcula con el peso y el % de grasa de la evaluación más reciente que tiene ambos datos.';
        out.formula = { text: 'Masa grasa = peso × % de grasa ÷ 100 · Masa magra = peso − masa grasa', example: lf ? `${fmt(lf.weight ?? w, 1)} × ${fmt(p.now.fat, 1)} ÷ 100 = ${fmt(lf.fatMass, 1)} kg de grasa; ${fmt(lf.weight ?? w, 1)} − ${fmt(lf.fatMass, 1)} = ${fmt(lf.leanMass, 1)} kg de masa magra` : '' };
        out.why = 'Cada color es un porcentaje del peso total. Una composición saludable busca mantener o aumentar la masa muscular mientras la grasa baja.';
        out.tips = ['Mirá cómo cambian los colores con el tiempo más que el peso total.'];
        out.limits = 'Depende de la exactitud del % de grasa y de la masa muscular, que son estimaciones.';
        break;
      }
      case 'goals': {
        out.what = 'Muestra qué tan cerca está la persona de su meta y cuándo podría alcanzarla si mantiene el ritmo actual.';
        out.how = 'La barra es el avance: (valor actual − valor inicial) ÷ (meta − valor inicial). La fecha estimada sale de una línea de tendencia (regresión lineal) con las últimas hasta 6 evaluaciones: se divide lo que falta por el ritmo semanal. Se necesitan al menos 3 evaluaciones que abarquen 2 semanas.';
        out.formula = { text: 'Semanas estimadas = (meta − valor actual) ÷ ritmo semanal', example: '' };
        out.why = 'Si hay fecha objetivo, también se calcula el ritmo semanal que haría falta para llegar justo a esa fecha y se compara con el ritmo actual.';
        out.tips = ['Usalo como guía motivadora, no como promesa: lo importante es sostener hábitos.'];
        out.limits = 'El progreso real no es una línea recta: hay mesetas, retención de líquidos y cambios de rutina. La proyección se actualiza con cada evaluación.';
        break;
      }
      case 'colors': {
        out.what = 'Las flechas muestran el cambio desde la primera evaluación hasta la última.';
        out.how = 'Verde: el cambio va en la dirección favorable según el objetivo y el indicador (por ejemplo, bajar % de grasa, cintura o grasa visceral; subir la masa muscular). Rojo: va en dirección contraria. Gris: no hay cambio o el indicador no tiene una dirección «mejor».';
        out.why = 'El peso depende del objetivo: bajar es favorable en «Pérdida de grasa»; subir lo es en «Hipertrofia»; con otros objetivos se muestra en gris.';
        out.limits = 'Los colores son una ayuda visual: siempre conviene interpretar varios indicadores juntos.';
        break;
      }
      case 'summary': {
        out.what = 'Es una lectura rápida de los cambios más importantes entre la primera y la última evaluación.';
        out.how = 'Se generan automáticamente a partir de peso, % de grasa, masa muscular, cintura, grasa visceral y frecuencia cardíaca.';
        out.limits = 'No reemplaza el análisis del entrenador: los números se interpretan en conjunto.';
        break;
      }
      default: out.what = 'Sin descripción disponible.';
    }
    return out;
  }

  // Indicadores presentes en el progreso (para la guía en pantalla y el informe)
  function glossary(p) {
    const keys = [];
    if (p.now.weight != null) keys.push('weight');
    if (p.now.bmi != null) keys.push('bmi');
    M.FIELDS.forEach(f => { if (f.key !== 'weight' && fld(p, f.key)) keys.push(f.key); });
    p.derived.forEach(d => { if (['fatMass', 'leanMass', 'whr', 'whtr'].includes(d.key)) keys.push(d.key); });
    const order = ['weight', 'bmi', 'fat', 'fatMass', 'leanMass', 'muscle', 'water', 'visceral', 'bone', 'bmr', 'metAge', 'waist', 'whr', 'whtr', 'neck', 'chest', 'arm', 'hip', 'thigh', 'calf', 'rhr'];
    return order.filter(k => keys.includes(k)).map(k => { const fo = explain(k, p).formula; return { key: k, title: TITLES[k], line: LINES[k], formula: fo ? fo.text : '' }; });
  }

  return { explain, glossary, formulas, TITLES, KEYS: Object.keys(TITLES) };
})();
