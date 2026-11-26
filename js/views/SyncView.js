/* VISTA · Sincronización del equipo: indicador de la barra, tarjeta de ajustes y ventanas */
PF.Views.Sync = (function () {
  const { esc, fmtDate } = PF.Utils, F = PF.Views.FormFields, Modal = PF.Views.Modal;
  const $ = id => document.getElementById(id);
  const ago = t => { if (!t) return 'todavía no'; const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 10 ? 'ahora mismo' : s < 60 ? `hace ${s} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : s < 86400 ? `hace ${Math.round(s / 3600)} h` : `el ${fmtDate(new Date(t).toISOString().slice(0, 10))}`; };
  const LABEL = { off: ['Sin conectar al equipo', 'off'], syncing: ['Sincronizando…', 'busy'], idle: ['Sincronizado', 'ok'], offline: ['Sin conexión: se sincronizará al volver', 'warn'], error: ['Sincronización con error', 'bad'], nosite: ['Sin servidor de sincronización', 'off'] };

  function renderChip(s) {
    const el = $('syncChip'); if (!el) return;
    const [text, tone] = LABEL[s.status] || LABEL.off;
    el.className = 'syncchip ' + tone; el.hidden = false;
    el.innerHTML = `<i aria-hidden="true"></i><span>${esc(s.status === 'idle' ? 'Sincronizado ' + ago(s.last) : text)}</span>`;
    el.title = s.error || text;
  }
  function renderCard(s) {
    const el = $('syncCard'); if (!el) return;
    const [text, tone] = LABEL[s.status] || LABEL.off;
    el.innerHTML = `<h2 style="margin-top:0">Sincronización del equipo</h2>
      <p class="muted">Mantiene los mismos clientes, rutinas y datos en todos los dispositivos de tu equipo. Los datos se <b>cifran en cada dispositivo</b> antes de subir: el servidor solo guarda texto cifrado y no puede leerlo.</p>
      <div class="syncstate ${tone}"><i aria-hidden="true"></i><div><b>${esc(text)}</b>${s.connected ? `<div class="muted" style="font-size:12.5px">Última sincronización: ${esc(ago(s.last))} · versión ${s.rev}</div>` : ''}${s.error ? `<div class="syncerr">${esc(s.error)}</div>` : ''}</div></div>
      <div class="toolbar" style="justify-content:flex-start">${s.connected
        ? `<button class="btn primary" data-action="sync:now">Sincronizar ahora</button><button class="btn" data-action="sync:versions">Versiones anteriores</button><button class="btn" data-action="sync:disconnect">Desconectar este dispositivo</button>`
        : `<button class="btn primary" data-action="sync:connect">Conectar este dispositivo al equipo</button>`}</div>
      ${s.connected ? '' : '<p class="note">El <b>primer</b> dispositivo crea la clave del equipo; los demás la ingresan para unirse. Si un dispositivo ya tiene clientes, se combinan con los del equipo.</p>'}`;
  }
  function connectDialog({ onSubmit }) {
    Modal.open({
      title: 'Conectar al equipo', saveLabel: 'Conectar',
      body: `<p class="formnote">La <b>clave del equipo</b> cifra los datos antes de salir de este dispositivo. Tiene que ser la <b>misma</b> en todos los dispositivos y no se puede recuperar: guardala en un gestor de contraseñas.</p>
        <div class="field"><label for="sKey">Clave del equipo <span class="req">*</span></label><div class="passrow"><input id="sKey" type="text" maxlength="200" autocomplete="off" spellcheck="false" placeholder="Mínimo 16 caracteres" aria-describedby="e-sKey"><button type="button" class="btn small" data-action="sync:genkey">Generar una nueva</button></div><div class="err" id="e-sKey" role="alert"></div></div>
        <div class="note" id="sKeyNote">Si es el <b>primer</b> dispositivo, generá una clave y compartila con tu equipo por un canal seguro. Si ya existe, pegá la que tiene tu equipo.</div>
        ${F.checkField('Entiendo que sin esta clave nadie puede recuperar los datos del servidor', 'sAck', false)}`,
      onSave: () => onSubmit({ key: F.read('sKey'), ack: F.read('sAck') })
    });
  }
  function setKey(k) { const el = $('sKey'); if (el) { el.value = k; F.clearError(el); } const n = $('sKeyNote'); if (n) n.innerHTML = '✅ <b>Guardá esta clave ahora</b> (gestor de contraseñas) y compartila con tu equipo por un canal seguro. No se muestra de nuevo.'; }
  function versionsDialog(list) {
    Modal.open({
      title: 'Versiones anteriores', saveLabel: 'Cerrar', onSave: () => Modal.close(),
      body: `<p class="formnote">Cada guardado en el servidor es una versión. Restaurar una crea un cambio nuevo que se aplica en todos los dispositivos; no borra el historial.</p>${list.length ? `<div class="tablewrap"><table><thead><tr><th>Versión</th><th>Fecha</th><th>Guardó</th><th></th></tr></thead><tbody>${list.map((v, i) => `<tr><td>${v.rev}${i === 0 ? ' <span class="tag green">actual</span>' : ''}</td><td>${esc(new Date(v.updatedAt).toLocaleString('es-CR'))}</td><td>${esc(v.updatedBy || '—')}</td><td>${i === 0 ? '' : `<button class="btn small" data-action="sync:restore" data-rev="${esc(v.rev)}">Restaurar</button>`}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Todavía no hay versiones.</div>'}`
    });
  }
  return { renderChip, renderCard, connectDialog, setKey, versionsDialog };
})();
