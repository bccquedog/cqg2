import * as admin from 'firebase-admin';
import { EventDoc } from '../src/types/events';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function sanityEvents() {
  console.log('🔍 Checking events collection...\n');

  try {
    const snapshot = await db.collection('events').get();
    
    if (snapshot.empty) {
      console.log('❌ No events found');
      return;
    }

    console.log(`📊 Found ${snapshot.size} events\n`);

    const events: EventDoc[] = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() } as EventDoc);
    });

    // Group by type
    const byType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const byStatus = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 Event Statistics:');
    console.log('By Type:', byType);
    console.log('By Status:', byStatus);
    console.log('');

    // Check each event
    for (const event of events) {
      console.log(`🎪 ${event.details.title} (${event.id})`);
      console.log(`   Type: ${event.type} | Status: ${event.status}`);
      console.log(`   Game: ${event.details.game || 'N/A'}`);
      console.log(`   Start: ${event.details.startTime.toDate().toLocaleString()}`);
      if (event.details.endTime) {
        console.log(`   End: ${event.details.endTime.toDate().toLocaleString()}`);
      }
      console.log(`   Streams: ${event.streams.length} (${event.streams.filter(s => s.status === 'live').length} live)`);
      console.log(`   Featured Streams: ${event.streams.filter(s => s.isFeatured).length}`);
      console.log(`   Surge Highlights: ${event.surgeHighlights.length}`);
      console.log(`   Ads: ${event.overlays.ads.length}`);
      console.log(`   Chat Enabled: ${event.chatIntegration.cqgChatEnabled}`);
      console.log(`   Created: ${event.audit.createdAt.toDate().toLocaleString()}`);
      console.log('');
    }

    // Check for issues
    const issues: string[] = [];
    
    for (const event of events) {
      // Check for missing required fields
      if (!event.details.title) issues.push(`${event.id}: Missing title`);
      if (!event.details.startTime) issues.push(`${event.id}: Missing startTime`);
      if (!event.details.organizerId) issues.push(`${event.id}: Missing organizerId`);
      
      // Check for invalid status transitions
      const validTransitions: Record<string, string[]> = {
        draft: ['pregame', 'archived'],
        pregame: ['live', 'archived'],
        live: ['completed', 'archived'],
        completed: ['archived'],
        archived: []
      };
      
      // Check stream status consistency
      for (const stream of event.streams) {
        if (!stream.streamId) issues.push(`${event.id}: Stream missing streamId`);
        if (!stream.platform) issues.push(`${event.id}: Stream missing platform`);
        if (!stream.url) issues.push(`${event.id}: Stream missing url`);
      }
      
      // Check surge highlights
      for (const highlight of event.surgeHighlights) {
        if (!highlight.clipId) issues.push(`${event.id}: Surge highlight missing clipId`);
        if (!highlight.playerId) issues.push(`${event.id}: Surge highlight missing playerId`);
        if (highlight.scoreBoost <= 0) issues.push(`${event.id}: Invalid scoreBoost`);
      }
    }

    if (issues.length > 0) {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ All events look good!');
    }

  } catch (error) {
    console.error('❌ Error checking events:', error);
  }
}

sanityEvents()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error running sanity check:', err);
    process.exit(1);
  });


