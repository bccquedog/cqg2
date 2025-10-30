"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToast } from "@/components/Toast";
import { GamerTagSettings } from "@/lib/gamerTagSystem";

export default function GamerTagAdminPage() {
  const [settings, setSettings] = useState<GamerTagSettings>({
    claimEnabled: true,
    auctionEnabled: false,
    takeoverEnabled: true,
    defaultClaimPrice: 500,
    defaultTakeoverPrice: 500
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "gamerTags");
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as GamerTagSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, "settings", "gamerTags");
      await setDoc(settingsRef, settings);
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof GamerTagSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Gamer Tag System Settings</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Premium Claim System</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Enable Premium Claims</h3>
                  <p className="text-sm text-gray-600">
                    Allow players to claim taken gamer tags by paying CQG Coins
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.claimEnabled}
                    onChange={(e) => handleSettingChange("claimEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Enable Takeovers</h3>
                  <p className="text-sm text-gray-600">
                    Allow flat-price takeover of taken gamer tags
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.takeoverEnabled}
                    onChange={(e) => handleSettingChange("takeoverEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Enable Auctions</h3>
                  <p className="text-sm text-gray-600">
                    Allow 24-hour bidding wars for premium gamer tags
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auctionEnabled}
                    onChange={(e) => handleSettingChange("auctionEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Pricing Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium mb-2">
                  Default Claim Price (CQG Coins)
                </label>
                <input
                  type="number"
                  value={settings.defaultClaimPrice}
                  onChange={(e) => handleSettingChange("defaultClaimPrice", Number(e.target.value))}
                  min="100"
                  max="10000"
                  step="50"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter default claim price"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Legacy claim system price
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium mb-2">
                  Default Takeover Price (CQG Coins)
                </label>
                <input
                  type="number"
                  value={settings.defaultTakeoverPrice}
                  onChange={(e) => handleSettingChange("defaultTakeoverPrice", Number(e.target.value))}
                  min="100"
                  max="10000"
                  step="50"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter default takeover price"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Flat-price takeover system price
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">System Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Flat Takeover</h3>
                <p className="text-sm text-green-700">
                  Players pay a flat price to instantly take over gamer tags. 
                  Original owner gets a fallback tag with suffix.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Legacy Claims</h3>
                <p className="text-sm text-blue-700">
                  Original claim system where players pay CQG Coins to claim taken gamer tags. 
                  Original owner gets a legacy fallback tag.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">Auction System</h3>
                <p className="text-sm text-purple-700">
                  When enabled, players can start 24-hour auctions for gamer tags. 
                  Multiple players can bid, with the highest bidder winning.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={loadSettings}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
