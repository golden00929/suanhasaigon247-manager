import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user as any;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('🔐 REQUIRE ROLE - User:', req.user?.email, 'Role:', req.user?.role, 'Required roles:', roles);

    if (!req.user) {
      console.log('❌ REQUIRE ROLE - No user found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ REQUIRE ROLE - Insufficient permissions');
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    console.log('✅ REQUIRE ROLE - Access granted');
    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireEmployee = requireRole(['EMPLOYEE', 'ADMIN']);

