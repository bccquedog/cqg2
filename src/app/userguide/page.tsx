"use client";

import { useState } from "react";
import {
  Trophy,
  Users,
  Gamepad2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Home,
  Play,
  Eye,
  BarChart3,
  DollarSign,
  Shield,
  HelpCircle,
  Search,
  Monitor,
  Target,
  Award,
  Settings,
  CheckCircle,
  AlertCircle,
  Video,
  TrendingUp,
  Zap,
  BookOpen
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: {
    subtitle: string;
    description: string;
    steps?: string[];
    tips?: string[];
  }[];
}

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Home className="h-5 w-5" />,
    content: [
      {
        subtitle: "Welcome to CQG Platform",
        description: "CQG (Community Gaming Quest) Platform is your ultimate competitive gaming tournament platform. Whether you're a casual player or aspiring pro, we provide everything you need to compete, connect, and conquer in the world of competitive gaming.",
        tips: [
          "Start by creating your player profile",
          "Add your gamer tags for different games",
          "Browse available tournaments to get familiar with the platform"
        ]
      },
      {
        subtitle: "Creating Your Account",
        description: "To get started on CQG Platform, you'll need to create an account and set up your player profile.",
        steps: [
          "Click the 'Sign Up' or 'Login' button in the navigation",
          "Complete the authentication process",
          "You'll be prompted with a first-time setup modal",
          "Enter your display name and preferred gamer tag",
          "Click 'Complete Setup' to finish"
        ],
        tips: [
          "Choose a memorable display name - this is how other players will see you",
          "Your gamer tag should match your in-game username for easy identification"
        ]
      },
      {
        subtitle: "Setting Up Your Profile",
        description: "Your player profile is your identity on CQG Platform. It showcases your stats, achievements, and tournament history.",
        steps: [
          "Navigate to your profile page",
          "Add gamer tags for different games you play",
          "Update your bio and personal information",
          "Track your tournament history and stats"
        ]
      }
    ]
  },
  {
    id: "tournaments",
    title: "Tournaments",
    icon: <Trophy className="h-5 w-5" />,
    content: [
      {
        subtitle: "Browsing Tournaments",
        description: "The tournaments page shows all available competitions. You can filter by status to find exactly what you're looking for.",
        steps: [
          "Visit the /tournaments page from the homepage",
          "Use filter buttons: All, Upcoming, Live, or Completed",
          "View tournament cards showing key information",
          "Click on any tournament to see full details"
        ],
        tips: [
          "Live tournaments show real-time match counts with a pulsing badge",
          "Progress bars indicate how far along a tournament is",
          "Check the entry fee (buy-in) before joining"
        ]
      },
      {
        subtitle: "Tournament Types",
        description: "CQG Platform supports various tournament formats to suit different competitive styles.",
        steps: [
          "Single Elimination: Lose once, you're out. Fast-paced and intense.",
          "Double Elimination: Get a second chance in the losers bracket.",
          "Swiss: Play multiple rounds, face opponents with similar records.",
          "Round Robin: Everyone plays everyone. Most comprehensive format."
        ]
      },
      {
        subtitle: "Joining a Tournament",
        description: "Ready to compete? Joining a tournament is simple and straightforward.",
        steps: [
          "Navigate to the tournament detail page",
          "Click the 'Join Tournament' button",
          "If there's a buy-in, complete the payment process",
          "Confirm your registration",
          "Wait for the tournament to start"
        ],
        tips: [
          "Check the max player limit - tournaments fill up fast!",
          "Make sure you're available for the start time",
          "Some tournaments require check-in before matches begin"
        ]
      },
      {
        subtitle: "Tournament Check-In",
        description: "Many tournaments require check-in to confirm you're ready to play.",
        steps: [
          "Return to the tournament page near start time",
          "Click the 'Check In' button when available",
          "Wait for the tournament to begin",
          "Check your match schedule once brackets are generated"
        ],
        tips: [
          "Check-in usually opens 15-30 minutes before start",
          "Missing check-in may result in disqualification",
          "Set a reminder so you don't forget!"
        ]
      }
    ]
  },
  {
    id: "matches",
    title: "Matches",
    icon: <Gamepad2 className="h-5 w-5" />,
    content: [
      {
        subtitle: "Understanding Match Schedules",
        description: "Once a tournament starts, matches are generated and scheduled. You'll receive notifications when your matches are ready.",
        steps: [
          "View your upcoming matches on the tournament page",
          "Check match times and opponents",
          "Note the match format (Bo1, Bo3, Bo5, etc.)",
          "Join the match when it's time to play"
        ]
      },
      {
        subtitle: "Playing Your Match",
        description: "When your match is ready, it's time to compete!",
        steps: [
          "Navigate to the match detail page",
          "Connect with your opponent (via chat or external platform)",
          "Play the match according to tournament rules",
          "Keep track of game wins and scores",
          "Report the results when finished"
        ],
        tips: [
          "Be respectful to your opponent",
          "Follow the tournament's specific rules",
          "Take screenshots of results as proof if needed"
        ]
      },
      {
        subtitle: "Submitting Match Results",
        description: "After your match, both players should submit the results.",
        steps: [
          "Go to the match page",
          "Click 'Submit Result' or 'Report Score'",
          "Enter the score (games won by each player)",
          "Add any notes or comments if needed",
          "Submit the result"
        ],
        tips: [
          "Both players should submit matching results",
          "If results don't match, a dispute may be opened",
          "Attach proof (screenshots) when available"
        ]
      },
      {
        subtitle: "Handling Disputes",
        description: "If there's a disagreement about match results, the dispute system helps resolve it.",
        steps: [
          "If results don't match, a dispute is automatically created",
          "Provide your evidence (screenshots, videos)",
          "Wait for an admin or tournament organizer to review",
          "The admin will make a final decision",
          "Match result is updated accordingly"
        ],
        tips: [
          "Always take screenshots of final scores",
          "Be honest and fair in your submissions",
          "Respond promptly to admin questions"
        ]
      }
    ]
  },
  {
    id: "player-profiles",
    title: "Player Profiles",
    icon: <Users className="h-5 w-5" />,
    content: [
      {
        subtitle: "Viewing Player Profiles",
        description: "Player profiles show comprehensive stats, tournament history, and achievements.",
        steps: [
          "Click on any player's name throughout the platform",
          "View their tournament history and performance",
          "Check their gamer tags for different games",
          "See their win/loss record and achievements"
        ]
      },
      {
        subtitle: "Managing Your Profile",
        description: "Keep your profile up-to-date to showcase your gaming prowess.",
        steps: [
          "Navigate to your profile page",
          "Click 'Edit Profile' or settings",
          "Update your display name, bio, and other details",
          "Add or update gamer tags",
          "Save your changes"
        ],
        tips: [
          "Accurate gamer tags help opponents find you in-game",
          "Keep your profile updated with current information",
          "Your stats update automatically as you compete"
        ]
      },
      {
        subtitle: "Gamer Tags",
        description: "Gamer tags link your CQG profile to your in-game identities.",
        steps: [
          "Go to your profile settings or gamer tag editor",
          "Select the game platform",
          "Enter your exact in-game username",
          "Verify the tag if required",
          "Save your gamer tag"
        ],
        tips: [
          "Use your exact in-game name for accuracy",
          "You can have different tags for different games",
          "Update tags if you change your in-game name"
        ]
      }
    ]
  },
  {
    id: "spectating",
    title: "Spectating & Streaming",
    icon: <Eye className="h-5 w-5" />,
    content: [
      {
        subtitle: "Spectator Mode",
        description: "Watch live tournament matches and follow your favorite players.",
        steps: [
          "Navigate to a live tournament",
          "Click on any live match to spectate",
          "View real-time scores and updates",
          "Switch between different matches",
          "Chat with other spectators (if enabled)"
        ]
      },
      {
        subtitle: "Streaming with OBS",
        description: "CQG Platform integrates with OBS for professional-quality tournament streams.",
        steps: [
          "Install OBS Studio on your computer",
          "Navigate to the OBS control panel in CQG",
          "Copy the browser source URL for overlays",
          "Add the browser source to your OBS scene",
          "Configure overlay settings and go live"
        ],
        tips: [
          "Test your overlay setup before going live",
          "Use the spectator overlay for clean tournament broadcasts",
          "RedZone overlay highlights critical moments"
        ]
      },
      {
        subtitle: "Match Overlays",
        description: "Professional overlays enhance your stream with live tournament data.",
        steps: [
          "Access overlay controls from the tournament admin panel",
          "Choose your overlay type (spectator, arena, redzone)",
          "Copy the overlay URL",
          "Add as browser source in OBS",
          "Customize colors and themes as needed"
        ]
      },
      {
        subtitle: "Clips and Highlights",
        description: "Capture and share your best gaming moments.",
        steps: [
          "During or after a match, create a clip",
          "Select the timestamp and duration",
          "Add a title and description",
          "Share your clip with the community",
          "View clips in the Replay Vault"
        ],
        tips: [
          "Clips auto-prune after a set number of days (check settings)",
          "Some clips may go through moderation before being public",
          "Featured clips appear in the spotlight section"
        ]
      }
    ]
  },
  {
    id: "leaderboards",
    title: "Leaderboards & Rankings",
    icon: <BarChart3 className="h-5 w-5" />,
    content: [
      {
        subtitle: "Viewing Leaderboards",
        description: "Track your ranking and compare your performance with other players.",
        steps: [
          "Navigate to the /leaderboards page",
          "Filter by game or league",
          "View global or game-specific rankings",
          "Check detailed stats for top players",
          "See your own ranking and percentile"
        ]
      },
      {
        subtitle: "How Rankings Work",
        description: "Your ranking is calculated based on tournament performance, wins, and other factors.",
        tips: [
          "Rankings update after each tournament completion",
          "Different games may have separate leaderboards",
          "Consistent performance improves your rank over time",
          "Inactive players may be moved to archived leaderboards"
        ]
      },
      {
        subtitle: "League Standings",
        description: "For league competitions, standings show team/player performance throughout the season.",
        steps: [
          "Navigate to a specific league",
          "View the standings table",
          "Check wins, losses, and point differential",
          "Track your position in the league",
          "Monitor upcoming match schedules"
        ]
      }
    ]
  },
  {
    id: "payments",
    title: "Payments & Buy-ins",
    icon: <DollarSign className="h-5 w-5" />,
    content: [
      {
        subtitle: "Understanding Entry Fees",
        description: "Some tournaments have entry fees (buy-ins) that contribute to prize pools.",
        steps: [
          "Check the tournament card for buy-in amount",
          "Entry fees are shown in USD (e.g., $5.00)",
          "Buy-ins contribute to the total prize pool",
          "Payment is required before joining the tournament"
        ]
      },
      {
        subtitle: "Payment Methods",
        description: "CQG Platform uses Stripe for secure payment processing.",
        steps: [
          "Click 'Join Tournament' on a paid tournament",
          "You'll be redirected to the payment page",
          "Enter your payment details (credit/debit card)",
          "Complete the Stripe checkout process",
          "You'll be registered upon successful payment"
        ],
        tips: [
          "All payments are processed securely through Stripe",
          "You'll receive a confirmation email after payment",
          "Check refund policies before entering paid tournaments"
        ]
      },
      {
        subtitle: "Prize Pools",
        description: "Prize pools accumulate from entry fees and may include additional sponsor contributions.",
        tips: [
          "Prize pool amount is shown on the tournament page",
          "Distribution depends on tournament settings (e.g., 1st: 50%, 2nd: 30%, 3rd: 20%)",
          "Winners receive prizes according to their placement",
          "Prize payouts are handled by tournament organizers"
        ]
      }
    ]
  },
  {
    id: "admin",
    title: "Admin Features",
    icon: <Shield className="h-5 w-5" />,
    content: [
      {
        subtitle: "Admin Dashboard Access",
        description: "Tournament admins and platform moderators have access to advanced management tools.",
        steps: [
          "Navigate to /admin (requires admin permissions)",
          "Select the section you want to manage",
          "Make changes using the admin controls",
          "Changes sync in real-time to the platform"
        ],
        tips: [
          "Different admin roles have different permissions",
          "Super admins can access all sections",
          "Moderators have limited access to specific features"
        ]
      },
      {
        subtitle: "Tournament Management",
        description: "Admins can create, edit, archive, and manage tournaments.",
        steps: [
          "Go to Admin > Competitions Manager",
          "Toggle between Tournaments and Leagues",
          "Create new competitions with the form",
          "Edit existing tournaments by clicking 'Edit'",
          "Archive completed tournaments for data retention"
        ],
        tips: [
          "Archived tournaments are auto-exported before deletion",
          "Use duplicate feature to quickly create similar tournaments",
          "Monitor tournament statistics in real-time"
        ]
      },
      {
        subtitle: "Match Validation & Overrides",
        description: "Admins can validate match results and override scores when necessary.",
        steps: [
          "View disputed or pending matches",
          "Review submitted evidence from both players",
          "Make a decision on the correct result",
          "Override match scores if needed",
          "Document the decision in audit logs"
        ]
      },
      {
        subtitle: "Audit Logs",
        description: "All admin actions are logged for security and accountability.",
        steps: [
          "Navigate to Admin > Audit Logs",
          "Filter by admin ID or action type",
          "Review recent administrative actions",
          "Check details and timestamps",
          "Export logs if needed for compliance"
        ]
      }
    ]
  },
  {
    id: "faq",
    title: "FAQ & Troubleshooting",
    icon: <HelpCircle className="h-5 w-5" />,
    content: [
      {
        subtitle: "Common Questions",
        description: "Quick answers to frequently asked questions.",
        steps: [
          "Q: How do I join a tournament? A: Navigate to the tournament page and click 'Join Tournament'. Complete payment if required.",
          "Q: What if my opponent doesn't show up? A: Wait for the grace period to expire, then report a no-show to admins.",
          "Q: Can I change my gamer tag? A: Yes, go to your profile settings and update your gamer tag at any time.",
          "Q: How are prizes distributed? A: Winners are contacted by tournament organizers for prize distribution.",
          "Q: What happens if I miss check-in? A: You may be disqualified. Always check-in on time!"
        ]
      },
      {
        subtitle: "Technical Issues",
        description: "Troubleshooting common technical problems.",
        steps: [
          "Issue: Can't join tournament - Check if max players is reached or if you're already registered",
          "Issue: Match not showing - Refresh the page and check your tournament tab",
          "Issue: Payment failed - Verify your card details and try again, or contact support",
          "Issue: Can't submit result - Ensure you have the correct permissions and match is active",
          "Issue: Overlay not loading in OBS - Verify the browser source URL and check OBS settings"
        ]
      },
      {
        subtitle: "Getting Help",
        description: "Need more assistance? Here's how to get support.",
        steps: [
          "Check this user guide for answers first",
          "Contact tournament admins for competition-specific issues",
          "Report bugs via GitHub Issues (for developers)",
          "Join the community Discord for real-time help",
          "Email support for account or payment issues"
        ],
        tips: [
          "Include as much detail as possible when reporting issues",
          "Screenshots help support staff understand your problem",
          "Check announcements for known issues and scheduled maintenance"
        ]
      }
    ]
  }
];

export default function UserGuidePage() {
  const [activeSection, setActiveSection] = useState<string>("getting-started");
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleItem = (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter sections based on search query
  const filteredSections = sections.map(section => {
    if (!searchQuery) return section;

    const matchesTitle = section.title.toLowerCase().includes(searchQuery.toLowerCase());
    const filteredContent = section.content.filter(item =>
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.steps?.some(step => step.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.tips?.some(tip => tip.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (matchesTitle || filteredContent.length > 0) {
      return {
        ...section,
        content: matchesTitle ? section.content : filteredContent
      };
    }
    return null;
  }).filter(Boolean) as Section[];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold">User Guide</h1>
              <p className="text-lg text-blue-100 mt-2">Everything you need to know about CQG Platform</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search the user guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contents</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {section.icon}
                    <span className="font-medium text-sm">{section.title}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <a href="/" className="block text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    Home
                  </a>
                  <a href="/tournaments" className="block text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    Tournaments
                  </a>
                  <a href="/players" className="block text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    Players
                  </a>
                  <a href="/leaderboards" className="block text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    Leaderboards
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="space-y-12">
              {filteredSections.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">No results found</h2>
                  <p className="text-gray-600">Try searching with different keywords</p>
                </div>
              ) : (
                filteredSections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 scroll-mt-8"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                        {section.icon}
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                    </div>

                    <div className="space-y-6">
                      {section.content.map((item, index) => {
                        const isExpanded = expandedItems[`${section.id}-${index}`] ?? true;
                        return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all"
                          >
                            <button
                              onClick={() => toggleItem(section.id, index)}
                              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-purple-50 transition-all"
                            >
                              <h3 className="text-xl font-semibold text-gray-900 text-left">
                                {item.subtitle}
                              </h3>
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="p-6 pt-0 space-y-4">
                                <p className="text-gray-700 leading-relaxed">{item.description}</p>

                                {item.steps && item.steps.length > 0 && (
                                  <div className="bg-blue-50 rounded-xl p-5">
                                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                      <CheckCircle className="h-5 w-5" />
                                      Steps
                                    </h4>
                                    <ol className="space-y-2">
                                      {item.steps.map((step, stepIndex) => (
                                        <li key={stepIndex} className="flex gap-3 text-sm text-blue-900">
                                          <span className="font-bold flex-shrink-0">{stepIndex + 1}.</span>
                                          <span>{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}

                                {item.tips && item.tips.length > 0 && (
                                  <div className="bg-amber-50 rounded-xl p-5">
                                    <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                      <Zap className="h-5 w-5" />
                                      Tips
                                    </h4>
                                    <ul className="space-y-2">
                                      {item.tips.map((tip, tipIndex) => (
                                        <li key={tipIndex} className="flex gap-3 text-sm text-amber-900">
                                          <span className="flex-shrink-0 mt-1">💡</span>
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            {/* Footer Help Section */}
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
                  <p className="text-blue-100 mb-4">
                    Can't find what you're looking for? Our support team is here to help!
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/"
                      className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
                    >
                      Back to Home
                    </a>
                    <a
                      href="/tournaments"
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/30 transition-all"
                    >
                      Browse Tournaments
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
