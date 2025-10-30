import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function sanityCheckCompetitions() {
  let warningCount = 0;
  let totalStaleCount = 0;
  let staleWarnings = 0;
  let stalePurged = 0;
  let buyInEvents = 0;
  let freeEvents = 0;
  let tierExemptions: Record<string, number> = {};
  let tierDiscounts: Record<string, number> = {};

  // Fetch and Print Clans
  const clansSnapshot = await db.collection("clans").get();
  console.log("\n🏰 Clans:");
  if (clansSnapshot.empty) {
    console.log("❌ No clans found");
  } else {
    clansSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(
        `   🏰 ${data.name} | Captain: ${data.captainId} | Members: ${data.members.join(", ")} | W:${data.stats.wins} L:${data.stats.losses} TW:${data.stats.tournamentsWon}`
      );
    });
  }

  // Fetch Feature Toggles
  const togglesDoc = await db.collection("adminControls").doc("featureToggles").get();
  const toggles = togglesDoc.exists ? togglesDoc.data() || {} : {};
  console.log("\n⚙️ Feature Toggles:");
  for (const [key, value] of Object.entries(toggles)) {
    console.log(
      `   🔹 ${key}: enabled=${value.enabled}, scope=${value.scope?.join(",")}, retentionDays=${value.retentionDays}`
    );
  }

  // Show global toggle first
  if (toggles.buyIns?.enabled) {
    console.log("\n💰 Global Buy-Ins: ENABLED (per-event settings apply)");
  } else {
    console.log("\n💰 Global Buy-Ins: DISABLED (all events free entry)");
  }

  // Fetch memberships for Elite exemption check
  const membershipsSnapshot = await db.collection("memberships").get();
  const memberships: { [key: string]: any } = {};
  membershipsSnapshot.forEach(doc => {
    memberships[doc.id] = doc.data();
  });

  // Build list of all valid features across all membership tiers
  const allValidFeatures = new Set<string>();
  Object.values(memberships).forEach((tier: any) => {
    if (tier.features && Array.isArray(tier.features)) {
      tier.features.forEach((feature: string) => allValidFeatures.add(feature));
    }
  });

  // Check if stale detection is enabled
  if (toggles && toggles.staleCompetitions?.enabled === false) {
    console.log("\nℹ️ Stale competition detection disabled by feature toggle");
  }

  console.log("\n✅ Checking Leagues...\n");

  const leaguesSnapshot = await db.collection("leagues").get();
  let soloLeagues = 0;
  let clanLeagues = 0;
  let staleLeagues = 0;
  
  if (leaguesSnapshot.empty) {
    console.log("❌ No leagues found\n");
  } else {
    for (const doc of leaguesSnapshot.docs) {
      const data = doc.data();
      const participants = data.participants || [];
      const stats = data.stats || { matchesPlayed: 0 };
      console.log(
        `📊 League: ${data.name} (${data.type}) | Participants: ${participants.join(", ")}`
      );
      
      if (data.buyIn?.enabled) {
        if (!toggles.buyIns?.enabled) {
          console.log(`   💰 Buy-In: $${data.buyIn.amount} (${data.buyIn.currency})`);
          console.log("   ℹ️ Global buyIns disabled — event buy-in ignored");
        } else if (data.buyIn.amount <= 0) {
          console.log("   ⚠️ Warning: Buy-In enabled but invalid amount");
        } else {
          // Show different membership tier examples
          console.log(`   💰 Buy-In: $${data.buyIn.amount} (${data.buyIn.currency})`);
          
          // Example: Gamer tier (no discount)
          console.log(`   👤 Gamer: $${data.buyIn.amount} (no discount)`);
          
          // Example: Mamba tier (no discount)
          console.log(`   👤 Mamba: $${data.buyIn.amount} (no discount)`);
          
          // Example: The King tier (no discount)
          console.log(`   👤 The King: $${data.buyIn.amount} (no discount)`);
          
          // Example: CQG Elite tier (exempt)
          console.log(`   👤 CQG Elite: $0 (exempt)`);
        }
      } else {
        console.log("   💰 Buy-In: Free Entry");
      }
      
      // Track buy-in stats
      if (data.buyIn?.enabled && data.buyIn.amount > 0) {
        buyInEvents++;

        // Check all memberships
        for (const [tierId, tier] of Object.entries(memberships)) {
          if (tier.buyInOverride?.exempt) {
            tierExemptions[tier.name] = (tierExemptions[tier.name] || 0) + 1;
          } else if (tier.buyInOverride?.discountPercent > 0) {
            tierDiscounts[tier.name] = (tierDiscounts[tier.name] || 0) + 1;
          }
        }
      } else {
        freeEvents++;
      }
      
      // Show buyInOverride info if present
      if (data.buyIn?.buyInOverride) {
        const override = data.buyIn.buyInOverride;
        if (override.exempt) {
          console.log("   🆓 Override: Exempt from buy-in");
        }
        if (override.discountPercent > 0) {
          console.log(`   💸 Override: ${override.discountPercent}% discount`);
        }
      }

      // Show membership rules
      if (data.membershipRules) {
        console.log("   🎟 Membership Rules:");
        if (data.membershipRules.requiredFeatures?.length) {
          console.log(`      - Required to Join: ${data.membershipRules.requiredFeatures.join(", ")}`);
          // Validate required features
          data.membershipRules.requiredFeatures.forEach((rule: string) => {
            if (!allValidFeatures.has(rule)) {
              console.log(`   ⚠️ Warning: Membership rule "${rule}" not mapped in any tier`);
              warningCount++;
            }
          });
        } else {
          console.log("      - Required to Join: None");
        }
        if (data.membershipRules.hostRequired?.length) {
          console.log(`      - Required to Host: ${data.membershipRules.hostRequired.join(", ")}`);
          // Validate host required features
          data.membershipRules.hostRequired.forEach((rule: string) => {
            if (!allValidFeatures.has(rule)) {
              console.log(`   ⚠️ Warning: Membership rule "${rule}" not mapped in any tier`);
              warningCount++;
            }
          });
        } else {
          console.log("      - Required to Host: None");
        }
      }

      // Validate host against membership rules
      if (data.createdBy && data.membershipRules?.hostRequired?.length) {
        console.log("   👑 Validating Host...");
        const hostDoc = await db.collection("users").doc(data.createdBy).get();

        if (!hostDoc.exists) {
          console.log(`      ⚠️ Host ${data.createdBy} not found in /users`);
        } else {
          const host = hostDoc.data();
          const tierId = host?.membership?.tierId || "none";
          const tier = memberships[tierId];

          if (!tier) {
            console.log(`      ⚠️ Host assigned to invalid tier: ${tierId}`);
          } else {
            const canHost = tier.features?.includes("allFeatures") ||
                            data.membershipRules.hostRequired.some((f: string) => tier.features?.includes(f));

            if (canHost) {
              console.log(`      ✅ Host ${data.createdBy} (${tier.name}) passes host requirement`);
            } else {
              console.log(`      ❌ Host ${data.createdBy} (${tier.name}) does NOT meet host requirement`);
              warningCount++;
            }
          }
        }
      }

      // Validate participants against membership rules
      if (data.participants && data.membershipRules?.requiredFeatures?.length) {
        console.log("   🔎 Validating Participants...");
        for (const pid of data.participants) {
          const userDoc = await db.collection("users").doc(pid).get();
          if (!userDoc.exists) {
            console.log(`      ⚠️ Participant ${pid} not found in /users`);
            continue;
          }

          const user = userDoc.data();
          const tierId = user?.membership?.tierId || "none";
          const tier = memberships[tierId];

          if (!tier) {
            console.log(`      ⚠️ ${pid} assigned to invalid tier: ${tierId}`);
            continue;
          }

          // Check if user has at least one of the required features
          const hasAccess = tier.features?.includes("allFeatures") ||
                            data.membershipRules.requiredFeatures.some((f: string) => tier.features?.includes(f));

          if (hasAccess) {
            console.log(`      ✅ ${pid} (${tier.name}) passes join requirement`);
          } else {
            console.log(`      ❌ ${pid} (${tier.name}) does NOT meet join requirements`);
            warningCount++;
          }
        }
      }
      
      // Track counts
      if (data.type === "solo") soloLeagues++;
      if (data.type === "clan") clanLeagues++;
      
      // Check for stale competitions
      if (data.createdAt && toggles && toggles.staleCompetitions?.enabled !== false) {
        const createdAt = new Date(data.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const retentionDays = toggles.staleCompetitions?.retentionDays || 30;
        
        if (diffDays > retentionDays) {
          if (toggles.staleCompetitions?.autoPurge) {
            await doc.ref.delete();
            console.log(`   🗑️ Auto-purged stale competition: ${data.name}`);
            stalePurged++;
            totalStaleCount++;
          } else {
            console.log(`   ⚠️ Warning: ${data.name} is stale (${diffDays} days old, retention: ${retentionDays} days)`);
            warningCount++;
            staleLeagues++;
            staleWarnings++;
            totalStaleCount++;
          }
        }
      }
      
      // Check for no participants
      if (!data.participants || data.participants.length === 0) {
        console.log("   ⚠️ Warning: No participants in this competition");
        warningCount++;
        staleLeagues++;
      }
      
      // Check feature toggles against leagues
      if (data.type === "clan" && toggles && toggles.clanTournaments?.enabled === false) {
        console.log("   ⚠️ Warning: Clan Leagues disabled by feature toggle");
        warningCount++;
      }
    }
  }

  console.log("\n✅ Checking Tournaments...\n");

  const tournamentsSnapshot = await db.collection("tournaments").get();
  let soloTournaments = 0;
  let clanTournaments = 0;
  let staleTournaments = 0;
  let totalMatches = 0;
  
  if (tournamentsSnapshot.empty) {
    console.log("❌ No tournaments found\n");
  } else {
    for (const doc of tournamentsSnapshot.docs) {
      const data = doc.data();
      const participants = data.participants || [];
      console.log(
        `🏆 Tournament: ${data.name} (${data.type}) | Game: ${data.game} | Participants: ${participants.join(", ")}`
      );
      
      if (data.buyIn?.enabled) {
        if (!toggles.buyIns?.enabled) {
          console.log(`   💰 Buy-In: $${data.buyIn.amount} (${data.buyIn.currency})`);
          console.log("   ℹ️ Global buyIns disabled — event buy-in ignored");
        } else if (data.buyIn.amount <= 0) {
          console.log("   ⚠️ Warning: Buy-In enabled but invalid amount");
        } else {
          // Show different membership tier examples
          console.log(`   💰 Buy-In: $${data.buyIn.amount} (${data.buyIn.currency})`);
          
          // Example: Gamer tier (no discount)
          console.log(`   👤 Gamer: $${data.buyIn.amount} (no discount)`);
          
          // Example: Mamba tier (no discount)
          console.log(`   👤 Mamba: $${data.buyIn.amount} (no discount)`);
          
          // Example: The King tier (no discount)
          console.log(`   👤 The King: $${data.buyIn.amount} (no discount)`);
          
          // Example: CQG Elite tier (exempt)
          console.log(`   👤 CQG Elite: $0 (exempt)`);
        }
      } else {
        console.log("   💰 Buy-In: Free Entry");
      }
      
      // Track buy-in stats
      if (data.buyIn?.enabled && data.buyIn.amount > 0) {
        buyInEvents++;

        // Check all memberships
        for (const [tierId, tier] of Object.entries(memberships)) {
          if (tier.buyInOverride?.exempt) {
            tierExemptions[tier.name] = (tierExemptions[tier.name] || 0) + 1;
          } else if (tier.buyInOverride?.discountPercent > 0) {
            tierDiscounts[tier.name] = (tierDiscounts[tier.name] || 0) + 1;
          }
        }
      } else {
        freeEvents++;
      }
      
      // Show buyInOverride info if present
      if (data.buyIn?.buyInOverride) {
        const override = data.buyIn.buyInOverride;
        if (override.exempt) {
          console.log("   🆓 Override: Exempt from buy-in");
        }
        if (override.discountPercent > 0) {
          console.log(`   💸 Override: ${override.discountPercent}% discount`);
        }
      }

      // Show membership rules
      if (data.membershipRules) {
        console.log("   🎟 Membership Rules:");
        if (data.membershipRules.requiredFeatures?.length) {
          console.log(`      - Required to Join: ${data.membershipRules.requiredFeatures.join(", ")}`);
          // Validate required features
          data.membershipRules.requiredFeatures.forEach((rule: string) => {
            if (!allValidFeatures.has(rule)) {
              console.log(`   ⚠️ Warning: Membership rule "${rule}" not mapped in any tier`);
              warningCount++;
            }
          });
        } else {
          console.log("      - Required to Join: None");
        }
        if (data.membershipRules.hostRequired?.length) {
          console.log(`      - Required to Host: ${data.membershipRules.hostRequired.join(", ")}`);
          // Validate host required features
          data.membershipRules.hostRequired.forEach((rule: string) => {
            if (!allValidFeatures.has(rule)) {
              console.log(`   ⚠️ Warning: Membership rule "${rule}" not mapped in any tier`);
              warningCount++;
            }
          });
        } else {
          console.log("      - Required to Host: None");
        }
      }

      // Validate host against membership rules
      if (data.createdBy && data.membershipRules?.hostRequired?.length) {
        console.log("   👑 Validating Host...");
        const hostDoc = await db.collection("users").doc(data.createdBy).get();

        if (!hostDoc.exists) {
          console.log(`      ⚠️ Host ${data.createdBy} not found in /users`);
        } else {
          const host = hostDoc.data();
          const tierId = host?.membership?.tierId || "none";
          const tier = memberships[tierId];

          if (!tier) {
            console.log(`      ⚠️ Host assigned to invalid tier: ${tierId}`);
          } else {
            const canHost = tier.features?.includes("allFeatures") ||
                            data.membershipRules.hostRequired.some((f: string) => tier.features?.includes(f));

            if (canHost) {
              console.log(`      ✅ Host ${data.createdBy} (${tier.name}) passes host requirement`);
            } else {
              console.log(`      ❌ Host ${data.createdBy} (${tier.name}) does NOT meet host requirement`);
              warningCount++;
            }
          }
        }
      }

      // Validate participants against membership rules
      if (data.participants && data.membershipRules?.requiredFeatures?.length) {
        console.log("   🔎 Validating Participants...");
        for (const pid of data.participants) {
          const userDoc = await db.collection("users").doc(pid).get();
          if (!userDoc.exists) {
            console.log(`      ⚠️ Participant ${pid} not found in /users`);
            continue;
          }

          const user = userDoc.data();
          const tierId = user?.membership?.tierId || "none";
          const tier = memberships[tierId];

          if (!tier) {
            console.log(`      ⚠️ ${pid} assigned to invalid tier: ${tierId}`);
            continue;
          }

          // Check if user has at least one of the required features
          const hasAccess = tier.features?.includes("allFeatures") ||
                            data.membershipRules.requiredFeatures.some((f: string) => tier.features?.includes(f));

          if (hasAccess) {
            console.log(`      ✅ ${pid} (${tier.name}) passes join requirement`);
          } else {
            console.log(`      ❌ ${pid} (${tier.name}) does NOT meet join requirements`);
            warningCount++;
          }
        }
      }

      // Track counts
      if (data.type === "solo") soloTournaments++;
      if (data.type === "clan") clanTournaments++;

      // Check for stale competitions
      if (data.createdAt && toggles && toggles.staleCompetitions?.enabled !== false) {
        const createdAt = new Date(data.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const retentionDays = toggles.staleCompetitions?.retentionDays || 30;
        
        if (diffDays > retentionDays) {
          if (toggles.staleCompetitions?.autoPurge) {
            await doc.ref.delete();
            console.log(`   🗑️ Auto-purged stale competition: ${data.name}`);
            stalePurged++;
            totalStaleCount++;
          } else {
            console.log(`   ⚠️ Warning: ${data.name} is stale (${diffDays} days old, retention: ${retentionDays} days)`);
            warningCount++;
            staleTournaments++;
            staleWarnings++;
            totalStaleCount++;
          }
        }
      }
      
      // Check for no participants
      if (!data.participants || data.participants.length === 0) {
        console.log("   ⚠️ Warning: No participants in this competition");
        warningCount++;
        staleTournaments++;
      }

      // Check feature toggles against tournaments
      if (data.type === "clan" && toggles && toggles.clanTournaments?.enabled === false) {
        console.log("   ⚠️ Warning: Clan Tournaments disabled by feature toggle");
        warningCount++;
      }

      // Fetch matches
      const matchesSnapshot = await db.collection("tournaments").doc(doc.id).collection("matches").get();
      if (matchesSnapshot.empty) {
        console.log("   ↳ ❌ No matches found");
        console.log("   ⚠️ Warning: No matches found");
        warningCount++;
        staleTournaments++;
      } else {
        matchesSnapshot.forEach(matchDoc => {
          const match = matchDoc.data();
          const teams = match.teams || [];
          console.log(
            `   ↳ Match: ${match.format} | Winner: ${match.winnerTeamId}`
          );
        });
        totalMatches += matchesSnapshot.size;
      }
    }
  }

  console.log("\n📌 Summary");
  console.log(`   Total Competitions: ${leaguesSnapshot.size + tournamentsSnapshot.size}`);
  console.log(`   Clans: ${clansSnapshot.size}`);
  console.log(`   Leagues: ${leaguesSnapshot.size} (solo=${soloLeagues}, clan=${clanLeagues}) | stale=${staleLeagues}`);
  console.log(`   Tournaments: ${tournamentsSnapshot.size} (solo=${soloTournaments}, clan=${clanTournaments}) | stale=${staleTournaments}`);
  console.log(`   Matches: ${totalMatches}`);
  console.log(`   Stale Competitions: ${staleWarnings} flagged, ${stalePurged} auto-purged`);
  console.log(`   Membership Violations: ${warningCount}`);
  
  if (warningCount > 0) {
    console.log(`⚠️ Warnings detected: ${warningCount}`);
  }

  console.log("\n💰 Buy-In Summary");
  console.log(`   Global: ${toggles.buyIns?.enabled ? "Enabled" : "Disabled"}`);
  console.log(`   Events with Buy-Ins: ${buyInEvents}`);
  console.log(`   Events Free Entry: ${freeEvents}`);

  if (Object.keys(tierExemptions).length > 0) {
    console.log("   Tier Exemptions:");
    for (const [tier, count] of Object.entries(tierExemptions)) {
      console.log(`      💎 ${tier}: ${count} event(s)`);
    }
  }

  if (Object.keys(tierDiscounts).length > 0) {
    console.log("   Tier Discounts:");
    for (const [tier, count] of Object.entries(tierDiscounts)) {
      console.log(`      💰 ${tier}: discount applied in ${count} event(s)`);
    }
  }
  
  console.log("✅ Sanity check complete\n");
}

sanityCheckCompetitions();
