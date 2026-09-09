const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const leadService = require('../services/lead.service');
const providerService = require('../services/provider.service');
const { validationResult } = require('express-validator');

class AdminController {
    async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: errors.array()[0].msg
                    }
                });
            }

            const { username, password } = req.body;
            
            const result = await db.query(
                'SELECT * FROM admin_users WHERE username = $1',
                [username]
            );

            const admin = result.rows[0];
            
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid username or password'
                    }
                });
            }

            const isValidPassword = await bcrypt.compare(password, admin.password_hash);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid username or password'
                    }
                });
            }

            const token = generateToken(admin.id, admin.username);

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: admin.id,
                        username: admin.username
                    }
                },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getDashboardStats(req, res, next) {
        try {
            const leadStats = await leadService.getLeadStats();
            
            const providerStats = await db.query(
                `SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified,
                    COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN active = true THEN 1 END) as active
                 FROM providers`
            );

            res.json({
                success: true,
                data: {
                    leads: leadStats,
                    providers: providerStats.rows[0]
                },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getRecentLeads(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const result = await db.query(
                `SELECT l.*, s.name as service_name, p.name as provider_name
                 FROM leads l
                 LEFT JOIN services s ON l.service_id = s.id
                 LEFT JOIN providers p ON l.assigned_provider_id = p.id
                 ORDER BY l.created_at DESC
                 LIMIT $1`,
                [limit]
            );
            
            res.json({
                success: true,
                data: result.rows,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();