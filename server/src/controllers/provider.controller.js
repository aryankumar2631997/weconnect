const providerService = require('../services/provider.service');
const { validationResult } = require('express-validator');

class ProviderController {
    async getAllProviders(req, res, next) {
        try {
            const filters = {
                active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
                verification_status: req.query.verification_status
            };
            const providers = await providerService.getAllProviders(filters);
            
            res.json({
                success: true,
                data: providers,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getProvider(req, res, next) {
        try {
            const provider = await providerService.getProviderById(req.params.id);
            
            if (!provider) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Provider not found'
                    }
                });
            }

            const stats = await providerService.getProviderStats(req.params.id);
            
            res.json({
                success: true,
                data: { ...provider, stats },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async createProvider(req, res, next) {
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

            const provider = await providerService.createProvider(req.body);
            
            // Add services and areas if provided
            if (req.body.services && Array.isArray(req.body.services)) {
                for (const serviceId of req.body.services) {
                    await providerService.addProviderService(provider.id, serviceId);
                }
            }
            
            if (req.body.areas && Array.isArray(req.body.areas)) {
                for (const area of req.body.areas) {
                    await providerService.addProviderArea(provider.id, area);
                }
            }

            res.status(201).json({
                success: true,
                data: provider,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProvider(req, res, next) {
        try {
            const provider = await providerService.updateProvider(req.params.id, req.body);

            // Replace services/areas if arrays were provided — same "full set" semantics
            // as the edit form, which shows and submits the complete selection each time.
            if (req.body.services && Array.isArray(req.body.services)) {
                await providerService.replaceProviderServices(req.params.id, req.body.services);
            }
            if (req.body.areas && Array.isArray(req.body.areas)) {
                await providerService.replaceProviderAreas(req.params.id, req.body.areas);
            }

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Provider not found'
                    }
                });
            }

            res.json({
                success: true,
                data: provider,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async addProviderService(req, res, next) {
        try {
            await providerService.addProviderService(req.params.id, req.body.service_id);
            res.json({
                success: true,
                data: { message: 'Service added successfully' },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async removeProviderService(req, res, next) {
        try {
            await providerService.removeProviderService(req.params.id, req.params.serviceId);
            res.json({
                success: true,
                data: { message: 'Service removed successfully' },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async addProviderArea(req, res, next) {
        try {
            await providerService.addProviderArea(req.params.id, req.body.area);
            res.json({
                success: true,
                data: { message: 'Area added successfully' },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async removeProviderArea(req, res, next) {
        try {
            await providerService.removeProviderArea(req.params.id, req.params.area);
            res.json({
                success: true,
                data: { message: 'Area removed successfully' },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    async getAvailableProviders(req, res, next) {
        try {
            const { service_id, area } = req.query;
            const providers = await providerService.getAvailableProviders(service_id, area);
            res.json({
                success: true,
                data: providers,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProviderController();