// ─────────────────────────────────────────────────────────────
// Activity Logger — records admin actions to activity_log table
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');

/**
 * Log an action to the activity_log table.
 *
 * @param {string}      action      - Description, e.g. "Created new client"
 * @param {string}      entityType  - Table name, e.g. "clients", "invoices"
 * @param {number|null} entityId    - ID of the affected record
 * @param {number|null} userId      - ID of the user performing the action
 */
const logActivity = async (action, entityType, entityId = null, userId = null) => {
  try {
    await db.query(
      `INSERT INTO activity_log (action, entity_type, entity_id, user_id)
       VALUES ($1, $2, $3, $4)`,
      [action, entityType, entityId, userId]
    );
  } catch (err) {
    // Never let logging failures break the main request
    console.error('⚠️  Activity log write failed:', err.message);
  }
};

module.exports = { logActivity };
