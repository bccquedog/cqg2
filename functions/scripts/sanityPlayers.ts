import * as admin from 'firebase-admin';
import { PlayerDoc } from '../src/types/players';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function sanityPlayers() {
  console.log('🔍 Checking players collection...\n');

  try {
    const snapshot = await db.collection('players').get();
    
    if (snapshot.empty) {
      console.log('❌ No players found');
      return;
    }

    console.log(`📊 Found ${snapshot.size} players\n`);

    const players: PlayerDoc[] = [];
    snapshot.forEach(doc => {
      players.push({ id: doc.id, ...doc.data() } as PlayerDoc);
    });

    // Group by status
    const byLiveStatus = players.reduce((acc, player) => {
      acc[player.status.live ? 'live' : 'offline'] = (acc[player.status.live ? 'live' : 'offline'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by platform
    const byPlatform = players.reduce((acc, player) => {
      if (player.status.platform) {
        acc[player.status.platform] = (acc[player.status.platform] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Count clips and streams
    const totalClips = players.reduce((sum, player) => sum + player.clips.length, 0);
    const totalStreams = players.reduce((sum, player) => sum + player.streams.length, 0);
    const totalLegacy = players.reduce((sum, player) => sum + player.legacy.length, 0);

    console.log('📈 Player Statistics:');
    console.log('By Live Status:', byLiveStatus);
    console.log('By Platform:', byPlatform);
    console.log(`Total Clips: ${totalClips}`);
    console.log(`Total Streams: ${totalStreams}`);
    console.log(`Total Legacy Entries: ${totalLegacy}`);
    console.log('');

    // Check each player
    for (const player of players) {
      console.log(`👤 ${player.profile.gamerTag} (${player.id})`);
      console.log(`   Bio: ${player.profile.bio || 'No bio'}`);
      console.log(`   Status: ${player.status.live ? '🔴 LIVE' : '⚫ Offline'}`);
      if (player.status.platform) {
        console.log(`   Platform: ${player.status.platform}`);
        console.log(`   Stream URL: ${player.status.streamUrl || 'N/A'}`);
      }
      if (player.status.currentEventId) {
        console.log(`   Current Event: ${player.status.currentEventId}`);
      }
      console.log(`   Clips: ${player.clips.length} (${player.clips.filter(c => c.featured).length} featured)`);
      console.log(`   Streams: ${player.streams.length} (${player.streams.filter(s => !s.endTime).length} active)`);
      console.log(`   Legacy: ${player.legacy.length} entries`);
      console.log('');
    }

    // Check for issues
    const issues: string[] = [];
    
    for (const player of players) {
      // Check for missing required fields
      if (!player.profile.gamerTag) issues.push(`${player.id}: Missing gamerTag`);
      if (!player.profile.avatarUrl) issues.push(`${player.id}: Missing avatarUrl`);
      
      // Check status consistency
      if (player.status.live && !player.status.platform) {
        issues.push(`${player.id}: Live but no platform specified`);
      }
      if (player.status.live && !player.status.streamUrl) {
        issues.push(`${player.id}: Live but no stream URL`);
      }
      
      // Check clips
      for (const clip of player.clips) {
        if (!clip.clipId) issues.push(`${player.id}: Clip missing clipId`);
        if (!clip.url) issues.push(`${player.id}: Clip missing url`);
        if (clip.surgeScore && clip.surgeScore < 0) {
          issues.push(`${player.id}: Clip has negative surgeScore`);
        }
      }
      
      // Check streams
      for (const stream of player.streams) {
        if (!stream.streamId) issues.push(`${player.id}: Stream missing streamId`);
        if (!stream.platform) issues.push(`${player.id}: Stream missing platform`);
        if (!stream.url) issues.push(`${player.id}: Stream missing url`);
        if (!stream.startTime) issues.push(`${player.id}: Stream missing startTime`);
        if (stream.endTime && stream.endTime < stream.startTime) {
          issues.push(`${player.id}: Stream endTime before startTime`);
        }
      }
      
      // Check legacy
      for (const legacy of player.legacy) {
        if (!legacy.season) issues.push(`${player.id}: Legacy missing season`);
        if (!legacy.type) issues.push(`${player.id}: Legacy missing type`);
        if (!legacy.description) issues.push(`${player.id}: Legacy missing description`);
        if (!legacy.date) issues.push(`${player.id}: Legacy missing date`);
      }
    }

    if (issues.length > 0) {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ All players look good!');
    }

  } catch (error) {
    console.error('❌ Error checking players:', error);
  }
}

sanityPlayers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error running sanity check:', err);
    process.exit(1);
  });


