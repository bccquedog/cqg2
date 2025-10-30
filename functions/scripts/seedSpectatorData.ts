import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

interface Alert {
  message: string;
  type: "score" | "winner" | "milestone" | "highlight" | "system";
  timestamp: admin.firestore.Timestamp;
  playerId?: string;
  matchId?: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface Spotlight {
  playerId: string;
  title: string;
  description: string;
  type: "weekly" | "live" | "featured" | "rising";
  stats?: {
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
  };
  achievements?: string[];
  startTime?: admin.firestore.Timestamp;
  endTime?: admin.firestore.Timestamp;
}

interface SpectatorStats {
  totalViewers: number;
  peakViewers: number;
  chatMessages: number;
  reactions: number;
  shares: number;
  lastUpdated: admin.firestore.Timestamp;
}

interface ChatMessage {
  user: string;
  message: string;
  timestamp: admin.firestore.Timestamp;
  type: "user" | "system";
}

async function seedSpectatorData() {
  console.log("🎬 Seeding Spectator Data...\n");

  try {
    const competitions = ["soloCupS1", "clanCupS1", "soloLeagueS1", "clanLeagueS1"];
    
    for (const competitionId of competitions) {
      console.log(`📊 Seeding data for ${competitionId}...`);

      // Seed Alerts
      const alerts: Alert[] = [
        {
          message: "⚡ 2 minutes left in Finals",
          type: "system",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)), // 2 minutes ago
          priority: "high"
        },
        {
          message: "🏆 Player1 wins the match with 95 points!",
          type: "winner",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)), // 5 minutes ago
          playerId: "user1",
          matchId: "match1",
          priority: "critical"
        },
        {
          message: "🎯 Player2 scores 87 points!",
          type: "score",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 1000)), // 8 minutes ago
          playerId: "user2",
          matchId: "match1",
          priority: "medium"
        },
        {
          message: "⭐ Player3 reaches 10 win streak!",
          type: "milestone",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 1000)), // 12 minutes ago
          playerId: "user3",
          priority: "high"
        },
        {
          message: "🔥 Amazing comeback by Player4!",
          type: "highlight",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)), // 15 minutes ago
          playerId: "user4",
          matchId: "match2",
          priority: "medium"
        },
        {
          message: "📢 Tournament starts in 30 minutes",
          type: "system",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 1000)), // 20 minutes ago
          priority: "low"
        },
        {
          message: "🏅 Player5 wins Round 1!",
          type: "winner",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 25 * 60 * 1000)), // 25 minutes ago
          playerId: "user5",
          matchId: "match3",
          priority: "high"
        },
        {
          message: "💥 Epic battle in the semifinals!",
          type: "highlight",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)), // 30 minutes ago
          priority: "medium"
        }
      ];

      // Add alerts to Firestore
      for (const alert of alerts) {
        await db.collection("tournaments").doc(competitionId).collection("alerts").add(alert);
      }

      // Seed Spotlight
      const spotlightData: Spotlight = {
        playerId: "user123",
        title: "Player of the Week",
        description: "Dominated with 10 wins straight in COD league",
        type: "weekly",
        stats: {
          wins: 15,
          losses: 2,
          winRate: 88,
          currentStreak: 10
        },
        achievements: [
          "Win Streak Master",
          "COD Champion",
          "Rising Star"
        ],
        startTime: admin.firestore.Timestamp.fromDate(new Date()),
        endTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days from now
      };

      await db.collection("tournaments").doc(competitionId).collection("spotlights").doc("current").set(spotlightData);

      // Seed Spectator Stats
      const statsData: SpectatorStats = {
        totalViewers: Math.floor(Math.random() * 500) + 100, // 100-600 viewers
        peakViewers: Math.floor(Math.random() * 800) + 200, // 200-1000 peak
        chatMessages: Math.floor(Math.random() * 1000) + 200, // 200-1200 messages
        reactions: Math.floor(Math.random() * 500) + 100, // 100-600 reactions
        shares: Math.floor(Math.random() * 100) + 20, // 20-120 shares
        lastUpdated: admin.firestore.Timestamp.now()
      };

      await db.collection("tournaments").doc(competitionId).collection("spectatorStats").doc("live").set(statsData);

      // Seed Chat Messages
      const chatMessages: ChatMessage[] = [
        {
          user: "Spectator1",
          message: "This is amazing! 🔥",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 1000)), // 1 minute ago
          type: "user"
        },
        {
          user: "System",
          message: "Welcome to the live stream!",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)), // 2 minutes ago
          type: "system"
        },
        {
          user: "Fan2",
          message: "Player1 is on fire! 🚀",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 1000)), // 3 minutes ago
          type: "user"
        },
        {
          user: "Viewer3",
          message: "What a comeback!",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 1000)), // 4 minutes ago
          type: "user"
        },
        {
          user: "System",
          message: "Match starting in 30 seconds",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)), // 5 minutes ago
          type: "system"
        },
        {
          user: "Supporter4",
          message: "Let's go Player2! 💪",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 1000)), // 6 minutes ago
          type: "user"
        },
        {
          user: "Fan5",
          message: "This tournament is incredible!",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 60 * 1000)), // 7 minutes ago
          type: "user"
        },
        {
          user: "System",
          message: "Live stream quality: HD",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 1000)), // 8 minutes ago
          type: "system"
        },
        {
          user: "Viewer6",
          message: "Player3's strategy is brilliant!",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 9 * 60 * 1000)), // 9 minutes ago
          type: "user"
        },
        {
          user: "Fan7",
          message: "Can't wait for the finals! 🏆",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)), // 10 minutes ago
          type: "user"
        }
      ];

      // Add chat messages to Firestore
      for (const message of chatMessages) {
        await db.collection("tournaments").doc(competitionId).collection("chat").add(message);
      }

      console.log(`✅ Seeded ${alerts.length} alerts, 1 spotlight, 1 stats doc, and ${chatMessages.length} chat messages for ${competitionId}`);
    }

    console.log("\n🎬 Spectator Data Seeding Complete!");
    console.log("📊 Data includes:");
    console.log("   • Live alerts with different priorities and types");
    console.log("   • Player spotlights with stats and achievements");
    console.log("   • Real-time spectator statistics");
    console.log("   • Live chat messages from users and system");
    console.log("\n🔗 Test the SpectatorOverlay component at:");
    console.log("   • /test-spectator-overlay");
    console.log("   • /spectate/soloCupS1");

  } catch (error) {
    console.error("❌ Error seeding spectator data:", error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  seedSpectatorData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedSpectatorData };


