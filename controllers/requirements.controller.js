// ─────────────────────────────────────────────────────────────
// Requirements Controller — CRUD + status workflow
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

/**
 * GET /api/requirements
 * Query params: ?client_id=1&status=Pending
 */
exports.getAll = async (req, res, next) => {
  try {
    const { client_id, status } = req.query;
    let sql = `
      SELECT r.*, c.name AS client_name
      FROM requirements r
      JOIN clients c ON r.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (client_id) {
      params.push(client_id);
      sql += ` AND r.client_id = $${params.length}`;
    }
    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }

    sql += ' ORDER BY r.created_at DESC';
    const result = await db.query(sql, params);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * POST /api/requirements
 * New requirement — defaults to Pending.
 */
exports.create = async (req, res, next) => {
  try {
    const { client_id, title, detail, priority } = req.body;

    const result = await db.query(
      `INSERT INTO requirements (client_id, title, detail, priority)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [client_id, title, detail, priority || 'Medium']
    );

    await logActivity(`New requirement: ${title}`, 'requirements', result.rows[0].id, req.user.id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PUT /api/requirements/:id
 * Update requirement fields.
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, detail, priority, status } = req.body;

    const result = await db.query(
      `UPDATE requirements SET
        title    = COALESCE($1, title),
        detail   = COALESCE($2, detail),
        priority = COALESCE($3, priority),
        status   = COALESCE($4, status)
       WHERE id = $5 RETURNING *`,
      [title, detail, priority, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    await logActivity(`Updated requirement: ${result.rows[0].title}`, 'requirements', parseInt(id), req.user.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/requirements/:id/advance
 * One-click status advancement: Pending → In Progress → Done.
 */
exports.advanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const current = await db.query('SELECT * FROM requirements WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    const statusFlow = { 'Pending': 'In Progress', 'In Progress': 'Done' };
    const currentStatus = current.rows[0].status;
    const nextStatus = statusFlow[currentStatus];

    if (!nextStatus) {
      return res.status(400).json({ success: false, message: 'Requirement is already Done.' });
    }

    const result = await db.query(
      'UPDATE requirements SET status = $1 WHERE id = $2 RETURNING *',
      [nextStatus, id]
    );

    await logActivity(
      `Requirement "${result.rows[0].title}" status: ${currentStatus} → ${nextStatus}`,
      'requirements', parseInt(id), req.user.id
    );

    res.json({ success: true, data: result.rows[0], message: `Status advanced to ${nextStatus}` });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/requirements/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM requirements WHERE id = $1 RETURNING title', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    await logActivity(`Deleted requirement: ${result.rows[0].title}`, 'requirements', parseInt(id), req.user.id);

    res.json({ success: true, message: `Requirement "${result.rows[0].title}" deleted.` });
  } catch (err) { next(err); }
};
