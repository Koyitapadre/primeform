/* VISTA · Compartir con el cliente (ventana del entrenador) y encabezado del modo «enlace de cliente» */
PF.Views.Share = (function () {
  const { esc, fmtDate } = PF.Utils, F = PF.Views.FormFields, Modal = PF.Views.Modal;
  const { field, selectField, checkField, read } = F;
  const DAYS = ['30 días', '60 días', '90 días', '180 días'];
  const chk = (id, label) => `<label class="check"><input type="checkbox" id="${id}" checked><span>${label}</span></label>`;

  function dialog({ client, onSubmit }) {
    Modal.open({
      title: 'Compartir con ' + client.name, saveLabel: 'Generar enlace',
      body: `<p class="formnote">Se genera un <b>enlace cifrado</b> con una copia del plan. El cliente lo abre en su celular con una contraseña, sin crear cuenta. No se comparten el correo, tus notas ni las revisiones.</p>
        <div class="field"><label for="sPass">Contraseña del enlace <span class="req">*</span></label><div class="passrow"><input id="sPass" type="text" maxlength="64" autocomplete="off" spellcheck="false" placeholder="Mínimo 10 caracteres" aria-describedby="e-sPass"><button type="button" class="btn small" data-action="share:gen">Generar una segura</button></div><div class="err" id="e-sPass" role="alert"></div></div>
        ${selectField('Vigencia de la copia', 'sDays', DAYS, '60 días', { req: true })}
        <div class="field" id="sInclude"><label>Qué incluir</label>${chk('sWorkouts', 'Rutinas y ejercicios (con su guía)')}${chk('sProgress', 'Progreso físico (evaluaciones y gráficos)')}${chk('sNutrition', 'Objetivo nutricional')}<div class="err" id="e-sInclude" role="alert"></div></div>
        ${checkField('El cliente aceptó recibir sus datos de salud por este medio', 'sOk', false)}
        <div id="shareResult" aria-live="polite"></div>
        <p class="note">Enviá la contraseña <b>por otro medio</b> (llamada o un mensaje aparte): quien tenga el enlace y la contraseña ve el plan. La copia no se puede revocar antes de que venza; si cambiás el plan, generá un enlace nuevo.</p>`,
      onSave: () => onSubmit({ password: read('sPass'), days: parseInt(read('sDays'), 10), workouts: read('sWorkouts'), progress: read('sProgress'), nutrition: read('sNutrition'), ok: read('sOk') })
    });
  }
  function setPassword(p) { const el = document.getElementById('sPass'); if (el) { el.value = p; F.clearError(el); } }
  function showResult({ link, password, client, length, expires }) {
    const el = document.getElementById('shareResult'); if (!el) return;
    const wa = 'https://wa.me/?text=' + encodeURIComponent('Hola ' + client.name.split(' ')[0] + ', este es tu plan de entrenamiento: ' + link);
    el.innerHTML = `<div class="share-result"><div class="formsub">✅ Enlace listo (vence el ${esc(fmtDate(expires))})</div>
      <textarea id="shareLink" readonly rows="4" aria-label="Enlace para el cliente">${esc(link)}</textarea>
      <div class="toolbar" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" class="btn small primary" data-action="share:copy" data-what="link">Copiar enlace</button><button type="button" class="btn small" data-action="share:copy" data-what="pass">Copiar contraseña</button><a class="btn small" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">Enviar enlace por WhatsApp</a></div>
      ${length > 8000 ? '<p class="note">El enlace es largo: algunas apps pueden cortarlo. Usá «Copiar enlace».</p>' : ''}</div>`;
  }
  // Encabezado del modo «enlace de cliente»
  function banner({ created, expires, org }, saved) {
    const el = document.getElementById('viewerBanner'); if (!el) return;
    el.hidden = false;
    el.innerHTML = `<div class="vb-title">Tu plan de entrenamiento</div><p>Copia del ${esc(fmtDate(created))} · válida hasta el ${esc(fmtDate(expires))}. Si tu entrenador cambia el plan, pedile un enlace nuevo.</p>${org.name ? `<p>Responsable: <b>${esc(org.name)}</b>${org.email ? ' · ' + esc(org.email) : ''}${org.phone ? ' · ' + esc(org.phone) : ''}</p>` : ''}<div class="vb-actions">${saved ? '<span class="vb-saved">✅ Guardado en este dispositivo</span><button type="button" class="linkbtn" data-action="plan:forget">Olvidar</button>' : '<button type="button" class="btn small primary" data-action="plan:save">📲 Guardar mi plan en este dispositivo</button>'}<button type="button" class="btn small" data-action="pwa:help">Instalar como app</button></div><p class="vb-adv"><span class="adv-dot" aria-hidden="true">i</span> ${esc(PF.Advisory.short(true))}</p><p class="vb-priv">🔒 Tus datos viajan cifrados dentro de este enlace: este dispositivo no los guarda y no se envían a ningún servidor. <button type="button" class="linkbtn" data-action="legal:open" data-doc="privacy">Aviso de privacidad</button> · <button type="button" class="linkbtn" data-action="legal:open" data-doc="terms">Términos</button></p>`;
  }
  return { dialog, setPassword, showResult, banner };
})();
