// ─────────────────────────────────────────────────────────────
// Clients Controller — full CRUD with search & filter
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

/**
 * GET /api/clients
 * Query params: ?search=name&status=Active
 */
exports.getAll = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let sql = 'SELECT * FROM clients WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR contact ILIKE $${params.length})`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await db.query(sql, params);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * GET /api/clients/:id
 * Detail view with associated requirements and invoices.
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const [requirements, invoices] = await Promise.all([
      db.query('SELECT * FROM requirements WHERE client_id = $1 ORDER BY created_at DESC', [id]),
      db.query('SELECT * FROM invoices WHERE client_id = $1 ORDER BY created_at DESC', [id]),
    ]);

    res.json({
      success: true,
      data: {
        ...client.rows[0],
        requirements: requirements.rows,
        invoices: invoices.rows,
      },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/clients
 * Create new client — defaults to Pending status.
 */
exports.create = async (req, res, next) => {
  try {
    const { name, contact, phone, email, project_type, amount } = req.body;

    const result = await db.query(
      `INSERT INTO clients (name, contact, phone, email, project_type, amount)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, contact, phone, email, project_type, amount || 0]
    );

    await logActivity(`Created new client: ${name}`, 'clients', result.rows[0].id, req.user.id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PUT /api/clients/:id
 * Update client fields.
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, email, project_type, amount, paid, status } = req.body;

    const result = await db.query(
      `UPDATE clients SET
        name = COALESCE($1, name),
        contact = COALESCE($2, contact),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        project_type = COALESCE($5, project_type),
        amount = COALESCE($6, amount),
        paid = COALESCE($7, paid),
        status = COALESCE($8, status)
       WHERE id = $9 RETURNING *`,
      [name, contact, phone, email, project_type, amount, paid, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    await logActivity(`Updated client: ${result.rows[0].name}`, 'clients', parseInt(id), req.user.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/clients/:id
 * Super Admin only.
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM clients WHERE id = $1 RETURNING name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    await logActivity(`Deleted client: ${result.rows[0].name}`, 'clients', parseInt(id), req.user.id);

    res.json({ success: true, message: `Client "${result.rows[0].name}" deleted.` });
  } catch (err) { next(err); }
};
