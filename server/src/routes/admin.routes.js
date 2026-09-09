const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts
    message: {
        success: false,
        data: null,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts. Please try again later.'
        }
    }
});

// Public login route
router.post('/login',
    loginLimiter,
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validate,
    adminController.login
);

// Protected admin routes
router.get('/dashboard/stats',
    authenticate,
    adminController.getDashboardStats
);

router.get('/dashboard/recent-leads',
    authenticate,
    adminController.getRecentLeads
);

module.exports = router;