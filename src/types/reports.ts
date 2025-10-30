export interface TournamentReport {
  id: string;
  tournamentId: string;
  title: string;
  description: string;
  type: "match" | "round" | "tournament" | "incident" | "performance";
  status: "draft" | "submitted" | "reviewed" | "resolved" | "rejected";
  priority: "low" | "medium" | "high" | "critical";
  
  // Report content
  content: {
    summary: string;
    details: string;
    evidence?: string[]; // URLs to screenshots, videos, etc.
    affectedPlayers?: string[]; // User IDs
    matchId?: string; // If report is about a specific match
    roundId?: string; // If report is about a specific round
  };
  
  // Reporting user
  reportedBy: string; // User ID
  reportedAt: string; // ISO timestamp
  
  // Admin handling
  assignedTo?: string; // Admin user ID
  reviewedBy?: string; // Admin user ID
  reviewedAt?: string; // ISO timestamp
  resolution?: string; // Admin's resolution notes
  resolutionNotes?: string; // Additional admin notes
  
  // Metadata
  tags?: string[]; // For categorization
  isPublic: boolean; // Whether report is visible to other users
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface ReportComment {
  id: string;
  reportId: string;
  authorId: string; // User ID
  content: string;
  isAdmin: boolean; // Whether comment is from admin
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface ReportStats {
  totalReports: number;
  reportsByType: Record<string, number>;
  reportsByStatus: Record<string, number>;
  reportsByPriority: Record<string, number>;
  averageResolutionTime: number; // in hours
  unresolvedReports: number;
}


