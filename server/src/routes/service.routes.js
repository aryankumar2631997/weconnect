const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const serviceController = require('../controllers/service.controller');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/categories', serviceController.getCategories);
router.get('/:id',
    param('id').isInt().withMessage('Invalid service ID'),
    validate,
    serviceController.getService
);

// Admin routes
router.post('/',
    authenticate,
    [
        body('category').notEmpty().withMessage('Category is required'),
        body('name').notEmpty().withMessage('Name is required'),
        body('name_hi').optional().isString()
    ],
    validate,
    serviceController.createService
);

router.patch('/:id',
    authenticate,
    [
        param('id').isInt().withMessage('Invalid service ID'),
        body('category').optional().isString(),
        body('name').optional().isString(),
        body('name_hi').optional().isString(),
        body('active').optional().isBoolean()
    ],
    validate,
    serviceController.updateService
);

module.exports = router;