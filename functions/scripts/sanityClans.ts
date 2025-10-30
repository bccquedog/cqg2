import * as admin from 'firebase-admin';
import { Clan } from '../src/types/clans';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function sanityClans() {
  console.log('🔍 Checking clans collection...\n');

  try {
    const snapshot = await db.collection('clans').get();
    
    if (snapshot.empty) {
      console.log('❌ No clans found');
      return;
    }

    console.log(`📊 Found ${snapshot.size} clans\n`);

    const clans: Clan[] = [];
    snapshot.forEach(doc => {
      clans.push({ id: doc.id, ...doc.data() } as Clan);
    });

    // Group by activity
    const onlineMembers = clans.reduce((sum, clan) => 
      sum + clan.roster.filter(m => m.status.online).length, 0);
    const totalMembers = clans.reduce((sum, clan) => sum + clan.roster.length, 0);

    // Group by streaming
    const streamingMembers = clans.reduce((sum, clan) => 
      sum + clan.roster.filter(m => m.status.activity === 'streaming').length, 0);

    // Count voice sessions
    const activeVoiceSessions = clans.reduce((sum, clan) => 
      sum + clan.voiceSessions.filter(s => s.status === 'active').length, 0);

    // Count active comms sessions
    const activeCommsSessions = clans.reduce((sum, clan) => 
      sum + clan.comms.activeSessions.length, 0);

    // Count total clips
    const totalClips = clans.reduce((sum, clan) => sum + clan.clips.length, 0);

    console.log('📈 Clan Statistics:');
    console.log(`Total Members: ${totalMembers} (${onlineMembers} online)`);
    console.log(`Streaming Members: ${streamingMembers}`);
    console.log(`Active Voice Sessions: ${activeVoiceSessions}`);
    console.log(`Active Comms Sessions: ${activeCommsSessions}`);
    console.log(`Total Clips: ${totalClips}`);
    console.log('');

    // Check each clan
    for (const clan of clans) {
      console.log(`🏰 ${clan.name} (${clan.id})`);
      console.log(`   Leader: ${clan.leaderId}`);
      console.log(`   Tagline: ${clan.tagline || 'No tagline'}`);
      console.log(`   Members: ${clan.roster.length} (${clan.roster.filter(m => m.status.online).length} online)`);
      console.log(`   Voice Sessions: ${clan.voiceSessions.length} (${clan.voiceSessions.filter(s => s.status === 'active').length} active)`);
      console.log(`   Active Comms: ${clan.comms.activeSessions.length}`);
      console.log(`   Last Session: ${clan.comms.lastSessionAt.toDate().toLocaleString()}`);
      console.log(`   Stats: ${clan.stats.wins}W-${clan.stats.losses}L | Surge: ${clan.stats.surgePower}`);
      console.log(`   Trophies: ${clan.stats.trophies.length} | Clips: ${clan.clips.length}`);
      
      // Show roster details
      console.log('   Roster:');
      for (const member of clan.roster) {
        const statusIcon = member.status.online ? '🟢' : '🔴';
        const activityIcon = {
          'idle': '😴',
          'in_match': '⚔️',
          'streaming': '📺',
          'in_voice': '🎤',
          'dnd': '🚫'
        }[member.status.activity] || '❓';
        
        console.log(`     ${statusIcon} ${member.playerId} (${member.role}) ${activityIcon} ${member.status.activity}`);
        if (member.status.streamUrl) {
          console.log(`       Stream: ${member.status.streamUrl}`);
        }
      }
      
      // Show voice sessions
      if (clan.voiceSessions.length > 0) {
        console.log('   Voice Sessions:');
        for (const session of clan.voiceSessions) {
          const statusIcon = session.status === 'active' ? '🟢' : '🔴';
          console.log(`     ${statusIcon} ${session.sessionId} (${session.type}) - ${session.participants.length} participants`);
          if (session.linkedEventId) {
            console.log(`       Linked Event: ${session.linkedEventId}`);
          }
        }
      }

      // Show active comms sessions
      if (clan.comms.activeSessions.length > 0) {
        console.log('   Active Comms:');
        for (const session of clan.comms.activeSessions) {
          console.log(`     🟢 ${session.sessionId} (${session.type}) - ${session.participants} participants`);
        }
      }
      console.log('');
    }

    // Check for issues
    const issues: string[] = [];
    
    for (const clan of clans) {
      // Check for missing required fields
      if (!clan.name) issues.push(`${clan.id}: Missing name`);
      if (!clan.logoUrl) issues.push(`${clan.id}: Missing logoUrl`);
      if (!clan.leaderId) issues.push(`${clan.id}: Missing leaderId`);
      
      // Check roster
      if (clan.roster.length === 0) {
        issues.push(`${clan.id}: Empty roster`);
      }
      
      // Check if leader is in roster
      const leaderInRoster = clan.roster.find(m => m.playerId === clan.leaderId);
      if (!leaderInRoster) {
        issues.push(`${clan.id}: Leader ${clan.leaderId} not in roster`);
      } else if (leaderInRoster.role !== 'leader') {
        issues.push(`${clan.id}: Leader ${clan.leaderId} has role ${leaderInRoster.role} instead of leader`);
      }
      
      // Check roster members
      for (const member of clan.roster) {
        if (!member.playerId) issues.push(`${clan.id}: Member missing playerId`);
        if (!member.role) issues.push(`${clan.id}: Member ${member.playerId} missing role`);
        if (!member.joinedAt) issues.push(`${clan.id}: Member ${member.playerId} missing joinedAt`);
        if (!member.status) issues.push(`${clan.id}: Member ${member.playerId} missing status`);
        
        if (member.status) {
          if (typeof member.status.online !== 'boolean') {
            issues.push(`${clan.id}: Member ${member.playerId} invalid online status`);
          }
          if (!member.status.activity) {
            issues.push(`${clan.id}: Member ${member.playerId} missing activity`);
          }
          if (member.status.activity === 'streaming' && !member.status.platform) {
            issues.push(`${clan.id}: Member ${member.playerId} streaming but no platform`);
          }
          if (member.status.activity === 'streaming' && !member.status.streamUrl) {
            issues.push(`${clan.id}: Member ${member.playerId} streaming but no streamUrl`);
          }
        }
      }
      
      // Check voice sessions
      for (const session of clan.voiceSessions) {
        if (!session.sessionId) issues.push(`${clan.id}: Voice session missing sessionId`);
        if (!session.type) issues.push(`${clan.id}: Voice session missing type`);
        if (!session.status) issues.push(`${clan.id}: Voice session missing status`);
        if (!session.participants) issues.push(`${clan.id}: Voice session missing participants`);
        if (!session.createdAt) issues.push(`${clan.id}: Voice session missing createdAt`);
        
        // Check if participants are in roster
        for (const participantId of session.participants) {
          const memberInRoster = clan.roster.find(m => m.playerId === participantId);
          if (!memberInRoster) {
            issues.push(`${clan.id}: Voice session participant ${participantId} not in roster`);
          }
        }
      }
      
      // Check stats
      if (typeof clan.stats.wins !== 'number') issues.push(`${clan.id}: Invalid wins stat`);
      if (typeof clan.stats.losses !== 'number') issues.push(`${clan.id}: Invalid losses stat`);
      if (typeof clan.stats.surgePower !== 'number') issues.push(`${clan.id}: Invalid surgePower stat`);
      if (!Array.isArray(clan.stats.trophies)) issues.push(`${clan.id}: Invalid trophies array`);
      if (!Array.isArray(clan.clips)) issues.push(`${clan.id}: Invalid clips array`);
      
      // Check comms
      if (!clan.comms) issues.push(`${clan.id}: Missing comms`);
      if (clan.comms) {
        if (!Array.isArray(clan.comms.activeSessions)) issues.push(`${clan.id}: Invalid activeSessions array`);
        if (!clan.comms.lastSessionAt) issues.push(`${clan.id}: Missing lastSessionAt`);
        
        // Check active sessions
        for (const session of clan.comms.activeSessions) {
          if (!session.sessionId) issues.push(`${clan.id}: Active session missing sessionId`);
          if (!session.type) issues.push(`${clan.id}: Active session missing type`);
          if (typeof session.participants !== 'number') issues.push(`${clan.id}: Active session invalid participants count`);
          if (!session.createdAt) issues.push(`${clan.id}: Active session missing createdAt`);
        }
      }
    }

    if (issues.length > 0) {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ All clans look good!');
    }

  } catch (error) {
    console.error('❌ Error checking clans:', error);
  }
}

sanityClans()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error running sanity check:', err);
    process.exit(1);
  });
