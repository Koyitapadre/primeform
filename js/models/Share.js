/* ============================================================
   MODELO · Share (enlace para que el cliente vea su plan, sin cuentas ni servidor)
   El plan viaja DENTRO del enlace, en el fragmento (#s=…), que el navegador
   nunca envía a ningún servidor. Se comprime (gzip) y se cifra con AES-256-GCM;
   la clave sale de una contraseña (PBKDF2-SHA256, 250 000 iteraciones).
   Formato: [versión(1)][compresión(1)][sal(16)][iv(12)][cifrado]; los dos primeros
   bytes van autenticados (AAD). Solo comparte lo mínimo: sin correo, sin notas
   privadas, sin revisiones y sin datos de consentimiento.
   Limitación honesta: es una copia; el entrenador no puede revocarla antes de que
   venza (la vigencia se verifica en el navegador del cliente).
   ============================================================ */
PF.Share = (function () {
  const VER = 1, ITER = 250000, MAX_PLAIN = 2000000, MAX_LINK = 60000;
  const te = new TextEncoder(), td = new TextDecoder();
  const err = code => Object.assign(new Error(code), { code });
  const subtle = () => (window.crypto && window.crypto.subtle) || null;
  const toB64u = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const fromB64u = s => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const canGzip = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number), t = new Date(y, m - 1, d + n); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
  const isLink = h => /^#s=/.test(h === undefined ? location.hash : h);

  async function pipe(bytes, stream, cap) {
    const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader(), chunks = []; let n = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; if (cap && n > cap) throw err('format'); chunks.push(value); }
    const out = new Uint8Array(n); let o = 0; chunks.forEach(c => { out.set(c, o); o += c.length; }); return out;
  }
  async function deriveKey(pass, salt) {
    const base = await subtle().importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return subtle().deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // Qué se comparte (mínimo necesario)
  function payload(id, o) {
    const S = PF.Store, c = S.find('clients', id); if (!c) return null;
    const t = PF.Utils.today(), days = [30, 60, 90, 180].includes(+o.days) ? +o.days : 60;
    const inc = { workouts: o.workouts !== false, progress: o.progress !== false, nutrition: o.nutrition !== false };
    const own = k => S.list(k).filter(x => x.clientId === id);
    const workouts = inc.workouts ? own('workouts') : [], used = new Set(workouts.flatMap(w => w.exercises.map(e => e.name)));
    const db = {
      clients: [{ id: c.id, name: c.name, age: c.age, sex: c.sex, activity: c.activity, height: c.height, weight: c.weight, goal: c.goal, experience: c.experience, start: c.start, goalWeight: c.goalWeight, goalFat: c.goalFat, goalDate: c.goalDate }],
      workouts,
      measures: inc.progress ? own('measures').map(({ notes, ...m }) => m) : [],
      nutrition: inc.nutrition ? own('nutrition').sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 1) : [],
      checkins: [],
      exercises: S.list('exercises').filter(e => used.has(e.name))
    };
    const org = PF.Legal.org();
    return { v: VER, created: t, expires: addDays(t, days), org: { name: org.name, email: org.email, phone: org.phone }, inc, db };
  }

  async function build(clientId, o) {
    if (!subtle()) throw err('nocrypto');
    const p = payload(clientId, o); if (!p) throw err('client');
    let bytes = te.encode(JSON.stringify(p)), flag = 0;
    if (canGzip() && !o.noCompress) { try { bytes = await pipe(bytes, new CompressionStream('gzip')); flag = 1; } catch (e) { bytes = te.encode(JSON.stringify(p)); flag = 0; } }
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), head = new Uint8Array([VER, flag]);
    const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv, additionalData: head }, await deriveKey(o.password, salt), bytes));
    const out = new Uint8Array(30 + ct.length); out.set(head, 0); out.set(salt, 2); out.set(iv, 18); out.set(ct, 30);
    const base = PF.Legal.org().planUrl || location.href.split('#')[0];          // los enlaces apuntan al sitio PÚBLICO de clientes
    const link = base + '#s=' + toB64u(out);
    if (link.length > MAX_LINK) throw err('toolarge');
    return { link, length: link.length, expires: p.expires, compressed: flag === 1 };
  }

  // Abre un enlace: devuelve datos ya saneados (nunca se confía en el contenido descifrado)
  async function open(hash, pass) {
    const m = /^#s=([A-Za-z0-9_-]+)$/.exec(hash || ''); if (!m) throw err('format');
    if (!subtle()) throw err('nocrypto');
    let raw; try { raw = fromB64u(m[1]); } catch (e) { throw err('format'); }
    if (raw.length < 47) throw err('format');
    if (raw[0] !== VER) throw err('version');
    if (raw[1] !== 0 && raw[1] !== 1) throw err('format');
    let plain;
    try { plain = new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: raw.subarray(18, 30), additionalData: raw.subarray(0, 2) }, await deriveKey(pass, raw.subarray(2, 18)), raw.subarray(30))); }
    catch (e) { throw err('password'); }
    if (raw[1] === 1) { if (!canGzip()) throw err('unsupported'); plain = await pipe(plain, new DecompressionStream('gzip'), MAX_PLAIN); }
    let p; try { p = JSON.parse(td.decode(plain)); } catch (e) { throw err('format'); }
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!p || typeof p !== 'object' || p.v !== VER || !iso.test(p.expires || '') || !iso.test(p.created || '')) throw err('format');
    if (PF.Utils.today() > p.expires) throw Object.assign(err('expired'), { expires: p.expires });
    const r = PF.Schema.sanitizeDb(p.db);
    if (r.data.clients.length !== 1) throw err('format');
    return { db: r.data, clientId: r.data.clients[0].id, created: p.created, expires: p.expires, org: PF.Legal.clean(p.org) };
  }
  return { build, open, isLink, MAX_LINK };
})();
