import * as admin from 'firebase-admin';
import { VoiceSession } from '../src/types/voiceSessions';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function sanityVoiceSessions() {
  console.log('🔍 Checking voice sessions collections...\n');

  try {
    // Get all clans
    const clansSnapshot = await db.collection('clans').get();
    
    if (clansSnapshot.empty) {
      console.log('❌ No clans found');
      return;
    }

    let totalSessions = 0;
    const typeCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const recordingCount = { active: 0, total: 0 };

    console.log(`📊 Checking voice sessions for ${clansSnapshot.size} clans\n`);

    for (const clanDoc of clansSnapshot.docs) {
      const clanId = clanDoc.id;
      const clanData = clanDoc.data();
      
      console.log(`🏰 Clan: ${clanData.name || clanId}`);
      
      // Get voice sessions for this clan
      const sessionsSnapshot = await db.collection('clans').doc(clanId)
        .collection('voiceSessions').get();
      
      if (sessionsSnapshot.empty) {
        console.log('   No voice sessions');
        continue;
      }

      const sessions: VoiceSession[] = [];
      sessionsSnapshot.forEach(doc => {
        sessions.push(doc.data() as VoiceSession);
      });

      totalSessions += sessions.length;
      console.log(`   🎤 ${sessions.length} voice sessions`);

      // Count types and statuses
      for (const session of sessions) {
        typeCounts[session.type] = (typeCounts[session.type] || 0) + 1;
        statusCounts[session.status] = (statusCounts[session.status] || 0) + 1;
        
        if (session.metadata.isRecording) {
          recordingCount.total++;
          if (session.status === 'active') {
            recordingCount.active++;
          }
        }
      }

      // Show individual sessions
      for (const session of sessions) {
        const timeAgo = Math.floor((Date.now() - session.createdAt.toDate().getTime()) / 1000 / 60);
        const activeParticipants = session.participants.filter(p => !p.leftAt).length;
        const totalParticipants = session.participants.length;
        
        console.log(`     ${session.sessionId}: ${session.type} (${session.status}) - ${timeAgo}m ago`);
        console.log(`       Participants: ${activeParticipants}/${totalParticipants} active`);
        console.log(`       Created by: ${session.createdBy}`);
        if (session.metadata.linkedEventId) {
          console.log(`       Linked Event: ${session.metadata.linkedEventId}`);
        }
        if (session.metadata.isRecording) {
          console.log(`       🔴 Recording`);
        }
      }
      console.log('');
    }

    console.log('📈 Overall Voice Session Statistics:');
    console.log(`Total Sessions: ${totalSessions}`);
    console.log('By Type:', typeCounts);
    console.log('By Status:', statusCounts);
    console.log(`Recording: ${recordingCount.active}/${recordingCount.total} active`);
    console.log('');

    // Check for issues
    const issues: string[] = [];
    
    for (const clanDoc of clansSnapshot.docs) {
      const clanId = clanDoc.id;
      const sessionsSnapshot = await db.collection('clans').doc(clanId)
        .collection('voiceSessions').get();
      
      for (const sessionDoc of sessionsSnapshot.docs) {
        const session = sessionDoc.data() as VoiceSession;
        const sessionId = sessionDoc.id;
        
        // Check for missing required fields
        if (!session.sessionId) issues.push(`${clanId}/${sessionId}: Missing sessionId`);
        if (!session.createdBy) issues.push(`${clanId}/${sessionId}: Missing createdBy`);
        if (!session.createdAt) issues.push(`${clanId}/${sessionId}: Missing createdAt`);
        if (!session.type) issues.push(`${clanId}/${sessionId}: Missing type`);
        if (!session.status) issues.push(`${clanId}/${sessionId}: Missing status`);
        if (!session.participants) issues.push(`${clanId}/${sessionId}: Missing participants`);
        if (!session.metadata) issues.push(`${clanId}/${sessionId}: Missing metadata`);
        
        // Check sessionId consistency
        if (session.sessionId !== sessionId) {
          issues.push(`${clanId}/${sessionId}: sessionId mismatch (${session.sessionId})`);
        }
        
        // Check participants
        for (const participant of session.participants) {
          if (!participant.playerId) {
            issues.push(`${clanId}/${sessionId}: Participant missing playerId`);
          }
          if (!participant.joinedAt) {
            issues.push(`${clanId}/${sessionId}: Participant missing joinedAt`);
          }
          if (participant.leftAt && participant.leftAt < participant.joinedAt) {
            issues.push(`${clanId}/${sessionId}: Participant leftAt before joinedAt`);
          }
        }
        
        // Check for stale active sessions (older than 24 hours)
        if (session.status === 'active') {
          const timeSinceCreated = Date.now() - session.createdAt.toDate().getTime();
          if (timeSinceCreated > 24 * 60 * 60 * 1000) { // 24 hours
            issues.push(`${clanId}/${sessionId}: Stale active session (${Math.floor(timeSinceCreated / 1000 / 60 / 60)}h old)`);
          }
        }
        
        // Check for active sessions with no participants
        if (session.status === 'active') {
          const activeParticipants = session.participants.filter(p => !p.leftAt);
          if (activeParticipants.length === 0) {
            issues.push(`${clanId}/${sessionId}: Active session with no participants`);
          }
        }
      }
    }

    if (issues.length > 0) {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ All voice sessions look good!');
    }

  } catch (error) {
    console.error('❌ Error checking voice sessions:', error);
  }
}

sanityVoiceSessions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error running sanity check:', err);
    process.exit(1);
  });


