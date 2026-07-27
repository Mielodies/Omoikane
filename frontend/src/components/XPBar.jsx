import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export default function XPBar({ xp, level, title, nextLevelXp, currentLevelXp }) {
  const [showGain, setShowGain] = useState(false);
  const [gainAmount, setGainAmount] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  const progress = nextLevelXp > currentLevelXp
    ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 100;

  useEffect(() => {
    if (level > prevLevel) {
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 2000);
    }
    setPrevLevel(level);
  }, [level]);

  useEffect(() => {
    if (xp > 0) {
      setGainAmount(10);
      setShowGain(true);
      setTimeout(() => setShowGain(false), 1500);
    }
  }, [xp]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300 ${levelUp ? 'animate-pulse' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 pb-3">
        <div className={`bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl px-4 py-2.5 shadow-2xl shadow-black/50 pointer-events-auto ${levelUp ? 'border-grape-500/50 shadow-grape-500/20' : ''}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${levelUp ? 'bg-grape-500/40 scale-110' : 'bg-grape-500/20'}`}>
                <Star className={`w-4 h-4 ${levelUp ? 'text-grape-300' : 'text-grape-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm transition-all ${levelUp ? 'text-grape-300 text-base' : 'text-gray-100'}`}>
                    Lvl {level}
                  </span>
                  {showGain && (
                    <span className="text-green-400 text-xs font-bold animate-bounce inline-block">
                      +{gainAmount} XP
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{title || 'Learner'}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 tabular-nums">
              {xp} / {nextLevelXp} XP
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ease-out ${levelUp ? 'bg-grape-400' : 'bg-grape-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
