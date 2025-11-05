import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OnboardingData {
  profileSetup?: {
    gamerTag: string;
    preferredGame: string;
    skillLevel: string;
    playStyle: string[];
  };
  preferences?: {
    notifications: boolean;
    privacy: boolean;
    competitive: boolean;
  };
  goals?: {
    primaryGoal: string;
    timeCommitment: string;
    interests: string[];
  };
  completedAt?: Date;
  version?: string;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNeedsOnboarding(false);
      setOnboardingData(null);
      setLoading(false);
      return;
    }

    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check if user has completed onboarding
      const onboardingRef = doc(db, "userOnboarding", user.uid);
      const onboardingSnap = await getDoc(onboardingRef);
      
      if (onboardingSnap.exists()) {
        const data = onboardingSnap.data() as OnboardingData;
        setOnboardingData(data);
        setNeedsOnboarding(false);
      } else {
        // Check if user has a profile (legacy check)
        const profileRef = doc(db, "players", user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          // User has a profile but no onboarding record
          // Consider them as having completed basic onboarding
          setNeedsOnboarding(false);
        } else {
          // New user, needs onboarding
          setNeedsOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // On error, assume onboarding is needed
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  const resetOnboarding = () => {
    setNeedsOnboarding(true);
    setOnboardingData(null);
  };

  return {
    needsOnboarding,
    onboardingData,
    loading,
    completeOnboarding,
    resetOnboarding,
    checkOnboardingStatus
  };
}









