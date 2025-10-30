# Discord Integration Setup Checklist

## ✅ **Required Steps to Make Discord Work:**

### 1. **Create Discord Application** (REQUIRED)
- [ ] Go to [Discord Developer Portal](https://discord.com/developers/applications)
- [ ] Click "New Application" 
- [ ] Name it "CQG Platform"
- [ ] Go to "OAuth2" → "General"
- [ ] Copy your **Client ID** and **Client Secret**

### 2. **Configure OAuth2 Settings**
- [ ] In your Discord app, go to "OAuth2" → "General"
- [ ] Add redirect URI: `http://localhost:3000/api/discord/callback`
- [ ] For production, also add: `https://yourdomain.com/api/discord/callback`
- [ ] Enable these scopes:
  - `identify` (basic user info)
  - `email` (user email)
  - `connections` (linked gaming accounts)
  - `guilds` (server memberships)

### 3. **Set Environment Variables**
Create `.env.local` file with:

```env
# Discord OAuth2 Configuration (REQUIRED)
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
NEXT_PUBLIC_DISCORD_REDIRECT_URI=http://localhost:3000/api/discord/callback
```

### 4. **Test the Integration**
```bash
# Test Discord setup
npm run test:discord

# Start development server
npm run dev
```

### 5. **Verify Everything Works**
- [ ] Navigate to your app
- [ ] Click "Sign Up" or "Sign In"
- [ ] Click the Discord button
- [ ] You should be redirected to Discord for authorization
- [ ] After authorizing, you should be redirected back to your app
- [ ] Check your profile page to see linked Discord data

## 🚨 **Common Issues & Solutions:**

### Issue: "Invalid redirect URI"
**Solution:** Make sure the redirect URI in Discord settings exactly matches your environment variable

### Issue: "Client secret not found"
**Solution:** Ensure `DISCORD_CLIENT_SECRET` is in `.env.local` (not `.env`)

### Issue: "Discord OAuth error"
**Solution:** Check that all required scopes are enabled in Discord app settings

### Issue: Gaming accounts not syncing
**Solution:** Make sure user has linked accounts in Discord and they're marked as "verified"

## 📋 **Quick Setup Commands:**

```bash
# 1. Copy environment template
cp env.example .env.local

# 2. Edit .env.local with your Discord credentials
# (Add your Discord Client ID and Secret)

# 3. Test the setup
npm run test:discord

# 4. Start the app
npm run dev
```

## 🎯 **What You'll Get:**

Once set up, users will be able to:
- ✅ Sign in with Discord
- ✅ Link their Discord account to existing profiles
- ✅ Sync gaming accounts (Xbox, PlayStation, Steam, etc.)
- ✅ Join your Discord community server
- ✅ Participate in tournament-specific Discord channels
- ✅ Get real-time tournament updates

## 🔗 **Your Discord Server:**
Your community server is ready at: **https://discord.gg/eY7QmDAeCy**

The integration will automatically direct users to join this server for community features and tournament coordination.
