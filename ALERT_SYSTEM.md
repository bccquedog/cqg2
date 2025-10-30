# 🔔 CQG Deployment Alert System

Real-time build monitoring and Discord notifications for the CQG Platform.

---

## Features

- ✅ **Success Alerts**: Green notifications when builds complete successfully
- ❌ **Failure Alerts**: Red notifications with error details when builds fail
- ⏱️ **Build Timing**: Tracks and reports build duration
- 👤 **Git Integration**: Includes commit hash, author, and message
- 🔗 **Quick Links**: Direct links to GitHub commit and Vercel dashboard
- 📝 **Error Logging**: First 10 lines of build errors for quick debugging

---

## Setup

### 1. Discord Webhook

Create a Discord webhook for your deployment channel:

1. Go to your Discord server settings
2. Navigate to **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Name it "CQG Deploy Bot"
5. Copy the webhook URL

### 2. Environment Variables

Add to your `.env.production` or Vercel environment variables:

```bash
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
GITHUB_URL=https://github.com/natenasty21/cqg-platform
VERCEL_PROJECT_URL=https://vercel.com/your-org/cqg-platform
```

### 3. GitHub Actions (Optional)

If using GitHub Actions for deployment, add these secrets:

- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL
- `VERCEL_TOKEN`: Your Vercel deployment token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

---

## Usage

### Local Development

Test the alert system locally:

```bash
# Test success alert
pnpm run alert:test

# Build with alerts enabled
export ALERT_WEBHOOK_URL="your_webhook_url"
pnpm run build:alert
```

### Vercel Deployment

Vercel automatically detects build status and can be integrated with webhooks.

#### Option 1: GitHub Actions (Recommended)

The `.github/workflows/deploy.yml` workflow automatically:
1. Builds the project
2. Sends build status to Discord
3. Deploys to Vercel on success

Push to `main` branch to trigger:

```bash
git push origin main
```

#### Option 2: Vercel CLI

Deploy directly with alerts:

```bash
# Set environment variables
export ALERT_WEBHOOK_URL="your_webhook_url"
export GITHUB_URL="https://github.com/natenasty21/cqg-platform"
export VERCEL_PROJECT_URL="https://vercel.com/your-org/cqg-platform"

# Build with alerts
pnpm run build:alert

# Deploy to Vercel
vercel --prod --force
```

---

## Alert Format

### Success Alert (Green)

```
✅ Build Successful
🚀 Deployment completed successfully!

📝 Commit: `48f2c13`
👤 Author: John Doe
⏱️ Build Time: 15s
💬 Message: Phase 1: Alert system and deployment hooks active

🔗 Links
GitHub Commit • Vercel Dashboard

CQG Platform • Deployment Monitor
```

### Failure Alert (Red)

```
❌ Build Failed
⚠️ Deployment failed. Check error details below.

📝 Commit: `48f2c13`
👤 Author: John Doe
⏱️ Build Time: 8s
💬 Message: Phase 1: Alert system and deployment hooks active

🚨 Error Details
```
./src/app/example/page.tsx
Module not found: Can't resolve '@/components/Missing'
...
(first 10 lines of error)
```

🔗 Links
GitHub Commit • Vercel Dashboard

CQG Platform • Deployment Monitor
```

---

## Scripts

### `scripts/deploymentAlert.ts`

Core alert script that sends Discord notifications.

**Usage:**
```bash
ts-node scripts/deploymentAlert.ts <success|failure> [buildTime] [errorLog]
```

**Examples:**
```bash
# Success notification
ts-node scripts/deploymentAlert.ts success "15s"

# Failure notification with error
ts-node scripts/deploymentAlert.ts failure "8s" "Build error log here"
```

### `scripts/build-with-alerts.sh`

Wrapper script that builds the project and automatically sends alerts.

**Features:**
- Tracks build time
- Captures build output
- Sends success alert on completion
- Sends failure alert with error log on failure

---

## Integration Points

### 1. GitHub Actions

The workflow file `.github/workflows/deploy.yml` integrates with:
- Automatic builds on push to `main`
- Discord notifications for build status
- Vercel deployment on success

### 2. Vercel Build Hooks

Configure in Vercel dashboard:
- **Deploy Hooks**: Trigger builds via webhook
- **Environment Variables**: Set `ALERT_WEBHOOK_URL`
- **Notifications**: Native Vercel → Discord integration

### 3. Local Development

Use `build:alert` script for local testing:
```bash
pnpm run build:alert
```

---

## Troubleshooting

### No alerts are being sent

**Check:**
1. `ALERT_WEBHOOK_URL` is set correctly
2. Discord webhook is active
3. Webhook has permissions to send messages
4. Network connectivity to Discord API

**Test:**
```bash
# Test alert manually
export ALERT_WEBHOOK_URL="your_webhook_url"
pnpm run alert:test
```

### Alerts sent but not formatted correctly

**Fix:**
- Ensure Discord webhook allows embeds
- Check webhook permissions in Discord server settings
- Verify webhook URL is complete (includes token)

### Build succeeds but alert shows failure

**Check:**
- Build script exit codes
- Error log parsing in `build-with-alerts.sh`
- Shell script permissions (`chmod +x`)

### Git information not showing

**Ensure:**
- Running in a git repository
- Git is installed and accessible
- Repository has at least one commit

---

## Customization

### Modify Alert Appearance

Edit `scripts/deploymentAlert.ts`:

```typescript
// Change colors
const color = isSuccess ? 0x00ff00 : 0xff0000; // Green/Red

// Change emojis
const emoji = isSuccess ? '✅' : '❌';

// Add custom fields
fields.push({
  name: '🏷️ Version',
  value: process.env.npm_package_version || 'unknown',
  inline: true,
});
```

### Add Additional Webhooks

Send to multiple Discord channels:

```typescript
const webhooks = [
  process.env.ALERT_WEBHOOK_URL,
  process.env.ALERT_WEBHOOK_URL_TEAM,
  process.env.ALERT_WEBHOOK_URL_DEV,
].filter(Boolean);

for (const webhook of webhooks) {
  await sendDiscordAlert(webhook, buildInfo);
}
```

### Integrate with Other Services

Extend `deploymentAlert.ts` to support:
- Slack webhooks
- Email notifications
- SMS alerts
- Custom webhooks

---

## Security

⚠️ **Important Security Notes:**

1. **Never commit webhook URLs** to version control
2. Use environment variables for all sensitive data
3. Rotate webhook URLs if exposed
4. Limit webhook permissions in Discord
5. Use separate webhooks for dev/staging/prod

### .gitignore

Ensure these are in `.gitignore`:

```
.env*
!.env.example
!.env.production.example
```

---

## Monitoring

### Build Metrics

Track these in your Discord channel:
- Build success rate
- Average build time
- Failed build frequency
- Deployment frequency

### Alert History

Discord stores all messages, providing:
- Historical build logs
- Performance trends
- Error patterns
- Deployment timeline

---

## Next Steps

1. Set up Discord webhook
2. Add webhook URL to Vercel environment variables
3. Test with `pnpm run alert:test`
4. Push to `main` to trigger full deployment
5. Monitor Discord for alerts

---

**Status**: ✅ Alert system ready  
**Integration**: Discord webhooks  
**Deployment**: GitHub Actions + Vercel  
**Monitoring**: Real-time notifications

🚀 **Happy Deploying!**

