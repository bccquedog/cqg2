import type { NextApiRequest, NextApiResponse } from "next";
import { submitScore } from "@/lib/submitScore"; // reuse Firestore function

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed. Only POST requests are supported." 
    });
  }

  const { userId, competitionId, matchId, score, code } = req.body;

  // Validate required fields
  if (!userId || !competitionId || !matchId || score === undefined || !code) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields. Please provide userId, competitionId, matchId, score, and code."
    });
  }

  // Validate score is a number
  if (typeof score !== "number" || isNaN(score)) {
    return res.status(400).json({
      success: false,
      error: "Score must be a valid number."
    });
  }

  // Validate score is not negative
  if (score < 0) {
    return res.status(400).json({
      success: false,
      error: "Score cannot be negative."
    });
  }

  // Validate string fields
  if (typeof userId !== "string" || typeof competitionId !== "string" || 
      typeof matchId !== "string" || typeof code !== "string") {
    return res.status(400).json({
      success: false,
      error: "userId, competitionId, matchId, and code must be strings."
    });
  }

  // Validate code length
  if (code.length < 6 || code.length > 20) {
    return res.status(400).json({
      success: false,
      error: "Ticket code must be between 6 and 20 characters."
    });
  }

  try {
    const result = await submitScore(userId, competitionId, matchId, code, score);
    
    res.status(200).json({ 
      success: true, 
      message: "Score submitted successfully",
      result: {
        matchId: result.matchId,
        scores: result.scores,
        winner: result.winner,
        status: result.status
      }
    });
  } catch (err: unknown) {
    console.error("Score submission error:", err);
    
    // Handle specific error types
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    if (errorMessage.includes("Invalid or expired ticket")) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired ticket code. Please check your ticket and try again."
      });
    }
    
    if (errorMessage.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Match or competition not found. Please verify the match ID and competition ID."
      });
    }
    
    if (errorMessage.includes("already submitted")) {
      return res.status(409).json({
        success: false,
        error: "Score has already been submitted for this match."
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      success: false, 
      error: errorMessage || "An unexpected error occurred while submitting the score. Please try again."
    });
  }
}
