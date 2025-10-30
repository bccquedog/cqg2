import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const { keepData, stressTest } = await request.json();
    
    // Run the master test harness script
    const scriptPath = path.join(process.cwd(), 'scripts', 'masterTestHarness.ts');
    const command = `npx ts-node --project tsconfig.scripts.json ${scriptPath}`;
    
    // Set environment variables
    const env = {
      ...process.env,
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085',
      KEEP_DATA: keepData ? 'true' : 'false',
      STRESS_TEST: stressTest ? 'true' : 'false'
    };
    
    const output = execSync(command, { 
      stdio: 'pipe',
      cwd: process.cwd(),
      env
    });

    const outputString = output.toString();
    
    // Extract success/failure from output
    const isSuccess = outputString.includes('All tests passed!') || outputString.includes('Tournament Dry Run Test completed successfully');
    
    // Extract tournament IDs from output
    const tournamentIdMatches = outputString.match(/Tournament created: ([^\s\n]+)/g);
    const tournamentIds = tournamentIdMatches 
      ? tournamentIdMatches.map(match => match.replace('Tournament created: ', ''))
      : [];
    
    return NextResponse.json({ 
      success: isSuccess,
      message: isSuccess ? 'Master test harness completed successfully' : 'Master test harness completed with issues',
      output: outputString,
      tournamentIds: tournamentIds
    });
  } catch (error) {
    console.error('Test harness error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      output: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
