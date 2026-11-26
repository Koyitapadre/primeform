/* ============================================================
   MODELO · Advisory (aviso permanente: «es una recomendación, no un veredicto»)
   Fuente única de los textos que acompañan a TODA medición, categoría, meta y sugerencia.
   Dos voces: para la persona (self = true) y para el equipo (self = false).
   ============================================================ */
PF.Advisory = (function () {
  const TITLE = 'Es una recomendación, no un veredicto';
  const points = self => self ? [
    'Los valores, las categorías (por ejemplo «Peso saludable») y las metas son referencias generales para acompañar tu entrenamiento. No son un diagnóstico ni una indicación médica o nutricional.',
    'No tenés que seguirlos de forma estricta: son una sugerencia que se adapta a vos, a tu salud y a tu día a día.',
    'Si tenés (o querés tener) un nutricionista, un médico u otro especialista, consultalo con esa persona: su criterio profesional siempre prevalece sobre estas recomendaciones. Podés llevarle estos datos.'
  ] : [
    'Los valores, las categorías y las metas son referencias generales y orientativas. No son un diagnóstico ni una indicación médica o nutricional.',
    'Presentalos al cliente como una sugerencia que no tiene que seguir de forma estricta, nunca como una exigencia.',
    'Si el cliente tiene nutricionista, médico u otro especialista, su criterio prevalece: animalo a consultarlo y coordiná con esa persona.'
  ];
  const short = self => self === true
    ? 'Es una recomendación orientativa, no un veredicto ni un diagnóstico, y no tenés que seguirla de forma estricta. Consultala con tu nutricionista, médico o el especialista que te acompaña: su criterio prevalece.'
    : self === false
      ? 'Es una recomendación orientativa, no un veredicto ni un diagnóstico, y el cliente no tiene que seguirla de forma estricta. Si tiene nutricionista, médico u otro especialista, su criterio prevalece.'
      : 'Es una recomendación orientativa, no un veredicto ni un diagnóstico, y no hay que seguirla de forma estricta. Ante cualquier duda, consultá con un nutricionista, médico u otro especialista: su criterio profesional prevalece.';
  const nutrition = self => self
    ? 'Recomendación inicial, no una prescripción: no tenés que seguirla de forma estricta. Consultala con tu nutricionista, cuyo criterio prevalece.'
    : 'Recomendación inicial, no una prescripción: ajustala con criterio profesional. Si la persona tiene nutricionista, su indicación prevalece sobre esta sugerencia.';
  const GOALS = 'La fecha estimada es una proyección orientativa: el progreso real no es una línea recta. Es una referencia, no una promesa ni un veredicto.';
  const LABELS = 'Las etiquetas («Peso saludable», «Promedio»…) son referencias generales, no un diagnóstico.';
  const FOOTER = 'Este informe contiene referencias y recomendaciones orientativas, no un diagnóstico ni un veredicto final. No es necesario seguirlas de forma estricta: consultá con tu nutricionista, médico o especialista, cuyo criterio prevalece.';
  const LEGAL = 'No son un veredicto final: no es obligatorio seguirlos de forma estricta y siempre prevalece el criterio de tu nutricionista, médico u otro especialista, a quien podés consultar y llevar estos datos.';
  return { TITLE, points, short, nutrition, GOALS, LABELS, FOOTER, LEGAL };
})();
