import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, addDoc, collection, query, where, getDocs, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "./firebaseClient";

export interface FeatureToggle {
  feature: string;
  enabled: boolean;
  updatedAt: Timestamp;
}

export interface FeatureToggleConfig {
  enabled: boolean;
  updatedAt: Timestamp;
  lastUpdatedBy: string; // admin userId or email
  scope: string[]; // e.g., ["all"] or ["elite", "mamba"]
  retentionDays: number; // days to retain history logs
  schedule?: {
    enableAt?: Timestamp;
    disableAt?: Timestamp;
  };
}

export interface FeatureTogglesDocument {
  [key: string]: FeatureToggleConfig;
}

// ==========================
// In-memory cache
// ==========================
let cachedFeatureToggles: FeatureTogglesDocument | null = null;
let cacheFetchedAtMs: number | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// ==========================
// Helper functions
// ==========================

/**
 * Auto-prunes old history logs based on retention policy
 * @param featureKey - The feature toggle key
 * @param retentionDays - Number of days to retain logs
 * @returns Promise<void>
 */
async function pruneHistoryLogs(featureKey: string, retentionDays: number): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const historyRef = collection(db, "adminControls", "featureToggles", "history");
    const q = query(
      historyRef,
      where("feature", "==", featureKey),
      where("updatedAt", "<", cutoffTimestamp),
      orderBy("updatedAt", "asc")
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`Pruned ${deletePromises.length} old history logs for feature '${featureKey}'`);
    }
  } catch (error) {
    console.error(`Error pruning history logs for feature '${featureKey}':`, error);
    // Don't throw - pruning is not critical for the main operation
  }
}

/**
 * Checks if clan tournaments feature is enabled
 * @returns Promise<boolean> - true if clan tournaments are enabled, false otherwise
 */
export async function isClanTournamentsEnabled(): Promise<boolean> {
  try {
    const featureToggleRef = doc(db, "adminControls", "featureToggles");
    const featureToggleSnap = await getDoc(featureToggleRef);

    if (featureToggleSnap.exists()) {
      const data = featureToggleSnap.data();
      return data?.clanTournaments?.enabled === true;
    } else {
      // If the feature toggle doesn't exist, default to false (disabled)
      console.warn("Clan tournaments feature toggle not found, defaulting to disabled");
      return false;
    }
  } catch (error) {
    console.error("Error checking clan tournaments feature toggle:", error);
    // On error, default to false (disabled) for safety
    return false;
  }
}

/**
 * Gets all feature toggles from Firestore
 * @returns Promise<FeatureTogglesDocument | null> - All feature toggles or null if not found
 */
export async function getFeatureToggles(): Promise<FeatureTogglesDocument | null> {
  try {
    const now = Date.now();
    if (cachedFeatureToggles && cacheFetchedAtMs && now - cacheFetchedAtMs < CACHE_TTL_MS) {
      return cachedFeatureToggles;
    }

    const featureToggleRef = doc(db, "adminControls", "featureToggles");
    const featureToggleSnap = await getDoc(featureToggleRef);

    if (featureToggleSnap.exists()) {
      const data = featureToggleSnap.data() as FeatureTogglesDocument;
      cachedFeatureToggles = data;
      cacheFetchedAtMs = now;
      return data;
    } else {
      console.warn("Feature toggles document not found");
      cachedFeatureToggles = null;
      cacheFetchedAtMs = now;
      return null;
    }
  } catch (error) {
    console.error("Error getting feature toggles:", error);
    return null;
  }
}

/**
 * Generic function to check any feature toggle
 * @param key - The key of the feature to check (e.g., "clanTournaments", "autoTournaments")
 * @returns Promise<boolean> - true if feature is enabled, false otherwise
 */
export async function isFeatureEnabled(key: string, tier?: string): Promise<boolean> {
  try {
    const toggles = await getFeatureToggles();
    if (!toggles) {
      // Fail-safe default: disabled
      return false;
    }

    const cfg = toggles[key];
    if (!cfg) {
      return false;
    }

    // Check base enabled flag first
    if (cfg.enabled !== true) {
      return false;
    }

    // Check schedule windows (client clock; acceptable for gating UI + writes)
    const nowMs = Date.now();
    const enableAtMs = cfg.schedule?.enableAt ? cfg.schedule.enableAt.toMillis() : undefined;
    const disableAtMs = cfg.schedule?.disableAt ? cfg.schedule.disableAt.toMillis() : undefined;

    if (enableAtMs !== undefined && nowMs < enableAtMs) {
      return false;
    }
    if (disableAtMs !== undefined && nowMs >= disableAtMs) {
      return false;
    }

    // Check scope against provided tier
    const scope = cfg.scope || [];
    if (scope.includes("all")) {
      return true;
    }
    if (tier && scope.includes(tier)) {
      return true;
    }

    // Tier not allowed or no 'all' scope
    return false;
  } catch (error) {
    console.error(`Error checking feature toggle '${key}':`, error);
    return false;
  }
}

