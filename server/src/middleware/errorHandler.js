const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);

    // Default error
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        data: null,
        error: {
            code: errorCode,
            message: message
        }
    });
};

module.exports = errorHandler;