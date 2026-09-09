const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const leadController = require('../controllers/lead.controller');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for lead creation
const createLeadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    // 30, not 10: mobile carriers in small towns often put many customers
    // behind one shared NAT IP, so a tight per-IP limit risks blocking real
    // customers, not just spam. Revisit once you have real traffic data.
    max: 30,
    message: {
        success: false,
        data: null,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.'
        }
    }
});

// Public routes
router.post('/',
    createLeadLimiter,
    [
        body('customer_name').notEmpty().withMessage('Name is required'),
        body('customer_phone').isLength({ min: 10, max: 15 }).withMessage('Valid phone number required'),
        body('service_id').isInt().withMessage('Valid service ID required'),
        body('area').notEmpty().withMessage('Area is required'),
        body('description').optional().isString(),
        body('source').optional().isString()
    ],
    validate,
    leadController.createLead
);

// NOTE: /stats/overview must be registered before the /:id route below.
// Express matches routes in registration order, so if /:id came first,
// a request to /leads/stats/overview would match /:id with id="stats",
// fail the isInt() validation, and 400 — the stats endpoint would never
// actually be reachable.
router.get('/stats/overview',
    authenticate,
    leadController.getStats
);

router.get('/:id',
    param('id').isInt().withMessage('Invalid lead ID'),
    validate,
    leadController.getLead
);

// Admin routes - protected
router.get('/',
    authenticate,
    [
        query('status').optional().isString(),
        query('service_id').optional().isInt()
    ],
    validate,
    leadController.getAllLeads
);

router.patch('/:id',
    authenticate,
    [
        param('id').isInt().withMessage('Invalid lead ID'),
        body('status').isIn(['NEW', 'CONTACTED', 'ASSIGNED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'])
            .withMessage('Invalid status'),
        body('assigned_provider_id').optional().isInt()
    ],
    validate,
    leadController.updateLeadStatus
);

router.post('/:id/assign',
    authenticate,
    [
        param('id').isInt().withMessage('Invalid lead ID'),
        body('provider_id').isInt().withMessage('Valid provider ID required')
    ],
    validate,
    leadController.assignProvider
);

module.exports = router;