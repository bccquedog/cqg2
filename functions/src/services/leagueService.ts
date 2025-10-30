import * as admin from "firebase-admin";
import { League, LeagueStatus } from "../types/leagues";

export class LeagueService {
  private db: admin.firestore.Firestore;
  private leaguesRef: admin.firestore.CollectionReference;

  constructor() {
    this.db = admin.firestore();
    this.leaguesRef = this.db.collection("leagues");
  }

  private static readonly allowedStatusTransitions: Record<string, string[]> = {
    draft: ["registration"],
    registration: ["checkin", "archived"],
    checkin: ["active", "archived"],
    active: ["playoffs", "archived"],
    playoffs: ["completed", "archived"],
    completed: ["archived"],
    archived: [],
  };

  async createLeague(league: Omit<League, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const now = new Date().toISOString();
    const docRef = await this.leaguesRef.add({
      ...league,
      createdAt: now,
      updatedAt: now,
    } as any);
    return docRef.id;
  }

  async getLeague(id: string): Promise<League | null> {
    const doc = await this.leaguesRef.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as League;
  }

  async updateLeague(id: string, updates: Partial<League>): Promise<void> {
    if (updates.status) {
      const cur = await this.leaguesRef.doc(id).get();
      if (!cur.exists) throw new Error("League not found");
      const current = cur.data() as League;
      const fromStatus = (current.status as unknown as string) || "draft";
      const toStatus = updates.status as unknown as string;
      const allowed = LeagueService.allowedStatusTransitions[fromStatus] || [];
      if (!allowed.includes(toStatus)) {
        throw new Error(`Invalid league status transition: ${fromStatus} → ${toStatus}`);
      }
    }

    await this.leaguesRef.doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    } as any);
  }

  // Helpers mirroring lifecycle
  async openRegistration(id: string): Promise<void> {
    await this.updateLeague(id, { status: "registration" as LeagueStatus });
  }

  async startCheckIn(id: string): Promise<void> {
    await this.updateLeague(id, { status: "checkin" as LeagueStatus });
  }

  async activate(id: string): Promise<void> {
    await this.updateLeague(id, { status: "active" as LeagueStatus });
  }

  async startPlayoffs(id: string): Promise<void> {
    await this.updateLeague(id, { status: "playoffs" as LeagueStatus });
  }

  async complete(id: string): Promise<void> {
    await this.updateLeague(id, { status: "completed" as LeagueStatus });
  }

  async archive(id: string): Promise<void> {
    await this.updateLeague(id, { status: "archived" as LeagueStatus, archived: true });
  }
}




