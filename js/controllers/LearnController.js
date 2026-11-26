/* CONTROLADOR · Guía educativa de indicadores */
PF.Controllers.Learn = {
  init() {
    PF.Events.on('learn:open', d => {
      const p = PF.Selectors.progressFor(d.id);
      if (p && PF.Learn.TITLES[d.key]) PF.Views.Learn.open(PF.Learn.explain(d.key, p));
    });
  },
  render() { }
};
