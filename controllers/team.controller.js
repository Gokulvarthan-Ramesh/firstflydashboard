// ─────────────────────────────────────────────────────────────
// Team Controller — members CRUD + task assignments
// ─────────────────────────────────────────────────────────────
const db = require('../config/db');
const { syncTeamMemberStats } = require('../utils/sync');
const { logActivity } = require('../utils/activityLogger');

// ═══════════ TEAM MEMBERS ═══════════════════════════════════

/**
 * GET /api/team/members
 */
exports.getMembers = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM team_members ORDER BY name');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * POST /api/team/members
 */
exports.addMember = async (req, res, next) => {
  try {
    const { name, role } = req.body;

    const result = await db.query(
      `INSERT INTO team_members (name, role) VALUES ($1, $2) RETURNING *`,
      [name, role]
    );

    await logActivity(`Added team member: ${name}`, 'team_members', result.rows[0].id, req.user.id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/team/members/:id
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM team_members WHERE id = $1 RETURNING name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    await logActivity(`Removed team member: ${result.rows[0].name}`, 'team_members', parseInt(id), req.user.id);

    res.json({ success: true, message: `Team member "${result.rows[0].name}" removed.` });
  } catch (err) { next(err); }
};

/**
 * PUT /api/team/members/:id
 * Update team member details.
 */
exports.updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const result = await db.query(
      `UPDATE team_members SET
        name = COALESCE($1, name),
        role = COALESCE($2, role)
       WHERE id = $3 RETURNING *`,
      [name, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    await logActivity(`Updated team member: ${result.rows[0].name}`, 'team_members', parseInt(id), req.user.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ═══════════ TASK ASSIGNMENTS ═══════════════════════════════

/**
 * GET /api/team/assignments
 */
exports.getAssignments = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        ta.*,
        tm.name AS member_name,
        tm.role AS member_role,
        p.name  AS project_name
      FROM task_assignments ta
      JOIN team_members tm ON ta.member_id = tm.id
      JOIN projects p      ON ta.project_id = p.id
      ORDER BY tm.name, p.name
    `);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { next(err); }
};

/**
 * POST /api/team/assignments
 */
exports.createAssignment = async (req, res, next) => {
  try {
    const { member_id, project_id, role, progress, status } = req.body;

    const result = await db.query(
      `INSERT INTO task_assignments (member_id, project_id, role, progress, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [member_id, project_id, role, progress || 0, status || 'Active']
    );

    // Update active_projects count for the team member
    await syncTeamMemberStats(member_id);

    await logActivity(`Assigned task to member #${member_id} for project #${project_id}`, 'task_assignments', result.rows[0].id, req.user.id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * PUT /api/team/assignments/:id
 */
exports.updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, progress, status } = req.body;

    const result = await db.query(
      `UPDATE task_assignments SET
        role     = COALESCE($1, role),
        progress = COALESCE($2, progress),
        status   = COALESCE($3, status)
       WHERE id = $4 RETURNING *`,
      [role, progress, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Recalculate active & completed counts
    await syncTeamMemberStats(result.rows[0].member_id);

    await logActivity(`Updated task assignment #${id}`, 'task_assignments', parseInt(id), req.user.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/team/assignments/:id
 */
exports.deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM task_assignments WHERE id = $1 RETURNING member_id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Recalculate counts after deletion
    await syncTeamMemberStats(result.rows[0].member_id);

    await logActivity(`Deleted task assignment #${id}`, 'task_assignments', parseInt(id), req.user.id);

    res.json({ success: true, message: `Assignment #${id} deleted.` });
  } catch (err) { next(err); }
};
