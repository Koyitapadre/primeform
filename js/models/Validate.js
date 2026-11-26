/* ============================================================
   MODELO · Validación
   Reglas reutilizables para formularios, importación y datos guardados.
   Cada regla devuelve { value } o { error }.
   ============================================================ */
PF.Lists = {
  STATUS: ['Activo', 'En espera', 'En pausa', 'Finalizado'],   // «Activo» ocupa un cupo; el resto no
  GOALS: ['Hipertrofia', 'Pérdida de grasa', 'Fuerza', 'Rendimiento', 'Salud general'],
  LEVELS: ['Principiante', 'Intermedio', 'Avanzado'],
  DAYS: ['Día 1 · Tren superior', 'Día 2 · Tren inferior', 'Día 3 · Cuerpo completo', 'Empuje', 'Tracción', 'Piernas', 'Personalizada'],
  NUT_ADH: ['Sin registrar', 'Baja', 'Media', 'Alta'],
  CHK_ADH: ['Alta', 'Media', 'Baja'],
  ENERGY: ['Alta', 'Normal', 'Baja'],
  SLEEP: ['Bueno', 'Regular', 'Malo'],
  FATIGUE: ['Baja', 'Moderada', 'Alta'],
  SEX: ['Femenino', 'Masculino'],
  ACTIVITY: ['Sedentario', 'Ligero', 'Moderado', 'Alto', 'Muy alto'],
  METHOD: ['Bioimpedancia', 'Plicómetro', 'DEXA', 'Estimación visual', 'Otro']
};

PF.Validate = (function () {
  const bad = error => ({ error }), good = value => ({ value });
  // Concordancia según el artículo de la etiqueta: El/La/Los/Las
  const gram = label => { const a = String(label).split(' ')[0], pl = a === 'Las' || a === 'Los', fem = a === 'La' || a === 'Las'; return { obl: pl ? (fem ? 'son obligatorias' : 'son obligatorios') : (fem ? 'es obligatoria' : 'es obligatorio'), must: pl ? 'deben' : 'debe', num: pl ? 'ser números' : 'ser un número', int: pl ? 'ser números enteros' : 'ser un número entero' }; };
  const clean = s => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanMulti = s => String(s ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

  function text(v, { min = 0, max = 200, label = 'El campo', multiline = false, required = false } = {}) {
    const s = multiline ? cleanMulti(v) : clean(v);
    if (!s) return required ? bad(`${label} ${gram(label).obl}`) : good('');
    if (s.length < min) return bad(`${label}: mínimo ${min} caracteres`);
    if (s.length > max) return bad(`${label}: máximo ${max} caracteres`);
    return good(s);
  }

  // Nombre completo: al menos dos palabras reales (nombre y apellido), solo letras.
  function fullName(v) {
    const s = clean(v);
    if (!s) return bad('Ingresá el nombre completo');
    if (s.length > 80) return bad('El nombre es demasiado largo (máximo 80 caracteres)');
    if (!/^\p{L}[\p{L}'’.\- ]*$/u.test(s)) return bad('El nombre solo puede tener letras, espacios, guion y apóstrofe');
    const toks = s.split(' ').filter(Boolean), real = toks.filter(t => t.replace(/[^\p{L}]/gu, '').length >= 2);
    if (toks.length < 2 || real.length < 2) return bad('Ingresá nombre y apellido (nombre completo)');
    return good(s);
  }

  function email(v, { required = true } = {}) {
    const s = clean(v).toLowerCase();
    if (!s) return required ? bad('Ingresá el correo electrónico') : good('');
    if (s.length > 120 || !/^[a-z0-9._%+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$/.test(s)) return bad('Ingresá un correo válido (ej. nombre@correo.com)');
    return good(s);
  }

  function num(v, { min, max, label = 'El valor', required = true, decimals = 1, int = false } = {}) {
    const raw = String(v ?? '').trim().replace(',', '.');
    const g = gram(label);
    if (raw === '') return required ? bad(`${label} ${g.obl}`) : good(null);
    const n = Number(raw);
    if (!Number.isFinite(n)) return bad(`${label} ${g.must} ${g.num}`);
    if (int && !Number.isInteger(n)) return bad(`${label} ${g.must} ${g.int}`);
    if (n < min || n > max) return bad(`${label} ${g.must} estar entre ${min} y ${max}`);
    const f = Math.pow(10, decimals);
    return good(int ? n : Math.round(n * f) / f);
  }

  function oneOf(v, list, { label = 'una opción', required = true } = {}) {
    const s = clean(v);
    if (!s) return required ? bad(`Elegí ${label}`) : good(list[0]);
    return list.includes(s) ? good(s) : bad('Opción no válida');
  }

  function date(v, { label = 'La fecha', min, max, maxMsg, required = true } = {}) {
    const s = clean(v);
    if (!s) return required ? bad(`${label} es obligatoria`) : good('');
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return bad(`${label} no es válida`);
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return bad(`${label} no es válida`);
    if (min && s < min) return bad(`${label} es demasiado antigua`);
    if (max && s > max) return bad(maxMsg || `${label} es demasiado lejana`);
    return good(s);
  }

  function optOne(v, list) { const s = clean(v); if (!s) return good(''); return list.includes(s) ? good(s) : bad('Opción no válida'); }

  // Los ids no pueden coincidir con propiedades internas de JavaScript (__proto__, constructor, toString…): evita confusiones con objetos indexados por id
  const id = v => { const s = String(v ?? ''); return /^[A-Za-z0-9_-]{1,40}$/.test(s) && !(s in Object.prototype) && s !== 'prototype' ? good(s) : bad('id no válido'); };

  // Solo https:// o imágenes embebidas; nunca javascript:, http:, file:, etc.
  function imageUrl(v) {
    const s = String(v ?? '').trim();
    if (!s) return good('');
    if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= 300000) return good(s);
    try { const u = new URL(s); if (u.protocol === 'https:' && s.length <= 500) return good(u.href); } catch (e) { /* nada */ }
    return bad('Usá un enlace https:// a una imagen');
  }

  return { text, fullName, email, num, oneOf, optOne, date, id, imageUrl, clean, cleanMulti };
})();
