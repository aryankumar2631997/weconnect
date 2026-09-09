const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    return res.status(400).json({
        success: false,
        data: null,
        error: {
            code: 'VALIDATION_ERROR',
            message: errors.array()[0].msg
        }
    });
};

module.exports = { validate };