import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireEmployee } from '../middleware/auth';
import { AuthenticatedRequest, QuotationCreateRequest, QuotationUpdateRequest, ApiResponse, PaginationParams } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Generate quotation number
const generateQuotationNumber = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const count = await prisma.quotation.count({
    where: {
      createdAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    }
  });
  
  const sequence = String(count + 1).padStart(3, '0');
  return `QT-${dateStr}-${sequence}`;
};

// Get all quotations with pagination and search
router.get('/', authenticateToken, requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' }: PaginationParams = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { customer: { customerName: { contains: search, mode: 'insensitive' } } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } }
      ]
    } : {};

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              customerName: true,
              companyName: true,
              phone: true
            }
          },
          customerAddress: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          items: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: Number(limit)
      }),
      prisma.quotation.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        quotations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get quotation by ID
router.get('/:id', authenticateToken, requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            addresses: true
          }
        },
        customerAddress: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const response: ApiResponse = {
      success: true,
      data: quotation
    };

    res.json(response);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create quotation
router.post('/', authenticateToken, requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotationData: QuotationCreateRequest = req.body;
    const userId = req.user!.id;

    // Generate quotation number
    const quotationNumber = await generateQuotationNumber();

    // Calculate totals
    const itemsTotal = quotationData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const materialCost = quotationData.materialCost || 0;
    const laborCost = quotationData.laborCost || 0;
    const travelCost = quotationData.travelCost || 0;
    const marginRate = quotationData.marginRate || 15;
    
    const subtotal = itemsTotal + materialCost + laborCost + travelCost;
    const marginAmount = subtotal * (marginRate / 100);
    const finalSubtotal = subtotal + marginAmount;
    const tax = finalSubtotal * 0.1; // 10% VAT
    const total = finalSubtotal + tax;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: quotationData.customerId,
        customerAddressId: quotationData.customerAddressId,
        materialCost,
        laborCost,
        travelCost,
        marginRate,
        subtotal: finalSubtotal,
        tax,
        total,
        createdBy: userId,
        validUntil: quotationData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        items: {
          create: quotationData.items.map(item => ({
            categoryId: item.categoryId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            customerName: true,
            companyName: true,
            phone: true
          }
        },
        customerAddress: true,
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: quotation,
      message: 'Quotation created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update quotation
router.put('/:id', authenticateToken, requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const quotationData: QuotationUpdateRequest = req.body;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id }
    });

    if (!existingQuotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // If items are being updated, recalculate totals
    let updateData: any = {
      status: quotationData.status,
      materialCost: quotationData.materialCost,
      laborCost: quotationData.laborCost,
      travelCost: quotationData.travelCost,
      marginRate: quotationData.marginRate,
      validUntil: quotationData.validUntil
    };

    if (quotationData.items && quotationData.items.length > 0) {
      // Delete existing items and create new ones
      await prisma.quotationItem.deleteMany({
        where: { quotationId: id }
      });

      const itemsTotal = quotationData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const materialCost = quotationData.materialCost || existingQuotation.materialCost;
      const laborCost = quotationData.laborCost || existingQuotation.laborCost;
      const travelCost = quotationData.travelCost || existingQuotation.travelCost;
      const marginRate = quotationData.marginRate || existingQuotation.marginRate;
      
      const subtotal = itemsTotal + materialCost + laborCost + travelCost;
      const marginAmount = subtotal * (marginRate / 100);
      const finalSubtotal = subtotal + marginAmount;
      const tax = finalSubtotal * 0.1;
      const total = finalSubtotal + tax;

      updateData.subtotal = finalSubtotal;
      updateData.tax = tax;
      updateData.total = total;

      // Create new items
      await prisma.quotationItem.createMany({
        data: quotationData.items.map(item => ({
          quotationId: id,
          categoryId: item.categoryId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice
        }))
      });
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            customerName: true,
            companyName: true,
            phone: true
          }
        },
        customerAddress: true,
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: quotation,
      message: 'Quotation updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete quotation
router.delete('/:id', authenticateToken, requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id }
    });

    if (!existingQuotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    await prisma.quotation.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Quotation deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

