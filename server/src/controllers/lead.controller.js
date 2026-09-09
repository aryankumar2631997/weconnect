const leadService = require('../services/lead.service');
const { validationResult } = require('express-validator');

class LeadController {
    async createLead(req, res, next) {
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

            const lead = await leadService.createLead(req.body);
            
            res.status(201).json({
                success: true,
                data: lead,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getLead(req, res, next) {
        try {
            const lead = await leadService.getLeadById(req.params.id);
            
            if (!lead) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Lead not found'
                    }
                });
            }

            res.json({
                success: true,
                data: lead,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllLeads(req, res, next) {
        try {
            const filters = {
                status: req.query.status,
                service_id: req.query.service_id
            };
            const leads = await leadService.getAllLeads(filters);
            
            res.json({
                success: true,
                data: leads,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async updateLeadStatus(req, res, next) {
        try {
            const { status, assigned_provider_id } = req.body;
            const lead = await leadService.updateLeadStatus(
                req.params.id, 
                status, 
                assigned_provider_id
            );
            
            res.json({
                success: true,
                data: lead,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async assignProvider(req, res, next) {
        try {
            const { provider_id } = req.body;
            const lead = await leadService.assignProvider(
                req.params.id,
                provider_id
            );
            
            res.json({
                success: true,
                data: lead,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const stats = await leadService.getLeadStats();
            res.json({
                success: true,
                data: stats,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LeadController();