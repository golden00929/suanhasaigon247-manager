# Vercel Deployment Checklist

## Pre-Deployment Verification

### File Structure ✓
- [ ] `backend/api/index.ts` exists and exports Express app
- [ ] `backend/src/app.ts` contains Express application
- [ ] `backend/vercel.json` exists with correct configuration
- [ ] `backend/package.json` has `vercel-build` script

### Configuration Files ✓
- [ ] `vercel.json` points to `api/index.ts`
- [ ] `api/index.ts` imports from `../src/app`
- [ ] `src/app.ts` does NOT call `app.listen()` in production
- [ ] `package.json` has `"type": "module"`

### Prisma Setup ✓
- [ ] `prisma/schema.prisma` exists
- [ ] Database URL uses connection pooling (if Supabase/Postgres)
- [ ] `vercel-build` script runs `prisma generate`

## Vercel Dashboard Setup

### Project Settings
- [ ] Root Directory: `backend`
- [ ] Framework Preset: Other
- [ ] Node.js Version: 22.x
- [ ] Build Command: `npm run vercel-build`

### Environment Variables
- [ ] DATABASE_URL (with ?pgbouncer=true for Supabase)
- [ ] JWT_SECRET
- [ ] JWT_EXPIRES_IN
- [ ] NODE_ENV=production

## Post-Deployment Testing

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```
Expected: `{"status":"OK","timestamp":"...","memory":{...}}`

### Authentication
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
Expected: `{"token":"...","user":{...}}`

### Protected Route
```bash
curl https://your-app.vercel.app/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: `[{customer data}]`

## Common Issues

### All routes return 404
- Check `vercel.json` exists in backend root
- Verify `api/index.ts` path is correct
- Check Vercel Dashboard → Settings → Root Directory is `backend`

### Module not found errors
- Check import path in `api/index.ts` is `../src/app`
- Verify `src/app.ts` exists
- Check all route imports in `src/app.ts`

### Database errors
- Verify DATABASE_URL is set in Vercel Dashboard
- Check connection pooling is enabled (?pgbouncer=true)
- Ensure database is accessible from internet

### Prisma errors
- Check `prisma generate` runs in build
- Verify `@prisma/client` is in dependencies (not devDependencies)
- Check Prisma version compatibility

## Quick Deploy

```bash
# 1. Ensure all files are committed
git status
git add .
git commit -m "Configure for Vercel deployment"

# 2. Push to GitHub
git push origin main

# 3. Vercel auto-deploys
# Wait for deployment notification

# 4. Test endpoints
curl https://your-app.vercel.app/api/health
```

## Rollback

If deployment fails:

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

## Local Testing with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
cd backend
vercel link

# Pull environment variables
vercel env pull

# Run locally (production-like)
vercel dev

# Test on http://localhost:3000
curl http://localhost:3000/api/health
```

## Monitoring

### Real-time Logs
```bash
vercel logs --follow
```

### Function Analytics
Vercel Dashboard → Analytics → Functions

### Error Tracking
Vercel Dashboard → Deployments → [Latest] → Functions → [Function] → Logs

## Performance Tips

1. **Database Connection Pooling**
   - Use PgBouncer for Postgres
   - Keep connections under 10 per function

2. **Optimize Cold Starts**
   - Minimize dependencies
   - Use lazy imports for large modules
   - Keep function size under 50MB

3. **Cache Strategy**
   - Use Vercel Edge Cache for static data
   - Implement response caching where appropriate

4. **Monitoring**
   - Set up alerts for errors
   - Monitor function duration
   - Track cold start frequency

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- Express + Vercel: https://vercel.com/guides/using-express-with-vercel

---

Last Updated: 2025-10-23
