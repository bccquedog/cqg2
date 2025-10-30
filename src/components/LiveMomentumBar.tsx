"use client";

import { useEffect, useState } from "react";
import { calculateMomentum, getMomentumLevel, getMomentumShift, MomentumData } from "@/lib/momentumCalculator";

interface LiveMomentumBarProps {
  playerId: string;
  playerName: string;
  momentumData: MomentumData;
  showStats?: boolean;
}

export default function LiveMomentumBar({ 
  playerId, 
  playerName, 
  momentumData, 
  showStats = true 
}: LiveMomentumBarProps) {
  const [momentum, setMomentum] = useState(0);
  const [prevMomentum, setPrevMomentum] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [glowTrail, setGlowTrail] = useState(false);

  useEffect(() => {
    const newMomentum = calculateMomentum(momentumData);
    setPrevMomentum(momentum);
    setMomentum(newMomentum);
    
    const diff = Math.abs(newMomentum - momentum);
    if (diff > 5) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    
    // Trigger glow trail on sudden spikes (>15% increase)
    if (newMomentum - momentum > 15) {
      setGlowTrail(true);
      setTimeout(() => setGlowTrail(false), 1200);
    }
  }, [momentumData]);

  const level = getMomentumLevel(momentum);
  const shift = getMomentumShift(prevMomentum, momentum);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900">{playerName}</span>
          <span className="text-lg">{level.icon}</span>
          {shift.direction !== "stable" && (
            <span className={`text-xs font-medium ${shift.direction === "rising" ? "text-green-600" : "text-red-600"}`}>
              {shift.direction === "rising" ? "↗" : "↘"} {shift.magnitude.toFixed(0)}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-gray-600">
          {momentum.toFixed(0)}% {level.level.toUpperCase()}
        </span>
      </div>

      <div 
        className="relative h-6 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Glow trail effect on momentum spikes */}
        {glowTrail && (
          <div className={`absolute inset-0 bg-gradient-to-r ${level.color} opacity-40 animate-pulse`} />
        )}
        
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${level.color} ${level.glow} transition-all duration-500 ease-out ${
            isAnimating ? "animate-pulse" : ""
          }`}
          style={{ width: `${momentum}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 min-w-[180px]">
            <div className="font-semibold mb-1">{playerName} Metrics</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Win Streak:</span>
                <span className="font-mono">{momentumData.winStreak || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Surge Score:</span>
                <span className="font-mono">{momentumData.recentSurgeScore || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Round Wins:</span>
                <span className="font-mono">{momentumData.recentRoundWins || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Clutch Plays:</span>
                <span className="font-mono">{momentumData.clutchPlays || 0}</span>
              </div>
            </div>
            {/* Arrow pointer */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {showStats && (
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
          <div className="text-center">
            <div className="font-medium text-gray-900">{momentumData.recentSurgeScore || 0}</div>
            <div className="text-[10px]">Surge</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{momentumData.winStreak || 0}</div>
            <div className="text-[10px]">Streak</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{momentumData.recentRoundWins || 0}</div>
            <div className="text-[10px]">Rounds</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{momentumData.clutchPlays || 0}</div>
            <div className="text-[10px]">Clutch</div>
          </div>
        </div>
      )}
    </div>
  );
}

