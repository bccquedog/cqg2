import { TournamentReport, ReportStats } from "@/types/reports";

// Generate a unique report ID
export function generateReportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `report_${timestamp}_${random}`;
}

// Validate report data
export function validateReportData(data: Partial<TournamentReport>): string[] {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Description is required");
  }

  if (!data.type || !["match", "round", "tournament", "incident", "performance"].includes(data.type)) {
    errors.push("Valid type is required (match, round, tournament, incident, performance)");
  }

  if (!data.priority || !["low", "medium", "high", "critical"].includes(data.priority)) {
    errors.push("Valid priority is required (low, medium, high, critical)");
  }

  if (!data.reportedBy || data.reportedBy.trim().length === 0) {
    errors.push("Reported by user ID is required");
  }

  if (data.content) {
    if (!data.content.summary || data.content.summary.trim().length === 0) {
      errors.push("Content summary is required");
    }

    if (!data.content.details || data.content.details.trim().length === 0) {
      errors.push("Content details are required");
    }

    if (data.content.evidence && !Array.isArray(data.content.evidence)) {
      errors.push("Evidence must be an array of URLs");
    }

    if (data.content.affectedPlayers && !Array.isArray(data.content.affectedPlayers)) {
      errors.push("Affected players must be an array of user IDs");
    }
  }

  return errors;
}

// Format report priority for display
export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: "🟢 Low",
    medium: "🟡 Medium", 
    high: "🟠 High",
    critical: "🔴 Critical"
  };
  return priorityMap[priority] || priority;
}

// Format report status for display
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "📝 Draft",
    submitted: "📤 Submitted",
    reviewed: "👀 Reviewed",
    resolved: "✅ Resolved",
    rejected: "❌ Rejected"
  };
  return statusMap[status] || status;
}

// Format report type for display
export function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    match: "🎮 Match",
    round: "🏆 Round",
    tournament: "🏅 Tournament",
    incident: "⚠️ Incident",
    performance: "📊 Performance"
  };
  return typeMap[type] || type;
}

// Calculate time since report was created
export function getTimeSinceCreated(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

// Calculate resolution time
export function getResolutionTime(report: TournamentReport): string | null {
  if (report.status !== "resolved" || !report.reviewedAt) {
    return null;
  }
  
  const created = new Date(report.createdAt);
  const resolved = new Date(report.reviewedAt);
  const diffMs = resolved.getTime() - created.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return `${diffDays}d`;
  }
}

// Filter reports by criteria
export function filterReports(
  reports: TournamentReport[],
  filters: {
    status?: string;
    type?: string;
    priority?: string;
    reportedBy?: string;
    assignedTo?: string;
    isPublic?: boolean;
    searchTerm?: string;
  }
): TournamentReport[] {
  return reports.filter(report => {
    if (filters.status && report.status !== filters.status) return false;
    if (filters.type && report.type !== filters.type) return false;
    if (filters.priority && report.priority !== filters.priority) return false;
    if (filters.reportedBy && report.reportedBy !== filters.reportedBy) return false;
    if (filters.assignedTo && report.assignedTo !== filters.assignedTo) return false;
    if (filters.isPublic !== undefined && report.isPublic !== filters.isPublic) return false;
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesTitle = report.title.toLowerCase().includes(searchLower);
      const matchesDescription = report.description.toLowerCase().includes(searchLower);
      const matchesSummary = report.content.summary.toLowerCase().includes(searchLower);
      const matchesDetails = report.content.details.toLowerCase().includes(searchLower);
      
      if (!matchesTitle && !matchesDescription && !matchesSummary && !matchesDetails) {
        return false;
      }
    }
    
    return true;
  });
}

// Sort reports by various criteria
export function sortReports(
  reports: TournamentReport[],
  sortBy: "createdAt" | "updatedAt" | "priority" | "status" | "title",
  order: "asc" | "desc" = "desc"
): TournamentReport[] {
  return [...reports].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "updatedAt":
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      case "priority":
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        break;
      case "status":
        const statusOrder = { draft: 1, submitted: 2, reviewed: 3, resolved: 4, rejected: 5 };
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
        break;
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (order === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
}

// Generate report statistics summary
export function generateReportSummary(stats: ReportStats): string {
  const summary = [
    `📊 Total Reports: ${stats.totalReports}`,
    `⚠️ Unresolved: ${stats.unresolvedReports}`,
    `⏱️ Avg Resolution: ${stats.averageResolutionTime.toFixed(1)}h`,
  ];
  
  if (stats.reportsByPriority.critical > 0) {
    summary.push(`🔴 Critical: ${stats.reportsByPriority.critical}`);
  }
  
  if (stats.reportsByPriority.high > 0) {
    summary.push(`🟠 High: ${stats.reportsByPriority.high}`);
  }
  
  return summary.join(" • ");
}

// Check if user can edit report
export function canEditReport(report: TournamentReport, userId: string, isAdmin: boolean = false): boolean {
  // Admins can always edit
  if (isAdmin) return true;
  
  // Users can only edit their own draft reports
  return report.reportedBy === userId && report.status === "draft";
}

// Check if user can delete report
export function canDeleteReport(report: TournamentReport, userId: string, isAdmin: boolean = false): boolean {
  // Admins can always delete
  if (isAdmin) return true;
  
  // Users can only delete their own draft reports
  return report.reportedBy === userId && report.status === "draft";
}

// Check if user can comment on report
export function canCommentOnReport(report: TournamentReport, userId: string, isAdmin: boolean = false): boolean {
  // Admins can always comment
  if (isAdmin) return true;
  
  // Users can comment on their own reports or public reports
  return report.reportedBy === userId || report.isPublic;
}

// Get report priority color for UI
export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    low: "text-green-600 bg-green-100",
    medium: "text-yellow-600 bg-yellow-100",
    high: "text-orange-600 bg-orange-100",
    critical: "text-red-600 bg-red-100"
  };
  return colorMap[priority] || "text-gray-600 bg-gray-100";
}

// Get report status color for UI
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: "text-gray-600 bg-gray-100",
    submitted: "text-blue-600 bg-blue-100",
    reviewed: "text-purple-600 bg-purple-100",
    resolved: "text-green-600 bg-green-100",
    rejected: "text-red-600 bg-red-100"
  };
  return colorMap[status] || "text-gray-600 bg-gray-100";
}


