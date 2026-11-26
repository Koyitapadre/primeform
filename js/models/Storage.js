/* ============================================================
   MODELO · Storage
   Único punto de contacto con localStorage.
   (Para migrar a una API/backend, este es el archivo a reemplazar.)
   ============================================================ */
PF.Storage = {
  KEY: 'primeform_fitness_v01',

  available() {
    try { const k = '__pf_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; }
    catch (e) { return false; }
  },
  read() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); }
    catch (e) { return {}; }
  },
  write(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  },
  clear() { try { localStorage.removeItem(this.KEY); } catch (e) { /* nada */ } }
};

/* Preferencias NO sensibles (aceptación del aviso, fecha del último respaldo) */
PF.Meta = {
  KEY: 'primeform_meta_v1',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY) || '{}') || {}; } catch (e) { return {}; } },
  set(patch) { try { localStorage.setItem(this.KEY, JSON.stringify({ ...this.get(), ...patch })); } catch (e) { /* nada */ } }
};
