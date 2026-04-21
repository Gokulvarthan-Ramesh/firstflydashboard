// ─────────────────────────────────────────────────────────────
// Services Routes — full CRUD + public view + quotes
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const ctrl = require('../controllers/services.controller');

// GET    /api/services — Public
router.get('/', ctrl.getAll);

// GET    /api/services/:id — Public
router.get('/:id', ctrl.getById);

// ── Protected Routes ─────────────────────────────────────────

// POST   /api/services — Admin only
router.post('/',
  authenticate,
  authorize('super_admin', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('price').trim().notEmpty().withMessage('Price text is required'),
    body('icon').optional().trim(),
    body('active').optional().isBoolean(),
  ],
  validate,
  ctrl.create
);

// PUT    /api/services/:id — Super Admin only
router.put('/:id',
  authenticate,
  authorize('super_admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('active').optional().isBoolean(),
  ],
  validate,
  ctrl.update
);

// DELETE /api/services/:id — Super Admin only
router.delete('/:id',
  authenticate,
  authorize('super_admin'),
  ctrl.remove
);

// POST   /api/services/quote-request — Public (potential leads)
// FHR §3.2 implies client-facing services optionally public.
router.post('/quote-request',
  [
    body('service_id').isInt().withMessage('Valid service ID required'),
    body('client_name').trim().notEmpty().withMessage('Your name is required'),
    body('client_email').isEmail().withMessage('Valid email is required'),
    body('message').optional().trim(),
  ],
  validate,
  ctrl.requestQuote
);

module.exports = router;
