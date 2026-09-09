const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const providerController = require('../controllers/provider.controller');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// All provider routes are admin-only
router.use(authenticate);

router.get('/',
    [
        query('active').optional().isBoolean(),
        query('verification_status').optional().isString()
    ],
    validate,
    providerController.getAllProviders
);

router.get('/available',
    [
        query('service_id').isInt().withMessage('Service ID required'),
        query('area').notEmpty().withMessage('Area required')
    ],
    validate,
    providerController.getAvailableProviders
);

router.get('/:id',
    param('id').isInt().withMessage('Invalid provider ID'),
    validate,
    providerController.getProvider
);

router.post('/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('phone').notEmpty().withMessage('Phone is required'),
        body('category_id').isInt().withMessage('Valid category ID required'),
        body('description').optional().isString(),
        body('verification_status').optional().isIn(['pending', 'verified', 'rejected']),
        body('services').optional().isArray(),
        body('areas').optional().isArray()
    ],
    validate,
    providerController.createProvider
);

router.patch('/:id',
    [
        param('id').isInt().withMessage('Invalid provider ID'),
        body('name').optional().isString(),
        body('phone').optional().isString(),
        body('category_id').optional().isInt(),
        body('description').optional().isString(),
        body('verification_status').optional().isIn(['pending', 'verified', 'rejected']),
        body('active').optional().isBoolean()
    ],
    validate,
    providerController.updateProvider
);

router.post('/:id/services',
    [
        param('id').isInt().withMessage('Invalid provider ID'),
        body('service_id').isInt().withMessage('Valid service ID required')
    ],
    validate,
    providerController.addProviderService
);

router.delete('/:id/services/:serviceId',
    [
        param('id').isInt().withMessage('Invalid provider ID'),
        param('serviceId').isInt().withMessage('Invalid service ID')
    ],
    validate,
    providerController.removeProviderService
);

router.post('/:id/areas',
    [
        param('id').isInt().withMessage('Invalid provider ID'),
        body('area').notEmpty().withMessage('Area is required')
    ],
    validate,
    providerController.addProviderArea
);

router.delete('/:id/areas/:area',
    [
        param('id').isInt().withMessage('Invalid provider ID'),
        param('area').notEmpty().withMessage('Area is required')
    ],
    validate,
    providerController.removeProviderArea
);

module.exports = router;