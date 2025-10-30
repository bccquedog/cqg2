"use client";

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export interface GamerTagSettings {
  claimEnabled: boolean;
  auctionEnabled: boolean;
  takeoverEnabled: boolean;
  defaultClaimPrice: number;
  defaultTakeoverPrice: number;
}

export interface GamerTagRecord {
  currentOwner: string;
  originalOwnerId: string;
  status: "active" | "claimed" | "auction";
  claimable: boolean;
  claimPrice: number;
  takeoverPrice: number;
  isTaken: boolean;
  createdAt: any;
  lastClaimedAt?: any;
  auctionEndTime?: any;
  currentBid?: number;
  currentBidder?: string;
}

export interface TransactionRecord {
  type: "gamerTagClaim" | "gamerTagAuction" | "gamerTagBid" | "gamerTagTakeover";
  from: string;
  to: string;
  tag: string;
  amount: number;
  timestamp: any;
  status: "completed" | "pending" | "refunded";
}

// Get gamer tag settings
export async function getGamerTagSettings(): Promise<GamerTagSettings> {
  try {
    const settingsRef = doc(db, "settings", "gamerTags");
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data() as GamerTagSettings;
    }
    
    // Return default settings if not found
    return {
      claimEnabled: true,
      auctionEnabled: false,
      takeoverEnabled: true,
      defaultClaimPrice: 500,
      defaultTakeoverPrice: 500
    };
  } catch (error) {
    console.error("Error getting gamer tag settings:", error);
    return {
      claimEnabled: false,
      auctionEnabled: false,
      takeoverEnabled: false,
      defaultClaimPrice: 500,
      defaultTakeoverPrice: 500
    };
  }
}

// Check if gamer tag is available
export async function checkGamerTagAvailability(tag: string): Promise<{
  available: boolean;
  currentOwner?: string;
  claimPrice?: number;
  canClaim?: boolean;
}> {
  try {
    const tagRef = doc(db, "gamerTags", tag.toLowerCase());
    const tagSnap = await getDoc(tagRef);
    
    if (!tagSnap.exists()) {
      return { available: true };
    }
    
    const tagData = tagSnap.data() as GamerTagRecord;
    const settings = await getGamerTagSettings();
    
    return {
      available: false,
      currentOwner: tagData.currentOwner,
      claimPrice: tagData.claimPrice || settings.defaultClaimPrice,
      canClaim: settings.claimEnabled && tagData.claimable
    };
  } catch (error) {
    console.error("Error checking gamer tag availability:", error);
    return { available: false };
  }
}

// Flat-price takeover of a gamer tag
export async function takeoverGamerTag(
  tag: string,
  newOwnerId: string,
  newOwnerWallet: number
): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getGamerTagSettings();
    if (!settings.takeoverEnabled) {
      return { success: false, message: "Gamer tag takeover is currently disabled" };
    }
    
    const tagRef = doc(db, "gamerTags", tag.toLowerCase());
    const tagSnap = await getDoc(tagRef);
    
    if (!tagSnap.exists()) {
      return { success: false, message: "Gamer tag not found" };
    }
    
    const tagData = tagSnap.data() as GamerTagRecord;
    const takeoverPrice = tagData.takeoverPrice || settings.defaultClaimPrice;
    
    if (newOwnerWallet < takeoverPrice) {
      return { success: false, message: `Insufficient coins. You need ${takeoverPrice} CQG Coins` };
    }
    
    const oldOwnerId = tagData.currentOwner;
    
    // Generate fallback tag with suffix for old owner
    const fallbackTag = await generateFallbackTagWithSuffix(oldOwnerId, tag);
    
    // Update old owner's profile
    const oldOwnerRef = doc(db, "players", oldOwnerId);
    await updateDoc(oldOwnerRef, {
      gamerTag: fallbackTag,
      displayName: fallbackTag,
      wallet: (await getDoc(oldOwnerRef)).data()?.wallet || 0
    });
    
    // Update new owner's profile
    const newOwnerRef = doc(db, "players", newOwnerId);
    await updateDoc(newOwnerRef, {
      gamerTag: tag,
      displayName: tag,
      wallet: newOwnerWallet - takeoverPrice
    });
    
    // Update gamer tag record
    await updateDoc(tagRef, {
      currentOwner: newOwnerId,
      isTaken: true,
      lastClaimedAt: serverTimestamp(),
      claimable: true
    });
    
    // Create transaction record
    await addDoc(collection(db, "transactions"), {
      type: "gamerTagTakeover",
      from: oldOwnerId,
      to: newOwnerId,
      tag: tag,
      amount: takeoverPrice,
      timestamp: serverTimestamp(),
      status: "completed"
    } as TransactionRecord);
    
    return { 
      success: true, 
      message: `Successfully took over ${tag} for ${takeoverPrice} CQG Coins` 
    };
  } catch (error) {
    console.error("Error taking over gamer tag:", error);
    return { success: false, message: "Failed to take over gamer tag" };
  }
}

