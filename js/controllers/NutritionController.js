/* ============================================================
   CONTROLADOR · Nutrición
   ============================================================ */
PF.Controllers.Nutrition = (function () {
  const V = PF.Views, S = PF.Selectors, Store = PF.Store;

  function render() { V.Nutrition.render(S.nutritionList()); }

  function create(clientId = '') {
    if (!PF.Controllers.App.requireClients()) return;
    V.Forms.nutrition({
      clients: Store.list('clients'),
      clientId,
      onSubmit(values) {
        const r = PF.Entities.nutrition(values);
        if (!r.ok) return PF.Controllers.App.fail('nutrition', r);
        V.Modal.close();
        Store.add('nutrition', r.record);
        V.Toast.show('Objetivo nutricional guardado');
      }
    });
  }

  function suggest() {
    const inp = V.Forms.readSuggestInputs(), c = Store.find('clients', inp.clientId), E = PF.Utils.esc;
    if (!c) { V.Forms.setSuggestNote('Elegí primero un cliente.', 'bad'); return; }
    const sex = inp.sex || c.sex, activity = inp.activity || c.activity, r = PF.Metrics.nutrition(c, { sex, activity });
    if (r.error) { V.Forms.setSuggestNote(E(r.error) + '.', 'bad'); return; }
    V.Forms.fillSuggestion(r, { sex, activity });
    const adj = r.adj ? `${r.adj > 0 ? '+' : ''}${Math.round(r.adj * 100)}%` : 'sin ajuste';
    const steps = r.steps.map(s => `<li><b>${E(s.title)}</b><code>${E(s.formula)}</code><span class="calc">${E(s.calc)}</span><small>${E(s.note)}</small></li>`).join('');
    V.Forms.setSuggestNote(`<b>TMB ${r.bmr} kcal</b> · gasto total ≈ <b>${r.tdee} kcal</b> (actividad ${E(activity.toLowerCase())}). Objetivo «${E(c.goal)}»: ${adj}. ${r.notes.map(E).join(' ')} ${E(PF.Advisory.nutrition(false))}<details class="calc-steps" open><summary>Ver cómo se calculó, paso a paso</summary><ol>${steps}</ol></details>`, 'ok');
  }

  function init() {
    PF.Events.on('nutrition:suggest', suggest);
    PF.Events.on('nutrition:new', d => create(d.clientId || ''));
    PF.Events.on('nutrition:delete', d => PF.Controllers.App.deleteRecord('nutrition', d.id));
  }

  return { init, render };
})();
