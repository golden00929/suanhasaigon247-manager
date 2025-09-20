import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
const router = Router();
const prisma = new PrismaClient();
// Get all price categories with items
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { items: { some: { itemName: { contains: search, mode: 'insensitive' } } } }
            ]
        } : {};
        const [categories, total] = await Promise.all([
            prisma.priceCategory.findMany({
                where,
                include: {
                    items: {
                        where: { isActive: true },
                        orderBy: { itemName: 'asc' }
                    },
                    creator: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: Number(limit)
            }),
            prisma.priceCategory.count({ where })
        ]);
        const response = {
            success: true,
            data: {
                categories,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get price categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Get price category by ID
router.get('/categories/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.priceCategory.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { itemName: 'asc' }
                },
                creator: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Price category not found'
            });
        }
        const response = {
            success: true,
            data: category
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get price category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Create price category
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const categoryData = req.body;
        const userId = req.user.id;
        const category = await prisma.priceCategory.create({
            data: {
                name: categoryData.name,
                createdBy: userId,
                items: {
                    create: categoryData.items.map(item => ({
                        itemName: item.itemName,
                        unit: item.unit,
                        unitPrice: item.unitPrice,
                        laborHours: item.laborHours || 0
                    }))
                }
            },
            include: {
                items: true,
                creator: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        const response = {
            success: true,
            data: category,
            message: 'Price category created successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create price category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Update price category
router.put('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const categoryData = req.body;
        // Check if category exists
        const existingCategory = await prisma.priceCategory.findUnique({
            where: { id }
        });
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Price category not found'
            });
        }
        const category = await prisma.priceCategory.update({
            where: { id },
            data: {
                name: categoryData.name,
                isActive: categoryData.name !== undefined ? true : undefined
            },
            include: {
                items: true,
                creator: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        const response = {
            success: true,
            data: category,
            message: 'Price category updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update price category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Delete price category
router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if category exists
        const existingCategory = await prisma.priceCategory.findUnique({
            where: { id }
        });
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Price category not found'
            });
        }
        await prisma.priceCategory.delete({
            where: { id }
        });
        const response = {
            success: true,
            message: 'Price category deleted successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Delete price category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Get all price items
router.get('/items', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', categoryId, sortBy = 'itemName', sortOrder = 'asc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            isActive: true
        };
        if (search) {
            where.itemName = { contains: search, mode: 'insensitive' };
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        const [items, total] = await Promise.all([
            prisma.priceItem.findMany({
                where,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: Number(limit)
            }),
            prisma.priceItem.count({ where })
        ]);
        const response = {
            success: true,
            data: {
                items,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get price items error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Create price item
router.post('/items', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { categoryId, itemName, unit, unitPrice, laborHours = 0 } = req.body;
        if (!categoryId || !itemName || !unit || !unitPrice) {
            return res.status(400).json({
                success: false,
                message: 'Category ID, item name, unit, and unit price are required'
            });
        }
        const item = await prisma.priceItem.create({
            data: {
                categoryId,
                itemName,
                unit,
                unitPrice,
                laborHours
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        const response = {
            success: true,
            data: item,
            message: 'Price item created successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create price item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Update price item
router.put('/items/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { itemName, unit, unitPrice, laborHours, isActive } = req.body;
        const item = await prisma.priceItem.update({
            where: { id },
            data: {
                itemName,
                unit,
                unitPrice,
                laborHours,
                isActive
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        const response = {
            success: true,
            data: item,
            message: 'Price item updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update price item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Delete price item
router.delete('/items/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.priceItem.delete({
            where: { id }
        });
        const response = {
            success: true,
            message: 'Price item deleted successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Delete price item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
export default router;
//# sourceMappingURL=prices.js.map