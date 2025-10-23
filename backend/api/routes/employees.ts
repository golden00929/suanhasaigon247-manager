import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse, PaginationParams } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Get all employees
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '', sortBy = 'createdAt', sortOrder = 'desc', employeeType, department, isActive }: PaginationParams & {
      employeeType?: string;
      department?: string;
      isActive?: string;
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Type filter
    if (employeeType) {
      where.employeeType = employeeType;
    }

    // Department filter
    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: Number(limit)
      }),
      prisma.employee.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        employees,
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
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const response: ApiResponse = {
      success: true,
      data: employee
    };

    res.json(response);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new employee
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      employeeId,
      name,
      fullName,
      email,
      phone,
      position,
      department,
      division,
      team,
      employeeType,
      specialization,
      certifications,
      experience,
      salary,
      hireDate,
      birthDate,
      address,
      emergencyContact,
      profileImage,
      notes
    } = req.body;

    // Check if employeeId already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const emailExists = await prisma.employee.findFirst({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        fullName,
        email,
        phone,
        position,
        department,
        division,
        team,
        employeeType,
        specialization,
        certifications: certifications ? JSON.stringify(certifications) : null,
        experience: experience || 0,
        salary,
        hireDate: new Date(hireDate),
        birthDate: birthDate ? new Date(birthDate) : null,
        address,
        emergencyContact,
        profileImage,
        notes
      }
    });

    const response: ApiResponse = {
      success: true,
      data: employee,
      message: 'Employee created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update employee
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      employeeId,
      name,
      fullName,
      email,
      phone,
      position,
      department,
      division,
      team,
      employeeType,
      specialization,
      certifications,
      experience,
      salary,
      hireDate,
      birthDate,
      address,
      emergencyContact,
      profileImage,
      notes,
      isActive
    } = req.body;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employeeId is already taken by another employee
    if (employeeId && employeeId !== existingEmployee.employeeId) {
      const employeeIdExists = await prisma.employee.findUnique({
        where: { employeeId }
      });

      if (employeeIdExists) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Check if email is already taken by another employee
    if (email && email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findFirst({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData: any = {
      employeeId,
      name,
      fullName,
      email,
      phone,
      position,
      department,
      division,
      team,
      employeeType,
      specialization,
      certifications: certifications ? JSON.stringify(certifications) : null,
      experience,
      salary,
      address,
      emergencyContact,
      profileImage,
      notes,
      isActive
    };

    if (hireDate) {
      updateData.hireDate = new Date(hireDate);
    }

    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    });

    const response: ApiResponse = {
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete employee
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await prisma.employee.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Employee deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle employee active status
router.put('/:id/toggle-status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive: !existingEmployee.isActive }
    });

    const response: ApiResponse = {
      success: true,
      data: employee,
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Toggle employee status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee statistics
router.get('/stats/overview', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      technicianCount,
      officeCount,
      managerCount,
      contractorCount
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.employee.count({ where: { employeeType: 'TECHNICIAN' } }),
      prisma.employee.count({ where: { employeeType: 'OFFICE' } }),
      prisma.employee.count({ where: { employeeType: 'MANAGER' } }),
      prisma.employee.count({ where: { employeeType: 'CONTRACTOR' } })
    ]);

    const stats = {
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      byType: {
        technician: technicianCount,
        office: officeCount,
        manager: managerCount,
        contractor: contractorCount
      }
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Get employee statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;