import * as functions from 'firebase-functions';

/**
 * Simple HTTPS function that returns a greeting message
 */
export const helloWorld = functions.https.onRequest((request, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  response.json({
    message: "Hello CQG from Firebase Functions!",
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.path
  });
});