// Claim a gamer tag (legacy function for backward compatibility)
export async function claimGamerTag(
  tag: string, 
  newOwnerId: string, 
  newOwnerWallet: number
): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getGamerTagSettings();
    if (!settings.claimEnabled) {
      return { success: false, message: "Gamer tag claiming is currently disabled" };
    }
    
    const tagRef = doc(db, "gamerTags", tag.toLowerCase());
    const tagSnap = await getDoc(tagRef);
    
    if (!tagSnap.exists()) {
      return { success: false, message: "Gamer tag not found" };
    }
    
    const tagData = tagSnap.data() as GamerTagRecord;
    const claimPrice = tagData.claimPrice || settings.defaultClaimPrice;
    
    if (newOwnerWallet < claimPrice) {
      return { success: false, message: `Insufficient coins. You need ${claimPrice} CQG Coins` };
    }
    
    const oldOwnerId = tagData.currentOwner;
    
    // Generate fallback tag for old owner
    const fallbackTag = await generateFallbackTag(oldOwnerId);
    
    // Update old owner's profile
    const oldOwnerRef = doc(db, "players", oldOwnerId);
    await updateDoc(oldOwnerRef, {
      gamerTag: fallbackTag,
      displayName: fallbackTag,
      wallet: (await getDoc(oldOwnerRef)).data()?.wallet || 0
    });
    
    // Update new owner's profile
    const newOwnerRef = doc(db, "players", newOwnerId);
    await updateDoc(newOwnerRef, {
      gamerTag: tag,
      displayName: tag,
      wallet: newOwnerWallet - claimPrice
    });
    
    // Update gamer tag record
    await updateDoc(tagRef, {
      currentOwner: newOwnerId,
      lastClaimedAt: serverTimestamp(),
      claimable: true
    });
    
    // Create transaction record
    await addDoc(collection(db, "transactions"), {
      type: "gamerTagClaim",
      from: oldOwnerId,
      to: newOwnerId,
      tag: tag,
      amount: claimPrice,
      timestamp: serverTimestamp(),
      status: "completed"
    } as TransactionRecord);
    
    return { 
      success: true, 
      message: `Successfully claimed ${tag} for ${claimPrice} CQG Coins` 
    };
  } catch (error) {
    console.error("Error claiming gamer tag:", error);
    return { success: false, message: "Failed to claim gamer tag" };
  }
}

// Generate fallback tag for old owner
async function generateFallbackTag(ownerId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const fallbackTag = `CQG_Player${randomDigits}_legacy`;
    
    const availability = await checkGamerTagAvailability(fallbackTag);
    if (availability.available) {
      return fallbackTag;
    }
    
    attempts++;
  }
  
  // Fallback to timestamp-based tag if random generation fails
  const timestamp = Date.now().toString().slice(-4);
  return `CQG_Player${timestamp}_legacy`;
}

// Generate fallback tag with suffix for takeover
async function generateFallbackTagWithSuffix(ownerId: string, originalTag: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const fallbackTag = `${originalTag}_${randomDigits}`;
    
    const availability = await checkGamerTagAvailability(fallbackTag);
    if (availability.available) {
      return fallbackTag;
    }
    
    attempts++;
  }
  
  // Fallback to timestamp-based tag if random generation fails
  const timestamp = Date.now().toString().slice(-4);
  return `${originalTag}_${timestamp}`;
}

// Create gamer tag record
export async function createGamerTagRecord(tag: string, ownerId: string): Promise<void> {
  try {
    const settings = await getGamerTagSettings();
    const tagRef = doc(db, "gamerTags", tag.toLowerCase());
    
    await setDoc(tagRef, {
      currentOwner: ownerId,
      originalOwnerId: ownerId,
      status: "active",
      claimable: true,
      claimPrice: settings.defaultClaimPrice,
      takeoverPrice: settings.defaultTakeoverPrice,
      isTaken: false,
      createdAt: serverTimestamp()
    } as GamerTagRecord);
  } catch (error) {
    console.error("Error creating gamer tag record:", error);
  }
}

// Start auction for gamer tag
export async function startGamerTagAuction(
  tag: string,
  newOwnerId: string,
  bidAmount: number
): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getGamerTagSettings();
    if (!settings.auctionEnabled) {
      return { success: false, message: "Gamer tag auctions are currently disabled" };
    }
    
    const tagRef = doc(db, "gamerTags", tag.toLowerCase());
    const tagSnap = await getDoc(tagRef);
    
    if (!tagSnap.exists()) {
      return { success: false, message: "Gamer tag not found" };
    }
    
    const tagData = tagSnap.data() as GamerTagRecord;
    
    if (tagData.status === "auction") {
      return { success: false, message: "This gamer tag is already in auction" };
    }
    
    // Set auction end time (24 hours from now)
    const auctionEndTime = new Date();
    auctionEndTime.setHours(auctionEndTime.getHours() + 24);
    
    // Update gamer tag record
    await updateDoc(tagRef, {
      status: "auction",
      auctionEndTime: auctionEndTime,
      currentBid: bidAmount,
      currentBidder: newOwnerId,
      claimable: false
    });
    
    // Create transaction record
    await addDoc(collection(db, "transactions"), {
      type: "gamerTagAuction",
      from: tagData.currentOwner,
      to: newOwnerId,
      tag: tag,
      amount: bidAmount,
      timestamp: serverTimestamp(),
      status: "pending"
    } as TransactionRecord);
    
    return { 
      success: true, 
      message: `Auction started for ${tag}. Current bid: ${bidAmount} CQG Coins` 
    };
  } catch (error) {
    console.error("Error starting gamer tag auction:", error);
    return { success: false, message: "Failed to start auction" };
  }
}

