// ─────────────────────────────────────────────────────────────
// Team Routes — full CRUD for members + task assignments
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const ctrl = require('../controllers/team.controller');

router.use(authenticate);

// ═══ Members ═══════════════════════════════════════════════

// GET    /api/team/members
router.get('/members', ctrl.getMembers);

// POST   /api/team/members
router.post('/members',
  authorize('super_admin', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
  ],
  validate,
  ctrl.addMember
);

// PUT    /api/team/members/:id
router.put('/members/:id',
  authorize('super_admin', 'admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('role').optional().trim().notEmpty(),
  ],
  validate,
  ctrl.updateMember
);

// DELETE /api/team/members/:id
router.delete('/members/:id',
  authorize('super_admin', 'admin'),
  ctrl.removeMember
);

// ═══ Task Assignments ══════════════════════════════════════

// GET    /api/team/assignments
router.get('/assignments', ctrl.getAssignments);

// POST   /api/team/assignments
router.post('/assignments',
  authorize('super_admin', 'admin'),
  [
    body('member_id').isInt().withMessage('Member ID must be an integer'),
    body('project_id').isInt().withMessage('Project ID must be an integer'),
    body('role').trim().notEmpty().withMessage('Assignment role is required'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    body('status').optional().isIn(['Active', 'Done', 'On Hold']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.createAssignment
);

// PUT    /api/team/assignments/:id
router.put('/assignments/:id',
  authorize('super_admin', 'admin'),
  [
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    body('status').optional().isIn(['Active', 'Done', 'On Hold']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.updateAssignment
);

// DELETE /api/team/assignments/:id
router.delete('/assignments/:id',
  authorize('super_admin', 'admin'),
  ctrl.deleteAssignment
);

module.exports = router;
