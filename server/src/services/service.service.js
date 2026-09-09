const db = require('../config/database');

class ServiceService {
    async getAllServices(activeOnly = true) {
        let query = 'SELECT * FROM services';
        if (activeOnly) {
            query += ' WHERE active = true';
        }
        query += ' ORDER BY category, name';
        
        const result = await db.query(query);
        return result.rows;
    }

    async getServiceById(id) {
        const result = await db.query(
            'SELECT * FROM services WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async getCategories() {
        const result = await db.query(
            'SELECT DISTINCT category FROM services WHERE active = true ORDER BY category'
        );
        return result.rows.map(row => row.category);
    }

    async createService(serviceData) {
        const { category, name, name_hi } = serviceData;
        const result = await db.query(
            `INSERT INTO services (category, name, name_hi) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [category, name, name_hi || name]
        );
        return result.rows[0];
    }

    async updateService(id, serviceData) {
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (serviceData.category) {
            updates.push(`category = $${paramIndex}`);
            params.push(serviceData.category);
            paramIndex++;
        }
        if (serviceData.name) {
            updates.push(`name = $${paramIndex}`);
            params.push(serviceData.name);
            paramIndex++;
        }
        if (serviceData.name_hi) {
            updates.push(`name_hi = $${paramIndex}`);
            params.push(serviceData.name_hi);
            paramIndex++;
        }
        if (serviceData.active !== undefined) {
            updates.push(`active = $${paramIndex}`);
            params.push(serviceData.active);
            paramIndex++;
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        params.push(id);
        const result = await db.query(
            `UPDATE services SET ${updates.join(', ')} 
             WHERE id = $${paramIndex} 
             RETURNING *`,
            params
        );
        return result.rows[0];
    }
}

module.exports = new ServiceService();