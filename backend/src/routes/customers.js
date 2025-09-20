import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireEmployee } from '../middleware/auth';
const router = Router();
const prisma = new PrismaClient();
// Get all customers with pagination and search
router.get('/', authenticateToken, requireEmployee, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = search ? {
            OR: [
                { customerName: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ]
        } : {};
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    addresses: true,
                    quotations: {
                        select: {
                            id: true,
                            quotationNumber: true,
                            status: true,
                            total: true,
                            createdAt: true
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: Number(limit)
            }),
            prisma.customer.count({ where })
        ]);
        const response = {
            success: true,
            data: {
                customers,
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
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Get customer by ID
router.get('/:id', authenticateToken, requireEmployee, async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                addresses: true,
                quotations: {
                    include: {
                        customerAddress: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        const response = {
            success: true,
            data: customer
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Create customer
router.post('/', authenticateToken, requireEmployee, async (req, res) => {
    try {
        const customerData = req.body;
        const customer = await prisma.customer.create({
            data: {
                customerName: customerData.customerName,
                companyName: customerData.companyName,
                phone: customerData.phone,
                email: customerData.email,
                memo: customerData.memo,
                addresses: {
                    create: customerData.addresses.map(addr => ({
                        name: addr.name,
                        address: addr.address,
                        isMain: addr.isMain
                    }))
                }
            },
            include: {
                addresses: true
            }
        });
        const response = {
            success: true,
            data: customer,
            message: 'Customer created successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Update customer
router.put('/:id', authenticateToken, requireEmployee, async (req, res) => {
    try {
        const { id } = req.params;
        const customerData = req.body;
        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { id }
        });
        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        const customer = await prisma.customer.update({
            where: { id },
            data: {
                customerName: customerData.customerName,
                companyName: customerData.companyName,
                phone: customerData.phone,
                email: customerData.email,
                memo: customerData.memo,
                lastContactDate: new Date()
            },
            include: {
                addresses: true
            }
        });
        const response = {
            success: true,
            data: customer,
            message: 'Customer updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Delete customer
router.delete('/:id', authenticateToken, requireEmployee, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { id }
        });
        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        await prisma.customer.delete({
            where: { id }
        });
        const response = {
            success: true,
            message: 'Customer deleted successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
export default router;
//# sourceMappingURL=customers.js.map