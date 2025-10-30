import * as admin from 'firebase-admin';
import { EventPresence } from '../src/types/presence';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function sanityPresence() {
  console.log('🔍 Checking event presence collections...\n');

  try {
    // Get all events
    const eventsSnapshot = await db.collection('events').get();
    
    if (eventsSnapshot.empty) {
      console.log('❌ No events found');
      return;
    }

    let totalPresence = 0;
    const statusCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};

    console.log(`📊 Checking presence for ${eventsSnapshot.size} events\n`);

    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data();
      
      console.log(`🎪 Event: ${eventData.details?.title || eventId}`);
      
      // Get presence for this event
      const presenceSnapshot = await db.collection('events').doc(eventId)
        .collection('presence').get();
      
      if (presenceSnapshot.empty) {
        console.log('   No presence data');
        continue;
      }

      const presence: EventPresence[] = [];
      presenceSnapshot.forEach(doc => {
        presence.push(doc.data() as EventPresence);
      });

      totalPresence += presence.length;
      console.log(`   👥 ${presence.length} players present`);

      // Count statuses and platforms
      for (const p of presence) {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        if (p.platform) {
          platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
        }
      }

      // Show individual presence
      for (const p of presence) {
        const timeAgo = Math.floor((Date.now() - p.lastUpdated.toDate().getTime()) / 1000 / 60);
        console.log(`     ${p.playerId}: ${p.status}${p.platform ? ` (${p.platform})` : ''} - ${timeAgo}m ago`);
        if (p.streamUrl) {
          console.log(`       Stream: ${p.streamUrl}`);
        }
      }
      console.log('');
    }

    console.log('📈 Overall Presence Statistics:');
    console.log(`Total Presence Records: ${totalPresence}`);
    console.log('By Status:', statusCounts);
    console.log('By Platform:', platformCounts);
    console.log('');

    // Check for issues
    const issues: string[] = [];
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      const presenceSnapshot = await db.collection('events').doc(eventId)
        .collection('presence').get();
      
      for (const presenceDoc of presenceSnapshot.docs) {
        const presence = presenceDoc.data() as EventPresence;
        const playerId = presenceDoc.id;
        
        // Check for missing required fields
        if (!presence.playerId) issues.push(`${eventId}/${playerId}: Missing playerId`);
        if (!presence.status) issues.push(`${eventId}/${playerId}: Missing status`);
        if (!presence.lastUpdated) issues.push(`${eventId}/${playerId}: Missing lastUpdated`);
        
        // Check playerId consistency
        if (presence.playerId !== playerId) {
          issues.push(`${eventId}/${playerId}: playerId mismatch (${presence.playerId})`);
        }
        
        // Check status-specific requirements
        if (presence.status === 'streaming') {
          if (!presence.platform) {
            issues.push(`${eventId}/${playerId}: Streaming but no platform`);
          }
          if (!presence.streamUrl) {
            issues.push(`${eventId}/${playerId}: Streaming but no streamUrl`);
          }
        }
        
        // Check for stale presence (older than 1 hour)
        const timeSinceUpdate = Date.now() - presence.lastUpdated.toDate().getTime();
        if (timeSinceUpdate > 60 * 60 * 1000) { // 1 hour
          issues.push(`${eventId}/${playerId}: Stale presence (${Math.floor(timeSinceUpdate / 1000 / 60)}m old)`);
        }
      }
    }

    if (issues.length > 0) {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ All presence data looks good!');
    }

  } catch (error) {
    console.error('❌ Error checking presence:', error);
  }
}

sanityPresence()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error running sanity check:', err);
    process.exit(1);
  });


