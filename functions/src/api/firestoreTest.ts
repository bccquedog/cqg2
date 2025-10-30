import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * HTTPS function that tests Firestore read/write operations
 */
export const firestoreTest = functions.https.onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    // Generate a unique document ID
    const docId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Test data to write
    const testData = {
      createdAt: new Date().toISOString(),
      message: "CQG Firestore Test",
      randomValue: Math.floor(Math.random() * 1000)
    };

    // Write to Firestore
    await db.collection('tests').doc(docId).set(testData);

    // Read it back
    const docSnapshot = await db.collection('tests').doc(docId).get();
    
    if (!docSnapshot.exists) {
      throw new Error('Document was not found after writing');
    }

    const retrievedData = docSnapshot.data();

    // Return success response
    response.json({
      success: true,
      message: "Firestore test completed successfully",
      writtenData: testData,
      retrievedData: retrievedData,
      docId: docId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Firestore test error:', error);
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});


