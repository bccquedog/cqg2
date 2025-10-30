# Discord Integration Setup Guide

This guide will help you set up Discord OAuth2 integration for the CQG Platform, enabling users to link their Discord accounts and sync gaming profiles.

## Prerequisites

1. A Discord Developer Application
2. Firebase project with Firestore enabled
3. Next.js application with the Discord integration code

## Step 1: Create Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "CQG Platform")
3. Navigate to the "OAuth2" section in the left sidebar
4. Add the following redirect URI:
   - For development: `http://localhost:3000/api/discord/callback`
   - For production: `https://yourdomain.com/api/discord/callback`

### Community Server Integration

Your CQG Platform Discord server is already set up at: **https://discord.gg/eY7QmDAeCy**

This server will be used for:
- Community discussions and networking
- Tournament-specific channels
- Player matchmaking and coordination
- Real-time tournament updates

## Step 2: Configure OAuth2 Scopes

In your Discord application's OAuth2 settings, ensure these scopes are enabled:

- `identify` - Access basic user information
- `email` - Access user's email (optional)
- `connections` - Access linked gaming accounts
- `guilds` - Access server memberships (optional)
- `guilds.members.read` - Access server member data (optional)

## Step 3: Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Discord OAuth2 Configuration
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
NEXT_PUBLIC_DISCORD_REDIRECT_URI=http://localhost:3000/api/discord/callback
```

**Important Security Notes:**
- Never commit your `.env.local` file to version control
- The `DISCORD_CLIENT_SECRET` should only be used on the server side
- For production, update the redirect URI to your production domain

## Step 4: Firebase Security Rules

Update your Firestore security rules to allow Discord data storage:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own player data including Discord info
    match /players/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading other players' public data (without sensitive Discord info)
    match /players/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

## Step 5: Testing the Integration

### 1. Start Your Development Server

```bash
npm run dev
```

### 2. Test Discord OAuth Flow

1. Navigate to your application
2. Click "Sign Up" or "Sign In"
3. Click the "Discord" button in the social sign-in section
4. You should be redirected to Discord for authorization
5. After authorizing, you'll be redirected back to your app
6. Check your profile page to see the linked Discord account

### 3. Test Gaming Account Sync

1. In Discord, go to Settings → Connections
2. Link some gaming accounts (Xbox, PlayStation, Steam, etc.)
3. In your app, unlink and re-link your Discord account
4. Check that the gaming accounts appear in your profile

## Step 6: Production Deployment

### 1. Update Environment Variables

For production, update your environment variables:

```env
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_production_client_id
DISCORD_CLIENT_SECRET=your_production_client_secret
NEXT_PUBLIC_DISCORD_REDIRECT_URI=https://yourdomain.com/api/discord/callback
```

### 2. Update Discord Application Settings

1. Go to your Discord application settings
2. Update the redirect URI to your production domain
3. Optionally add a production redirect URI while keeping the development one

### 3. Deploy Your Application

Deploy your application using your preferred method (Vercel, Netlify, etc.).

## Features Included

### 1. Discord OAuth2 Authentication
- Users can sign in with Discord
- Automatic account creation for new Discord users
- Tournament auto-join for Discord sign-ups

### 2. Gaming Account Sync
- Automatically syncs linked gaming accounts from Discord
- Supports Xbox, PlayStation, Steam, Battle.net, Epic Games, and Riot Games
- Displays gaming accounts in user profiles

### 3. Profile Integration
- Discord avatar and username display
- Linked gaming account showcase
- Discord account linking/unlinking functionality

### 4. Community Features
- **Discord Server Integration**: Direct integration with your community server (https://discord.gg/eY7QmDAeCy)
- **Tournament-Specific Channels**: Automatic channel creation for tournaments
- **Role Synchronization**: Auto-assign Discord roles based on tournament participation
- **Real-time Notifications**: Discord notifications for match updates and tournament events
- **Community Engagement Tracking**: Analytics for Discord community participation

## API Endpoints

The integration includes several API endpoints:

- `POST /api/discord/token` - Exchange authorization code for access token
- `POST /api/discord/user` - Fetch Discord user data
- `POST /api/discord/connections` - Fetch linked gaming accounts
- `POST /api/discord/guilds` - Fetch server memberships
- `POST /api/discord/sync` - Sync Discord data to user profile
- `POST /api/discord/unlink` - Unlink Discord account
- `GET /api/discord/callback` - Handle OAuth callback

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure your redirect URI in Discord settings matches exactly
   - Check that the URI is properly URL-encoded

2. **"Client secret not found" error**
   - Verify your environment variables are set correctly
   - Ensure the Discord client secret is in `.env.local`, not `.env`

3. **Gaming accounts not syncing**
   - Make sure the user has linked accounts in Discord
   - Check that the `connections` scope is enabled
   - Verify the accounts are marked as "verified" in Discord

4. **Profile not updating**
   - Check Firestore security rules
   - Verify the user is authenticated
   - Check browser console for errors

### Debug Mode

Enable debug logging by adding this to your environment:

```env
NEXT_PUBLIC_DEBUG_DISCORD=true
```

This will log additional information to help troubleshoot issues.

## Security Considerations

1. **Environment Variables**: Never expose your Discord client secret in client-side code
2. **State Parameter**: The integration uses a state parameter for CSRF protection
3. **Token Storage**: Access tokens are not stored permanently; they're only used for initial sync
4. **Data Privacy**: Only essential Discord data is stored; no messages or sensitive information

## Future Enhancements

The integration is designed to support future features:

1. **Discord Bot Integration**: Add a Discord bot for server management
2. **Role Sync**: Automatically assign Discord roles based on tournament participation
3. **Notifications**: Send Discord DMs for match updates
4. **Server Integration**: Join users to specific Discord servers automatically

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your Discord application settings
3. Test with a fresh Discord account
4. Check the API endpoint responses

For additional help, refer to the [Discord Developer Documentation](https://discord.com/developers/docs).
