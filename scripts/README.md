# CQG Seeding Script

This script populates Firestore with comprehensive test data for CQG platform testing.

## 🚀 Quick Start

```bash
# Run the seeding script
pnpm seed

# Clean up test data when done
pnpm reset
```

## 📋 What Gets Created

### 👥 Users (3 total)
- **testUser1**: "CQG Tester" - Gamer tier, basic stats
- **testUser2**: "Tournament Master" - King tier, tournament experience  
- **testUser3**: "League Champion" - Elite tier, league champion

### 🏆 Tournaments (2 total)
- **testTournament1**: "CQG Test Tournament" - Call of Duty, single elimination
- **testTournament2**: "CQG Championship Series" - FIFA 24, double elimination with matches

### 🏅 Leagues (2 total)
- **testLeague1**: "CQG Test League" - NBA 2K, Season 1
- **testLeague2**: "CQG Pro Circuit" - Rocket League, Winter 2024 with standings

## 🔧 Setup Requirements

### 1. Firebase Admin SDK Credentials
The script uses Firebase Admin SDK and requires authentication:

**Option A: Service Account Key (Recommended for local development)**
```bash
# Download service account JSON from Firebase Console
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

**Option B: Google Cloud Default Credentials**
```bash
# If running on Google Cloud or with gcloud CLI
gcloud auth application-default login
```

### 2. Environment Variables
```bash
# Set your Firebase project ID
export FIREBASE_PROJECT_ID="your-actual-project-id"
```

## 📊 Test Data Details

### User Profiles
Each user includes:
- Username, email, avatar placeholder
- Tier (Gamer, Mamba, King, Elite)
- Win/loss record, tournament/league wins
- Timestamps for creation and updates

### Tournament Data
- Multiple tournament types (single_elim, double_elim)
- Player registrations with join timestamps
- Match results with scores and verification status
- Stream URLs and tournament settings

### League Data
- Multiple seasons and game types
- Team registrations with join timestamps
- Standings with points and records
- Tier-based access control

## 🧪 Testing with Readiness Test

After running the seed script, test all systems:

1. **Visit**: `http://localhost:3001/readiness-test`
2. **Use these test IDs**:
   - **User ID**: `testUser1`, `testUser2`, `testUser3`
   - **Tournament ID**: `testTournament1`, `testTournament2`
   - **League ID**: `testLeague1`, `testLeague2`

3. **Run checks** to verify all systems are working

## 🔄 Reseeding & Cleanup

The script will overwrite existing documents with the same IDs. To reseed:

```bash
# Just run again
pnpm seed
```

### Cleanup Test Data
When you're done testing, clean up all test data:

```bash
# Remove all seeded test documents
pnpm reset
```

This will safely delete:
- All test users (testUser1, testUser2, testUser3)
- All test tournaments (testTournament1, testTournament2)  
- All test leagues (testLeague1, testLeague2)

**Safe to run multiple times** - won't error if documents don't exist.

## 🚨 Troubleshooting

### Common Issues

**"Permission denied" errors**
- Ensure service account has Firestore write permissions
- Check `GOOGLE_APPLICATION_CREDENTIALS` path

**"Project not found" errors**
- Verify `FIREBASE_PROJECT_ID` environment variable
- Check Firebase Console for correct project ID

**TypeScript compilation errors**
- Ensure `ts-node` and `@types/node` are installed
- Check import paths in the script

### Debug Mode
Add logging to see what's happening:

```bash
# Run with verbose logging
DEBUG=* pnpm seed
```

## 📁 File Structure

```
scripts/
├── seed.ts          # Main seeding script
├── reset.ts         # Cleanup test data
├── setup-env.sh     # Environment setup helper
├── README.md        # This documentation
└── (future scripts)
```

## 🔗 Related Pages

- **Readiness Test**: `/readiness-test` - Verify all systems
- **Profile Test**: `/profile-test` - Test user profiles
- **Events Test**: `/events-test` - Test tournaments/leagues
- **Presence Test**: `/presence-test` - Test real-time presence

## 🎯 Next Steps

After successful seeding:
1. ✅ Test all systems with readiness test
2. 🔒 Deploy production rules when ready
3. 🚀 Go live with CQG platform!

### Complete Testing Workflow
```bash
# 1. Set up environment
./scripts/setup-env.sh

# 2. Seed test data
pnpm seed

# 3. Test systems
# Visit: http://localhost:3001/readiness-test

# 4. Clean up when done
pnpm reset
```
