"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTournamentContext } from "@/hooks/useTournamentContext";
import { useToast } from "@/components/Toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/enhanced-card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/enhanced-badge";
import { 
  Trophy, 
  Gamepad2, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Wand2,
  Sparkles,
  SkipForward,
  ArrowRight,
  X,
  Mail,
  Lock,
  User
} from "lucide-react";
import { 
  generateAIUsernameSuggestions, 
  validateAIUsername, 
  getCategoryEmoji,
  type UsernameSuggestion 
} from "@/lib/aiUsernameGenerator";
import { checkGamerTagAvailability, takeoverGamerTag, createGamerTagRecord } from "@/lib/gamerTagSystem";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { serverTimestamp } from "firebase/firestore";

interface ConsolidatedAuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function ConsolidatedAuthModal({ 
  open, 
  onClose, 
  initialMode = "signin" 
}: ConsolidatedAuthModalProps) {
  const { signIn, signUp, completeSignUp } = useAuth();
  const { tournamentId, isJoinPage } = useTournamentContext();
  const { showToast } = useToast();
  
  // Auth state
  const [mode, setMode] = useState<"signin" | "signup" | "gamerTag">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTournament, setPendingTournament] = useState<{id: string, name: string} | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  
  // Gamer tag setup state
  const [gamerTagMode, setGamerTagMode] = useState<"select" | "auto" | "custom" | "ai">("select");
  const [customTag, setCustomTag] = useState("");
  const [autoTag, setAutoTag] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<UsernameSuggestion[]>([]);
  const [selectedAITag, setSelectedAITag] = useState<UsernameSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showTakeover, setShowTakeover] = useState(false);
  const [takeoverPrice, setTakeoverPrice] = useState(500);

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Generate auto tag when modal opens
  useEffect(() => {
    if (mode === "gamerTag" && gamerTagMode === "auto") {
      generateAutoTag();
    }
  }, [mode, gamerTagMode]);

  // Generate AI suggestions when modal opens in AI mode
  useEffect(() => {
    if (mode === "gamerTag" && gamerTagMode === "ai") {
      generateAISuggestions();
    }
  }, [mode, gamerTagMode]);

  const generateAutoTag = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setAutoTag(`CQG_Player${randomDigits}`);
  };

  const generateAISuggestions = async () => {
    setAiLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const suggestions = generateAIUsernameSuggestions(5);
      setAiSuggestions(suggestions);
      setSelectedAITag(suggestions[0]);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setError('Failed to generate AI suggestions. Please try again.');
    } finally {
      setAiLoading(false);
    }
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

  const handleSkipForNow = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "players", userId), {
        gamerTag: null,
        displayName: userEmail.split('@')[0],
        email: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
        stats: {},
        wallet: 1000,
        setupComplete: false
      });

      await completeSignUp(null, pendingTournament?.id);
      onClose();
      showToast("Welcome to CQG! You can set up your gamer tag later in your profile.", "success");
    } catch (error) {
      setError("Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeGamerTagSetup = async (gamerTag: string) => {
    try {
      await setDoc(doc(db, "players", userId), {
        gamerTag: gamerTag,
        displayName: gamerTag,
        email: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
        stats: {},
        wallet: 1000,
        setupComplete: true
      });

      await createGamerTagRecord(gamerTag, userId);
      await completeSignUp(gamerTag, pendingTournament?.id);
      
      onClose();
      if (pendingTournament) {
        showToast(`Welcome to CQG! You've been added to ${pendingTournament.name}.`, "success");
      } else {
        showToast(`Welcome to CQG! Your gamer tag is ${gamerTag}.`, "success");
      }
    } catch (error) {
      setError("Failed to complete setup. Please try again.");
    }
  };

  const handleAutoGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const uniqueness = await checkUniqueness(autoTag);
      if (!uniqueness.available) {
        generateAutoTag();
        setError("Tag was taken, generating a new one...");
        setTimeout(() => handleAutoGenerate(), 1000);
        return;
      }

      await completeGamerTagSetup(autoTag);
    } catch (error) {
      setError("Failed to generate gamer tag. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedAITag) return;
    
    setLoading(true);
    setError(null);

    try {
      const validation = validateAIUsername(selectedAITag.username);
      if (!validation.valid) {
        setError(validation.error || 'Invalid username');
        setLoading(false);
        return;
      }

      const uniqueness = await checkUniqueness(selectedAITag.username);
      if (!uniqueness.available) {
        setError("This AI suggestion was taken. Generating new ones...");
        await generateAISuggestions();
        setLoading(false);
        return;
      }

      await completeGamerTagSetup(selectedAITag.username);
    } catch (error) {
      setError("Failed to validate AI username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    setLoading(true);
    setError(null);

    const validationError = validateGamerTag(customTag);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const uniqueness = await checkUniqueness(customTag);
      if (!uniqueness.available) {
        if (uniqueness.canClaim) {
          setTakeoverPrice(uniqueness.claimPrice || 500);
          setShowTakeover(true);
          setLoading(false);
          return;
        } else {
          setError("This gamer tag is already taken. Please choose another.");
          setLoading(false);
          return;
        }
      }

      await completeGamerTagSetup(customTag);
    } catch (error) {
      setError("Failed to validate gamer tag. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTakeover = async () => {
    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, "players", userId);
      const userSnap = await getDoc(userRef);
      const userWallet = userSnap.data()?.wallet || 1000;

      const result = await takeoverGamerTag(customTag, userId, userWallet);
      
      if (result.success) {
        showToast(result.message, "success");
        await completeGamerTagSetup(customTag);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to take over gamer tag. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        onClose();
      } else {
        const result = await signUp(email, password, isJoinPage ? tournamentId : undefined);
        
        if (result.needsGamerTag) {
          const storedTournament = sessionStorage.getItem('pendingTournament');
          if (storedTournament) {
            setPendingTournament(JSON.parse(storedTournament));
          }
          setUserId(result.userId || "");
          setUserEmail(email);
          setMode("gamerTag");
        } else {
          onClose();
          if (result.tournamentName) {
            showToast(`Welcome to CQG! You've been added to ${result.tournamentName}.`, "success");
          } else {
            showToast("Welcome to CQG! Profile created successfully.", "success");
          }
        }
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card variant="elevated" size="lg" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader spacing="normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <CardTitle level="h2" className="text-2xl font-bold text-neutral-900">
                  {mode === "gamerTag" ? "Welcome to CQG!" : "Join CQG"}
                </CardTitle>
                <p className="text-neutral-600 text-sm mt-1">
                  {mode === "gamerTag" 
                    ? "Let&apos;s set up your gamer tag. This is how other players will see you in tournaments and matches."
                    : "Create your gaming profile"
                  }
                </p>
              </div>
            </div>
            
            {mode === "gamerTag" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipForNow}
                disabled={loading}
                leftIcon={<SkipForward className="h-4 w-4" />}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Skip for now
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent spacing="normal">
          {mode === "signin" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-neutral-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3 text-neutral-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
                  <div className="flex items-center gap-2 text-error-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={submit}
                disabled={loading || !email || !password}
                loading={loading}
                variant="default"
                size="lg"
                className="w-full"
                leftIcon={<User className="h-5 w-5" />}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center pt-4">
                <p className="text-neutral-600 text-sm">
                  Don&apos;t have an account?{" "}
                  <button 
                    className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors duration-200" 
                    onClick={() => setMode("signup")}
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-neutral-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3 text-neutral-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
                  <div className="flex items-center gap-2 text-error-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={submit}
                disabled={loading || !email || !password}
                loading={loading}
                variant="default"
                size="lg"
                className="w-full"
                leftIcon={<User className="h-5 w-5" />}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="text-center pt-4">
                <p className="text-neutral-600 text-sm">
                  Already have an account?{" "}
                  <button 
                    className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors duration-200" 
                    onClick={() => setMode("signin")}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {mode === "gamerTag" && (
            <div className="space-y-6">
              {gamerTagMode === "select" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Button
                      onClick={() => setGamerTagMode("auto")}
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center space-y-3 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
                        <Gamepad2 className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-neutral-900 text-lg">Auto-Generate</h4>
                        <p className="text-sm text-neutral-600 mt-1">We&apos;ll create a unique tag for you</p>
                      </div>
                    </Button>

                    <Button
                      onClick={() => setGamerTagMode("ai")}
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center space-y-3 hover:border-secondary-500 hover:bg-secondary-50 transition-all duration-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-secondary-600" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-neutral-900 text-lg">AI Suggestions</h4>
                        <p className="text-sm text-neutral-600 mt-1">Get creative, gaming-themed names</p>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      onClick={() => setGamerTagMode("custom")}
                      variant="outline"
                      className="w-full h-auto p-6 flex items-center justify-center space-x-3 hover:border-success-500 hover:bg-success-50 transition-all duration-200"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-success-100 to-success-200 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-success-600" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-neutral-900 text-lg">Create Your Own</h4>
                        <p className="text-sm text-neutral-600 mt-1">Choose a custom gamer tag</p>
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              {gamerTagMode === "auto" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Gamepad2 className="h-8 w-8 text-primary-600" />
                    </div>
                    <h4 className="text-xl font-bold text-neutral-900 mb-2">Auto-Generated Tag</h4>
                    <div className="text-2xl font-mono bg-neutral-100 p-4 rounded-xl border-2 border-dashed border-neutral-300">
                      {autoTag}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-500">
                    <Badge variant="secondary" size="sm">3-16 characters</Badge>
                    <Badge variant="secondary" size="sm">Letters, numbers, underscores</Badge>
                    <Badge variant="secondary" size="sm">Must be unique</Badge>
                  </div>

                  {error && (
                    <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
                      <div className="flex items-center gap-2 text-error-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setGamerTagMode("select")}
                      variant="outline"
                      className="flex-1"
                      leftIcon={<ArrowRight className="h-4 w-4 rotate-180" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleAutoGenerate}
                      disabled={loading}
                      loading={loading}
                      variant="default"
                      className="flex-1"
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                      {loading ? "Checking..." : "Use This Tag"}
                    </Button>
                  </div>
                </div>
              )}

              {gamerTagMode === "ai" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-secondary-600" />
                    </div>
                    <h4 className="text-xl font-bold text-neutral-900 mb-2">AI-Generated Suggestions</h4>
                    <p className="text-neutral-600 text-sm">Choose from our AI-powered gaming usernames</p>
                  </div>

                  {aiLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                          <Wand2 className="h-6 w-6 text-secondary-600" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-neutral-700 font-medium">Generating AI suggestions...</p>
                          <p className="text-neutral-500 text-sm">Creating unique gaming usernames</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedAITag(suggestion)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            selectedAITag?.username === suggestion.username
                              ? 'border-primary-500 bg-primary-50 shadow-md'
                              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{getCategoryEmoji(suggestion.category)}</div>
                              <div>
                                <div className="font-mono text-lg font-bold text-neutral-900">
                                  {suggestion.username}
                                </div>
                                <div className="text-sm text-neutral-600">
                                  {suggestion.category} • {suggestion.description}
                                </div>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              selectedAITag?.username === suggestion.username
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-neutral-300'
                            }`}>
                              {selectedAITag?.username === suggestion.username && (
                                <CheckCircle className="w-3 h-3 text-white m-0.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-center">
                        <Button
                          onClick={generateAISuggestions}
                          variant="ghost"
                          size="sm"
                          leftIcon={<RefreshCw className="h-4 w-4" />}
                          className="text-neutral-600 hover:text-secondary-600"
                        >
                          Generate More
                        </Button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
                      <div className="flex items-center gap-2 text-error-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setGamerTagMode("select")}
                      variant="outline"
                      className="flex-1"
                      leftIcon={<ArrowRight className="h-4 w-4 rotate-180" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleAIGenerate}
                      disabled={loading || !selectedAITag || aiLoading}
                      loading={loading}
                      variant="default"
                      className="flex-1"
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                      {loading ? "Checking..." : "Use This Tag"}
                    </Button>
                  </div>
                </div>
              )}

              {gamerTagMode === "custom" && !showTakeover && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-success-600" />
                    </div>
                    <h4 className="text-xl font-bold text-neutral-900 mb-2">Create Your Own</h4>
                    <p className="text-neutral-600 text-sm">Choose your custom gamer tag</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-neutral-700">Your Gamer Tag</label>
                      <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder="Enter your gamer tag"
                        className="w-full border-2 border-neutral-300 rounded-xl px-4 py-3 text-lg font-mono focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                        maxLength={16}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-neutral-500">
                          {customTag.length}/16 characters
                        </span>
                        {customTag.length >= 3 && (
                          <CheckCircle className="h-4 w-4 text-success-600" />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" size="sm">3-16 characters</Badge>
                      <Badge variant="secondary" size="sm">Letters, numbers, underscores</Badge>
                      <Badge variant="secondary" size="sm">Must be unique</Badge>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
                      <div className="flex items-center gap-2 text-error-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setGamerTagMode("select")}
                      variant="outline"
                      className="flex-1"
                      leftIcon={<ArrowRight className="h-4 w-4 rotate-180" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCustomSubmit}
                      disabled={loading || customTag.length < 3}
                      loading={loading}
                      variant="success"
                      className="flex-1"
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                      {loading ? "Checking..." : "Confirm Tag"}
                    </Button>
                  </div>
                </div>
              )}

              {showTakeover && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-warning-100 to-warning-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-warning-600" />
                    </div>
                    <h4 className="text-xl font-bold text-neutral-900 mb-2">Gamer Tag Taken</h4>
                    <div className="text-2xl font-mono bg-neutral-100 p-4 rounded-xl border-2 border-dashed border-neutral-300 mb-3">
                      {customTag}
                    </div>
                    <p className="text-neutral-600 text-sm">
                      This gamer tag is already taken by another player
                    </p>
                  </div>

                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-warning-800 mb-1">
                          Takeover Option Available
                        </p>
                        <p className="text-sm text-warning-700">
                          You can claim this gamer tag for <span className="font-bold">{takeoverPrice} CQG Coins</span>.
                          The current owner will be reassigned a fallback tag.
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
                      <div className="flex items-center gap-2 text-error-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setShowTakeover(false);
                        setError(null);
                      }}
                      variant="outline"
                      className="flex-1"
                      leftIcon={<ArrowRight className="h-4 w-4 rotate-180" />}
                    >
                      Choose Different Tag
                    </Button>
                    <Button
                      onClick={handleTakeover}
                      disabled={loading}
                      loading={loading}
                      variant="warning"
                      className="flex-1"
                      leftIcon={<ExternalLink className="h-4 w-4" />}
                    >
                      {loading ? "Taking Over..." : `Take Over for ${takeoverPrice} CQG Coins`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
