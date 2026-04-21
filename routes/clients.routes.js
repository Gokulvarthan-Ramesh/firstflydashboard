// ─────────────────────────────────────────────────────────────
// Clients Routes — full CRUD
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const ctrl = require('../controllers/clients.controller');

router.use(authenticate);

// GET    /api/clients
router.get('/', ctrl.getAll);

// GET    /api/clients/:id
router.get('/:id', ctrl.getById);

// POST   /api/clients
router.post('/',
  authorize('super_admin', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Business name is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().trim(),
    body('status').optional().isIn(['Active', 'Pending', 'On Hold']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.create
);

// PUT    /api/clients/:id
router.put('/:id',
  authorize('super_admin', 'admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('status').optional().isIn(['Active', 'Pending', 'On Hold']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.update
);

// DELETE /api/clients/:id
router.delete('/:id',
  authorize('super_admin'),
  ctrl.remove
);

module.exports = router;
