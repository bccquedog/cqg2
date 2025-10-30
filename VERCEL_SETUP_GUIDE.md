# 🚀 CQG Platform - Vercel Setup Guide

Complete step-by-step guide to deploy CQG Platform on Vercel with alert system integration.

---

## Quick Start Checklist

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Discord webhook created
- [ ] Firebase credentials ready
- [ ] Environment variables configured
- [ ] First deployment successful
- [ ] Alerts tested and working

---

## Part 1: Discord Webhook Setup

### Create Discord Webhook

1. **Open your Discord server**
2. Go to **Server Settings** → **Integrations**
3. Click **Webhooks** → **New Webhook**
4. **Configure webhook:**
   - Name: `CQG Deploy Bot`
   - Channel: Select your deployment channel (e.g., `#deployments`)
   - Avatar: Optional - add a bot icon
5. **Copy Webhook URL** (save for later)
6. Click **Save**

**Example webhook URL:**
```
https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz123456
```

---

## Part 2: Vercel Project Setup

### Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. **Import Git Repository:**
   - Search for: `natenasty21/cqg-platform`
   - Click **Import**

### Configure Project

**Framework Preset:** Next.js (auto-detected)  
**Root Directory:** `./` (default)  
**Build Command:** `pnpm run build` (auto-detected)  
**Output Directory:** `.next` (auto-detected)  
**Install Command:** `pnpm install` (auto-detected)

**Node.js Version:** 20.x (from `vercel.json`)

---

## Part 3: Environment Variables

### Required Firebase Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Alert System Variables

```bash
# Alert & Monitoring
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
GITHUB_URL=https://github.com/natenasty21/cqg-platform
VERCEL_PROJECT_URL=https://vercel.com/your-org/cqg-platform
```

### Build Environment Variables

```bash
# Build Configuration (optional - auto-set by vercel.json)
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Environment Scope

For each variable, select which environments to apply:
- ✅ **Production** - Live site
- ✅ **Preview** - Pull request previews
- ✅ **Development** - Local development (optional)

---

## Part 4: GitHub Actions Setup (Optional)

If you want GitHub Actions to handle builds and alerts:

### Add GitHub Secrets

Go to GitHub: `Settings` → `Secrets and variables` → `Actions`

Add these secrets:

```
DISCORD_WEBHOOK_URL=your_discord_webhook_url
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

**Get Vercel tokens:**

1. **Vercel Token:**
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create new token: "GitHub Actions Deploy"
   - Copy token

2. **Vercel Org ID & Project ID:**
   ```bash
   # Run in your local project
   vercel link
   # Check .vercel/project.json for IDs
   ```

### Add Firebase Secrets (for GitHub Actions builds)

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## Part 5: Deploy

### First Deployment

1. In Vercel Dashboard, click **Deploy**
2. Wait 2-5 minutes for build to complete
3. **Success!** Your site is now live

**Deployment URL:** `https://cqg-platform-xxxxx.vercel.app`

### Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate

---

## Part 6: Test Alert System

### Local Test (before Vercel)

```bash
# Set webhook URL
export ALERT_WEBHOOK_URL="your_discord_webhook_url"

# Test success alert
pnpm run alert:test
```

**Check Discord** - You should see a green ✅ success notification!

### Vercel Integration Test

After first deployment, the alert system will automatically:

1. **On Push to Main:**
   - GitHub Actions triggers build
   - Build with alert monitoring
   - Send Discord notification
   - Deploy to Vercel

2. **Manual Deploy:**
   ```bash
   # Force new deployment
   vercel --prod --force
   ```

---

## Part 7: Verify Deployment

### Health Checks

Test these URLs after deployment:

**Core Pages:**
- [ ] Homepage: `https://your-site.vercel.app/`
- [ ] Tournaments: `https://your-site.vercel.app/tournaments`
- [ ] Admin Panel: `https://your-site.vercel.app/admin`
- [ ] Players: `https://your-site.vercel.app/players`

**API Routes:**
- [ ] Seed API: `https://your-site.vercel.app/api/seed`
- [ ] Test Harness: `https://your-site.vercel.app/api/test-harness`

**Firebase Integration:**
- [ ] User authentication works
- [ ] Data loads from Firestore
- [ ] Real-time updates working

