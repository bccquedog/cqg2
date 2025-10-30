import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Run the reset script (we'll create a simple one that clears collections)
    const resetScript = `
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'demo-cqg' });
const db = getFirestore(app);

async function clearCollections() {
  const collections = ['tournaments', 'players', 'matches'];
  
  for (const col of collections) {
    try {
      const snap = await db.collection(col).get();
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      if (!snap.empty) {
        await batch.commit();
        console.log(\`🗑️ Cleared \${col}\`);
      }
    } catch (error) {
      console.log(\`No \${col} collection found\`);
    }
  }
  
  // Clear tournament subcollections
  const tournamentsSnap = await db.collection('tournaments').get();
  for (const tournamentDoc of tournamentsSnap.docs) {
    const subcollections = ['matches', 'players', 'registrations'];
    for (const subcol of subcollections) {
      try {
        const subSnap = await db.collection('tournaments').doc(tournamentDoc.id).collection(subcol).get();
        const batch = db.batch();
        subSnap.forEach(doc => batch.delete(doc.ref));
        if (!subSnap.empty) {
          await batch.commit();
          console.log(\`🗑️ Cleared tournaments/\${tournamentDoc.id}/\${subcol}\`);
        }
      } catch (error) {
        // Subcollection might not exist
      }
    }
  }
  
  console.log('✅ Reset completed');
}

clearCollections().catch(console.error);
`;

    // Write temporary script and run it
    const tempScriptPath = path.join(process.cwd(), 'temp-reset.ts');
    require('fs').writeFileSync(tempScriptPath, resetScript);
    
    const command = `npx ts-node ${tempScriptPath}`;
    execSync(command, { 
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085' }
    });

    // Clean up temp file
    require('fs').unlinkSync(tempScriptPath);

    return NextResponse.json({ 
      success: true, 
      message: 'Data reset successfully' 
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}


