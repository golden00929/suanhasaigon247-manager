# Express.js Backend - Vercel Deployment

## Quick Start

This Express.js backend is configured to deploy as a **single serverless function** on Vercel.

### 1. Deploy to Vercel

**Option A: Using Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure settings:
   - **Root Directory:** `backend`
   - **Framework Preset:** Other
   - **Node.js Version:** 22.x
4. Add environment variables (see below)
5. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
npm i -g vercel
cd backend
vercel --prod
```

### 2. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### 3. Test Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2025-10-23T...",
  "memory": { ... }
}
```

## Project Structure

```
backend/
├── api/
│   └── index.ts          # Vercel entry point (exports Express app)
├── src/
│   ├── app.ts            # Express application
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   └── utils/            # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── vercel.json           # Vercel configuration
└── package.json
```

## How It Works

1. **Vercel receives request** → `https://your-app.vercel.app/api/customers`
2. **Routes to serverless function** → `api/index.ts` (via `vercel.json`)
3. **Express app handles request** → Imported from `src/app.ts`
4. **Response sent back** → Through Vercel's infrastructure

## Key Files

### `api/index.ts` (Vercel Entry Point)
```typescript
import app from '../src/app';
export default app;
```

### `vercel.json` (Vercel Configuration)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

### `src/app.ts` (Express Application)
```typescript
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
// ... more routes

// DON'T call app.listen() in production
if (process.env.NODE_ENV !== 'production') {
  app.listen(8000);
}

export default app;
```

## API Endpoints

After deployment, all your Express routes are available:

```
Base URL: https://your-app.vercel.app

Authentication:
  POST /api/auth/login
  POST /api/auth/register

Customers:
  GET    /api/customers
  POST   /api/customers
  GET    /api/customers/:id
  PUT    /api/customers/:id
  DELETE /api/customers/:id

Quotations:
  GET    /api/quotations
  POST   /api/quotations
  GET    /api/quotations/:id
  PUT    /api/quotations/:id
  DELETE /api/quotations/:id

Prices:
  GET    /api/prices
  POST   /api/prices
  PUT    /api/prices/:id
  DELETE /api/prices/:id

Users:
  GET    /api/users
  POST   /api/users
  PUT    /api/users/:id
  DELETE /api/users/:id

Health Check:
  GET /api/health
```

## Local Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:generate
npm run db:push

# Run development server
npm run dev

# Server starts at http://localhost:8000
```

## Common Issues

### All routes return 404
**Solution:** Ensure `vercel.json` exists in backend root and points to `api/index.ts`

### Module not found errors
**Solution:** Check import path in `api/index.ts` is `../src/app`

### Database connection errors
**Solution:** Verify `DATABASE_URL` is set in Vercel Dashboard with `?pgbouncer=true`

### Prisma errors
**Solution:** Ensure `prisma generate` runs during build (check `vercel-build` script)

## Documentation

- **Full Guide:** [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- **Structure Details:** [STRUCTURE.txt](./STRUCTURE.txt)
- **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Why This Structure?

### Traditional Server (Doesn't work on Vercel):
- Runs on a port (e.g., 8000)
- Always listening for requests
- Single instance

### Serverless (Vercel):
- No persistent server
- Function invoked per request
- Auto-scales
- Express app exported as function

### Benefits:
- Zero configuration scaling
- Pay per request (not per server)
- Global CDN
- HTTPS by default
- Auto-deployment on git push

## Troubleshooting

### View Logs
```bash
vercel logs --follow
```

### Check Function Status
Vercel Dashboard → Deployments → [Your Deployment] → Functions

### Test Locally with Vercel
```bash
vercel dev
# Test at http://localhost:3000
```

## Performance

- **Cold Start:** ~1-2 seconds (first request after idle)
- **Warm:** ~50-200ms (subsequent requests)
- **Timeout:** 10s (Free), 60s (Pro)
- **Memory:** 1GB (Free), 3GB (Pro)

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Express Guide:** https://vercel.com/guides/using-express-with-vercel
- **Issues:** Create issue in this repository

---

**Last Updated:** 2025-10-23
**Vercel Version:** 2
**Node.js Version:** 22.x
