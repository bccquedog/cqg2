import { db } from "./firebase";
import { TournamentReport, ReportComment, ReportStats } from "@/types/reports";
import { serverTimestamp } from "firebase/firestore";

// Lazy initialization of Firestore
function getDb() {
  return db;
}

// Create a new tournament report
export async function createTournamentReport(
  tournamentId: string,
  reportData: Omit<TournamentReport, "id" | "tournamentId" | "createdAt" | "updatedAt">
): Promise<string> {
  const reportsRef = getDb().collection("tournaments").doc(tournamentId).collection("reports");
  
  const report: Omit<TournamentReport, "id"> = {
    ...reportData,
    tournamentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await reportsRef.add(report);
  return docRef.id;
}

// Get a specific tournament report
export async function getTournamentReport(
  tournamentId: string,
  reportId: string
): Promise<TournamentReport | null> {
  const reportDoc = await getDb()
    .collection("tournaments")
    .doc(tournamentId)
    .collection("reports")
    .doc(reportId)
    .get();

  if (!reportDoc.exists) {
    return null;
  }

  return {
    id: reportDoc.id,
    ...reportDoc.data(),
  } as TournamentReport;
}

// Get all reports for a tournament
export async function getTournamentReports(
  tournamentId: string,
  filters?: {
    status?: string;
    type?: string;
    priority?: string;
    reportedBy?: string;
    isPublic?: boolean;
  }
): Promise<TournamentReport[]> {
  let query = getDb()
    .collection("tournaments")
    .doc(tournamentId)
    .collection("reports")
    .orderBy("createdAt", "desc");

  if (filters?.status) {
    query = query.where("status", "==", filters.status);
  }
  if (filters?.type) {
    query = query.where("type", "==", filters.type);
  }
  if (filters?.priority) {
    query = query.where("priority", "==", filters.priority);
  }
  if (filters?.reportedBy) {
    query = query.where("reportedBy", "==", filters.reportedBy);
  }
  if (filters?.isPublic !== undefined) {
    query = query.where("isPublic", "==", filters.isPublic);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TournamentReport[];
}

// Update a tournament report
export async function updateTournamentReport(
  tournamentId: string,
  reportId: string,
  updates: Partial<Omit<TournamentReport, "id" | "tournamentId" | "createdAt">>
): Promise<void> {
  const reportRef = getDb()
    .collection("tournaments")
    .doc(tournamentId)
    .collection("reports")
    .doc(reportId);

  await reportRef.update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// Delete a tournament report
export async function deleteTournamentReport(
  tournamentId: string,
  reportId: string
): Promise<void> {
  await getDb()
    .collection("tournaments")
    .doc(tournamentId)
    .collection("reports")
    .doc(reportId)
    .delete();
}

// Assign a report to an admin
export async function assignReport(
  tournamentId: string,
  reportId: string,
  adminId: string
): Promise<void> {
  await updateTournamentReport(tournamentId, reportId, {
    assignedTo: adminId,
    status: "reviewed",
  });
}

// Resolve a report
export async function resolveReport(
  tournamentId: string,
  reportId: string,
  adminId: string,
  resolution: string,
  resolutionNotes?: string
): Promise<void> {
  await updateTournamentReport(tournamentId, reportId, {
    status: "resolved",
    reviewedBy: adminId,
    reviewedAt: new Date().toISOString(),
    resolution,
    resolutionNotes,
  });
}

// Reject a report
export async function rejectReport(
  tournamentId: string,
  reportId: string,
  adminId: string,
  resolutionNotes: string
): Promise<void> {
  await updateTournamentReport(tournamentId, reportId, {
    status: "rejected",
    reviewedBy: adminId,
    reviewedAt: new Date().toISOString(),
    resolutionNotes,
  });
}

// Add a comment to a report
export async function addReportComment(
  tournamentId: string,
  reportId: string,
  commentData: Omit<ReportComment, "id" | "reportId" | "createdAt" | "updatedAt">
): Promise<string> {
  const commentsRef = getDb()
    .collection("tournaments")
    .doc(tournamentId)
    .collection("reports")
    .doc(reportId)
    .collection("comments");

  const comment: Omit<ReportComment, "id"> = {
    ...commentData,
    reportId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await commentsRef.add(comment);
  return docRef.id;
}

// Get comments for a report
export async function getReportComments(
  tournamentId: string,
  reportId: string
): Promise<ReportComment[]> {
  const snapshot = await getDb()
    .collection("tournaments")
    .doc(tournamentId)
    .collection("reports")
    .doc(reportId)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ReportComment[];
}

// Get report statistics for a tournament
export async function getTournamentReportStats(tournamentId: string): Promise<ReportStats> {
  const reportsSnapshot = await getDb()
    .collection("tournaments")
    .doc(tournamentId)
    .collection("reports")
    .get();

  const reports = reportsSnapshot.docs.map(doc => doc.data()) as TournamentReport[];
  
  const stats: ReportStats = {
    totalReports: reports.length,
    reportsByType: {},
    reportsByStatus: {},
    reportsByPriority: {},
    averageResolutionTime: 0,
    unresolvedReports: 0,
  };

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  reports.forEach(report => {
    // Count by type
    stats.reportsByType[report.type] = (stats.reportsByType[report.type] || 0) + 1;
    
    // Count by status
    stats.reportsByStatus[report.status] = (stats.reportsByStatus[report.status] || 0) + 1;
    
    // Count by priority
    stats.reportsByPriority[report.priority] = (stats.reportsByPriority[report.priority] || 0) + 1;
    
    // Count unresolved
    if (report.status !== "resolved" && report.status !== "rejected") {
      stats.unresolvedReports++;
    }
    
    // Calculate resolution time
    if (report.status === "resolved" && report.reviewedAt) {
      const created = new Date(report.createdAt);
      const resolved = new Date(report.reviewedAt);
      const resolutionTime = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      totalResolutionTime += resolutionTime;
      resolvedCount++;
    }
  });

  if (resolvedCount > 0) {
    stats.averageResolutionTime = totalResolutionTime / resolvedCount;
  }

  return stats;
}

// Get all reports across all tournaments (admin function)
export async function getAllReports(filters?: {
  status?: string;
  type?: string;
  priority?: string;
  tournamentId?: string;
}): Promise<TournamentReport[]> {
  let query = getDb().collectionGroup("reports").orderBy("createdAt", "desc");

  if (filters?.status) {
    query = query.where("status", "==", filters.status);
  }
  if (filters?.type) {
    query = query.where("type", "==", filters.type);
  }
  if (filters?.priority) {
    query = query.where("priority", "==", filters.priority);
  }
  if (filters?.tournamentId) {
    query = query.where("tournamentId", "==", filters.tournamentId);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TournamentReport[];
}