### Discord Alerts Check

You should see in Discord:

```
✅ Build Successful
🚀 Deployment completed successfully!

📝 Commit: ac16558
👤 Author: Your Name
⏱️ Build Time: 15s
💬 Message: Phase 1: Alert system and deployment hooks active

🔗 Links
GitHub Commit • Vercel Dashboard
```

---

## Part 8: Continuous Deployment

### Automatic Deployments

Every push to `main` branch will:
1. ✅ Trigger GitHub Actions (if configured)
2. ✅ Build with alert monitoring
3. ✅ Send Discord notification
4. ✅ Deploy to Vercel
5. ✅ Invalidate CDN cache

### Preview Deployments

Every pull request will:
1. Create preview deployment
2. Comment on PR with preview URL
3. Run build checks
4. (Optional) Send Discord notification

---

## Troubleshooting

### Build Fails on Vercel

**Check:**
1. Environment variables are set correctly
2. Node version is 20.x
3. PNPM is enabled
4. Build logs in Vercel dashboard

**Common fixes:**
```bash
# Clear Vercel cache
vercel --prod --force

# Verify local build
pnpm run build
```

### No Discord Alerts

**Check:**
1. `ALERT_WEBHOOK_URL` is set in Vercel
2. Discord webhook is active
3. Webhook has message permissions
4. GitHub Actions secrets are configured

**Test webhook:**
```bash
curl -X POST "your_webhook_url" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message"}'
```

### Firebase Connection Error

**Check:**
1. All Firebase env vars are set
2. Firebase project is active
3. Firebase security rules allow production domain
4. API keys are correct

**Verify in Firebase Console:**
- Authentication enabled
- Firestore database created
- Security rules configured

### Performance Issues

**Optimize:**
1. Enable Vercel Analytics
2. Check Web Vitals in dashboard
3. Review Lighthouse scores
4. Monitor build times

---

## Advanced Configuration

### Custom Build Command

If you want to use the alert-enabled build:

**Vercel Dashboard** → **Settings** → **General** → **Build & Development Settings**

Change **Build Command** to:
```bash
pnpm run build:alert
```

### Multiple Webhooks

Send alerts to different channels:

```bash
# In Vercel env vars
ALERT_WEBHOOK_URL_PROD=webhook_for_prod
ALERT_WEBHOOK_URL_TEAM=webhook_for_team
ALERT_WEBHOOK_URL_DEV=webhook_for_dev
```

Update `deploymentAlert.ts` to send to multiple webhooks.

### Vercel CLI Deployment

Deploy from command line:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy production
vercel --prod

# Deploy with force rebuild
vercel --prod --force
```

---

## Monitoring & Analytics

### Vercel Dashboard

Monitor in real-time:
- Deployment status
- Build logs
- Performance metrics
- Error tracking
- Bandwidth usage

### Discord Channel

Your deployment channel will show:
- Every deployment status
- Build success/failure
- Error details
- Quick links to GitHub & Vercel

### Firebase Console

Monitor your backend:
- Firestore usage
- Authentication activity
- Storage usage
- Performance data

---

## Security Best Practices

### Never Commit These:

```
✗ .env.production
✗ .env.local
✗ .env*.local
✗ .vercel (contains project IDs)
✗ Webhook URLs
✗ API keys
```

### Always Use:

```
✓ Vercel environment variables
✓ GitHub secrets
✓ .gitignore for sensitive files
✓ Separate webhooks for dev/prod
✓ Rotate exposed credentials
```

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Firebase Console:** https://console.firebase.google.com
- **GitHub Repository:** https://github.com/natenasty21/cqg-platform
- **Discord Support:** #tech-support channel

---

## Success Checklist

After following this guide:

- [x] Vercel project created and deployed
- [x] All environment variables configured
- [x] Discord webhook integrated
- [x] Alert system tested and working
- [x] Firebase connected and functional
- [x] Continuous deployment enabled
- [x] Health checks passing
- [x] Performance optimized

---

**Deployment Status:** 🟢 Live  
**Alert System:** 🟢 Active  
**Continuous Deployment:** 🟢 Enabled

🎉 **Congratulations! Your CQG Platform is live on Vercel!**

