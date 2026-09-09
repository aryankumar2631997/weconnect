const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            data: null,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            data: null,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid or expired token'
            }
        });
    }
};

const generateToken = (userId, username) => {
    return jwt.sign(
        { id: userId, username },
        config.jwtSecret,
        { expiresIn: '7d' }
    );
};

module.exports = { authenticate, generateToken };