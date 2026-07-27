import { Check, Flame } from 'lucide-react';

export default function DailyChallenges({ challenges = [] }) {
  const defaultChallenges = [
    { id: 'review', title: 'Study 10 cards', target: 10, progress: 0, xp: 20, type: 'cards_studied' },
    { id: 'accuracy', title: '90% accuracy session', target: 90, progress: 0, xp: 30, type: 'accuracy' },
    { id: 'time', title: 'Study for 15 minutes', target: 15, progress: 0, xp: 25, type: 'minutes' },
  ];

  const items = challenges.length > 0 ? challenges : defaultChallenges;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-400" />
        Daily Challenges
      </h2>
      <div className="space-y-3">
        {items.map((ch) => {
          const pct = ch.target > 0 ? Math.min((ch.progress / ch.target) * 100, 100) : 0;
          const completed = ch.completed || pct >= 100;
          return (
            <div key={ch.id} className={`p-3 rounded-xl border transition-all ${completed ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-800/50 border-gray-700/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {completed ? (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <span className={`text-sm font-medium ${completed ? 'text-green-400' : 'text-gray-300'}`}>
                    {ch.title}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${completed ? 'bg-green-500/20 text-green-400' : 'bg-grape-500/20 text-grape-400'}`}>
                  {completed ? 'Claimed' : `+${ch.xp} XP`}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${completed ? 'bg-green-500' : 'bg-grape-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {ch.progress}/{ch.target}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
