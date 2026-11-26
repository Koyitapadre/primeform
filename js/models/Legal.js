/* ============================================================
   MODELO · Legal
   Datos del responsable (entrenador/negocio), aviso de privacidad y términos
   de uso. Los textos estándar se rellenan con los datos del responsable; si
   el dueño tiene textos revisados por un abogado, los pega y reemplazan a los
   estándar. Devuelve TEXTO PLANO (la vista lo escapa).
   ============================================================ */
PF.Legal = (function () {
  const VERSION = '2026-11';
  const line = (x, n) => typeof x === 'string' ? x.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '';
  const block = (x, n) => typeof x === 'string' ? x.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, n) : '';
  // Dirección pública donde los clientes abren su plan: https (o http solo en localhost), sin credenciales, parámetros ni #
  function cleanUrl(x) {
    x = line(x, 200); if (!x) return '';
    try {
      const u = new URL(x), local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
      if (!(u.protocol === 'https:' || (u.protocol === 'http:' && local))) return '';
      u.hash = ''; u.search = ''; u.username = ''; u.password = ''; return u.toString();
    } catch (e) { return ''; }
  }
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function clean(o) {
    o = o && typeof o === 'object' ? o : {};
    const email = line(o.email, 120);
    return { name: line(o.name, 100), id: line(o.id, 40), email: EMAIL.test(email) ? email : '', phone: line(o.phone, 40), address: line(o.address, 160), slots: Math.max(0, Math.min(500, parseInt(o.slots, 10) || 0)), slotsMode: o.slotsMode === 'unlimited' || o.slotsMode === 'limited' ? o.slotsMode : ((parseInt(o.slots, 10) || 0) > 0 ? 'limited' : 'unlimited'), planUrl: cleanUrl(o.planUrl), privacy: block(o.privacy, 8000), terms: block(o.terms, 8000) };
  }
  let override = null;                                        // en un enlace de cliente: el responsable que vino en el enlace
  const org = () => override || clean(PF.Meta.get().org);
  const useOrg = o => { override = clean(o); };
  const save = o => { PF.Meta.set({ org: clean(o) }); if (PF.Store && PF.Store.touchOrg) PF.Store.touchOrg(); };   // se sincroniza con el equipo
  const applyRemote = o => PF.Meta.set({ org: clean(o) });                                                         // viene del equipo: no se vuelve a marcar como cambio local
  const slots = () => { const o = org(); return o.slotsMode === 'limited' ? o.slots : 0; };      // 0 = cupos ilimitados
  const isConfigured = () => { const o = org(); return !!(o.name && o.email); };

  function validate(v) {
    const errors = {}, name = line(v.name, 200), email = line(v.email, 200);
    if (name.length < 2) errors.name = 'Ingresá el nombre o razón social del responsable';
    else if (name.length > 100) errors.name = 'Máximo 100 caracteres';
    if (!email) errors.email = 'Ingresá un correo de contacto para que las personas puedan ejercer sus derechos';
    else if (!EMAIL.test(email)) errors.email = 'Ingresá un correo válido';
    const pu = line(v.planUrl, 400);
    if (pu && !cleanUrl(pu)) errors.planUrl = 'Ingresá una dirección https:// válida (ej. https://plan.tuempresa.com/)';
    else if (pu && PF.Config.requirePlanUrl && new URL(cleanUrl(pu)).origin === location.origin) errors.planUrl = 'Tiene que ser distinta de la dirección del espacio del equipo: el sitio de clientes se publica aparte';
    const sl = String(v.slots ?? '').trim(), unlimited = v.slotsMode === 'unlimited' || v.slotsMode === 'Ilimitados';
    if (!unlimited && (!/^\d{1,3}$/.test(sl) || +sl < 1 || +sl > 500)) errors.slots = 'Con cupos limitados ingresá cuántos (un número entero entre 1 y 500)';
    else if (unlimited && sl !== '' && (!/^\d{1,3}$/.test(sl) || +sl > 500)) errors.slots = 'Ingresá un número entero entre 0 y 500';
    if (block(v.privacy, 20000).length > 8000) errors.privacy = 'Máximo 8000 caracteres';
    if (block(v.terms, 20000).length > 8000) errors.terms = 'Máximo 8000 caracteres';
    return { ok: !Object.keys(errors).length, errors, record: clean({ ...v, slotsMode: unlimited ? 'unlimited' : 'limited' }) };
  }

  const or = (x, f = '(sin completar)') => x || f;
  function defaults(o) {
    const who = `${or(o.name)}${o.id ? ' (identificación ' + o.id + ')' : ''}`;
    const contact = [o.email && 'correo ' + o.email, o.phone && 'teléfono ' + o.phone, o.address && 'domicilio ' + o.address].filter(Boolean).join(', ') || '(sin completar)';
    return {
      privacy: [
        { h: 'Quién es el responsable', p: [`${who}. Contacto: ${contact}.`] },
        { h: 'Qué datos tratamos', p: ['Datos de identificación y contacto (nombre y correo).', 'Datos físicos y de salud, que son datos sensibles: edad, sexo, peso, altura, composición corporal, medidas, frecuencia cardíaca en reposo, objetivos, nivel de experiencia y notas de seguimiento. También tus planes de entrenamiento y de nutrición y tus revisiones.'] },
        { h: 'Para qué los usamos', p: ['Exclusivamente para planificar, dar seguimiento y evaluar tu entrenamiento y para generar tus informes de progreso. No los usamos para publicidad ni los vendemos o cedemos a terceros.'] },
        { h: 'Consentimiento', p: ['Tratamos tus datos de salud solo con tu consentimiento expreso e informado, que podés retirar en cualquier momento. Si sos menor de 18 años, el consentimiento lo da tu padre, madre o tutor legal.'] },
        { h: 'Dónde se guardan y cómo se protegen', p: ['Los datos se guardan en el navegador del dispositivo de tu entrenador; no se envían a servidores de PRIMEFORM. Se protegen con validación y escape de los datos, una política estricta de seguridad de contenido y, de forma opcional, cifrado AES-256 con contraseña.', 'Si tu entrenador te comparte un enlace, tus datos viajan cifrados dentro del propio enlace (no quedan en ningún servidor) y solo se abren con la contraseña que él te dé. Los respaldos descargados quedan bajo la responsabilidad de quien los guarda.'] },
        { h: 'Con quién se comparten', p: ['Con nadie, salvo contigo: por ejemplo mediante informes en PDF o enlaces protegidos con contraseña.'] },
        { h: 'Cuánto tiempo se conservan', p: ['Mientras dure la relación de entrenamiento y hasta que pidas su eliminación.'] },
        { h: 'Tus derechos', p: [`Podés pedir acceso, rectificación, supresión u oposición respecto de tus datos y retirar tu consentimiento escribiendo a ${or(o.email)}. También podés acudir ante la autoridad de protección de datos de tu país (en Costa Rica, la PRODHAB).`] },
        { h: 'Cambios a este aviso', p: [`Si este aviso cambia, te lo informaremos. Versión ${VERSION}.`] }
      ],
      terms: [
        { h: 'Qué es PRIMEFORM', p: [`La plataforma privada de seguimiento de ${or(o.name)}, de uso exclusivo para sus clientes y su equipo. Solo pueden usarla las personas autorizadas por ${or(o.name)}.`] },
        { h: 'Información orientativa, no médica', p: ['Los indicadores (IMC, % de grasa, rangos de referencia, proyecciones), las sugerencias de calorías y las guías de ejercicios son educativos y orientativos. No constituyen diagnóstico, tratamiento ni consejo médico o nutricional. ' + PF.Advisory.LEGAL] },
        { h: 'Tu salud y seguridad', p: ['Antes de empezar o cambiar un programa de ejercicio, consultá con un profesional de la salud, en especial si tenés alguna condición médica, estás embarazada o sos menor de edad. Detené el ejercicio ante dolor, mareo o malestar.'] },
        { h: 'Responsabilidad al entrenar', p: ['Cada persona debe ejecutar los ejercicios con una carga y una técnica adecuadas a su nivel. Se recomienda la supervisión de un entrenador, sobre todo en los ejercicios con barra y cargas altas.'] },
        { h: 'Uso adecuado', p: ['Usá la plataforma solo para los fines para los que fue autorizada. No compartas tus accesos, no intentes vulnerar su seguridad y no reproduzcas ni redistribuyas sus contenidos (guías, ilustraciones y textos).'] },
        { h: 'Datos personales', p: ['Se tratan según el Aviso de privacidad vigente.'] },
        { h: 'Respaldos y pérdida de datos', p: ['Los datos dependen del dispositivo y del navegador donde se guardan. Cada usuario debe hacer sus respaldos con regularidad.'] },
        { h: 'Propiedad intelectual', p: ['El diseño, las ilustraciones y los textos de PRIMEFORM pertenecen a sus titulares.'] },
        { h: 'Contacto', p: [`${who}. ${contact}.`] }
      ]
    };
  }
  // Secciones a mostrar: el texto propio del dueño (si lo cargó) o el estándar
  function sections(kind) {
    const o = org(), custom = o[kind];
    if (custom) return [{ h: '', p: custom.split(/\n{2,}/).map(x => x.trim()).filter(Boolean) }];
    return defaults(o)[kind];
  }
  const usesCustom = kind => !!org()[kind];
  return { VERSION, slots, org, useOrg, applyRemote, save, clean, validate, isConfigured, sections, usesCustom };
})();
