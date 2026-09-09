const serviceService = require('../services/service.service');
const { validationResult } = require('express-validator');

class ServiceController {
    async getAllServices(req, res, next) {
        try {
            const activeOnly = req.query.active !== 'false';
            const services = await serviceService.getAllServices(activeOnly);
            
            res.json({
                success: true,
                data: services,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getService(req, res, next) {
        try {
            const service = await serviceService.getServiceById(req.params.id);
            
            if (!service) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Service not found'
                    }
                });
            }

            res.json({
                success: true,
                data: service,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategories(req, res, next) {
        try {
            const categories = await serviceService.getCategories();
            res.json({
                success: true,
                data: categories,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    // Admin only
    async createService(req, res, next) {
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

            const service = await serviceService.createService(req.body);
            res.status(201).json({
                success: true,
                data: service,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async updateService(req, res, next) {
        try {
            const service = await serviceService.updateService(req.params.id, req.body);
            
            if (!service) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Service not found'
                    }
                });
            }

            res.json({
                success: true,
                data: service,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ServiceController();