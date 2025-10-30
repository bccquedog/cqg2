"use client";

import { useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToast } from "@/components/Toast";
import { checkGamerTagAvailability, claimGamerTag, takeoverGamerTag, createGamerTagRecord } from "@/lib/gamerTagSystem";
import PremiumClaimModal from "@/components/PremiumClaimModal";

interface GamerTagEditorProps {
  currentGamerTag: string;
  userId: string;
  onUpdate: (newGamerTag: string) => void;
}

export default function GamerTagEditor({ currentGamerTag, userId, onUpdate }: GamerTagEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState(currentGamerTag);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumClaimOpen, setPremiumClaimOpen] = useState(false);
  const [claimTag, setClaimTag] = useState("");
  const { showToast } = useToast();

  const validateGamerTag = (tag: string): string | null => {
    if (tag.length < 3) return "Gamer tag must be at least 3 characters";
    if (tag.length > 16) return "Gamer tag must be 16 characters or less";
    if (!/^[a-zA-Z0-9_]+$/.test(tag)) return "Only letters, numbers, and underscores allowed";
    if (tag === currentGamerTag) return "This is already your current gamer tag";
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

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    // Validate format
    const validationError = validateGamerTag(newTag);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Check uniqueness
      const uniqueness = await checkUniqueness(newTag);
      if (!uniqueness.available) {
        if (uniqueness.canClaim) {
          // Show premium claim modal
          setClaimTag(newTag);
          setPremiumClaimOpen(true);
          setLoading(false);
          return;
        } else {
          setError("This gamer tag is already taken. Please choose another.");
          setLoading(false);
          return;
        }
      }

      // Update in Firestore
      await updateDoc(doc(db, "players", userId), {
        gamerTag: newTag,
        displayName: newTag
      });

      // Create new gamer tag record
      await createGamerTagRecord(newTag, userId);

      onUpdate(newTag);
      setIsEditing(false);
      showToast("Gamer tag updated successfully!", "success");
    } catch (error) {
      setError("Failed to update gamer tag. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewTag(currentGamerTag);
    setError(null);
    setIsEditing(false);
  };

  const handlePremiumClaimComplete = (success: boolean) => {
    setPremiumClaimOpen(false);
    if (success) {
      onUpdate(claimTag);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center space-x-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Gamer Tag</label>
          <div className="text-lg font-mono bg-gray-100 px-3 py-2 rounded-lg">
            {currentGamerTag}
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">New Gamer Tag</label>
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Enter new gamer tag"
          className="w-full border rounded-lg px-3 py-2 text-lg font-mono"
          maxLength={16}
        />
        <div className="text-xs text-gray-500 mt-1">
          {newTag.length}/16 characters
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
          onClick={handleCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || newTag.length < 3}
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Save Changes"}
        </button>
      </div>
    </div>
    <PremiumClaimModal
      open={premiumClaimOpen}
      gamerTag={claimTag}
      onComplete={handlePremiumClaimComplete}
      onCancel={() => setPremiumClaimOpen(false)}
    />
  </>
  );
}
