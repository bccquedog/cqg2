import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This will use GOOGLE_APPLICATION_CREDENTIALS environment variable
// or default credentials if running on Google Cloud
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  });
}

const db = admin.firestore();

// Test data IDs to clean up
const testDataIds = {
  users: [
    'testUser1',
    'testUser2', 
    'testUser3'
  ],
  tournaments: [
    'testTournament1',
    'testTournament2'
  ],
  leagues: [
    'testLeague1',
    'testLeague2'
  ]
};

// Delete documents from a collection
async function deleteCollectionDocs(collectionName: string, docIds: string[]) {
  console.log(`🗑️  Cleaning up ${collectionName}...`);
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const docId of docIds) {
    try {
      const docRef = db.collection(collectionName).doc(docId);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        await docRef.delete();
        console.log(`  ✅ Deleted ${collectionName}/${docId}`);
        deletedCount++;
      } else {
        console.log(`  ⚪ ${collectionName}/${docId} doesn't exist (skipped)`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to delete ${collectionName}/${docId}:`, error);
      errorCount++;
    }
  }
  
  return { deletedCount, errorCount };
}

// Main reset function
async function resetTestData() {
  console.log('🧹 Starting CQG test data cleanup...\n');
  
  try {
    // Clean up users
    const usersResult = await deleteCollectionDocs('users', testDataIds.users);
    console.log('');
    
    // Clean up tournaments
    const tournamentsResult = await deleteCollectionDocs('tournaments', testDataIds.tournaments);
    console.log('');
    
    // Clean up leagues
    const leaguesResult = await deleteCollectionDocs('leagues', testDataIds.leagues);
    console.log('');
    
    // Summary
    const totalDeleted = usersResult.deletedCount + tournamentsResult.deletedCount + leaguesResult.deletedCount;
    const totalErrors = usersResult.errorCount + tournamentsResult.errorCount + leaguesResult.errorCount;
    
    console.log('📊 Cleanup Summary:');
    console.log(`  👥 Users: ${usersResult.deletedCount} deleted, ${usersResult.errorCount} errors`);
    console.log(`  🏆 Tournaments: ${tournamentsResult.deletedCount} deleted, ${tournamentsResult.errorCount} errors`);
    console.log(`  🏅 Leagues: ${leaguesResult.deletedCount} deleted, ${leaguesResult.errorCount} errors`);
    console.log(`  📈 Total: ${totalDeleted} documents deleted, ${totalErrors} errors`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 ✅ Reset complete! All test data cleaned up successfully.');
    } else {
      console.log('\n⚠️  Reset completed with some errors. Check the logs above.');
    }
    
  } catch (error) {
    console.error('💥 Reset failed:', error);
    process.exit(1);
  }
}

// Run the reset
if (require.main === module) {
  resetTestData().catch(console.error);
}


