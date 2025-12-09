# ByteRyte Backend - Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

All TypeScript errors have been fixed:
- [x] Added proper type annotations to all route handlers
- [x] Added missing AuditAction enum values (VAULT_UPDATED, VAULT_MEMBER_ADDED, VAULT_MEMBER_REMOVED, VAULT_MEMBER_UPDATED)
- [x] Fixed Prisma schema to include DATABASE_URL
- [x] Updated build script to generate Prisma client
- [x] Created vercel.json configuration

## 🚀 Deployment Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Fix TypeScript errors and prepare for Vercel deployment"
git push origin main
```

### 2. Configure Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

#### Required Variables:

```env
# Database (MongoDB Atlas)
DATABASE_URL=mongodb+srv://HaniEdelbi:hani54321@byteryte.t10ajnu.mongodb.net/byteryte

# JWT Configuration
JWT_SECRET=byteryte-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
BCRYPT_ROUNDS=12

# CORS - IMPORTANT: Update this to your frontend URL
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=60000

# Audit & Monitoring
ENABLE_AUDIT_LOGS=true

# Emergency Access
EMERGENCY_ACCESS_CHECK_INTERVAL=3600000

# 2FA
TOTP_WINDOW=1
TOTP_STEP=30
```

### 3. Update CORS Origin

**CRITICAL:** After deploying your frontend, update the `CORS_ORIGIN` environment variable to match your frontend URL:

```env
CORS_ORIGIN=https://byteryte-frontend.vercel.app
```

Or if you want to allow multiple origins during development:

```env
CORS_ORIGIN=https://byteryte-frontend.vercel.app,http://localhost:8080
```

### 4. Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

#### Option B: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect the configuration
4. Click "Deploy"

## 📁 Files Created for Deployment

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Updated package.json build script
```json
"build": "prisma generate && tsc"
```

This ensures Prisma Client is generated during Vercel build.

## 🔧 Build Process on Vercel

Vercel will automatically:

1. Install dependencies (`npm install`)
2. Run build command (`npm run build`)
   - Generate Prisma client
   - Compile TypeScript to JavaScript
3. Deploy the `dist/` folder
4. Run `npm start` to start the server

## ⚠️ Important Notes

### MongoDB Connection String
Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or whitelist Vercel's IP ranges.

**MongoDB Atlas Steps:**
1. Go to Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (for Vercel)
4. Click "Confirm"

### Environment Variables
- All environment variables MUST be set in Vercel dashboard
- The `.env` file is NOT deployed (it's in `.gitignore`)
- Double-check `DATABASE_URL` and `JWT_SECRET`

### Serverless Functions
Vercel runs Node.js as serverless functions. Your Fastify server will be adapted automatically.

## 🧪 Testing Your Deployment

Once deployed, Vercel will give you a URL like:
```
https://byteryte-backend.vercel.app
```

Test the API:

```bash
# Health check (if you have one)
curl https://byteryte-backend.vercel.app/health

# Test registration
curl -X POST https://byteryte-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "passwordVerifier": "test-verifier-hash",
    "encryptedVaultKey": "test-encrypted-vault-key-with-minimum-50-characters-required"
  }'
```

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors
✅ **FIXED** - All TypeScript errors have been resolved.

### Build Fails with Prisma Errors
✅ **FIXED** - Build script now includes `prisma generate`.

### "Cannot connect to database"
- Check `DATABASE_URL` environment variable in Vercel
- Verify MongoDB Atlas allows connections from 0.0.0.0/0
- Check MongoDB Atlas username/password

### CORS Errors in Frontend
- Update `CORS_ORIGIN` environment variable in Vercel
- Should match your frontend URL exactly
- Redeploy after changing environment variables

### "AuditAction is not defined"
✅ **FIXED** - Added missing enum values to schema.prisma.

## 📊 Deployment Summary

### Fixed Issues:
1. ✅ TypeScript implicit `any` errors in all route files
2. ✅ Missing `AuditAction` enum values
3. ✅ Prisma schema missing `url` in datasource
4. ✅ Build script doesn't generate Prisma client
5. ✅ No Vercel configuration file

### Files Modified:
- `prisma/schema.prisma` - Added DATABASE_URL, new AuditAction values
- `package.json` - Updated build script
- `src/routes/device.routes.ts` - Added type annotations
- `src/routes/vault.routes.ts` - Added type annotations  
- `src/routes/item.routes.ts` - Added type annotations
- `src/routes/password.routes.ts` - Added type annotations

### Files Created:
- `vercel.json` - Vercel deployment configuration

## 🎯 Next Steps After Deployment

1. **Test All Endpoints** - Use the test scripts:
   ```bash
   # Update test-api.ps1 with your Vercel URL
   # Then run tests
   ```

2. **Update Frontend** - Change API base URL to your Vercel URL:
   ```javascript
   const API_URL = 'https://byteryte-backend.vercel.app';
   ```

3. **Monitor Logs** - Check Vercel dashboard for any runtime errors

4. **Set Up Custom Domain** (Optional):
   - Go to Vercel project settings
   - Add custom domain like `api.byteryte.com`

5. **Enable HTTPS** - Vercel provides automatic SSL certificates

## 🔒 Security Recommendations

1. **Change JWT_SECRET** - Use a strong, random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Rotate Secrets Regularly** - Update JWT_SECRET periodically

3. **Monitor Audit Logs** - Check for suspicious activity

4. **Rate Limiting** - Already configured at 100 requests/minute

5. **Use Environment-Specific Secrets** - Different secrets for production vs staging

## 📝 Deployment Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] MongoDB Atlas allows Vercel connections
- [ ] CORS_ORIGIN matches frontend URL
- [ ] JWT_SECRET is strong and unique
- [ ] All endpoints tested and working
- [ ] Frontend updated with Vercel backend URL
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Error monitoring set up (optional: Sentry, etc.)

---

**Status:** Ready for Deployment ✅

**Last Updated:** December 9, 2025

**Deployment Platform:** Vercel (Serverless)
