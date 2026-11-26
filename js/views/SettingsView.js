/* VISTA · Datos y ajustes: descargas, lectura de archivos y estado de seguridad */
PF.Views.Settings = (function () {
  const $ = id => document.getElementById(id);

  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const pickFile = () => $('importFile').click();
  function readFile(file, callback) {
    if (file.size > 20 * 1024 * 1024) { callback(null, 'El archivo es demasiado grande (máx. 20 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.onerror = () => callback(null, 'No se pudo leer el archivo');
    reader.readAsText(file);
  }
  const resetFileInput = () => { $('importFile').value = ''; };

  function renderSecurity({ supported, enabled, active }) {
    const on = enabled && active;
    $('secStatus').innerHTML = !supported ? 'Este navegador no permite el cifrado. Actualizalo para usar contraseña.' : on ? '<b>Protegido:</b> los datos se guardan cifrados (AES-256) y la app se bloquea sola tras 10 minutos sin uso.' : '<b>Sin contraseña:</b> los datos se guardan sin cifrar en este navegador. Activá la contraseña si compartís el equipo.';
    $('secEnable').hidden = on || !supported; $('secLock').hidden = !on; $('secDisable').hidden = !on;
    $('secPill').textContent = on ? '🔒 Cifrado activo' : 'Datos en este dispositivo';
    $('secPill').classList.toggle('ok', on);
    $('lockBtn').hidden = !on;
  }
  const renderBackup = text => { $('backupInfo').textContent = text; };

  return { download, pickFile, readFile, resetFileInput, renderSecurity, renderBackup };
})();
