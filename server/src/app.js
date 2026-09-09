const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');

// Routes
const serviceRoutes = require('./routes/service.routes');
const leadRoutes = require('./routes/lead.routes');
const providerRoutes = require('./routes/provider.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Deploying behind a reverse proxy (Render, Railway, Heroku, Nginx, etc.)
// is the default assumption in production — needed for express-rate-limit
// and req.ip to see the real client IP instead of the proxy's.
if (config.nodeEnv === 'production') {
    app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS
app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve the customer + admin web client from the same service.
// This is what lets the whole app deploy as one process instead of
// needing separate static hosting for the frontend.
app.use(express.static(path.join(__dirname, '../../client')));

// Routes
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/admin', adminRoutes);

// Public runtime config the client needs (no secrets — just what's safe
// to expose to a browser, like which WhatsApp number to message).
app.get('/api/v1/config', (req, res) => {
    res.json({
        success: true,
        data: { whatsappPhone: config.whatsappPhone },
        error: null
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        error: null
    });
});

// Error handling
app.use(errorHandler);

module.exports = app;