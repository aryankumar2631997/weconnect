require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
    whatsappPhone: process.env.WHATSAPP_PHONE || '917000000000',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5500',
    nodeEnv: process.env.NODE_ENV || 'development'
};