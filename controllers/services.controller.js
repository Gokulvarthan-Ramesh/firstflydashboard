// ─────────────────────────────────────────────────────────────
// Services Controller — catalogue CRUD + quote request
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');
const { sendEmail } = require('../config/email');
const { logActivity } = require('../utils/activityLogger');

/**
 * GET /api/services
 * List all active services.
 */
exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM services WHERE active = TRUE ORDER BY id'
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * PUT /api/services/:id
 * Super Admin only — update service details/pricing.
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, description, price, tag, active } = req.body;

    const result = await db.query(
      `UPDATE services SET
        name        = COALESCE($1, name),
        icon        = COALESCE($2, icon),
        description = COALESCE($3, description),
        price       = COALESCE($4, price),
        tag         = COALESCE($5, tag),
        active      = COALESCE($6, active)
       WHERE id = $7 RETURNING *`,
      [name, icon, description, price, tag, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    await logActivity(`Updated service: ${result.rows[0].name}`, 'services', parseInt(id), req.user.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * POST /api/services/quote-request
 * Send a quote request notification.
 */
exports.requestQuote = async (req, res, next) => {
  try {
    const { service_id, client_name, client_email, message } = req.body;

    // Look up service name
    const service = await db.query('SELECT name FROM services WHERE id = $1', [service_id]);
    const serviceName = service.rows.length ? service.rows[0].name : 'Unknown Service';

    // Send email notification to First Fly Digital Solutions team
    await sendEmail({
      to: process.env.SMTP_USER || 'info@firstfly.in',
      subject: `Quote Request: ${serviceName} — from ${client_name}`,
      text: [
        `New quote request received:`,
        ``,
        `Service:  ${serviceName}`,
        `Client:   ${client_name}`,
        `Email:    ${client_email}`,
        `Message:  ${message || 'N/A'}`,
        ``,
        `— First Fly Digital Solutions Dashboard`,
      ].join('\n'),
    });

    await logActivity(`Quote request for ${serviceName} by ${client_name}`, 'services', service_id, req.user?.id);

    res.json({ success: true, message: 'Quote request sent successfully.' });
  } catch (err) { next(err); }
};

/**
 * GET /api/services/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * POST /api/services
 * Admin+ — create a new service.
 */
exports.create = async (req, res, next) => {
  try {
    const { name, icon, description, price, tag, active } = req.body;

    const result = await db.query(
      `INSERT INTO services (name, icon, description, price, tag, active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, icon, description, price, tag, active !== undefined ? active : true]
    );

    await logActivity(`Created service: ${name}`, 'services', result.rows[0].id, req.user.id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/services/:id
 * Super Admin only.
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    await logActivity(`Deleted service: ${result.rows[0].name}`, 'services', parseInt(id), req.user.id);

    res.json({ success: true, message: `Service "${result.rows[0].name}" deleted.` });
  } catch (err) { next(err); }
};
