/* CONTROLADOR · Resumen: lee del modelo y alimenta la vista (incluye el aviso de respaldo) */
PF.Controllers.Dashboard = {
  render() {
    const S = PF.Selectors, m = PF.Meta.get();
    const backupDue = PF.Store.hasClients() && (!m.lastBackup || m.lastBackup < PF.Utils.daysAgo(7));
    const all = S.priorityClients();
    PF.Views.Dashboard.render({ stats: S.dashboardStats(), recent: S.recentClients(4), weeks: S.weeklyActivity(8), backupDue, priority: all.filter(x => x.risk.level !== 'ok').slice(0, 5), clientCount: all.length });
  }
};
