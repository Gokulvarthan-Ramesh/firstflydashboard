// ─────────────────────────────────────────────────────────────
// Projects Controller — CRUD with filter by type
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

/**
 * GET /api/projects
 * Query params: ?type=Restaurant POS&client_id=1
 */
exports.getAll = async (req, res, next) => {
  try {
    const { type, client_id } = req.query;
    let sql = `
      SELECT p.*, c.name AS client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'All') {
      params.push(type);
      sql += ` AND p.type = $${params.length}`;
    }
    if (client_id) {
      params.push(client_id);
      sql += ` AND p.client_id = $${params.length}`;
    }

    sql += ' ORDER BY p.created_at DESC';
    const result = await db.query(sql, params);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * GET /api/projects/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await db.query(`
      SELECT p.*, c.name AS client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Include task assignments for this project
    const assignments = await db.query(`
      SELECT ta.*, tm.name AS member_name
      FROM task_assignments ta
      JOIN team_members tm ON ta.member_id = tm.id
      WHERE ta.project_id = $1
      ORDER BY ta.created_at
    `, [id]);

    res.json({
      success: true,
      data: {
        ...project.rows[0],
        assignments: assignments.rows,
      },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/projects
 */
exports.create = async (req, res, next) => {
  try {
    const { name, client_id, type, amount, progress, status, description } = req.body;

    const result = await db.query(
      `INSERT INTO projects (name, client_id, type, amount, progress, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, client_id, type, amount || 0, progress || 0, status || 'Active', description]
    );

    await logActivity(`Created project: ${name}`, 'projects', result.rows[0].id, req.user.id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PUT /api/projects/:id
 * Update project fields (progress, status, etc.).
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, client_id, type, amount, progress, status, description } = req.body;

    const result = await db.query(
      `UPDATE projects SET
        name        = COALESCE($1, name),
        client_id   = COALESCE($2, client_id),
        type        = COALESCE($3, type),
        amount      = COALESCE($4, amount),
        progress    = COALESCE($5, progress),
        status      = COALESCE($6, status),
        description = COALESCE($7, description)
       WHERE id = $8 RETURNING *`,
      [name, client_id, type, amount, progress, status, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await logActivity(`Updated project: ${result.rows[0].name}`, 'projects', parseInt(id), req.user.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/projects/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await logActivity(`Deleted project: ${result.rows[0].name}`, 'projects', parseInt(id), req.user.id);

    res.json({ success: true, message: `Project "${result.rows[0].name}" deleted.` });
  } catch (err) { next(err); }
};
