"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import MarketingEmailManager from "@/components/MarketingEmailManager";
import { Mail, Send, Users, Target, Calendar, Trophy, Star, Gift } from "lucide-react";

export default function MarketingEmailTestPage() {
  const { showToast } = useToast();
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [loading, setLoading] = useState(false);

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      showToast("Please enter a test email address", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketing/send-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          userName: "Test User",
          gamerTag: "TestGamer",
          campaignType: 'welcome',
          subject: 'Welcome to CQG Platform! 🎮',
          content: {
            title: 'Welcome to CQG Platform!',
            subtitle: 'Your gaming journey starts here',
            mainMessage: 'We\'re excited to have you join the CQG Platform community! Get ready to compete in tournaments, climb leaderboards, and connect with fellow gamers.',
            ctaText: 'Get Started',
            ctaUrl: 'https://cqgplatform.com/dashboard',
            features: [
              'Join competitive tournaments',
              'Track your performance',
              'Connect with the community',
              'Earn achievements and rewards'
            ],
            tournamentInfo: {
              name: 'Weekly Championship',
              date: 'March 15, 2024',
              prize: '$5,000',
              participants: 128
            }
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast("Test marketing email sent successfully!", "success");
      } else {
        showToast(result.error || "Failed to send test email", "error");
      }
    } catch (error) {
      showToast("Failed to send test email", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Email System</h1>
          <p className="text-gray-600">Test and manage marketing email campaigns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Marketing Email Manager */}
          <div className="lg:col-span-2">
            <MarketingEmailManager />
          </div>

          {/* Quick Test Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Test</h2>
                <p className="text-sm text-gray-600">Send a test marketing email</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter test email address"
                />
              </div>

              <button
                onClick={sendTestEmail}
                disabled={loading || !testEmail.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Campaign Types Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Campaign Types</h2>
                <p className="text-sm text-gray-600">Available marketing email types</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { type: 'welcome', label: 'Welcome Campaign', icon: Star, color: 'green', desc: 'Onboard new users' },
                { type: 'tournament_announcement', label: 'Tournament Announcement', icon: Trophy, color: 'purple', desc: 'Promote tournaments' },
                { type: 'weekly_digest', label: 'Weekly Digest', icon: Calendar, color: 'blue', desc: 'Weekly updates' },
                { type: 'feature_highlight', label: 'Feature Highlight', icon: Star, color: 'amber', desc: 'Showcase new features' },
                { type: 'promotional', label: 'Promotional', icon: Gift, color: 'red', desc: 'Special offers' }
              ].map((campaign) => {
                const Icon = campaign.icon;
                return (
                  <div key={campaign.type} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 bg-${campaign.color}-100 rounded-lg`}>
                      <Icon className={`w-4 h-4 text-${campaign.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{campaign.label}</h3>
                      <p className="text-sm text-gray-600">{campaign.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Marketing Email Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Professional Templates</h3>
              <p className="text-sm text-gray-600">Beautiful, responsive email templates with CQG branding</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Targeted Campaigns</h3>
              <p className="text-sm text-gray-600">Send to all users or specific tournament participants</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Campaign Types</h3>
              <p className="text-sm text-gray-600">Welcome, tournament, digest, feature, and promotional emails</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Rich Content</h3>
              <p className="text-sm text-gray-600">Features, tournament info, CTAs, and more</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Analytics Ready</h3>
              <p className="text-sm text-gray-600">Track opens, clicks, and engagement with Postmark</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Easy Management</h3>
              <p className="text-sm text-gray-600">Simple interface for creating and sending campaigns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
