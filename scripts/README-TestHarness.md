# 🚀 CQG Master Test Harness

A comprehensive test harness for validating the complete CQG Tournament Flow from seeding to champion declaration.

## 🎯 What It Does

The master test harness performs a complete end-to-end test of the tournament system:

1. **🔄 Reset Firestore Emulator** - Wipes all collections clean
2. **🌱 Seed Test Data** - Creates 16 players and a tournament with bracket
3. **🏆 Run Dry Run Tournament** - Simulates complete tournament progression
4. **🧹 Cleanup** - Resets emulator (unless KEEP_DATA=true)

## 🚀 Quick Start

### Prerequisites
- Firestore Emulator running on port 8085
- Next.js Dev Server running (any port)

### Run Complete Test
```bash
npm run test:harness
```

### Run Test and Keep Data (for debugging)
```bash
npm run test:harness:keep
```

## 📋 Test Environment Checklist

Before running, ensure:

- ✅ **Firestore Emulator**: `firebase emulators:start --only firestore`
- ✅ **Next.js Dev Server**: `npm run dev`
- ✅ **Port 8085**: Available for Firestore emulator
- ✅ **Port 3000+**: Available for Next.js (auto-detects available port)

## 🧪 Test Sequence

### 1. Environment Check
- Verifies Firestore emulator connectivity
- Checks Next.js server accessibility
- Logs environment status

### 2. Reset Firestore Emulator
- Clears collections: `players`, `tournaments`, `leagues`, `matches`, `events`
- Removes all tournament subcollections
- Ensures clean slate for testing

### 3. Seed Test Data
- Creates 16 demo players (`player1` → `player16`)
- Creates tournament `tourney-test` with status `setup`
- Generates 8 Round 1 matches in random order
- Sets up complete 16-player bracket structure

### 4. Run Dry Run Tournament
- Simulates match submissions with realistic scores
- Tests auto-progression through all rounds
- Declares final champion
- Updates tournament status to `completed`

### 5. Cleanup
- **Default**: Resets Firestore to empty state
- **KEEP_DATA=true**: Preserves data for debugging

## 📊 Expected Output

```
🚀 CQG Master Test Harness Starting...

📋 Test Environment Checklist:
   - Firestore Emulator: 127.0.0.1:8085
   - Next.js Dev Server: http://localhost:3000
   - Keep Data: No
   - Tournament ID: tourney-test

[10:30:15] ✅ Environment Check - Environment verified
[10:30:16] ✅ Reset Firestore Emulator - All collections cleared
[10:30:17] ✅ Seed Test Data - 16 players, tournament, and bracket created
[10:30:18] ✅ Run Dry Run Tournament - Tournament completed with 15 matches
[10:30:19] ✅ Cleanup - Firestore emulator reset to empty state

🎉 Tournament Dry Run Test completed successfully ✅

📊 Test Results Summary:
   ✅ Environment Check
   ✅ Reset Firestore Emulator
   ✅ Seed Test Data
   ✅ Run Dry Run Tournament
   ✅ Cleanup

🚀 All tests passed! CQG Tournament Flow is ready for production.
```

## 🔧 Configuration

### Environment Variables

- `FIRESTORE_EMULATOR_HOST`: Firestore emulator host (default: 127.0.0.1:8085)
- `NEXTJS_PORT`: Next.js server port (default: 3000)
- `KEEP_DATA`: Keep test data after completion (default: false)

### Tournament Configuration

- **Tournament ID**: `tourney-test`
- **Players**: 16 (`player1` → `player16`)
- **Format**: Single elimination
- **Rounds**: 4 (16 → 8 → 4 → 2 → 1)
- **Total Matches**: 15

## 🐛 Debugging

### Keep Test Data
```bash
KEEP_DATA=true npm run test:harness
```

### Check Firestore State
```bash
# View tournament
curl "http://127.0.0.1:8085/v1/projects/demo-cqg/databases/(default)/documents/tournaments/tourney-test"

# View matches
curl "http://127.0.0.1:8085/v1/projects/demo-cqg/databases/(default)/documents/tournaments/tourney-test/matches"
```

### Manual UI Testing
1. Navigate to `http://localhost:3000/tournaments`
2. Look for "Dry Run Test Tournament" card
3. Click to view bracket
4. Submit match results manually

## 🚨 Troubleshooting

### Port Conflicts
- **Firestore Emulator**: Change port in `firebase.json`
- **Next.js**: Automatically finds available port

### Connection Issues
- Ensure emulators are running before test
- Check firewall settings
- Verify localhost accessibility

### Test Failures
- Check console output for specific error messages
- Verify Firestore rules allow test operations
- Ensure sufficient disk space for emulator

## 📈 Continuous Integration

The test harness is designed for CI/CD integration:

```yaml
# Example GitHub Actions
- name: Run CQG Test Harness
  run: |
    firebase emulators:start --only firestore &
    npm run dev &
    sleep 10
    npm run test:harness
```

## 🎯 Success Criteria

The test passes when:
- ✅ All 5 test steps complete successfully
- ✅ Tournament progresses through all 4 rounds
- ✅ Champion is declared
- ✅ Tournament status updates to `completed`
- ✅ All matches have realistic scores and winners
- ✅ Auto-progression creates subsequent rounds
- ✅ Final verification confirms tournament completion

---

**Ready to test? Run `npm run test:harness` and watch the magic happen! 🚀**


