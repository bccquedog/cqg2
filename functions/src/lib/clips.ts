import * as admin from "firebase-admin";
import { Clip, CreateClipRequest, VoteClipRequest, ClipStats, ClipFilters } from "../types/clips";

export class ClipService {
  private competitionId: string;
  private db: admin.firestore.Firestore;

  constructor(competitionId: string) {
    this.competitionId = competitionId;
    this.db = admin.firestore();
  }

  /**
   * Create a new clip
   */
  async createClip(clipData: CreateClipRequest): Promise<string> {
    const clipRef = this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .doc();

    const clip: Omit<Clip, "id"> = {
      playerId: clipData.playerId,
      url: clipData.url,
      embedUrl: clipData.embedUrl,
      source: clipData.source,
      description: clipData.description,
      surgeScore: clipData.surgeScore || 0,
      votes: {},
      createdAt: new Date(),
      thumbnailUrl: clipData.thumbnailUrl,
      duration: clipData.duration,
      tags: clipData.tags || [],
      isHighlight: false,
    };

    await clipRef.set(clip);
    return clipRef.id;
  }

  /**
   * Get all clips for a competition
   */
  async getClips(filters?: ClipFilters): Promise<Clip[]> {
    // Get all clips first, then filter in memory to avoid composite index requirements
    const clipsSnap = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .orderBy("createdAt", "desc")
      .get();

    let clips = clipsSnap.docs.map((doc) => {
      const data = doc.data();
      // Handle both Firestore timestamps and ISO strings
      let createdAt: Date;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      };
    }) as Clip[];

    // Apply all filters in memory
    if (filters?.playerId) {
      clips = clips.filter(clip => clip.playerId === filters.playerId);
    }
    if (filters?.source) {
      clips = clips.filter(clip => clip.source === filters.source);
    }
    if (filters?.isHighlight !== undefined) {
      clips = clips.filter(clip => clip.isHighlight === filters.isHighlight);
    }
    if (filters?.minSurgeScore) {
      clips = clips.filter(clip => clip.surgeScore >= filters.minSurgeScore!);
    }
    if (filters?.tags && filters.tags.length > 0) {
      clips = clips.filter(clip => 
        clip.tags && filters.tags!.some(tag => clip.tags!.includes(tag))
      );
    }

    return clips;
  }

  /**
   * Get clips sorted by surge score (most popular first)
   */
  async getTopClips(limit: number = 10): Promise<Clip[]> {
    const clipsSnap = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .orderBy("surgeScore", "desc")
      .limit(limit)
      .get();

    return clipsSnap.docs.map((doc) => {
      const data = doc.data();
      // Handle both Firestore timestamps and ISO strings
      let createdAt: Date;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      };
    }) as Clip[];
  }

  /**
   * Get clips by a specific player
   */
  async getClipsByPlayer(playerId: string): Promise<Clip[]> {
    // Get all clips first, then filter in memory to avoid composite index requirements
    const clipsSnap = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .get();

    const clips = clipsSnap.docs.map((doc) => {
      const data = doc.data();
      // Handle both Firestore timestamps and ISO strings
      let createdAt: Date;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      };
    }) as Clip[];

    // Filter by player and sort by creation date
    return clips
      .filter(clip => clip.playerId === playerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get a specific clip by ID
   */
  async getClip(clipId: string): Promise<Clip | null> {
    const clipDoc = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .doc(clipId)
      .get();

    if (!clipDoc.exists) {
      return null;
    }

    const data = clipDoc.data()!;
    // Handle both Firestore timestamps and ISO strings
    let createdAt: Date;
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      createdAt = data.createdAt.toDate();
    } else if (data.createdAt) {
      createdAt = new Date(data.createdAt);
    } else {
      createdAt = new Date();
    }
    
    return {
      id: clipDoc.id,
      ...data,
      createdAt,
    } as Clip;
  }

  /**
   * Vote on a clip
   */
  async voteOnClip(voteData: VoteClipRequest): Promise<boolean> {
    const clipRef = this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .doc(voteData.clipId);

    return await this.db.runTransaction(async (transaction) => {
      const clipDoc = await transaction.get(clipRef);
      
      if (!clipDoc.exists) {
        throw new Error("Clip not found");
      }

      const clip = clipDoc.data()!;
      
      // Update the vote
      const updatedVotes = {
        ...clip.votes,
        [voteData.userId]: voteData.vote,
      };

      // Calculate new surge score based on votes
      const voteCounts = Object.values(updatedVotes);
      const upvotes = voteCounts.filter(vote => vote === true).length;
      const downvotes = voteCounts.filter(vote => vote === false).length;
      const newSurgeScore = Math.max(0, Math.min(100, upvotes * 10 - downvotes * 5));

      transaction.update(clipRef, { 
        votes: updatedVotes,
        surgeScore: newSurgeScore
      });
      return true;
    });
  }

  /**
   * Mark a clip as highlight
   */
  async markAsHighlight(clipId: string, isHighlight: boolean = true): Promise<boolean> {
    const clipRef = this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .doc(clipId);

    await clipRef.update({ isHighlight });
    return true;
  }

  /**
   * Delete a clip
   */
  async deleteClip(clipId: string): Promise<boolean> {
    const clipRef = this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .doc(clipId);

    await clipRef.delete();
    return true;
  }

  /**
   * Calculate clip statistics
   */
  async getClipStats(): Promise<ClipStats> {
    const clips = await this.getClips();
    
    const totalClips = clips.length;
    const totalVotes = clips.reduce((sum, clip) => sum + Object.keys(clip.votes || {}).length, 0);
    const averageSurgeScore = totalClips > 0 
      ? clips.reduce((sum, clip) => sum + clip.surgeScore, 0) / totalClips 
      : 0;
    
    // Count sources
    const sourceCounts = clips.reduce((counts, clip) => {
      counts[clip.source] = (counts[clip.source] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const topSource = Object.keys(sourceCounts).reduce((a, b) => 
      sourceCounts[a] > sourceCounts[b] ? a : b
    ) as "twitch" | "youtube" | "kick" | "manual";

    // Count player activity
    const playerCounts = clips.reduce((counts, clip) => {
      counts[clip.playerId] = (counts[clip.playerId] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostActivePlayer = Object.keys(playerCounts).reduce((a, b) => 
      playerCounts[a] > playerCounts[b] ? a : b
    ) || "None";

    return {
      totalClips,
      totalVotes,
      averageSurgeScore: Math.round(averageSurgeScore * 100) / 100,
      topSource,
      mostActivePlayer,
    };
  }

  /**
   * Get clips with high surge scores (trending)
   */
  async getTrendingClips(minSurgeScore: number = 80): Promise<Clip[]> {
    // Get all clips first, then filter and sort in memory to avoid composite index requirements
    const clipsSnap = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("clips")
      .get();

    const clips = clipsSnap.docs.map((doc) => {
      const data = doc.data();
      // Handle both Firestore timestamps and ISO strings
      let createdAt: Date;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      };
    }) as Clip[];

    // Filter and sort in memory
    return clips
      .filter(clip => clip.surgeScore >= minSurgeScore)
      .sort((a, b) => b.surgeScore - a.surgeScore);
  }

  /**
   * Search clips by description or tags
   */
  async searchClips(searchTerm: string): Promise<Clip[]> {
    const clips = await this.getClips();
    
    const searchLower = searchTerm.toLowerCase();
    return clips.filter(clip => 
      clip.description.toLowerCase().includes(searchLower) ||
      (clip.tags && clip.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }
}
