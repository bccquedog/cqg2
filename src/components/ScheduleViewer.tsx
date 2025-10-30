"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Filter
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  type: "match" | "round" | "ceremony" | "break" | "stream";
  startTime: string;
  endTime: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  streamLink?: string;
  participants?: string[];
  metadata?: Record<string, any>;
}

interface ScheduleDay {
  date: string;
  events: ScheduleEvent[];
}

interface ScheduleWeek {
  weekNumber: number;
  events: ScheduleEvent[];
}

interface TournamentSchedule {
  id: string;
  tournamentId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  days: ScheduleDay[];
  totalEvents: number;
  completedEvents: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

interface LeagueSchedule {
  id: string;
  leagueId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  weeks: ScheduleWeek[];
  currentWeek: number;
  totalEvents: number;
  completedEvents: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

type ScheduleData = TournamentSchedule | LeagueSchedule;

interface ScheduleViewerProps {
  competitionId: string;
  competitionType: "tournament" | "league";
}

export default function ScheduleViewer({ competitionId, competitionType }: ScheduleViewerProps) {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = db
      .collection(competitionType === "tournament" ? "tournaments" : "leagues")
      .doc(competitionId)
      .collection("schedule")
      .doc("schedule")
      .onSnapshot(
        (snap) => {
          if (snap.exists) {
            setSchedule(snap.data() as ScheduleData);
            setError(null);
          } else {
            setError("No schedule found for this competition");
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching schedule:", err);
          setError("Failed to load schedule");
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, [competitionId, competitionType]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "live":
        return <Play className="w-4 h-4 text-red-600 animate-pulse" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "live":
        return <Badge variant="default" className="bg-red-100 text-red-800 animate-pulse">Live</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-gray-500">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "match":
        return <Trophy className="w-4 h-4 text-blue-600" />;
      case "round":
        return <Users className="w-4 h-4 text-purple-600" />;
      case "ceremony":
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case "break":
        return <Pause className="w-4 h-4 text-gray-600" />;
      case "stream":
        return <Play className="w-4 h-4 text-red-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "match":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Match</Badge>;
      case "round":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Round</Badge>;
      case "ceremony":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Ceremony</Badge>;
      case "break":
        return <Badge variant="outline">Break</Badge>;
      case "stream":
        return <Badge variant="default" className="bg-red-100 text-red-800">Stream</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: schedule?.timezone || 'UTC'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeUntilEvent = (startTime: string) => {
    const now = new Date();
    const eventTime = new Date(startTime);
    const diffMs = eventTime.getTime() - now.getTime();
    
    if (diffMs < 0) return null; // Event has passed
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    return "Starting now";
  };

  const filterEvents = (events: ScheduleEvent[]) => {
    const now = new Date();
    
    return events.filter(event => {
      const eventTime = new Date(event.startTime);
      
      switch (filter) {
        case "upcoming":
          return eventTime > now && event.status === "scheduled";
        case "live":
          return event.status === "live";
        case "completed":
          return event.status === "completed";
        default:
          return true;
      }
    });
  };

  const getFilteredEvents = () => {
    if (!schedule) return [];
    
    let allEvents: ScheduleEvent[] = [];
    
    if (competitionType === "tournament" && "days" in schedule) {
      allEvents = schedule.days.flatMap(day => day.events);
    } else if (competitionType === "league" && "weeks" in schedule) {
      allEvents = schedule.weeks.flatMap(week => week.events);
    }
    
    return filterEvents(allEvents);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return getFilteredEvents().filter(event => 
      new Date(event.startTime) > now && event.status === "scheduled"
    ).slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading schedule...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Not Available</h3>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="p-6 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schedule Found</h3>
          <p className="text-gray-600">This competition doesn&apos;t have a schedule yet.</p>
        </Card>
      </div>
    );
  }

  const isTournament = competitionType === "tournament";
  const scheduleData = schedule as TournamentSchedule | LeagueSchedule;

  return (
    <div className="space-y-6">
      {/* Schedule Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              {scheduleData.name}
            </h2>
            <p className="text-gray-600 mt-1">
              {isTournament ? "Tournament" : "League"} Schedule • {competitionId}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(scheduleData.startDate)} - {formatDate(scheduleData.endDate)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{scheduleData.totalEvents} events</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{scheduleData.completedEvents} completed</span>
              </div>
              {isTournament && "days" in scheduleData && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{scheduleData.days.length} days</span>
                </div>
              )}
              {!isTournament && "weeks" in scheduleData && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Week {scheduleData.currentWeek}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            {["all", "upcoming", "live", "completed"].map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType as any)}
                className="capitalize"
              >
                {filterType}
              </Button>
            ))}
          </div>
        </div>
        
        {getUpcomingEvents().length > 0 && (
          <div className="text-sm text-gray-600">
            Next: {getUpcomingEvents()[0]?.title} in {getTimeUntilEvent(getUpcomingEvents()[0]?.startTime || "")}
          </div>
        )}
      </div>

      {/* Schedule Display */}
      <div className="space-y-6">
        {isTournament && "days" in scheduleData ? (
          // Tournament Schedule (Days)
          scheduleData.days.map((day, dayIdx) => {
            const filteredDayEvents = filterEvents(day.events);
            if (filteredDayEvents.length === 0) return null;
            
            return (
              <Card key={dayIdx} className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatDate(day.date)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filteredDayEvents.length} event{filteredDayEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {filteredDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(event.type)}
                          {getEventTypeBadge(event.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </p>
                          {event.participants && event.participants.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Participants: {event.participants.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getTimeUntilEvent(event.startTime) && (
                          <span className="text-sm text-blue-600 font-medium">
                            {getTimeUntilEvent(event.startTime)}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {getStatusIcon(event.status)}
                          {getStatusBadge(event.status)}
                        </div>
                        {event.streamLink && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={event.streamLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Watch
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        ) : !isTournament && "weeks" in scheduleData ? (
          // League Schedule (Weeks)
          scheduleData.weeks.map((week, weekIdx) => {
            const filteredWeekEvents = filterEvents(week.events);
            if (filteredWeekEvents.length === 0) return null;
            
            return (
              <Card key={weekIdx} className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Week {week.weekNumber}
                    {week.weekNumber === scheduleData.currentWeek && (
                      <Badge variant="default" className="ml-2 bg-blue-100 text-blue-800">
                        Current
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filteredWeekEvents.length} event{filteredWeekEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {filteredWeekEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(event.type)}
                          {getEventTypeBadge(event.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </p>
                          {event.participants && event.participants.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Participants: {event.participants.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getTimeUntilEvent(event.startTime) && (
                          <span className="text-sm text-blue-600 font-medium">
                            {getTimeUntilEvent(event.startTime)}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {getStatusIcon(event.status)}
                          {getStatusBadge(event.status)}
                        </div>
                        {event.streamLink && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={event.streamLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Watch
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        ) : null}
      </div>

      {/* Schedule Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Schedule created on {new Date(scheduleData.createdAt).toLocaleDateString()}</p>
        <p className="mt-1">Updates in real-time • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
