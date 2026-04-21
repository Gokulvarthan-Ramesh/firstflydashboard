// ─────────────────────────────────────────────────────────────
// Role-Based Access Control Middleware
// ─────────────────────────────────────────────────────────────

/**
 * Restrict access to users whose role is in the allowedRoles list.
 * Must be used AFTER the authenticate middleware.
 *
 * Usage:  router.post('/', authenticate, authorize('super_admin', 'admin'), controller.create);
 *
 * @param  {...string} allowedRoles - 'super_admin', 'admin', 'view_only'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
