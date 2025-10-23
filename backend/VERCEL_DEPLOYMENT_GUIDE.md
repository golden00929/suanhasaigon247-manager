# Vercel Deployment Guide for Express.js Backend

## Overview
This guide explains how the Express.js backend is configured for Vercel serverless deployment.

## File Structure

```
backend/
├── api/
│   └── index.ts              # Vercel entry point (serverless function)
├── src/
│   ├── app.ts                # Express application
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── customers.ts
│   │   ├── quotations.ts
│   │   ├── prices.ts
│   │   └── users.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── utils/
│   │   └── memoryMonitor.ts
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── package.json
├── vercel.json               # Vercel configuration
└── tsconfig.json
```

## Key Configuration Files

### 1. `vercel.json`
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

**Explanation:**
- `builds`: Tells Vercel to build `api/index.ts` as a Node.js serverless function
- `routes`: Routes ALL incoming requests to the single serverless function

### 2. `api/index.ts`
```typescript
import app from '../src/app';

export default app;
```

**Explanation:**
- This is the entry point for Vercel
- Exports the Express app as the default export
- Vercel automatically wraps this as a serverless function handler

### 3. `src/app.ts`
```typescript
// Express app setup
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
// ... other routes

// DON'T call app.listen() in production
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
```

## Vercel Dashboard Settings

### Project Settings
1. **Framework Preset:** Other
2. **Root Directory:** `backend`
3. **Build Command:** `npm run vercel-build` (runs `prisma generate`)
4. **Output Directory:** (leave empty)
5. **Install Command:** `npm install`
6. **Node.js Version:** 22.x

### Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

## How It Works

### Traditional Server vs Serverless

**Traditional (Doesn't work on Vercel):**
```
Start server on port 8000
  ↓
Listen for requests
  ↓
Handle requests with Express routes
```

**Serverless (Vercel approach):**
```
Request comes to Vercel
  ↓
Vercel invokes api/index.ts function
  ↓
Function returns Express app
  ↓
Vercel runs the Express app to handle the request
  ↓
Response sent back
  ↓
Function terminates
```

### Request Flow

1. **User requests:** `https://your-app.vercel.app/api/health`
2. **Vercel receives request** and routes it to `api/index.ts`
3. **Vercel executes:** `api/index.ts` which exports the Express app
4. **Express handles:** The request through its middleware and routes
5. **Response sent:** Express sends JSON response back through Vercel
6. **Function terminates:** After response is sent

## Why This Structure Works

### Vercel's Requirements:
1. **Entry point must be in `api/` directory** at the project root
2. **File must export default** (function or Express app)
3. **No `app.listen()`** in production (serverless doesn't use ports)

### Our Structure:
- `api/index.ts` → Vercel entry point ✓
- Exports Express app as default ✓
- No listen() in production ✓
- All routes handled by single function ✓

## Common Issues & Solutions

### Issue 1: 404 on all routes
**Cause:** Vercel can't find the entry point
**Solution:** Ensure `api/index.ts` exists and `vercel.json` points to it

### Issue 2: Module not found errors
**Cause:** Incorrect import paths
**Solution:** Use relative imports from `api/index.ts` → `../src/app`

### Issue 3: Database connection errors
**Cause:** Environment variables not set
**Solution:** Add DATABASE_URL in Vercel Dashboard

### Issue 4: Express routes return 404
**Cause:** Routes not properly configured
**Solution:** Ensure `vercel.json` routes ALL traffic to `api/index.ts`

## Testing Locally

### Development Mode (with app.listen)
```bash
cd backend
npm run dev
# Server runs on http://localhost:8000
```

### Production-like Mode (without app.listen)
```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
# Server runs on http://localhost:3000
```

## Deployment Steps

### First Time Deployment

1. **Prepare code:**
   ```bash
   cd backend
   git add .
   git commit -m "Configure for Vercel deployment"
   git push
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Import your Git repository
   - Set Root Directory to `backend`
   - Set Node version to `22.x`
   - Add environment variables
   - Deploy

3. **Verify deployment:**
   ```bash
   curl https://your-app.vercel.app/api/health
   # Should return: {"status":"OK","timestamp":"..."}
   ```

### Subsequent Deployments

Just push to your Git repository:
```bash
git add .
git commit -m "Update backend"
git push
# Vercel auto-deploys
```

## Expected URLs

After deployment, your endpoints will be:

```
Base URL: https://your-app.vercel.app

Endpoints:
- GET  https://your-app.vercel.app/api/health
- POST https://your-app.vercel.app/api/auth/login
- POST https://your-app.vercel.app/api/auth/register
- GET  https://your-app.vercel.app/api/customers
- POST https://your-app.vercel.app/api/customers
- GET  https://your-app.vercel.app/api/quotations
... (all your Express routes)
```

## Alternative: Individual Serverless Functions

If you wanted to split your Express app into individual functions (NOT recommended for this project):

```
api/
├── health.ts          # GET /api/health
├── auth/
│   ├── login.ts       # POST /api/auth/login
│   └── register.ts    # POST /api/auth/register
└── customers/
    ├── index.ts       # GET /api/customers
    └── [id].ts        # GET /api/customers/:id
```

Each file would be:
```typescript
export default function handler(req, res) {
  res.json({ message: 'Hello' });
}
```

**Why we DON'T use this approach:**
- Harder to maintain
- Can't share middleware easily
- More files to manage
- Express monolith is simpler

## Prisma Considerations

### Database Connection Pooling

Vercel serverless functions create new database connections on each invocation. Use connection pooling:

**Supabase:**
```
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true
```

### Prisma Generate

Run `prisma generate` during build:
```json
{
  "scripts": {
    "vercel-build": "prisma generate"
  }
}
```

## Performance Optimization

### Cold Starts
- First request after inactivity takes ~1-2 seconds
- Subsequent requests are fast (~50-200ms)
- Free tier: Functions sleep after inactivity
- Pro tier: Less cold starts

### Memory Limits
- Free: 1GB RAM per function
- Pro: 3GB RAM per function

### Timeout
- Free: 10 seconds
- Pro: 60 seconds

## Monitoring

### Vercel Logs
View logs in Vercel Dashboard → Deployments → [Your Deployment] → Functions

### Check Function Invocations
Vercel Dashboard → Analytics → Functions

## Troubleshooting Commands

```bash
# Check local build
npm run build

# Test locally with Vercel CLI
vercel dev

# Check Vercel deployment status
vercel --prod

# View logs
vercel logs

# Check environment variables
vercel env ls
```

## Summary

Your Express.js backend is now configured as a **single serverless function** on Vercel:

✅ All routes work (`/api/auth/*`, `/api/customers/*`, etc.)
✅ Prisma database connection (Supabase PostgreSQL)
✅ Environment variables from Vercel Dashboard
✅ Auto-deployment on git push
✅ HTTPS by default
✅ Global CDN

The key insight: **Vercel can run an entire Express app as a single serverless function**, not just individual route handlers.
