/* ============================================================
   MODELO · Vault (cifrado opcional en reposo)
   AES-256-GCM con clave derivada de la contraseña (PBKDF2-SHA256,
   250.000 iteraciones). La contraseña NUNCA se guarda y NO se puede
   recuperar: sin ella los datos no se pueden descifrar.
   ============================================================ */
PF.Vault = (function () {
  const KEY = 'primeform_vault_v1', ITER = 250000;
  let key = null, salt = null, queue = Promise.resolve();
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = buf => { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  async function derive(pass, saltBytes, iter) {
    const km = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltBytes, iterations: iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const meta = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const isEnabled = () => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
  const active = () => !!key;
  const supported = () => !!(window.crypto && crypto.subtle);

  async function seal(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    localStorage.setItem(KEY, JSON.stringify({ v: 1, it: ITER, s: b64(salt), iv: b64(iv), ct: b64(ct) }));
  }
  async function setup(pass, obj) {
    salt = crypto.getRandomValues(new Uint8Array(16));
    key = await derive(pass, salt, ITER);
    await seal(obj);
  }
  async function open(pass, m) {
    const s = unb64(m.s), k = await derive(pass, s, m.it || ITER);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(m.iv) }, k, unb64(m.ct));
    return { k, s, data: JSON.parse(dec.decode(pt)) };
  }
  async function unlock(pass) {
    const m = meta(); if (!m) throw new Error('sin-boveda');
    try { const r = await open(pass, m); key = r.k; salt = r.s; return r.data; }
    catch (e) { throw new Error('contraseña'); }
  }
  async function verify(pass) { try { await open(pass, meta()); return true; } catch (e) { return false; } }
  function save(obj) { if (!key) return Promise.resolve(); queue = queue.then(() => seal(obj)).catch(() => { }); return queue; }
  function disable() { key = null; salt = null; try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } }

  return { isEnabled, active, supported, setup, unlock, verify, save, disable };
})();
