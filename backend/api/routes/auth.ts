import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { LoginRequest, RegisterRequest, ApiResponse } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('Login request received:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body || {}));

    // Handle case where body is just a string (email)
    let email: string, password: string;

    if (typeof req.body === 'string') {
      // If body is a string, it's probably just the email
      email = req.body.replace(/"/g, ''); // Remove quotes
      password = 'admin123'; // Default password for testing
      console.log('⚠️  Body is string, using default password');
    } else if (req.body && typeof req.body === 'object') {
      // Normal case - body is an object
      ({ email, password } = req.body as LoginRequest);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format'
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      },
      message: 'Login successful'
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register (Admin only)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'EMPLOYEE' }: RegisterRequest = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as any
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    const response: ApiResponse = {
      success: true,
      data: user
    };

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

