// ─────────────────────────────────────────────────────────────
// Billing Controller — invoices CRUD + summary + mark-paid
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');
const { syncClientTotals } = require('../utils/sync');
const { logActivity } = require('../utils/activityLogger');

/**
 * GET /api/billing
 * List all invoices with client name.
 */
exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT i.*, c.name AS client_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * GET /api/billing/summary
 * Total billed, collected, pending, invoice count.
 */
exports.getSummary = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*)                       AS total_invoices,
        COALESCE(SUM(amount), 0)       AS total_billed,
        COALESCE(SUM(paid), 0)         AS total_collected,
        COALESCE(SUM(amount - paid), 0) AS total_pending
      FROM invoices
    `);

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        totalInvoices:  parseInt(row.total_invoices),
        totalBilled:    parseFloat(row.total_billed),
        totalCollected: parseFloat(row.total_collected),
        totalPending:   parseFloat(row.total_pending),
      },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/billing
 * Create new invoice — auto-generates invoice_number via DB trigger.
 */
exports.create = async (req, res, next) => {
  try {
    const { client_id, project, amount } = req.body;

    // Get next invoice number manually (trigger will also set it)
    const countResult = await db.query('SELECT COUNT(*) AS c FROM invoices');
    const nextNum = parseInt(countResult.rows[0].c) + 1;
    const invoiceNumber = `INV-${String(nextNum).padStart(3, '0')}`;

    const result = await db.query(
      `INSERT INTO invoices (invoice_number, client_id, project, amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [invoiceNumber, client_id, project, amount]
    );

    await logActivity(`Created invoice ${invoiceNumber}`, 'invoices', result.rows[0].id, req.user.id);
    await syncClientTotals(client_id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/billing/:id/mark-paid
 * Set paid = amount, status = 'Paid'.
 */
exports.markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE invoices SET paid = amount, status = 'Paid' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Sync client totals
    const invoice = result.rows[0];
    await syncClientTotals(invoice.client_id);

    await logActivity(
      `Invoice ${invoice.invoice_number} marked as Paid (₹${invoice.amount})`,
      'invoices', parseInt(id), req.user.id
    );

    res.json({ success: true, data: invoice, message: 'Invoice marked as paid.' });
  } catch (err) { next(err); }
};

/**
 * GET /api/billing/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT i.*, c.name AS client_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PUT /api/billing/:id
 * Update invoice fields.
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { project, amount, paid, status } = req.body;

    const result = await db.query(
      `UPDATE invoices SET
        project = COALESCE($1, project),
        amount  = COALESCE($2, amount),
        paid    = COALESCE($3, paid),
        status  = COALESCE($4, status)
       WHERE id = $5 RETURNING *`,
      [project, amount, paid, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Sync client totals
    const invoice = result.rows[0];
    await syncClientTotals(invoice.client_id);

    await logActivity(`Updated invoice ${invoice.invoice_number}`, 'invoices', parseInt(id), req.user.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/billing/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM invoices WHERE id = $1 RETURNING invoice_number, client_id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Sync client totals after deletion
    await syncClientTotals(result.rows[0].client_id);

    await logActivity(`Deleted invoice ${result.rows[0].invoice_number}`, 'invoices', parseInt(id), req.user.id);

    res.json({ success: true, message: `Invoice "${result.rows[0].invoice_number}" deleted.` });
  } catch (err) { next(err); }
};