// Place bid in auction
export async function placeGamerTagBid(
  tag: string,
  bidderId: string,
  bidAmount: number,
  bidderWallet: number
): Promise<{ success: boolean; message: string }> {
  try {
    const tagRef = doc(db, "gamerTags", tag.toLowerCase());
    const tagSnap = await getDoc(tagRef);
    
    if (!tagSnap.exists()) {
      return { success: false, message: "Gamer tag not found" };
    }
    
    const tagData = tagSnap.data() as GamerTagRecord;
    
    if (tagData.status !== "auction") {
      return { success: false, message: "This gamer tag is not in auction" };
    }
    
    if (tagData.currentBid && bidAmount <= tagData.currentBid) {
      return { success: false, message: "Bid must be higher than current bid" };
    }
    
    if (bidderWallet < bidAmount) {
      return { success: false, message: "Insufficient coins for bid" };
    }
    
    // Refund previous bidder if exists
    if (tagData.currentBidder && tagData.currentBid) {
      const prevBidderRef = doc(db, "players", tagData.currentBidder);
      const prevBidderSnap = await getDoc(prevBidderRef);
      if (prevBidderSnap.exists()) {
        const prevWallet = prevBidderSnap.data()?.wallet || 0;
        await updateDoc(prevBidderRef, {
          wallet: prevWallet + tagData.currentBid
        });
      }
    }
    
    // Update new bidder's wallet
    const bidderRef = doc(db, "players", bidderId);
    await updateDoc(bidderRef, {
      wallet: bidderWallet - bidAmount
    });
    
    // Update gamer tag record
    await updateDoc(tagRef, {
      currentBid: bidAmount,
      currentBidder: bidderId
    });
    
    // Create transaction record
    await addDoc(collection(db, "transactions"), {
      type: "gamerTagBid",
      from: tagData.currentBidder || tagData.currentOwner,
      to: bidderId,
      tag: tag,
      amount: bidAmount,
      timestamp: serverTimestamp(),
      status: "pending"
    } as TransactionRecord);
    
    return { 
      success: true, 
      message: `Bid placed: ${bidAmount} CQG Coins for ${tag}` 
    };
  } catch (error) {
    console.error("Error placing bid:", error);
    return { success: false, message: "Failed to place bid" };
  }
}

// Resolve auction (called by admin or system)
export async function resolveGamerTagAuction(tag: string): Promise<{ success: boolean; message: string }> {
  try {
    const tagRef = doc(db, "gamerTags", tag.toLowerCase());
    const tagSnap = await getDoc(tagRef);
    
    if (!tagSnap.exists()) {
      return { success: false, message: "Gamer tag not found" };
    }
    
    const tagData = tagSnap.data() as GamerTagRecord;
    
    if (tagData.status !== "auction") {
      return { success: false, message: "This gamer tag is not in auction" };
    }
    
    const winnerId = tagData.currentBidder;
    const winningBid = tagData.currentBid;
    const oldOwnerId = tagData.currentOwner;
    
    if (!winnerId || !winningBid) {
      return { success: false, message: "No valid bid found" };
    }
    
    // Generate fallback tag for old owner
    const fallbackTag = await generateFallbackTag(oldOwnerId);
    
    // Update old owner's profile
    const oldOwnerRef = doc(db, "players", oldOwnerId);
    await updateDoc(oldOwnerRef, {
      gamerTag: fallbackTag,
      displayName: fallbackTag
    });
    
    // Update winner's profile
    const winnerRef = doc(db, "players", winnerId);
    await updateDoc(winnerRef, {
      gamerTag: tag,
      displayName: tag
    });
    
    // Update gamer tag record
    await updateDoc(tagRef, {
      currentOwner: winnerId,
      status: "active",
      claimable: true,
      lastClaimedAt: serverTimestamp()
    });
    
    // Update transaction records
    const transactionsRef = collection(db, "transactions");
    const q = query(
      transactionsRef,
      where("tag", "==", tag),
      where("status", "==", "pending")
    );
    const transactionsSnap = await getDocs(q);
    
    transactionsSnap.forEach(async (doc) => {
      await updateDoc(doc.ref, { status: "completed" });
    });
    
    return { 
      success: true, 
      message: `Auction resolved. ${tag} won by ${winnerId} for ${winningBid} CQG Coins` 
    };
  } catch (error) {
    console.error("Error resolving auction:", error);
    return { success: false, message: "Failed to resolve auction" };
  }
}
