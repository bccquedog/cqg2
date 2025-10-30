"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToast } from "@/components/Toast";
import { checkGamerTagAvailability, takeoverGamerTag } from "@/lib/gamerTagSystem";
import PremiumClaimModal from "@/components/PremiumClaimModal";

interface GamerTagModalProps {
  open: boolean;
  onComplete: (gamerTag: string) => void;
  onCancel: () => void;
  tournamentName?: string;
}

export default function GamerTagModal({ open, onComplete, onCancel, tournamentName }: GamerTagModalProps) {
  const [mode, setMode] = useState<"select" | "auto" | "custom">("select");
  const [customTag, setCustomTag] = useState("");
  const [autoTag, setAutoTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumClaimOpen, setPremiumClaimOpen] = useState(false);
  const [claimTag, setClaimTag] = useState("");
  const { showToast } = useToast();

  // Generate auto tag when modal opens
  useEffect(() => {
    if (open && mode === "auto") {
      generateAutoTag();
    }
  }, [open, mode]);

  const generateAutoTag = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setAutoTag(`CQG_Player${randomDigits}`);
  };

  const validateGamerTag = (tag: string): string | null => {
    if (tag.length < 3) return "Gamer tag must be at least 3 characters";
    if (tag.length > 16) return "Gamer tag must be 16 characters or less";
    if (!/^[a-zA-Z0-9_]+$/.test(tag)) return "Only letters, numbers, and underscores allowed";
    return null;
  };

  const checkUniqueness = async (tag: string): Promise<{ available: boolean; canClaim?: boolean; claimPrice?: number }> => {
    try {
      const availability = await checkGamerTagAvailability(tag);
      return {
        available: availability.available,
        canClaim: availability.canClaim,
        claimPrice: availability.claimPrice
      };
    } catch (error) {
      console.error("Error checking gamer tag uniqueness:", error);
      return { available: false };
    }
  };

  const handleAutoGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if auto-generated tag is unique
      const uniqueness = await checkUniqueness(autoTag);
      if (!uniqueness.available) {
        // Generate a new one if not unique
        generateAutoTag();
        setError("Tag was taken, generating a new one...");
        setTimeout(() => handleAutoGenerate(), 1000);
        return;
      }

      onComplete(autoTag);
      showToast(
        `We gave you ${autoTag}. You can change this anytime in your profile.`,
        "success"
      );
    } catch (error) {
      setError("Failed to generate gamer tag. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validate format
    const validationError = validateGamerTag(customTag);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Check uniqueness
      const uniqueness = await checkUniqueness(customTag);
      if (!uniqueness.available) {
        if (uniqueness.canClaim) {
          // Show premium claim modal
          setClaimTag(customTag);
          setPremiumClaimOpen(true);
          setLoading(false);
          return;
        } else {
          setError("This gamer tag is already taken. Please choose another.");
          setLoading(false);
          return;
        }
      }

      onComplete(customTag);
      showToast(
        `Welcome ${customTag}! You're locked in.`,
        "success"
      );
    } catch (error) {
      setError("Failed to validate gamer tag. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumClaimComplete = (success: boolean) => {
    setPremiumClaimOpen(false);
    if (success) {
      onComplete(claimTag);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Choose Your Gamer Tag</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {tournamentName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🏆 You'll be joining <strong>{tournamentName}</strong> with this gamer tag!
            </p>
          </div>
        )}

        {mode === "select" && (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm mb-4">
              Your gamer tag is how other players will see you in tournaments and matches.
            </p>
            
            <button
              onClick={() => setMode("auto")}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🎲</div>
                <h4 className="font-medium text-gray-900">Auto-Generate</h4>
                <p className="text-sm text-gray-600">We'll create a unique tag for you</p>
              </div>
            </button>

            <button
              onClick={() => setMode("custom")}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">✏️</div>
                <h4 className="font-medium text-gray-900">Create Your Own</h4>
                <p className="text-sm text-gray-600">Choose a custom gamer tag</p>
              </div>
            </button>
          </div>
        )}

        {mode === "auto" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🎲</div>
              <h4 className="font-medium text-gray-900 mb-2">Auto-Generated Tag</h4>
              <div className="text-2xl font-mono bg-gray-100 p-3 rounded-lg">
                {autoTag}
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>• 3-16 characters</p>
              <p>• Letters, numbers, underscores only</p>
              <p>• Must be unique</p>
            </div>

            {error && <div className="text-sm text-red-600 text-center">{error}</div>}

            <div className="flex space-x-3">
              <button
                onClick={() => setMode("select")}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Checking..." : "Use This Tag"}
              </button>
            </div>
          </div>
        )}

        {mode === "custom" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Gamer Tag</label>
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Enter your gamer tag"
                className="w-full border rounded-lg px-3 py-2 text-lg font-mono"
                maxLength={16}
              />
              <div className="text-xs text-gray-500 mt-1">
                {customTag.length}/16 characters
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p>• 3-16 characters</p>
              <p>• Letters, numbers, underscores only</p>
              <p>• Must be unique</p>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex space-x-3">
              <button
                onClick={() => setMode("select")}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={loading || customTag.length < 3}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Checking..." : "Confirm Tag"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    <PremiumClaimModal
      open={premiumClaimOpen}
      gamerTag={claimTag}
      onComplete={handlePremiumClaimComplete}
      onCancel={() => setPremiumClaimOpen(false)}
      tournamentName={tournamentName}
    />
  </>
  );
}
