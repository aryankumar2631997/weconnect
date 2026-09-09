// Simple, idempotent SQL migration runner.
//
// Applies every .sql file in this directory, in filename order, and records
// which ones have already run in a `schema_migrations` table so re-running
// this script (locally or in CI/CD) is always safe.
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const dir = __dirname;
        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // 001_, 002_, ... naming keeps this in the right order

        const { rows } = await client.query('SELECT filename FROM schema_migrations');
        const applied = new Set(rows.map(r => r.filename));

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`⏭  Skipping already-applied migration: ${file}`);
                continue;
            }

            const sql = fs.readFileSync(path.join(dir, file), 'utf8');
            console.log(`▶️  Applying migration: ${file}`);

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`✅ Applied: ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                throw new Error(`Migration failed (${file}): ${err.message}`);
            }
        }

        console.log('✅ All migrations up to date.');
    } finally {
        client.release();
        await pool.end();
    }
}

// Used two ways:
//   1. `npm run migrate` — runs this file directly as a CLI script, exits when done.
//   2. required from server.js at boot — some hosts (e.g. Render's free tier)
//      don't offer a pre-deploy command or shell, so the server runs its own
//      migrations on startup instead. Safe either way: already-applied
//      migrations are skipped (see schema_migrations above).
if (require.main === module) {
    run().catch(err => {
        console.error('❌ Migration run failed:', err.message);
        process.exit(1);
    });
}

module.exports = run;
