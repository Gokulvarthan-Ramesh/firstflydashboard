// ─────────────────────────────────────────────────────────────
// Data Synchronization Utilities
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');

/**
 * Recalculate and update total amount and paid for a client
 * based on all their related invoices.
 * 
 * @param {number} clientId - The ID of the client to sync
 */
const syncClientTotals = async (clientId) => {
  if (!clientId) return;
  try {
    const result = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(paid), 0)   AS total_paid
      FROM invoices
      WHERE client_id = $1
    `, [clientId]);

    const { total_amount, total_paid } = result.rows[0];

    await db.query(`
      UPDATE clients 
      SET 
        amount = $1,
        paid = $2
      WHERE id = $3
    `, [total_amount, total_paid, clientId]);
    
    console.log(`🔄  Synced totals for client #${clientId}: ${total_amount} / ${total_paid}`);
  } catch (err) {
    console.error(`❌  Failed to sync totals for client #${clientId}:`, err.message);
  }
};

/**
 * Recalculate and update active/completed project counts for a team member
 * based on their task assignments.
 * 
 * @param {number} memberId - The ID of the team member to sync
 */
const syncTeamMemberStats = async (memberId) => {
  if (!memberId) return;
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Active') AS active_count,
        COUNT(*) FILTER (WHERE status = 'Done')   AS completed_count
      FROM task_assignments
      WHERE member_id = $1
    `, [memberId]);

    const { active_count, completed_count } = stats.rows[0];

    await db.query(`
      UPDATE team_members 
      SET 
        active_projects = $1,
        completed_projects = $2
      WHERE id = $3
    `, [active_count, completed_count, memberId]);

    console.log(`🔄  Synced stats for team member #${memberId}: ${active_count} active / ${completed_count} done`);
  } catch (err) {
    console.error(`❌  Failed to sync stats for team member #${memberId}:`, err.message);
  }
};

module.exports = {
  syncClientTotals,
  syncTeamMemberStats
};
