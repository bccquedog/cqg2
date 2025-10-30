# Firebase Security Rules

This project includes separate Firebase rules for development and production environments.

## Files Overview

### Firestore Rules
- `firebase.rules.dev` - Wide open access for development/testing
- `firebase.rules.prod` - Secure authentication-based access for production

### Storage Rules  
- `storage.rules.dev` - Open access for development
- `storage.rules.prod` - Secure access with user/admin permissions

### Realtime Database Rules
- `database.rules.dev.json` - Open access for development
- `database.rules.prod.json` - Secure access for presence and chat systems

## Usage

### Development Deployment
```bash
pnpm deploy:rules:dev
```
This copies dev rules to active files and deploys them with `--force` flag.

### Production Deployment
```bash
pnpm deploy:rules:prod
```
This copies prod rules to active files and deploys them safely.

## Production Rules Summary

### Firestore (`firebase.rules.prod`)
- **User Profiles** (`/users/{userId}`): 
  - Read: Any authenticated user
  - Write: Only the user themselves
- **Tournaments** (`/tournaments/{tournamentId}`):
  - Read: Public access
  - Write: Authenticated users who are players OR admins
- **Leagues** (`/leagues/{leagueId}`):
  - Read: Public access  
  - Write: Admin users only

### Storage (`storage.rules.prod`)
- **Profile Avatars** (`/profiles/{userId}/avatar.jpg`):
  - Read: Public
  - Write: User themselves only
- **Clips** (`/clips/{userId}/{clipId}`):
  - Read: Public
  - Write: User themselves only
- **Admin Assets** (`/assets/{type}/{fileName}`):
  - Read: Public
  - Write: Admin users only

### Realtime Database (`database.rules.prod.json`)
- **Presence** (`/presence/{userId}`):
  - Read: Public
  - Write: User themselves only
- **Chat** (`/chat/{matchId}`):
  - Read: Public
  - Write: Any authenticated user

## Admin Claims

Production rules expect admin users to have a custom claim:
```json
{
  "admin": true
}
```

Set this in Firebase Auth custom claims for admin users.

## Setup Instructions

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init
   ```

4. **Update Project ID**:
   Replace `your-project-id` in package.json scripts with your actual Firebase project ID.

5. **Deploy Rules**:
   ```bash
   # For development
   pnpm deploy:rules:dev
   
   # For production
   pnpm deploy:rules:prod
   ```

## Testing Rules

Use Firebase Rules Playground in the Firebase Console to test your rules before deploying to production.

## Security Notes

- Development rules (`*.dev`) provide **NO SECURITY** - use only for local development
- Production rules require proper Firebase Authentication setup
- Admin functionality requires custom claims configuration
- Always test rules thoroughly before production deployment


