# Discord Integration Setup Guide

This guide will help you set up Discord integration for the CQG Platform, allowing users to link their Discord accounts and access community features.

## Discord Application Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your application a name (e.g., "CQG Platform")
4. Click "Create"

### 2. Configure OAuth2 Settings

1. In your Discord application, go to the "OAuth2" section
2. Click "General" tab
3. Copy the **Client ID** - you'll need this for `NEXT_PUBLIC_DISCORD_CLIENT_ID`
4. Click "Reset Secret" and copy the **Client Secret** - you'll need this for `DISCORD_CLIENT_SECRET`
5. In the "Redirects" section, add your callback URL:
   - Development: `http://localhost:3001/api/auth/discord/callback`
   - Production: `https://yourdomain.com/api/auth/discord/callback`

### 3. Environment Variables

Add these to your `.env.local` file:

```env
# Discord OAuth Application ID
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id_here

# Discord OAuth Application Secret (server-side only)
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Discord OAuth Redirect URI
NEXT_PUBLIC_DISCORD_REDIRECT_URI=http://localhost:3001/api/auth/discord/callback
```

## Features Included

### ✅ Current Features

- **Discord Account Linking**: Users can link their Discord accounts via OAuth2
- **Manual ID Entry**: Alternative method to link Discord accounts
- **Profile Display**: Discord information shows on user profiles
- **Privacy Controls**: Users can unlink their Discord accounts anytime
- **Verification Status**: Shows if Discord account is verified

### 🚀 Future Features (Ready for Implementation)

- **Discord Bot Integration**: Bot can send match notifications
- **Server Integration**: Join tournament-specific Discord channels
- **Rich Presence**: Show game status in Discord
- **Community Features**: Discord-only tournaments and events

## Discord Service API

The `DiscordService` class provides methods for:

- OAuth URL generation
- Token exchange
- User information retrieval
- Guild (server) information
- Token refresh
- Avatar URL generation

## Security Considerations

- **Client Secret**: Never expose in client-side code
- **State Parameter**: OAuth state is generated for CSRF protection
- **Token Storage**: Access tokens should be stored securely
- **Permissions**: Only request necessary Discord permissions

## Testing

1. Start your development server: `npm run dev`
2. Navigate to your profile page
3. Click "Link with Discord OAuth" or enter Discord ID manually
4. Complete the OAuth flow
5. Verify Discord information appears on your profile

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Ensure the redirect URI in Discord matches your environment
2. **Missing Environment Variables**: Check that all required env vars are set
3. **CORS Issues**: Discord OAuth should work without CORS issues
4. **Token Exchange Fails**: Verify client secret is correct

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
NODE_ENV=development
```

## Production Deployment

1. Update redirect URIs in Discord application to production URLs
2. Update environment variables for production
3. Ensure HTTPS is used for production OAuth flows
4. Test the complete OAuth flow in production environment

## Discord Bot Setup (Future Feature)

To enable bot features:

1. Go to "Bot" section in Discord Developer Portal
2. Click "Add Bot"
3. Copy the bot token to `DISCORD_BOT_TOKEN`
4. Set bot permissions as needed
5. Invite bot to your Discord server

## Support

For Discord API issues, check:
- [Discord API Documentation](https://discord.com/developers/docs)
- [Discord OAuth2 Guide](https://discord.com/developers/docs/topics/oauth2)
- [Discord Developer Support](https://discord.com/developers/docs/topics/oauth2)
