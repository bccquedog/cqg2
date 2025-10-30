"use client";

import { useState } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingSystem from "@/components/OnboardingSystem";
import { FiUser, FiSettings } from "react-icons/fi";

export default function OnboardingTrigger() {
  const { resetOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleStartOnboarding = () => {
    resetOnboarding();
    setShowOnboarding(true);
  };

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      <button
        onClick={handleStartOnboarding}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
      >
        <FiUser className="h-4 w-4 mr-2" />
        Setup Profile
      </button>
      
      <OnboardingSystem
        open={showOnboarding}
        onComplete={handleComplete}
      />
    </>
  );
}







