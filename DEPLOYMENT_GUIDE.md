# CQG Phase 1 Beta - Vercel Deployment Guide

## Prerequisites Checklist ✅

- [x] Node.js 20.11.1 installed
- [x] PNPM package manager
- [x] Next.js 15 configured
- [x] Firebase credentials ready
- [x] Vercel account with GitHub integration

---

## File Configuration

### 1. `vercel.json` ✅ Created
Located in project root with:
- Node 20 support
- PNPM compatibility via Corepack
- Next.js telemetry disabled
- Routing fallback configured

### 2. `.env.production` ⚠️ Manual Setup Required
**IMPORTANT**: Create this file manually (not tracked in Git):

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your actual Firebase credentials
nano .env.production
```

Required environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `ALERT_WEBHOOK_URL` (Discord webhook)
- `GITHUB_URL`
- `VERCEL_PROJECT_URL`

### 3. `tsconfig.json` ✅ Updated
- Added `baseUrl: "."` for proper path resolution
- Path aliases configured for `@/*`, `@components/*`, `@lib/*`, etc.

### 4. UI Components ✅ Verified
- `src/components/ui/switch.tsx` - Created with SwitchProps interface
- `src/components/ui/separator.tsx` - Created with SeparatorProps interface
- `src/lib/utils.ts` - Utility functions for className merging

---

## Pre-Deployment Testing

### Step 1: Clean Build
```bash
rm -rf node_modules .next
pnpm install
```

### Step 2: Local Build Test
```bash
pnpm run build
```

**Expected Output**: ✓ Compiled successfully — 42+ pages generated

### Step 3: Local Production Test
```bash
pnpm start
```

Test key routes:
- http://localhost:3000 (Homepage)
- http://localhost:3000/tournaments (Tournaments list)
- http://localhost:3000/admin (Admin panel)

---

## Vercel Deployment Steps

### Option A: Automatic Deployment (Recommended)

1. **Connect GitHub Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import `natenasty21/cqg-platform`

2. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `pnpm run build`
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install`
   - Node Version: **20.x** (auto-detected from vercel.json)

3. **Add Environment Variables**
   In Vercel project settings → Environment Variables, add all variables from `.env.production`:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ALERT_WEBHOOK_URL=...
   GITHUB_URL=https://github.com/natenasty21/cqg-platform
   VERCEL_PROJECT_URL=https://cqg.vercel.app
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Vercel will auto-deploy on every push to `main`

### Option B: Manual Deployment via CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Post-Deployment Verification

### Health Check URLs
- [ ] Homepage: `https://cqg.vercel.app`
- [ ] Tournaments: `https://cqg.vercel.app/tournaments`
- [ ] Admin: `https://cqg.vercel.app/admin`
- [ ] API Routes: `https://cqg.vercel.app/api/test-harness`

### Firebase Integration
- [ ] User authentication works
- [ ] Firestore data loads correctly
- [ ] Realtime updates functional
- [ ] File uploads to Storage working

### Performance Checks
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No console errors in production

---

## Troubleshooting

### Build Fails with "Module not found"
**Solution**: Verify all imports use correct path aliases:
```typescript
// ✅ Correct
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// ❌ Incorrect
import { Switch } from "components/ui/switch"
```

### Firebase Connection Error
**Solution**: Double-check environment variables in Vercel dashboard match your Firebase project.

### 404 on Dynamic Routes
**Solution**: Ensure `vercel.json` routing is properly configured (already done).

### Build Warnings about ESLint/TypeScript
**Solution**: Already handled in `next.config.ts` with `ignoreDuringBuilds: true`.

---

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- ✅ Deploy on every push to `main`
- ✅ Create preview deployments for PRs
- ✅ Run build checks before deployment
- ✅ Invalidate CDN cache on new deploys

---

## Support & Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor performance analytics
- Check error rates
- Review build times

### Firebase Console
- Monitor Firestore usage
- Check authentication activity
- Review Storage usage
- Monitor Functions execution (if applicable)

---

## Security Notes

⚠️ **Never commit these files to Git:**
- `.env.production`
- `.env.local`
- Any file containing API keys or secrets

✅ **Always use Vercel Environment Variables** for production secrets.

---

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure Vercel Analytics
3. Enable Web Vitals monitoring
4. Set up error tracking (Sentry, LogRocket, etc.)
5. Configure Firebase security rules for production
6. Set up monitoring alerts via Discord webhook

---

**Deployment Date**: _To be filled_  
**Production URL**: https://cqg.vercel.app  
**Status**: Ready for deployment 🚀

