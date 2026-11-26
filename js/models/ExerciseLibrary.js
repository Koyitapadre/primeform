/* MODELO · Biblioteca de ejercicios (catálogo integrado + ejercicios propios del Store).
   Formato por línea: Nombre|Grupo|Equipo|plantilla de imagen|Descripción */
PF.ExerciseLibrary = (function () {
  const RAW = `
Press de banca con barra|Pecho|Barra y banco|benchPress|Acostado, baja la barra al pecho con control y empuja hasta extender los codos.
Press inclinado con mancuernas|Pecho|Mancuernas y banco|inclinePress|Banco a 30°; empuja las mancuernas hacia arriba enfatizando la parte alta del pecho.
Press declinado con barra|Pecho|Barra y banco|declinePress|Banco declinado; trabaja la porción inferior del pecho.
Press de pecho en máquina|Pecho|Máquina|machinePress|Empuja las asas al frente manteniendo la espalda apoyada; ideal para principiantes.
Aperturas con mancuernas|Pecho|Mancuernas y banco|flyFlat|Abre los brazos con codos semiflexionados hasta sentir estiramiento y vuelve juntando las manos.
Cruce de poleas|Pecho|Polea|cableFly|De pie, cierra los brazos al frente desde poleas altas apretando el pecho al final.
Flexiones de brazos|Pecho|Peso corporal|pushup|Cuerpo recto como tabla; baja el pecho al suelo y empuja hasta extender los brazos.
Fondos en paralelas|Pecho|Peso corporal|dipBars|Inclina el torso al frente, baja hasta 90° de codo y sube empujando las barras.
Dominadas|Espalda|Barra fija|pullup|Cuelga de la barra y lleva el mentón sobre ella llevando los codos hacia las costillas.
Dominadas supinas (chin-up)|Espalda|Barra fija|chinup|Agarre supino; mayor participación de bíceps junto con el dorsal.
Jalón al pecho|Espalda|Polea|latPulldown|Sentado, baja la barra hasta la parte alta del pecho sin balancear el torso.
Remo con barra|Espalda|Barra|bentRow|Torso inclinado y espalda neutra; tira de la barra hacia el abdomen.
Remo con mancuerna a una mano|Espalda|Mancuerna y banco|dbRow|Apoya una mano en el banco y lleva la mancuerna a la cadera.
Remo en polea baja|Espalda|Polea|seatedRow|Sentado, tira del agarre al abdomen juntando las escápulas.
Remo en máquina|Espalda|Máquina|machineRow|Pecho apoyado; tira de las asas hacia atrás con control.
Peso muerto convencional|Espalda|Barra|deadlift|Levanta la barra desde el suelo extendiendo cadera y rodillas con la espalda neutra.
Hiperextensiones|Espalda|Banco romano|hyper|Flexiona la cadera y sube el torso hasta alinearlo con las piernas.
Press militar con barra|Hombros|Barra|ohp|De pie, empuja la barra desde los hombros hasta bloquear los codos sobre la cabeza.
Press de hombros con mancuernas|Hombros|Mancuernas|dbPress|Sentado o de pie, empuja las mancuernas hacia arriba sin arquear la espalda.
Press Arnold|Hombros|Mancuernas|arnold|Press con rotación de las palmas durante el recorrido para mayor activación del deltoides.
Elevaciones laterales|Hombros|Mancuernas|lateralRaise|Eleva los brazos a los lados hasta la altura de los hombros con codos suaves.
Elevaciones frontales|Hombros|Mancuernas|frontRaise|Eleva las mancuernas al frente hasta la altura de los hombros.
Pájaros (deltoide posterior)|Hombros|Mancuernas|rearDelt|Torso inclinado; abre los brazos hacia los lados apretando la parte posterior del hombro.
Face pull|Hombros|Polea|facePull|Tira de la cuerda hacia el rostro abriendo los codos; salud del hombro y deltoide posterior.
Encogimientos de hombros|Hombros|Mancuernas|shrug|Eleva los hombros hacia las orejas sin rotar y baja lento.
Curl con barra|Bíceps|Barra|barbellCurl|De pie, flexiona los codos llevando la barra a los hombros sin balancear el cuerpo.
Curl alterno con mancuernas|Bíceps|Mancuernas|dbCurl|Flexiona un brazo a la vez girando la palma hacia arriba.
Curl martillo|Bíceps|Mancuernas|hammerCurl|Agarre neutro; trabaja braquial y braquiorradial además del bíceps.
Curl predicador|Bíceps|Barra Z y banco|preacher|Brazos apoyados en el banco predicador; aísla el bíceps.
Curl en polea|Bíceps|Polea|cableCurl|Tensión constante durante todo el recorrido de flexión del codo.
Extensión de tríceps en polea|Tríceps|Polea|pushdown|Codos pegados al cuerpo; extiende los brazos hacia abajo.
Press francés|Tríceps|Barra Z y banco|skull|Acostado, flexiona los codos llevando la barra a la frente y extiende.
Extensión tras nuca con mancuerna|Tríceps|Mancuerna|ohExt|Sostén la mancuerna sobre la cabeza y extiende los codos.
Patada de tríceps|Tríceps|Mancuerna|kickback|Torso inclinado; extiende el antebrazo hacia atrás manteniendo el codo fijo.
Fondos en banco|Tríceps|Banco|benchDip|Manos en el banco detrás del cuerpo; baja flexionando codos y sube.
Sentadilla trasera con barra|Piernas|Barra y rack|backSquat|Barra sobre los trapecios; baja con la cadera atrás hasta paralelo y sube empujando el suelo.
Sentadilla frontal|Piernas|Barra y rack|frontSquat|Barra apoyada en los hombros al frente; mayor énfasis en cuádriceps.
Sentadilla goblet|Piernas|Mancuerna o kettlebell|goblet|Sostén el peso al pecho y desciende con el torso erguido.
Sentadilla sumo|Piernas|Mancuerna o barra|sumo|Postura amplia y puntas afuera; enfatiza aductores y glúteos.
Sentadilla hack|Piernas|Máquina|hack|Espalda apoyada en la máquina; flexiona rodillas y empuja para subir.
Prensa de piernas|Piernas|Máquina|legPress|Empuja la plataforma con los pies sin bloquear las rodillas al final.
Zancadas|Piernas|Mancuernas|lunge|Da un paso largo y baja la rodilla trasera hacia el suelo; vuelve a la posición inicial.
Sentadilla búlgara|Piernas|Mancuernas y banco|bulgarian|Pie trasero elevado en un banco; desciende sobre la pierna delantera.
Step-up|Piernas|Cajón y mancuernas|stepUp|Sube a un cajón empujando con la pierna delantera y baja controlado.
Peso muerto rumano|Piernas|Barra|rdl|Piernas casi rectas; lleva la cadera atrás y baja la barra pegada a las piernas.
Extensión de cuádriceps|Piernas|Máquina|legExt|Sentado, extiende las rodillas hasta alinear las piernas y baja lento.
Curl femoral|Piernas|Máquina|legCurl|Flexiona las rodillas llevando los talones hacia los glúteos.
Elevación de talones|Piernas|Máquina o peso corporal|calf|Sube sobre las puntas de los pies y baja estirando bien las pantorrillas.
Hip thrust|Glúteos|Barra y banco|hipThrust|Espalda alta en el banco; empuja la cadera hacia arriba apretando glúteos.
Puente de glúteos|Glúteos|Peso corporal|bridge|Tumbado, eleva la cadera hasta alinear rodillas, cadera y hombros.
Patada de glúteo en polea|Glúteos|Polea|gluteKick|Extiende la pierna hacia atrás contra la resistencia de la polea baja.
Buenos días|Glúteos|Barra|goodMorning|Barra en la espalda; flexiona la cadera atrás con la espalda neutra y vuelve.
Plancha|Core|Peso corporal|plank|Apoyo en antebrazos y puntas; mantén el cuerpo alineado y el abdomen firme.
Plancha lateral|Core|Peso corporal|sidePlank|Apoyo lateral en un antebrazo; mantén la cadera elevada y alineada.
Crunch abdominal|Core|Peso corporal|crunch|Acostado, eleva los hombros del suelo contrayendo el abdomen.
Elevación de piernas|Core|Barra fija|legRaise|Colgado de una barra, eleva las piernas rectas hasta la horizontal controlando el abdomen y sin balancear el cuerpo.
Rueda abdominal|Core|Rueda|abWheel|Desde las rodillas, rueda hacia delante con el core firme y regresa.
Mountain climbers|Core|Peso corporal|mountain|En posición de plancha alta, lleva las rodillas al pecho alternando a ritmo.
Giro ruso|Core|Peso corporal o disco|russian|Sentado con el torso inclinado, rota llevando el peso de lado a lado.
Swing con kettlebell|Funcional|Kettlebell|kbSwing|Bisagra de cadera explosiva que impulsa la kettlebell hasta la altura del pecho.
Burpee|Funcional|Peso corporal|burpee|Baja al suelo, extiende en plancha, regresa y salta con los brazos arriba.
Salto al cajón|Funcional|Cajón|boxJump|Impulso con ambas piernas para aterrizar suave sobre el cajón.
Thruster|Funcional|Barra o mancuernas|thruster|Sentadilla frontal que se encadena con un press sobre la cabeza.
`.trim().split('\n').map(l => {
    const [name, group, equip, tpl, desc] = l.split('|');
    const id = name.toLowerCase().normalize('NFD').replace(/[^\w ]/g, '').trim().replace(/\s+/g, '-');
    return { id, name, group, equip, tpl, desc, builtin: true };
  });

  const GROUPS = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Glúteos', 'Core', 'Funcional'];
  const TEMPLATES = { benchPress: 'Press de banca', inclinePress: 'Press inclinado', declinePress: 'Press declinado', machinePress: 'Press en máquina', flyFlat: 'Aperturas en banco', cableFly: 'Cruce de poleas (frontal)', pushup: 'Flexiones', dipBars: 'Fondos en paralelas', pullup: 'Dominadas', chinup: 'Dominadas supinas', latPulldown: 'Jalón al pecho', bentRow: 'Remo inclinado', dbRow: 'Remo a una mano', seatedRow: 'Remo sentado en polea', machineRow: 'Remo en máquina', deadlift: 'Peso muerto', hyper: 'Hiperextensión', ohp: 'Press militar', dbPress: 'Press sentado', arnold: 'Press Arnold', lateralRaise: 'Elevación lateral (frontal)', frontRaise: 'Elevación frontal', rearDelt: 'Pájaros (frontal)', facePull: 'Face pull', shrug: 'Encogimientos (frontal)', barbellCurl: 'Curl de pie', dbCurl: 'Curl alterno', hammerCurl: 'Curl martillo', preacher: 'Curl predicador', cableCurl: 'Curl en polea', pushdown: 'Extensión en polea', skull: 'Press francés', ohExt: 'Extensión tras nuca', kickback: 'Patada de tríceps', benchDip: 'Fondos en banco', backSquat: 'Sentadilla trasera', frontSquat: 'Sentadilla frontal', goblet: 'Sentadilla goblet', sumo: 'Sentadilla sumo (frontal)', hack: 'Sentadilla hack', legPress: 'Prensa de piernas', lunge: 'Zancada', bulgarian: 'Sentadilla búlgara', stepUp: 'Step-up', rdl: 'Peso muerto rumano', legExt: 'Extensión de cuádriceps', legCurl: 'Curl femoral', calf: 'Elevación de talones', hipThrust: 'Hip thrust', bridge: 'Puente de glúteos', gluteKick: 'Patada de glúteo', goodMorning: 'Buenos días', plank: 'Plancha', sidePlank: 'Plancha lateral', crunch: 'Crunch', legRaise: 'Elevación de piernas', abWheel: 'Rueda abdominal', mountain: 'Mountain climbers', russian: 'Giro ruso', kbSwing: 'Swing', burpee: 'Burpee', boxJump: 'Salto al cajón', thruster: 'Thruster' };

  function all() { return RAW.concat(PF.Store.list('exercises')); }
  function find(name) { const n = (name || '').trim().toLowerCase(); return all().find(e => e.name.toLowerCase() === n); }
  function search({ query = '', group = '' } = {}) {
    const q = query.toLowerCase();
    return all().filter(e => (!group || e.group === group) && (e.name + ' ' + e.equip).toLowerCase().includes(q));
  }
  return { all, find, search, GROUPS, TEMPLATES };
})();
