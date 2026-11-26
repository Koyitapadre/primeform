/* VISTA · Campos de formulario con etiqueta, atributos de validación y mensaje de error propio */
PF.Views.FormFields = (function () {
  const { esc } = PF.Utils;
  const attrs = a => Object.entries(a || {}).filter(([, v]) => v !== undefined && v !== false && v !== null).map(([k, v]) => v === true ? k : `${k}="${esc(v)}"`).join(' ');
  const err = id => `<div class="err" id="e-${id}" role="alert"></div>`;
  const star = req => req ? ' <span class="req" title="Obligatorio">*</span>' : '';

  function field(label, name, placeholder = '', type = 'text', value = '', a = {}) {
    const { req, ...rest } = a;
    return `<div class="field"><label for="${name}">${label}${star(req)}</label><input id="${name}" name="${name}" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" aria-describedby="e-${name}" ${req ? 'aria-required="true"' : ''} ${attrs(rest)}>${err(name)}</div>`;
  }
  function selectField(label, name, options, selected = '', { req = false, placeholder = '' } = {}) {
    const opts = (placeholder ? `<option value="">${esc(placeholder)}</option>` : '') + options.map(o => `<option ${o === selected ? 'selected' : ''}>${esc(o)}</option>`).join('');
    return `<div class="field"><label for="${name}">${label}${star(req)}</label><select id="${name}" aria-describedby="e-${name}" ${req ? 'aria-required="true"' : ''}>${opts}</select>${err(name)}</div>`;
  }
  function textareaField(label, name, rows, placeholder = '', { maxlength = 500, value = '' } = {}) {
    return `<div class="field"><label for="${name}">${label}</label><textarea id="${name}" rows="${rows}" maxlength="${maxlength}" placeholder="${esc(placeholder)}" aria-describedby="e-${name}">${esc(value)}</textarea>${err(name)}</div>`;
  }
  function clientSelect(name, clients, selectedId = '') {
    const opts = '<option value="">Seleccioná un cliente…</option>' + clients.map(c => `<option value="${esc(c.id)}" ${selectedId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    return `<div class="field"><label for="${name}">Cliente${star(true)}</label><select id="${name}" aria-describedby="e-${name}" aria-required="true">${opts}</select>${err(name)}</div>`;
  }
  function checkField(label, name, checked = false) {
    return `<div class="field checkrow"><label class="check"><input type="checkbox" id="${name}" ${checked ? 'checked' : ''} aria-describedby="e-${name}"><span>${label} <span class="req">*</span></span></label>${err(name)}</div>`;
  }
  // Llena un <select> de filtro con los clientes, conservando la selección actual.
  function fillClientFilter(id, clients) {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value;
    el.innerHTML = '<option value="">Todos los clientes</option>' + clients.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    el.value = val;
  }
  const read = id => { const el = document.getElementById(id); return el.type === 'checkbox' ? el.checked : el.value; };

  function clearError(el) {
    if (!el || !el.id) return;
    el.classList.remove('invalid'); el.removeAttribute('aria-invalid');
    const box = document.getElementById('e-' + el.id); if (box) box.textContent = '';
    el.removeAttribute('title');
  }
  function clearAll() {
    document.querySelectorAll('#modalBody .err').forEach(b => { b.textContent = ''; });
    document.querySelectorAll('#modalBody .invalid').forEach(el => { el.classList.remove('invalid'); el.removeAttribute('aria-invalid'); el.removeAttribute('title'); });
  }

  return { field, selectField, textareaField, clientSelect, checkField, fillClientFilter, read, clearError, clearAll };
})();
