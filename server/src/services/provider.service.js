const db = require('../config/database');

class ProviderService {
    async getAllProviders(filters = {}) {
        let query = `
            SELECT 
                p.*,
                COUNT(DISTINCT l.id) as total_leads,
                COUNT(DISTINCT CASE WHEN l.status = 'COMPLETED' THEN l.id END) as completed_jobs,
                COUNT(DISTINCT CASE WHEN l.status IN ('NEW', 'ASSIGNED', 'CONTACTED') THEN l.id END) as pending_jobs,
                COALESCE(ps.services, '{}') as services,
                COALESCE(pa.areas, '{}') as areas
            FROM providers p
            LEFT JOIN leads l ON p.id = l.assigned_provider_id
            LEFT JOIN (
                SELECT provider_id, array_agg(service_id) as services
                FROM provider_services
                GROUP BY provider_id
            ) ps ON p.id = ps.provider_id
            LEFT JOIN (
                SELECT provider_id, array_agg(area) as areas
                FROM provider_areas
                GROUP BY provider_id
            ) pa ON p.id = pa.provider_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;

        if (filters.active !== undefined) {
            query += ` AND p.active = $${paramIndex}`;
            params.push(filters.active);
            paramIndex++;
        }

        if (filters.verification_status) {
            query += ` AND p.verification_status = $${paramIndex}`;
            params.push(filters.verification_status);
            paramIndex++;
        }

        query += ` GROUP BY p.id, ps.services, pa.areas ORDER BY p.name`;
        
        const result = await db.query(query, params);
        return result.rows;
    }

    async getProviderById(id) {
        const result = await db.query(
            `SELECT 
                p.*,
                COALESCE(ps.services, '{}') as services,
                COALESCE(pa.areas, '{}') as areas
            FROM providers p
            LEFT JOIN (
                SELECT provider_id, array_agg(service_id) as services
                FROM provider_services
                GROUP BY provider_id
            ) ps ON p.id = ps.provider_id
            LEFT JOIN (
                SELECT provider_id, array_agg(area) as areas
                FROM provider_areas
                GROUP BY provider_id
            ) pa ON p.id = pa.provider_id
            WHERE p.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async createProvider(providerData) {
        const { name, phone, category_id, description, verification_status } = providerData;
        
        const result = await db.query(
            `INSERT INTO providers (name, phone, category_id, description, verification_status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, phone, category_id, description, verification_status || 'pending']
        );
        return result.rows[0];
    }

    async updateProvider(id, providerData) {
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (providerData.name) {
            updates.push(`name = $${paramIndex}`);
            params.push(providerData.name);
            paramIndex++;
        }
        if (providerData.phone) {
            updates.push(`phone = $${paramIndex}`);
            params.push(providerData.phone);
            paramIndex++;
        }
        if (providerData.category_id !== undefined) {
            updates.push(`category_id = $${paramIndex}`);
            params.push(providerData.category_id);
            paramIndex++;
        }
        if (providerData.description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            params.push(providerData.description);
            paramIndex++;
        }
        if (providerData.verification_status) {
            updates.push(`verification_status = $${paramIndex}`);
            params.push(providerData.verification_status);
            paramIndex++;
        }
        if (providerData.active !== undefined) {
            updates.push(`active = $${paramIndex}`);
            params.push(providerData.active);
            paramIndex++;
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        params.push(id);
        const result = await db.query(
            `UPDATE providers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramIndex}
             RETURNING *`,
            params
        );
        return result.rows[0];
    }

    async addProviderService(providerId, serviceId) {
        await db.query(
            `INSERT INTO provider_services (provider_id, service_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [providerId, serviceId]
        );
        return true;
    }

    async removeProviderService(providerId, serviceId) {
        await db.query(
            `DELETE FROM provider_services
             WHERE provider_id = $1 AND service_id = $2`,
            [providerId, serviceId]
        );
        return true;
    }

    async addProviderArea(providerId, area) {
        await db.query(
            `INSERT INTO provider_areas (provider_id, area)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [providerId, area]
        );
        return true;
    }

    async removeProviderArea(providerId, area) {
        await db.query(
            `DELETE FROM provider_areas
             WHERE provider_id = $1 AND area = $2`,
            [providerId, area]
        );
        return true;
    }

    async replaceProviderServices(providerId, serviceIds) {
        await db.query('DELETE FROM provider_services WHERE provider_id = $1', [providerId]);
        for (const serviceId of serviceIds) {
            await db.query(
                `INSERT INTO provider_services (provider_id, service_id) VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [providerId, serviceId]
            );
        }
        return true;
    }

    async replaceProviderAreas(providerId, areas) {
        await db.query('DELETE FROM provider_areas WHERE provider_id = $1', [providerId]);
        for (const area of areas) {
            await db.query(
                `INSERT INTO provider_areas (provider_id, area) VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [providerId, area]
            );
        }
        return true;
    }

    async getProviderStats(providerId) {
        const result = await db.query(
            `SELECT 
                COUNT(*) as total_leads,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'ASSIGNED' THEN 1 END) as assigned,
                COUNT(CASE WHEN status = 'CONTACTED' THEN 1 END) as contacted,
                COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new
             FROM leads
             WHERE assigned_provider_id = $1`,
            [providerId]
        );
        return result.rows[0];
    }

    async getAvailableProviders(serviceId, area) {
        const result = await db.query(
            `SELECT DISTINCT p.*
             FROM providers p
             JOIN provider_services ps ON p.id = ps.provider_id
             JOIN provider_areas pa ON p.id = pa.provider_id
             WHERE p.active = true
               AND p.verification_status = 'verified'
               AND ps.service_id = $1
               AND pa.area = $2
             ORDER BY p.name`,
            [serviceId, area]
        );
        return result.rows;
    }
}

module.exports = new ProviderService();