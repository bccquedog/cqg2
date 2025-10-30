"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";
import { 
  checkGamerTagAvailability, 
  claimGamerTag, 
  takeoverGamerTag,
  startGamerTagAuction,
  getGamerTagSettings 
} from "@/lib/gamerTagSystem";

interface PremiumClaimModalProps {
  open: boolean;
  gamerTag: string;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
  tournamentName?: string;
}

export default function PremiumClaimModal({ 
  open, 
  gamerTag, 
  onComplete, 
  onCancel, 
  tournamentName 
}: PremiumClaimModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [claimInfo, setClaimInfo] = useState<{
    available: boolean;
    currentOwner?: string;
    claimPrice?: number;
    canClaim?: boolean;
  } | null>(null);
  const [settings, setSettings] = useState<{
    claimEnabled: boolean;
    auctionEnabled: boolean;
    defaultClaimPrice: number;
  } | null>(null);
  const [mode, setMode] = useState<"takeover" | "claim" | "auction">("takeover");
  const [bidAmount, setBidAmount] = useState(0);

  useEffect(() => {
    if (open) {
      loadClaimInfo();
      loadSettings();
    }
  }, [open, gamerTag]);

  const loadClaimInfo = async () => {
    try {
      const info = await checkGamerTagAvailability(gamerTag);
      setClaimInfo(info);
      if (info.claimPrice) {
        setBidAmount(info.claimPrice);
      }
    } catch (error) {
      console.error("Error loading claim info:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const gamerTagSettings = await getGamerTagSettings();
      setSettings(gamerTagSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleTakeover = async () => {
    if (!user || !claimInfo?.claimPrice) return;
    
    setLoading(true);
    try {
      // Get user's current wallet balance
      const userRef = doc(db, "players", user.uid);
      const userSnap = await getDoc(userRef);
      const userWallet = userSnap.data()?.wallet || 0;
      
      const result = await takeoverGamerTag(gamerTag, user.uid, userWallet);
      
      if (result.success) {
        showToast(result.message, "success");
        onComplete(true);
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Failed to take over gamer tag", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !claimInfo?.claimPrice) return;
    
    setLoading(true);
    try {
      // Get user's current wallet balance
      const userRef = doc(db, "players", user.uid);
      const userSnap = await getDoc(userRef);
      const userWallet = userSnap.data()?.wallet || 0;
      
      const result = await claimGamerTag(gamerTag, user.uid, userWallet);
      
      if (result.success) {
        showToast(result.message, "success");
        onComplete(true);
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Failed to claim gamer tag", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = async () => {
    if (!user || !bidAmount) return;
    
    setLoading(true);
    try {
      // Get user's current wallet balance
      const userRef = doc(db, "players", user.uid);
      const userSnap = await getDoc(userRef);
      const userWallet = userSnap.data()?.wallet || 0;
      
      const result = await startGamerTagAuction(gamerTag, user.uid, bidAmount);
      
      if (result.success) {
        showToast(result.message, "success");
        onComplete(true);
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Failed to start auction", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Premium Gamer Tag Claim</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {tournamentName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🏆 You'll be joining <strong>{tournamentName}</strong> with this gamer tag!
            </p>
          </div>
        )}

        <div className="mb-4">
          <div className="text-center">
            <div className="text-2xl font-mono bg-gray-100 p-3 rounded-lg mb-2">
              {gamerTag}
            </div>
            <p className="text-sm text-gray-600">
              This gamer tag is currently taken by another player
            </p>
          </div>
        </div>

        {claimInfo && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Current Owner:</strong> {claimInfo.currentOwner}<br/>
              <strong>Claim Price:</strong> {claimInfo.claimPrice} CQG Coins
            </p>
          </div>
        )}

        {settings && (
          <div className="mb-4">
            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => setMode("takeover")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                  mode === "takeover"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Flat Takeover
              </button>
              <button
                onClick={() => setMode("claim")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                  mode === "claim"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Legacy Claim
              </button>
              {settings.auctionEnabled && (
                <button
                  onClick={() => setMode("auction")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                    mode === "auction"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Start Auction
                </button>
              )}
            </div>

            {mode === "takeover" && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>• Pay {claimInfo?.claimPrice} CQG Coins to instantly take over this tag</p>
                  <p>• Current owner gets a fallback tag with suffix (e.g., {gamerTag}_1234)</p>
                  <p>• You become the new owner immediately</p>
                </div>
                
                <button
                  onClick={handleTakeover}
                  disabled={loading || !settings.claimEnabled}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Taking Over..." : `Take Over for ${claimInfo?.claimPrice} CQG Coins`}
                </button>
              </div>
            )}

            {mode === "claim" && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>• Pay {claimInfo?.claimPrice} CQG Coins to instantly claim this tag</p>
                  <p>• Current owner will be reassigned a legacy fallback tag</p>
                  <p>• You'll be notified of the change</p>
                </div>
                
                <button
                  onClick={handleClaim}
                  disabled={loading || !settings.claimEnabled}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Claiming..." : `Claim for ${claimInfo?.claimPrice} CQG Coins`}
                </button>
              </div>
            )}

            {mode === "auction" && settings.auctionEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Starting Bid (CQG Coins)</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={claimInfo?.claimPrice || 500}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Enter bid amount"
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>• Start a 24-hour auction for this gamer tag</p>
                  <p>• Other players can bid against you</p>
                  <p>• Highest bidder wins after 24 hours</p>
                  <p>• Losing bidders get refunded</p>
                </div>
                
                <button
                  onClick={handleStartAuction}
                  disabled={loading || bidAmount < (claimInfo?.claimPrice || 500)}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? "Starting..." : `Start Auction with ${bidAmount} CQG Coins`}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
