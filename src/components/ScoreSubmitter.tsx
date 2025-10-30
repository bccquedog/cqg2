"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Send,
  RefreshCw,
  Shield
} from "lucide-react";

interface ScoreSubmitterProps {
  competitionId: string;
  matchId: string;
  userId: string;
  maxScore?: number;
  minScore?: number;
  allowDecimal?: boolean;
  className?: string;
}

interface SubmissionStatus {
  type: "success" | "error" | "warning" | "info";
  message: string;
  details?: string;
}

export default function ScoreSubmitter({ 
  competitionId, 
  matchId, 
  userId,
  maxScore = 100,
  minScore = 0,
  allowDecimal = false,
  className = ""
}: ScoreSubmitterProps) {
  const [score, setScore] = useState<number | "">("");
  const [ticket, setTicket] = useState("");
  const [status, setStatus] = useState<SubmissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateScore = (value: number): string | null => {
    if (isNaN(value)) return "Score must be a valid number";
    if (value < minScore) return `Score must be at least ${minScore}`;
    if (value > maxScore) return `Score must be at most ${maxScore}`;
    if (!allowDecimal && !Number.isInteger(value)) return "Score must be a whole number";
    return null;
  };

  const validateTicket = (value: string): string | null => {
    if (!value.trim()) return "Ticket code is required";
    if (value.length < 6) return "Ticket code must be at least 6 characters";
    if (value.length > 20) return "Ticket code must be at most 20 characters";
    return null;
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setScore("");
      return;
    }

    const numValue = allowDecimal ? parseFloat(value) : parseInt(value);
    if (!isNaN(numValue)) {
      setScore(numValue);
    }
  };

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicket(e.target.value.toUpperCase().trim());
  };

  const handleSubmit = async () => {
    // Clear previous status
    setStatus(null);

    // Validate inputs
    if (score === "") {
      setStatus({
        type: "warning",
        message: "Please enter your score",
        details: `Score must be between ${minScore} and ${maxScore}`
      });
      return;
    }

    if (!ticket.trim()) {
      setStatus({
        type: "warning",
        message: "Please enter your match ticket code",
        details: "You should have received this code when the match started"
      });
      return;
    }

    const scoreError = validateScore(score as number);
    if (scoreError) {
      setStatus({
        type: "error",
        message: scoreError,
        details: `Valid range: ${minScore} - ${maxScore}`
      });
      return;
    }

    const ticketError = validateTicket(ticket);
    if (ticketError) {
      setStatus({
        type: "error",
        message: ticketError,
        details: "Check your ticket code and try again"
      });
      return;
    }

    setLoading(true);

    try {
      // Submit score via API
      const response = await fetch("/api/submitScore", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId, 
          competitionId, 
          matchId, 
          score: score as number, 
          code: ticket.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit score");
      }

      setStatus({
        type: "success",
        message: "Score submitted successfully!",
        details: `Your score of ${score} has been recorded for this match`
      });

      setSubmitted(true);
      
      // Clear form after successful submission
      setTimeout(() => {
        setScore("");
        setTicket("");
        setSubmitted(false);
      }, 3000);

    } catch (err) {
      console.error("Score submission error:", err);
      setStatus({
        type: "error",
        message: "Failed to submit score",
        details: err instanceof Error ? err.message : "Please try again or contact support"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) return null;
    
    switch (status.type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "info":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!status) return "";
    
    switch (status.type) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      default:
        return "";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Submit Match Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Competition:</span>
            <p className="text-gray-900">{competitionId}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Match:</span>
            <p className="text-gray-900">{matchId}</p>
          </div>
        </div>

        {/* Score Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Your Score
          </label>
          <Input
            type={allowDecimal ? "number" : "number"}
            step={allowDecimal ? "0.1" : "1"}
            placeholder={`Enter score (${minScore}-${maxScore})`}
            value={score}
            onChange={handleScoreChange}
            disabled={loading || submitted}
            className="text-lg"
          />
          <p className="text-xs text-gray-500">
            Valid range: {minScore} - {maxScore}
            {!allowDecimal && " (whole numbers only)"}
          </p>
        </div>

        {/* Ticket Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Match Ticket Code
          </label>
          <Input
            type="text"
            placeholder="Enter your match ticket code"
            value={ticket}
            onChange={handleTicketChange}
            disabled={loading || submitted}
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            You should have received this code when the match started
          </p>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={loading || submitted || score === "" || !ticket.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : submitted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Score Submitted
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Score
            </>
          )}
        </Button>

        {/* Status Message */}
        {status && (
          <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-start gap-2">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium">{status.message}</p>
                {status.details && (
                  <p className="text-xs text-gray-600 mt-1">{status.details}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Make sure you have the correct ticket code for this match</p>
          <p>• Scores are final once submitted - double-check before submitting</p>
          <p>• Contact support if you encounter any issues</p>
        </div>
      </CardContent>
    </Card>
  );
}
