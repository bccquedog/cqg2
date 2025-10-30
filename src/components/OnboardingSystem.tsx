"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import { 
  FiCheck, 
  FiArrowRight, 
  FiArrowLeft, 
  FiX, 
  FiUser, 
  FiSettings,
  FiBell,
  FiShield,
  FiStar,
  FiTarget,
  FiUsers,
  FiZap
} from "react-icons/fi";
import { FaTrophy } from "react-icons/fa";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<OnboardingStepProps>;
  isOptional?: boolean;
}

interface OnboardingStepProps {
  onNext: (data?: any) => void;
  onPrevious: () => void;
  onSkip: () => void;
  data?: any;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

interface OnboardingData {
  profileSetup: {
    gamerTag: string;
    preferredGame: string;
    skillLevel: string;
    playStyle: string[];
  };
  preferences: {
    notifications: boolean;
    privacy: boolean;
    competitive: boolean;
  };
  goals: {
    primaryGoal: string;
    timeCommitment: string;
    interests: string[];
  };
  complete: boolean;
}

const defaultData: OnboardingData = {
  profileSetup: {
    gamerTag: "",
    preferredGame: "",
    skillLevel: "",
    playStyle: []
  },
  preferences: {
    notifications: true,
    privacy: false,
    competitive: true
  },
  goals: {
    primaryGoal: "",
    timeCommitment: "",
    interests: []
  },
  complete: false
};

// Step 1: Welcome & Profile Setup
function WelcomeStep({ onNext, onSkip }: OnboardingStepProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
          <FiStar className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to CQG Platform!</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          The ultimate gaming tournament platform. Let's get you set up so you can start competing, 
          connecting, and conquering in the world of competitive gaming.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <FaTrophy className="h-8 w-8 text-blue-600 mb-4 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Tournaments</h3>
          <p className="text-sm text-gray-600">Join competitive tournaments and climb the leaderboards</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <FiUsers className="h-8 w-8 text-purple-600 mb-4 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
          <p className="text-sm text-gray-600">Connect with fellow gamers and build your network</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <FiZap className="h-8 w-8 text-green-600 mb-4 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Real-time</h3>
          <p className="text-sm text-gray-600">Live matches, instant updates, and seamless gameplay</p>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={onSkip}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip Setup
        </button>
        <button
          onClick={() => onNext()}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
        >
          <span>Get Started</span>
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Step 2: Profile Setup
function ProfileSetupStep({ onNext, onPrevious, data }: OnboardingStepProps) {
  const [gamerTag, setGamerTag] = useState(data?.gamerTag || "");
  const [preferredGame, setPreferredGame] = useState(data?.preferredGame || "");
  const [skillLevel, setSkillLevel] = useState(data?.skillLevel || "");
  const [playStyle, setPlayStyle] = useState<string[]>(data?.playStyle || []);

  const games = [
    "Call of Duty", "FIFA 24", "NBA 2K", "Rocket League", 
    "Valorant", "CS2", "League of Legends", "Dota 2", "Other"
  ];

  const skillLevels = [
    { value: "beginner", label: "Beginner", description: "New to competitive gaming" },
    { value: "intermediate", label: "Intermediate", description: "Some tournament experience" },
    { value: "advanced", label: "Advanced", description: "Regular competitor" },
    { value: "pro", label: "Pro", description: "Professional level" }
  ];

  const playStyles = [
    { value: "aggressive", label: "Aggressive", description: "High-risk, high-reward" },
    { value: "strategic", label: "Strategic", description: "Thoughtful and calculated" },
    { value: "supportive", label: "Supportive", description: "Team player focused" },
    { value: "adaptable", label: "Adaptable", description: "Flexible playstyle" }
  ];

  const togglePlayStyle = (style: string) => {
    setPlayStyle(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleNext = () => {
    onNext({
      gamerTag,
      preferredGame,
      skillLevel,
      playStyle
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto">
          <FiUser className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Set Up Your Profile</h2>
        <p className="text-gray-600">Tell us about your gaming preferences</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Gamer Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gamer Tag *</label>
          <input
            type="text"
            value={gamerTag}
            onChange={(e) => setGamerTag(e.target.value)}
            placeholder="Enter your unique gamer tag"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">This will be your display name across the platform</p>
        </div>

        {/* Preferred Game */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Game</label>
          <select
            value={preferredGame}
            onChange={(e) => setPreferredGame(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a game</option>
            {games.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>

        {/* Skill Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Skill Level</label>
          <div className="grid grid-cols-2 gap-3">
            {skillLevels.map(level => (
              <button
                key={level.value}
                onClick={() => setSkillLevel(level.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  skillLevel === level.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{level.label}</div>
                  <div className="text-sm text-gray-600">{level.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Play Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Play Style (Select all that apply)</label>
          <div className="grid grid-cols-2 gap-3">
            {playStyles.map(style => (
              <button
                key={style.value}
                onClick={() => togglePlayStyle(style.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  playStyle.includes(style.value)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{style.label}</div>
                  <div className="text-xs text-gray-600">{style.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <button
          onClick={handleNext}
          disabled={!gamerTag}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>Continue</span>
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Step 3: Preferences
function PreferencesStep({ onNext, onPrevious, data }: OnboardingStepProps) {
  const [notifications, setNotifications] = useState(data?.notifications ?? true);
  const [privacy, setPrivacy] = useState(data?.privacy ?? false);
  const [competitive, setCompetitive] = useState(data?.competitive ?? true);

  const handleNext = () => {
    onNext({
      notifications,
      privacy,
      competitive
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mx-auto">
          <FiSettings className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Set Your Preferences</h2>
        <p className="text-gray-600">Customize your CQG experience</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Notifications */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiBell className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Tournament Notifications</h3>
                <p className="text-sm text-gray-600">Get notified about new tournaments and match updates</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiShield className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Public Profile</h3>
                <p className="text-sm text-gray-600">Allow other players to view your profile and stats</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        {/* Competitive */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiTarget className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Competitive Mode</h3>
                <p className="text-sm text-gray-600">Focus on competitive tournaments and rankings</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={competitive}
                onChange={(e) => setCompetitive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
        >
          <span>Continue</span>
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Step 4: Goals & Interests
function GoalsStep({ onNext, onPrevious, onSkip, data }: OnboardingStepProps) {
  const [primaryGoal, setPrimaryGoal] = useState(data?.primaryGoal || "");
  const [timeCommitment, setTimeCommitment] = useState(data?.timeCommitment || "");
  const [interests, setInterests] = useState<string[]>(data?.interests || []);

  const goals = [
    { value: "competitive", label: "Compete Professionally", description: "Join pro tournaments and leagues" },
    { value: "casual", label: "Casual Gaming", description: "Play for fun and social connection" },
    { value: "improve", label: "Improve Skills", description: "Get better at my favorite games" },
    { value: "community", label: "Build Community", description: "Connect with other gamers" }
  ];

  const timeOptions = [
    { value: "light", label: "1-5 hours/week", description: "Light gaming schedule" },
    { value: "moderate", label: "6-15 hours/week", description: "Regular gaming sessions" },
    { value: "heavy", label: "16-30 hours/week", description: "Serious commitment" },
    { value: "intensive", label: "30+ hours/week", description: "Professional level" }
  ];

  const interestOptions = [
    "Tournaments", "Streaming", "Content Creation", "Coaching", 
    "Team Building", "Strategy Discussion", "Hardware Reviews", "Game Reviews"
  ];

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    onNext({
      primaryGoal,
      timeCommitment,
      interests
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto">
          <FiTarget className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">What Are Your Goals?</h2>
        <p className="text-gray-600">Help us personalize your experience</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Primary Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Primary Goal</label>
          <div className="grid grid-cols-2 gap-3">
            {goals.map(goal => (
              <button
                key={goal.value}
                onClick={() => setPrimaryGoal(goal.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  primaryGoal === goal.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{goal.label}</div>
                <div className="text-sm text-gray-600">{goal.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Commitment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Time Commitment</label>
          <div className="grid grid-cols-2 gap-3">
            {timeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTimeCommitment(option.value)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  timeCommitment === option.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Interests (Select all that apply)</label>
          <div className="grid grid-cols-2 gap-2">
            {interestOptions.map(interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  interests.includes(interest)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <div className="flex space-x-3">
          <button
            onClick={onSkip}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <span>Continue</span>
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 5: Completion
function CompletionStep({ onNext, data }: OnboardingStepProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Save onboarding data to Firestore
      await setDoc(doc(db, "userOnboarding", user.uid), {
        ...data,
        completedAt: new Date(),
        version: "1.0"
      });

      // Update user settings with onboarding preferences
      await setDoc(doc(db, "userSettings", user.uid), {
        notifications: {
          emailTournamentUpdates: data.preferences?.notifications ?? true,
          emailMatchResults: data.preferences?.notifications ?? true,
          pushNotifications: data.preferences?.notifications ?? true,
          discordNotifications: false,
        },
        privacy: {
          showEmail: false,
          showOnlineStatus: data.preferences?.privacy ?? true,
          allowFriendRequests: true,
          showInLeaderboards: data.preferences?.privacy ?? true,
        },
        gaming: {
          preferredGameMode: data.preferences?.competitive ? "competitive" : "casual",
          autoJoinTournaments: false,
          showAdvancedStats: data.preferences?.competitive ?? true,
          theme: "auto",
        },
        account: {
          twoFactorEnabled: false,
          deleteAccountAfter: 365,
        },
      }, { merge: true });

      showToast("Welcome to CQG Platform! Your profile is all set up.", "success");
      onNext();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      showToast("Failed to save your preferences. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto">
          <FiCheck className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">You're All Set!</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your CQG profile is ready. You can now start exploring tournaments, 
          connecting with other players, and building your gaming legacy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <FaTrophy className="h-8 w-8 text-blue-600 mb-4 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Join Tournaments</h3>
          <p className="text-sm text-gray-600">Browse and enter competitive tournaments</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <FiUsers className="h-8 w-8 text-purple-600 mb-4 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
          <p className="text-sm text-gray-600">Find teammates and build your network</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <FiSettings className="h-8 w-8 text-green-600 mb-4 mx-auto" />
          <h3 className="font-semibold text-gray-900 mb-2">Customize</h3>
          <p className="text-sm text-gray-600">Adjust your settings anytime</p>
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={loading}
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Setting up...</span>
          </>
        ) : (
          <>
            <span>Start Gaming</span>
            <FiArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

// Main Onboarding Component
export default function OnboardingSystem({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultData);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome",
      description: "Get started with CQG Platform",
      icon: FiStar,
      component: WelcomeStep
    },
    {
      id: "profile",
      title: "Profile Setup",
      description: "Set up your gaming profile",
      icon: FiUser,
      component: ProfileSetupStep
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Configure your settings",
      icon: FiSettings,
      component: PreferencesStep
    },
    {
      id: "goals",
      title: "Goals & Interests",
      description: "Tell us your gaming goals",
      icon: FiTarget,
      component: GoalsStep,
      isOptional: true
    },
    {
      id: "complete",
      title: "Complete",
      description: "You're all set!",
      icon: FiCheck,
      component: CompletionStep
    }
  ];

  const handleNext = (stepData?: any) => {
    if (stepData) {
      setOnboardingData(prev => ({
        ...prev,
        [steps[currentStep].id]: stepData
      }));
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleClose = () => {
    onComplete();
  };

  if (!open) return null;

  const currentStepComponent = steps[currentStep];
  const StepComponent = currentStepComponent.component;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome to CQG Platform</h1>
              <p className="text-blue-100">Step {currentStep + 1} of {steps.length}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex space-x-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    index <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-blue-100">
              {steps.map((step, index) => (
                <span
                  key={step.id}
                  className={`transition-colors ${
                    index <= currentStep ? 'text-white' : 'text-blue-200'
                  }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <StepComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            data={onboardingData[currentStepComponent.id as keyof OnboardingData]}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
