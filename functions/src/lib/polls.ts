import * as admin from "firebase-admin";
import { Poll, CreatePollRequest, VoteRequest, PollResults, PollStats } from "../types/polls";

export class PollService {
  private competitionId: string;
  private db: admin.firestore.Firestore;

  constructor(competitionId: string) {
    this.competitionId = competitionId;
    this.db = admin.firestore();
  }

  /**
   * Create a new poll
   */
  async createPoll(pollData: CreatePollRequest): Promise<string> {
    const pollRef = this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("polls")
      .doc();

    const poll: Omit<Poll, "id"> = {
      type: pollData.type,
      question: pollData.question,
      options: pollData.options,
      votes: {},
      createdAt: new Date(),
      closesAt: pollData.closesAt,
      isActive: true,
    };

    await pollRef.set(poll);
    return pollRef.id;
  }

  /**
   * Get all polls for a competition
   */
  async getPolls(): Promise<Poll[]> {
    const pollsSnap = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("polls")
      .orderBy("createdAt", "desc")
      .get();

    return pollsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      closesAt: doc.data().closesAt.toDate(),
    })) as Poll[];
  }

  /**
   * Get active polls (not closed and not expired)
   */
  async getActivePolls(): Promise<Poll[]> {
    const now = new Date();
    const pollsSnap = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("polls")
      .where("isActive", "==", true)
      .get();

    // Filter and sort in memory to avoid index requirements
    const polls = pollsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        closesAt: doc.data().closesAt.toDate(),
      })) as Poll[];

    return polls
      .filter(poll => poll.closesAt > now)
      .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime());
  }

  /**
   * Get a specific poll by ID
   */
  async getPoll(pollId: string): Promise<Poll | null> {
    const pollDoc = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("polls")
      .doc(pollId)
      .get();

    if (!pollDoc.exists) {
      return null;
    }

    const data = pollDoc.data()!;
    return {
      id: pollDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      closesAt: data.closesAt.toDate(),
    } as Poll;
  }

  /**
   * Vote on a poll
   */
  async voteOnPoll(voteData: VoteRequest): Promise<boolean> {
    const pollRef = this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("polls")
      .doc(voteData.pollId);

    return await this.db.runTransaction(async (transaction) => {
      const pollDoc = await transaction.get(pollRef);
      
      if (!pollDoc.exists) {
        throw new Error("Poll not found");
      }

      const poll = pollDoc.data()!;
      
      // Check if poll is still active
      if (!poll.isActive || poll.closesAt.toDate() < new Date()) {
        throw new Error("Poll is no longer active");
      }

      // Check if option is valid
      if (!poll.options.includes(voteData.selectedOption)) {
        throw new Error("Invalid option selected");
      }

      // Update the vote
      const updatedVotes = {
        ...poll.votes,
        [voteData.userId]: voteData.selectedOption,
      };

      transaction.update(pollRef, { votes: updatedVotes });
      return true;
    });
  }

  /**
   * Close a poll (mark as inactive)
   */
  async closePoll(pollId: string): Promise<boolean> {
    const pollRef = this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("polls")
      .doc(pollId);

    await pollRef.update({ isActive: false });
    return true;
  }

  /**
   * Calculate poll results
   */
  calculatePollResults(poll: Poll): PollResults {
    const totalVotes = Object.keys(poll.votes).length;
    const optionCounts: Record<string, number> = {};
    const optionPercentages: Record<string, number> = {};

    // Initialize counts
    poll.options.forEach((option) => {
      optionCounts[option] = 0;
    });

    // Count votes
    Object.values(poll.votes).forEach((vote) => {
      optionCounts[vote] = (optionCounts[vote] || 0) + 1;
    });

    // Calculate percentages
    poll.options.forEach((option) => {
      optionPercentages[option] = totalVotes > 0 
        ? Math.round((optionCounts[option] / totalVotes) * 100) 
        : 0;
    });

    return {
      totalVotes,
      optionCounts,
      optionPercentages,
    };
  }

  /**
   * Get poll statistics for a competition
   */
  async getPollStats(): Promise<PollStats> {
    const polls = await this.getPolls();
    
    const totalPolls = polls.length;
    const activePolls = polls.filter(p => p.isActive && p.closesAt > new Date()).length;
    const totalVotes = polls.reduce((sum, poll) => sum + Object.keys(poll.votes).length, 0);
    
    // Count poll types
    const typeCounts = polls.reduce((counts, poll) => {
      counts[poll.type] = (counts[poll.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostPopularType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b
    ) as "prediction" | "overunder";

    return {
      totalPolls,
      activePolls,
      totalVotes,
      mostPopularType,
    };
  }

  /**
   * Auto-close expired polls
   */
  async closeExpiredPolls(): Promise<number> {
    const now = new Date();
    const activePollsSnap = await this.db
      .collection("tournaments")
      .doc(this.competitionId)
      .collection("polls")
      .where("isActive", "==", true)
      .get();

    // Filter expired polls in memory to avoid index requirements
    const expiredPolls = activePollsSnap.docs.filter((doc) => {
      const closesAt = doc.data().closesAt.toDate();
      return closesAt <= now;
    });

    if (expiredPolls.length === 0) {
      return 0;
    }

    const batch = this.db.batch();
    expiredPolls.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
    return expiredPolls.length;
  }
}
