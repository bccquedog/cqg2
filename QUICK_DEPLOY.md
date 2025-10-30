# ⚡ Quick Deploy Commands

Fast reference for deploying CQG Platform to Vercel.

---

## 🚀 Option 1: Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/dashboard
2. Click **Import Project**
3. Select: `natenasty21/cqg-platform`
4. Add environment variables (see VERCEL_SETUP_GUIDE.md)
5. Click **Deploy**

**Time:** ~3 minutes  
**Automatic:** ✅ Yes (on push to main)

---

## 🔧 Option 2: Vercel CLI (Advanced)

### Install Vercel CLI

```bash
pnpm add -g vercel
# or
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy

```bash
# Production deployment with force rebuild
vercel --prod --force
```

**Time:** ~2-5 minutes  
**Use when:** Need immediate deployment or cache clear

---

## 🤖 Option 3: Git Push (Automated)

### Just push to main branch

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**GitHub Actions will automatically:**
1. Build with alert monitoring
2. Send Discord notification
3. Deploy to Vercel

**Time:** ~3-5 minutes  
**Best for:** Regular development workflow

---

## 🧪 Test Alert System First

Before deploying, test your alert system:

```bash
# Set your Discord webhook URL
export ALERT_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"

# Test success alert
pnpm run alert:test
```

**Check Discord** - You should see a green ✅ notification!

---

## 🔍 Monitor Deployment

### Vercel Dashboard

Watch deployment progress:
```
https://vercel.com/dashboard
```

### Discord Channel

Watch for deployment alerts with:
- Build status (✅ success or ❌ failure)
- Build time
- Commit info
- Quick links

### GitHub Actions

Monitor workflow:
```
https://github.com/natenasty21/cqg-platform/actions
```

---

## ⚙️ Environment Variables Quick Setup

**Required for first deployment:**

```bash
# In Vercel Dashboard → Settings → Environment Variables

NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
ALERT_WEBHOOK_URL=your_discord_webhook
```

---

## 🆘 Quick Troubleshooting

### Build Fails?

```bash
# Test locally first
pnpm run build

# If local works, clear Vercel cache
vercel --prod --force
```

### No Discord Alerts?

```bash
# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test from CQG"}'
```

### Environment Variables Missing?

Check they're set in **all environments** (Production, Preview, Development)

---

## 📊 Expected Results

### Successful Deployment Shows:

**Vercel:**
```
✓ Build completed
✓ Deployment ready
✓ https://cqg-platform-xxxxx.vercel.app
```

**Discord:**
```
✅ Build Successful
🚀 Deployment completed successfully!
📝 Commit: 35aab58
👤 Author: Your Name
⏱️ Build Time: 15s
```

**GitHub:**
```
✓ Build and deploy workflow completed
```

---

## 🎯 Quick Commands Reference

```bash
# Local build test
pnpm run build

# Build with alerts
pnpm run build:alert

# Test alert system
pnpm run alert:test

# Deploy to Vercel
vercel --prod

# Force clean deploy
vercel --prod --force

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

---

## 📱 After Deployment

### Health Check

```bash
# Check if site is live
curl -I https://your-site.vercel.app

# Test API route
curl https://your-site.vercel.app/api/seed
```

### Verify Pages

Visit these URLs:
- `/` - Homepage
- `/tournaments` - Tournament list
- `/admin` - Admin panel

---

**Ready to deploy?** Choose an option above and go! 🚀

