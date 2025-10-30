import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Run the seeding script
    const scriptPath = path.join(process.cwd(), 'scripts', 'seedDay.ts');
    const command = `npx ts-node ${scriptPath}`;
    
    execSync(command, { 
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Data seeded successfully' 
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}


