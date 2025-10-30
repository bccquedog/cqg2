"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import Link from "next/link";
import SwipeableCard from "@/components/SwipeableCard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/enhanced-card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/enhanced-badge";
import { StatusIcons, ProgressIcons } from "@/components/ui/tournament-icons";
import { 
  Trophy, 
  Users, 
  Gamepad2, 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  Timer,
  Database,
  BarChart3
} from "lucide-react";

// Helper to format dates (handles both Firestore Timestamp and JS Date)
function formatStartDate(timestamp: unknown): string {
  if (!timestamp) return "TBD";
  
  const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

// Enhanced Tournament Card Component with Professional Design
function TournamentCard({ tournament: t }: { tournament: Record<string, unknown> }) {
  const [liveMatchCount, setLiveMatchCount] = useState(0);
  const [, setLoading] = useState(true);
  const [registrationsCount, setRegistrationsCount] = useState<number>(0);

  // Real-time matches listener to determine glow intensity
  useEffect(() => {
    const matchesQuery = query(
      collection(db, "tournaments", t.id, "matches"),
      orderBy("roundNumber", "asc")
    );
    const unsub = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => doc.data());
      const liveCount = matchesData.filter((m: Record<string, unknown>) => m.status === "Live" || m.status === "live").length;
      setLiveMatchCount(liveCount);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [t.id]);

  // Real-time registration count
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tournaments", t.id, "registrations"), (snapshot) => {
      setRegistrationsCount(snapshot.size);
    });
    return () => unsub();
  }, [t.id]);

  // Get status-specific styling
  const getStatusVariant = () => {
    if (t.status === "completed") return "completed";
    if (t.status === "live" && liveMatchCount > 0) return "live";
    if (t.status === "upcoming") return "upcoming";
    return "default";
  };

  const getStatusIcon = () => {
    if (t.status === "live" && liveMatchCount > 0) return <StatusIcons.live />;
    if (t.status === "upcoming") return <StatusIcons.upcoming />;
    if (t.status === "completed") return <StatusIcons.completed />;
    return <StatusIcons.pending />;
  };

  return (
    <SwipeableCard
      onSwipeLeft={() => {
        // Could add bookmark or favorite functionality
        console.log('Swiped left on tournament:', t.id);
      }}
      onSwipeRight={() => {
        // Could add share functionality
        console.log('Swiped right on tournament:', t.id);
      }}
      className="gpu-accelerated"
    >
    <Link href={`/tournaments/${t.id}`}>
        <Card 
          variant="elevated" 
          size="lg" 
          className={`cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-0 ${getStatusVariant() === 'live' ? 'ring-2 ring-error-200 animate-pulse' : ''}`}
        >
        <CardHeader spacing="normal">
          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            <Badge 
              variant={getStatusVariant() as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" | "live" | "upcoming" | "completed"}
              size="lg"
              icon={getStatusIcon()}
              pulse={t.status === "live" && liveMatchCount > 0}
            >
              <span className="hidden sm:inline">
                {t.status === "live" && liveMatchCount > 0 && `LIVE NOW – ${liveMatchCount} ${liveMatchCount === 1 ? "Match" : "Matches"}`}
                {t.status === "completed" && "COMPLETED"}
                {t.status === "upcoming" && "UPCOMING"}
                {t.status === "pending" && "PENDING"}
              </span>
              <span className="sm:hidden">
                {t.status === "live" && liveMatchCount > 0 && `${liveMatchCount}`}
                {t.status === "completed" && "✓"}
                {t.status === "upcoming" && "⏰"}
                {t.status === "pending" && <Timer className="w-4 h-4" />}
              </span>
            </Badge>
          </div>

          <div className="pr-20">
            <CardTitle level="h2" className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3 leading-tight">
              {t.name || t.id}
            </CardTitle>
            <CardDescription variant="muted" className="text-sm mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary-600" />
                  <span className="font-medium">{registrationsCount}{t.maxPlayers ? ` / ${t.maxPlayers}` : ""} Players</span>
                </span>
                <span className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-secondary-600" />
                  <span className="font-medium">{t.game || "Game TBD"}</span>
                </span>
              </div>
            </CardDescription>
          </div>
          </CardHeader>
          <CardContent spacing="normal">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                  <span className="font-medium">Start Date:</span>
                  <span>{formatStartDate(t.startDate)}</span>
                </div>
                {t.buyIn && t.buyIn > 0 && (
                  <Badge variant="success" size="lg">
                    ${(t.buyIn / 100).toFixed(2)} Entry
                  </Badge>
                )}
              </div>
          
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-600" />
                    Progress
                  </span>
                  <span className="text-sm font-bold text-primary-600">{t.progress || 0}%</span>
                </div>
                <div className="bg-neutral-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 ease-out ${
                      t.status === "live" && liveMatchCount > 0
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
                          : t.status === "completed"
                          ? "bg-gradient-to-r from-success-500 to-success-600"
                          : "bg-gradient-to-r from-primary-500 to-primary-600"
                    }`}
                    style={{ width: `${t.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            
              {/* Status-specific information */}
              {t.status === "upcoming" && (
                <div className="flex items-center gap-3 p-4 bg-warning-50 border border-warning-200 rounded-xl">
                  <Clock className="h-5 w-5 text-warning-600" />
                  <span className="text-sm font-medium text-warning-700">Tournament starts soon!</span>
                </div>
              )}
              
              {t.status === "live" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 font-medium">
                      Matches: {t.matchesFinished || 0} finished / {t.matchesPending || 0} pending
                    </span>
                    {liveMatchCount > 0 && (
                      <Badge variant="live" size="sm" pulse>
                        <StatusIcons.live className="mr-1" />
                        {liveMatchCount} Live
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {t.status === "completed" && t.champion && (
                <div className="flex items-center gap-3 p-4 bg-success-50 border border-success-200 rounded-xl">
                  <Trophy className="h-5 w-5 text-success-600" />
                  <span className="text-sm font-semibold text-success-700">Champion: {t.champion}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
    </Link>
    </SwipeableCard>
  );
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<string>("All");
  const [showArchived, setShowArchived] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<unknown>(null);
  const [hasMore, setHasMore] = useState(true);
  const [keepData, setKeepData] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Fetch tournaments with pagination
  const fetchTournaments = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      console.log("Fetching tournaments from Firestore...");
      
      let q = query(
        collection(db, "tournaments"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      if (isLoadMore && lastVisibleDoc) {
        q = query(
          collection(db, "tournaments"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisibleDoc),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const newTournaments = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data(),
        _doc: doc // Store doc reference for pagination
      })) as Record<string, unknown>[];
      
      console.log(`Found ${newTournaments.length} tournaments`);
      
      if (isLoadMore) {
        setTournaments(prev => [...prev, ...newTournaments]);
      } else {
        setTournaments(newTournaments);
      }
      
      // Update pagination state
      if (newTournaments.length > 0) {
        setLastVisibleDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(newTournaments.length === 10);
      
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastVisibleDoc]);

  // Load KEEP_DATA state from localStorage and listen for changes
  useEffect(() => {
    const loadKeepDataState = () => {
      const saved = localStorage.getItem('keepData');
      setKeepData(saved === 'true');
    };

    // Load initial state
    loadKeepDataState();

    // Listen for storage changes (when toggled in dev-test page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'keepData') {
        loadKeepDataState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (same-origin changes)
    const handleCustomStorageChange = () => {
      loadKeepDataState();
    };
    
    window.addEventListener('keepDataChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('keepDataChanged', handleCustomStorageChange);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Reset pagination when filter changes
  useEffect(() => {
    setTournaments([]);
    setLastVisibleDoc(null);
    setHasMore(true);
    fetchTournaments();
  }, [filter, fetchTournaments]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchTournaments(true);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [fetchTournaments, hasMore, loadingMore, loading]);

  // Helper function to sort tournaments by date
  const sortTournamentsByDate = (tournaments: Record<string, unknown>[], status: string) => {
    return tournaments.sort((a, b) => {
      const dateA = a.startDate ? (typeof a.startDate.toDate === "function" ? a.startDate.toDate() : new Date(a.startDate)) : null;
      const dateB = b.startDate ? (typeof b.startDate.toDate === "function" ? b.startDate.toDate() : new Date(b.startDate)) : null;
      
      // Handle missing dates (put at end)
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      // Sort based on status
      if (status === "upcoming") {
        // Upcoming: soonest first (ascending)
        return dateA.getTime() - dateB.getTime();
      } else {
        // Live & Completed: most recent first (descending)
        return dateB.getTime() - dateA.getTime();
      }
    });
  };

  // Filter and sort tournaments
  let filteredTournaments: Record<string, unknown> | Record<string, unknown>[];
  
  // Apply archive filter first
  const activeTournaments = showArchived 
    ? tournaments 
    : tournaments.filter(t => t.archived !== true);
  
  if (filter === "All") {
    // Group by status and sort each group
    const upcoming = sortTournamentsByDate(activeTournaments.filter(t => t.status === "upcoming"), "upcoming");
    const live = sortTournamentsByDate(activeTournaments.filter(t => t.status === "live"), "live");
    const completed = sortTournamentsByDate(activeTournaments.filter(t => t.status === "completed"), "completed");
    
    filteredTournaments = { upcoming, live, completed };
  } else {
    // Filter by specific status and sort
    const statusTournaments = activeTournaments.filter(t => t.status === filter.toLowerCase());
    filteredTournaments = sortTournamentsByDate(statusTournaments, filter.toLowerCase());
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <ProgressIcons.loading className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-900">Loading tournaments...</h2>
            <p className="text-neutral-600 text-lg">Please wait while we fetch the latest data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 sm:mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-neutral-900 via-primary-700 to-secondary-700 bg-clip-text text-transparent leading-tight">
              CQG Tournaments
            </h1>
            <p className="text-neutral-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              Discover and join competitive gaming tournaments. Experience the thrill of competitive play with professional-grade tournaments and real-time leaderboards.
            </p>
          </div>
        
          {/* KEEP_DATA Status Badge - Only show in development */}
          {process.env.NODE_ENV !== 'production' && (
            <Badge 
              variant={keepData ? "warning" : "success"}
              size="lg"
              icon={keepData ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              className="shadow-sm"
              title={keepData 
                ? "Seeded data is preserved after dry runs." 
                : "Test data will be wiped after dry runs."
              }
            >
              {keepData ? 'Keep Data Mode' : 'Cleanup Mode'}
            </Badge>
          )}
      </div>
      
        {/* Filter Bar */}
        <div className="space-y-6 mb-8 sm:mb-12">
          <div className="flex flex-wrap gap-3">
            {["All", "Upcoming", "Live", "Completed"].map(status => {
              const isActive = filter === status;
              const getStatusIcon = () => {
                switch(status) {
                  case "All": return <Trophy className="h-4 w-4" />;
                  case "Upcoming": return <Clock className="h-4 w-4" />;
                  case "Live": return <Play className="h-4 w-4" />;
                  case "Completed": return <CheckCircle className="h-4 w-4" />;
                  default: return <Trophy className="h-4 w-4" />;
                }
              };
              
              return (
                <Button
                  key={status}
                  onClick={() => setFilter(status)}
                  variant={isActive ? "default" : "outline"}
                  size="lg"
                  leftIcon={getStatusIcon()}
                  className={`transition-all duration-200 ${
                    isActive 
                      ? "shadow-lg transform scale-105" 
                      : "hover:shadow-md hover:scale-102"
                  }`}
                >
                  {status}
                </Button>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 text-sm text-neutral-700 bg-white px-4 py-3 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer touch-target">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-sm font-medium">Show Archived Tournaments</span>
            </label>
            
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => fetchTournaments()}
              className="text-neutral-600 hover:text-primary-600"
            >
              Refresh
            </Button>
          </div>
        </div>

      {filter === "All" ? (
        // Grouped view with section headers
        <div>
          {/* Upcoming Section */}
          {filteredTournaments.upcoming.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-warning-100 to-warning-200 rounded-2xl">
                  <Clock className="h-6 w-6 text-warning-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">Upcoming Tournaments</h2>
                  <p className="text-neutral-600 text-sm sm:text-base">Tournaments starting soon</p>
                </div>
                <Badge variant="warning" size="lg" icon={<Clock className="h-4 w-4" />}>
                  {filteredTournaments.upcoming.length}
                </Badge>
              </div>
              <div className="grid gap-6 sm:gap-8">
                {filteredTournaments.upcoming.map((t: Record<string, unknown>) => (
                  <TournamentCard key={t.id as string} tournament={t} />
                ))}
              </div>
            </div>
          )}
          
          {/* Live Section */}
          {filteredTournaments.live.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-error-100 to-error-200 rounded-2xl animate-pulse">
                  <StatusIcons.live className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">Live Tournaments</h2>
                  <p className="text-neutral-600 text-sm sm:text-base">Happening right now</p>
                </div>
                <Badge variant="live" size="lg" icon={<StatusIcons.live />} pulse>
                  {filteredTournaments.live.length} LIVE
                </Badge>
              </div>
              <div className="grid gap-6 sm:gap-8">
                {filteredTournaments.live.map((t: Record<string, unknown>) => (
                  <TournamentCard key={t.id as string} tournament={t} />
                ))}
              </div>
            </div>
          )}
          
          {/* Completed Section */}
          {filteredTournaments.completed.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl">
                  <Trophy className="h-6 w-6 text-success-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">Completed Tournaments</h2>
                  <p className="text-neutral-600 text-sm sm:text-base">Finished competitions</p>
                </div>
                <Badge variant="success" size="lg" icon={<CheckCircle className="h-4 w-4" />}>
                  {filteredTournaments.completed.length}
                </Badge>
              </div>
              <div className="grid gap-6 sm:gap-8">
                {filteredTournaments.completed.map((t: Record<string, unknown>) => (
                  <TournamentCard key={t.id as string} tournament={t} />
                ))}
              </div>
            </div>
          )}
          
          {/* Empty state for All */}
          {filteredTournaments.upcoming.length === 0 && 
           filteredTournaments.live.length === 0 && 
           filteredTournaments.completed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                <Trophy className="h-16 w-16 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">No tournaments available yet</h2>
              <p className="text-neutral-600 mb-8 max-w-lg text-lg leading-relaxed">
                Check back soon for upcoming tournaments, or create your own to get started! 
                Join the competitive gaming community and showcase your skills.
              </p>
              {process.env.NODE_ENV !== 'production' && (
                <Button 
                  asChild
                  size="lg"
                  leftIcon={<ExternalLink className="h-5 w-5" />}
                  className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <a href="/dev-test">Seed Test Data</a>
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Filtered view
        <div>
          {filteredTournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                <Search className="h-16 w-16 text-neutral-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">No tournaments found</h2>
              <p className="text-neutral-600 mb-6 text-lg leading-relaxed max-w-md">
                No tournaments match your current filter criteria. Try adjusting your filters or check back later.
              </p>
              <Button 
                variant="outline" 
                size="lg" 
                leftIcon={<Filter className="h-5 w-5" />}
                onClick={() => setFilter("All")}
                className="shadow-sm hover:shadow-md"
              >
                Show All Tournaments
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                  {filter} Tournaments
                </h2>
                <Badge variant="default" size="lg">
                  {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid gap-6 sm:gap-8">
                {(filteredTournaments as Record<string, unknown>[]).map((t: Record<string, unknown>) => (
                  <TournamentCard key={t.id as string} tournament={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

        {/* Infinite Scroll Trigger */}
        {hasMore && !loading && (
          <div ref={observerRef} className="flex justify-center py-12">
            {loadingMore ? (
              <div className="flex items-center space-x-4 bg-white px-8 py-4 rounded-2xl shadow-lg border border-neutral-200">
                <ProgressIcons.loading className="h-6 w-6" />
                <span className="text-neutral-700 font-semibold text-lg">Loading more tournaments...</span>
              </div>
            ) : (
              <div className="h-8"></div>
            )}
          </div>
        )}

        {/* No more tournaments message */}
        {!hasMore && tournaments.length > 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3 text-neutral-600 bg-neutral-50 px-6 py-3 rounded-2xl shadow-sm border border-neutral-200">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span className="text-base font-medium">You&apos;ve seen all tournaments</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}