/**
 * Updates a specific feature toggle with audit tracking
 * @param key - The key of the feature toggle to update (e.g., "clanTournaments", "autoTournaments")
 * @param enabled - Whether the feature should be enabled or disabled
 * @param adminId - The ID or email of the admin making the change
 * @returns Promise<void>
 */
export async function updateFeatureToggle(
  key: string,
  enabled: boolean,
  adminId: string,
  scope?: string[],
  schedule?: { enableAt?: Date | Timestamp; disableAt?: Date | Timestamp },
  retentionDays?: number
): Promise<void> {
  try {
    const featureToggleRef = doc(db, "adminControls", "featureToggles");

    // Normalize schedule values to Firestore serverTimestamp or Timestamp if provided as Date
    const normalizedSchedule: { enableAt?: Timestamp; disableAt?: Timestamp } = {};
    if (schedule?.enableAt) {
      normalizedSchedule.enableAt = schedule.enableAt instanceof Timestamp
        ? schedule.enableAt
        : Timestamp.fromDate(schedule.enableAt as Date);
    }
    if (schedule?.disableAt) {
      normalizedSchedule.disableAt = schedule.disableAt instanceof Timestamp
        ? schedule.disableAt
        : Timestamp.fromDate(schedule.disableAt as Date);
    }

    const updateData: Record<string, unknown> = {
      [`${key}.enabled`]: enabled,
      [`${key}.updatedAt`]: serverTimestamp(),
      [`${key}.lastUpdatedBy`]: adminId,
    };

    if (scope) {
      updateData[`${key}.scope`] = scope;
    }
    if (schedule && (normalizedSchedule.enableAt || normalizedSchedule.disableAt)) {
      updateData[`${key}.schedule`] = normalizedSchedule;
    }
    if (retentionDays !== undefined) {
      updateData[`${key}.retentionDays`] = retentionDays;
    }

    await updateDoc(featureToggleRef, updateData);

    // Get current retention days for pruning (use provided value or fetch from current toggle)
    let currentRetentionDays = retentionDays;
    if (currentRetentionDays === undefined) {
      const togglesBefore = cachedFeatureToggles ?? (await getFeatureToggles());
      currentRetentionDays = togglesBefore?.[key]?.retentionDays ?? 30; // default fallback
    }

    // Write history log
    // Determine old/new for history best-effort using cache/toggles
    const togglesBefore = cachedFeatureToggles ?? (await getFeatureToggles());
    const oldValue = togglesBefore?.[key]?.enabled ?? null;

    const historyEntry: Record<string, unknown> = {
      feature: key,
      oldValue,
      newValue: enabled,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    };

    // Include retentionDays in history if it was updated
    if (retentionDays !== undefined) {
      historyEntry.retentionDays = retentionDays;
    }

    await addDoc(collection(db, "adminControls", "featureToggles", "history"), historyEntry);

    // Auto-prune old history logs based on retention policy
    await pruneHistoryLogs(key, currentRetentionDays);

    // Update cache
    if (!cachedFeatureToggles) {
      cachedFeatureToggles = {} as FeatureTogglesDocument;
    }
    const prev = cachedFeatureToggles[key] as FeatureToggleConfig | undefined;
    cachedFeatureToggles[key] = {
      enabled,
      updatedAt: prev?.updatedAt ?? Timestamp.now(),
      lastUpdatedBy: adminId,
      scope: scope ?? prev?.scope ?? ["all"],
      retentionDays: retentionDays ?? prev?.retentionDays ?? 30,
      schedule: (schedule && (normalizedSchedule.enableAt || normalizedSchedule.disableAt)) ? normalizedSchedule : prev?.schedule,
    } as FeatureToggleConfig;
    cacheFetchedAtMs = Date.now();

    console.log(`Feature toggle '${key}' updated to ${enabled} by ${adminId}${retentionDays !== undefined ? ` with retentionDays=${retentionDays}` : ''}`);
  } catch (error) {
    console.error(`Error updating feature toggle '${key}':`, error);
    throw new Error(`Failed to update feature toggle '${key}'`);
  }
}
