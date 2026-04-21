// ─────────────────────────────────────────────────────────────
// Overview Controller — KPIs, revenue chart, status, activity
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');

/**
 * GET /api/overview/stats
 * KPI cards: total clients, active projects, total revenue, pending.
 */
exports.getStats = async (req, res, next) => {
  try {
    const [clients, activeClients, activeProjects, revenue, pending] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM clients'),
      db.query("SELECT COUNT(*) AS count FROM clients WHERE status = 'Active'"),
      db.query("SELECT COUNT(*) AS count FROM projects WHERE status = 'Active'"),
      db.query('SELECT COALESCE(SUM(paid), 0) AS total FROM invoices'),
      db.query('SELECT COALESCE(SUM(amount - paid), 0) AS total FROM invoices'),
    ]);

    res.json({
      success: true,
      data: {
        totalClients:   parseInt(clients.rows[0].count),
        activeClients:  parseInt(activeClients.rows[0].count),
        activeProjects: parseInt(activeProjects.rows[0].count),
        totalRevenue:   parseFloat(revenue.rows[0].total),
        totalPending:   parseFloat(pending.rows[0].total),
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/overview/revenue-chart
 * Monthly revenue for last 7 months.
 */
exports.getRevenueChart = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') AS month,
        COALESCE(SUM(paid), 0) AS revenue
      FROM invoices
      WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * GET /api/overview/project-status
 * Active / Done / On Hold counts.
 */
exports.getProjectStatus = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM projects
      GROUP BY status
    `);

    const statusMap = { Active: 0, Done: 0, 'On Hold': 0 };
    result.rows.forEach((r) => { statusMap[r.status] = parseInt(r.count); });

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
    res.json({
      success: true,
      data: {
        active:  statusMap.Active,
        done:    statusMap.Done,
        onHold:  statusMap['On Hold'],
        total,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/overview/recent-activity
 * Last 10 activity log entries.
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT al.*, u.name AS user_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT 10
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};
