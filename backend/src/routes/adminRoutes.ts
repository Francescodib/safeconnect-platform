import { Router, type Router as RouterType } from 'express';
import adminController from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router: RouterType = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/logs
 * @desc    Get audit logs with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/logs', adminController.getAuditLogs);

/**
 * @route   GET /api/admin/security-events
 * @desc    Get security events with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/security-events', adminController.getSecurityEvents);

/**
 * @route   GET /api/admin/failed-logins
 * @desc    Get failed login attempts
 * @access  Private (Admin only)
 */
router.get('/failed-logins', adminController.getFailedLogins);

/**
 * @route   GET /api/admin/active-sessions
 * @desc    Get active user sessions
 * @access  Private (Admin only)
 */
router.get('/active-sessions', adminController.getActiveSessions);

/**
 * @route   GET /api/admin/stats
 * @desc    Get security statistics
 * @access  Private (Admin only)
 */
router.get('/stats', adminController.getSecurityStats);

/**
 * @route   PATCH /api/admin/security-events/:id/resolve
 * @desc    Resolve a security event
 * @access  Private (Admin only)
 */
router.patch('/security-events/:id/resolve', adminController.resolveSecurityEvent);

export default router;
