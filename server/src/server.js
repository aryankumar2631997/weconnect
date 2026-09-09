const app = require('./app');
const config = require('./config/environment');
const logger = require('./utils/logger');
const runMigrations = require('../../database/migrations/run');
const seedServices = require('../../database/seed/seed');

const PORT = config.port;

// Run migrations (and seed default services) on every boot, not just via a
// separate CLI step. Some hosts (e.g. Render's free tier) don't offer a
// pre-deploy command or shell access, so this is how the schema gets
// created there. Both are idempotent/safe to repeat — see schema_migrations
// and the services UNIQUE(category, name) constraint.
async function start() {
    try {
        await runMigrations();
        await seedServices(false);
    } catch (err) {
        logger.error(`❌ Startup migration/seed failed: ${err.message}`);
        process.exit(1);
    }

    app.listen(PORT, () => {
        logger.info(`🚀 WeConnect Lakhisarai server running on port ${PORT}`);
        logger.info(`📱 API available at http://localhost:${PORT}/api/v1`);
        logger.info(`💚 Health check at http://localhost:${PORT}/health`);
    });
}

start();

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});