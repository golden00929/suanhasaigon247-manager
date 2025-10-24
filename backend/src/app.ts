import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { MemoryMonitor } from './utils/memoryMonitor';

// Import routes
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import quotationRoutes from './routes/quotations';
import priceRoutes from './routes/prices';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// 메모리 모니터링 초기화
const memoryMonitor = new MemoryMonitor();
if (process.env.NODE_ENV === 'development') {
  memoryMonitor.start(30000); // 30초마다 체크
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('combined'));

// Raw body logging middleware BEFORE JSON parsing
app.use('/api/auth/login', (req, res, next) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    console.log('=== RAW REQUEST DATA ===');
    console.log('Raw body string:', JSON.stringify(body));
    console.log('Raw body length:', body.length);
    console.log('Raw body first 100 chars:', body.substring(0, 100));
    console.log('========================');
  });
  next();
});

app.use(express.json({
  limit: '10mb'
}));

// 메모리 사용량 추적 미들웨어 (개발환경에서만)
if (process.env.NODE_ENV === 'development') {
  app.use(memoryMonitor.middleware());
}

// Add request logging middleware AFTER JSON parsing
app.use((req, res, next) => {
  if (req.url.includes('/api/auth/login')) {
    console.log('=== Login Request Debug ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Parsed body:', req.body);
  }
  next();
});
app.use(express.urlencoded({ extended: true }));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'Suanha Saigon 247 Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      customers: '/api/customers/*',
      quotations: '/api/quotations/*',
      prices: '/api/prices/*',
      users: '/api/users/*'
    },
    documentation: 'https://github.com/golden00929/suanhasaigon247-manager'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/users', userRoutes);

// Health check with memory info
app.get('/api/health', (req, res) => {
  const memoryReport = memoryMonitor.getReport();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    memory: memoryReport.current
  });
});

// Memory report endpoint (개발환경에서만)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/memory', (req, res) => {
    res.json(memoryMonitor.getReport());
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler (Express 5 + path-to-regexp: avoid using "*")
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Vercel에서는 listen()을 호출하지 않음 (서버리스 환경)
// 로컬 개발 환경에서만 서버 시작
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
