const db = require('../config/database');

class LeadService {
    async createLead(leadData) {
        const { 
            customer_name, 
            customer_phone, 
            service_id, 
            area, 
            description, 
            source 
        } = leadData;

        const result = await db.query(
            `INSERT INTO leads (customer_name, customer_phone, service_id, area, description, source, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'NEW')
             RETURNING id, customer_name, customer_phone, service_id, area, status, created_at`,
            [customer_name, customer_phone, service_id, area, description, source || 'web']
        );

        const lead = result.rows[0];

        // Log event
        await db.query(
            `INSERT INTO lead_events (lead_id, event_type, new_status)
             VALUES ($1, 'CREATED', 'NEW')`,
            [lead.id]
        );

        return lead;
    }

    async getLeadById(id) {
        const result = await db.query(
            `SELECT l.*, s.name as service_name, s.category, p.name as provider_name
             FROM leads l
             LEFT JOIN services s ON l.service_id = s.id
             LEFT JOIN providers p ON l.assigned_provider_id = p.id
             WHERE l.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async getAllLeads(filters = {}) {
        let query = `
            SELECT l.*, s.name as service_name, s.category, p.name as provider_name
            FROM leads l
            LEFT JOIN services s ON l.service_id = s.id
            LEFT JOIN providers p ON l.assigned_provider_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (filters.status) {
            query += ` AND l.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters.service_id) {
            query += ` AND l.service_id = $${paramIndex}`;
            params.push(filters.service_id);
            paramIndex++;
        }

        query += ` ORDER BY l.created_at DESC`;

        const result = await db.query(query, params);
        return result.rows;
    }

    async updateLeadStatus(id, status, assignedProviderId = null) {
        // Get current status
        const current = await db.query(
            'SELECT status FROM leads WHERE id = $1',
            [id]
        );

        if (!current.rows[0]) {
            throw new Error('Lead not found');
        }

        const oldStatus = current.rows[0].status;

        let query = `UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP`;
        const params = [status];
        let paramIndex = 2;

        if (assignedProviderId !== null) {
            query += `, assigned_provider_id = $${paramIndex}`;
            params.push(assignedProviderId);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        params.push(id);

        const result = await db.query(query, params);

        // Log event
        await db.query(
            `INSERT INTO lead_events (lead_id, event_type, old_status, new_status)
             VALUES ($1, 'STATUS_CHANGE', $2, $3)`,
            [id, oldStatus, status]
        );

        return result.rows[0];
    }

    async assignProvider(leadId, providerId) {
        // Check if provider exists and is active
        const provider = await db.query(
            'SELECT id FROM providers WHERE id = $1 AND active = true',
            [providerId]
        );

        if (!provider.rows[0]) {
            throw new Error('Provider not found or inactive');
        }

        return this.updateLeadStatus(leadId, 'ASSIGNED', providerId);
    }

    async getLeadStats() {
        const result = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'NEW') as new,
                COUNT(*) FILTER (WHERE status = 'ASSIGNED') as assigned,
                COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted,
                COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
                COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
                COUNT(*) as total
            FROM leads
        `);
        return result.rows[0];
    }
}

module.exports = new LeadService();