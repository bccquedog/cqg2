"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Mail, Send, Users, Target, Calendar, Trophy, Star, Gift } from "lucide-react";

interface MarketingEmailManagerProps {
  className?: string;
}

type CampaignType = 'welcome' | 'tournament_announcement' | 'weekly_digest' | 'feature_highlight' | 'promotional';

export default function MarketingEmailManager({ className = "" }: MarketingEmailManagerProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [campaignType, setCampaignType] = useState<CampaignType>('welcome');
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mainMessage, setMainMessage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [targetAudience, setTargetAudience] = useState<'all' | 'tournament'>('all');
  const [tournamentId, setTournamentId] = useState("");

  const campaignTypes = {
    welcome: { label: 'Welcome Campaign', icon: Star, color: 'green' },
    tournament_announcement: { label: 'Tournament Announcement', icon: Trophy, color: 'purple' },
    weekly_digest: { label: 'Weekly Digest', icon: Calendar, color: 'blue' },
    feature_highlight: { label: 'Feature Highlight', icon: Star, color: 'amber' },
    promotional: { label: 'Promotional', icon: Gift, color: 'red' }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const sendCampaign = async () => {
    if (!subject || !title || !mainMessage || !ctaText || !ctaUrl) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketing/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignType,
          subject,
          content: {
            title,
            subtitle,
            mainMessage,
            ctaText,
            ctaUrl,
            features: features.length > 0 ? features : undefined
          },
          targetAudience,
          tournamentId: targetAudience === 'tournament' ? tournamentId : undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(`Campaign sent to ${result.stats.successful} recipients!`, "success");
        // Reset form
        setSubject("");
        setTitle("");
        setSubtitle("");
        setMainMessage("");
        setCtaText("");
        setCtaUrl("");
        setFeatures([]);
      } else {
        showToast(result.error || "Failed to send campaign", "error");
      }
    } catch (error) {
      showToast("Failed to send campaign", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Marketing Email Manager</h2>
          <p className="text-sm text-gray-600">Create and send marketing campaigns</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Campaign Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Campaign Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(campaignTypes).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setCampaignType(type as CampaignType)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    campaignType === type
                      ? `border-${config.color}-500 bg-${config.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${
                    campaignType === type ? `text-${config.color}-600` : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    campaignType === type ? `text-${config.color}-700` : 'text-gray-600'
                  }`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Target Audience</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={targetAudience === 'all'}
                onChange={(e) => setTargetAudience(e.target.value as 'all' | 'tournament')}
                className="mr-2"
              />
              <span className="text-sm">All Users</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="tournament"
                checked={targetAudience === 'tournament'}
                onChange={(e) => setTargetAudience(e.target.value as 'all' | 'tournament')}
                className="mr-2"
              />
              <span className="text-sm">Tournament Participants</span>
            </label>
          </div>
          {targetAudience === 'tournament' && (
            <input
              type="text"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              placeholder="Tournament ID"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Email Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter email title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Enter email subtitle (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Message *</label>
            <textarea
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              placeholder="Enter the main message content"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features (Optional)</label>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {feature}
                  </span>
                  <button
                    onClick={() => removeFeature(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <button
                  onClick={addFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA Text *</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g., Join Tournament"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA URL *</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="e.g., https://cqgplatform.com/tournaments"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={sendCampaign}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
