import { useState } from 'react';
import { Award, X } from 'lucide-react';

const ALL_ACHIEVEMENTS = [
  { id: 'first_card', name: 'First Steps', emoji: '🌱', desc: 'Review your first card' },
  { id: 'ten_cards', name: 'Getting Started', emoji: '📚', desc: 'Review 10 cards total' },
  { id: 'fifty_cards', name: 'Dedicated', emoji: '🔥', desc: 'Review 50 cards total' },
  { id: 'hundred_cards', name: 'Centurion', emoji: '💯', desc: 'Review 100 cards total' },
  { id: 'perfect_session', name: 'Perfectionist', emoji: '⭐', desc: 'Complete a session with 100% accuracy' },
  { id: 'streak_3', name: 'Consistent', emoji: '📅', desc: 'Study 3 days in a row' },
  { id: 'streak_7', name: 'Committed', emoji: '🗓️', desc: 'Study 7 days in a row' },
  { id: 'streak_30', name: 'Unstoppable', emoji: '🏆', desc: 'Study 30 days in a row' },
  { id: 'quiz_master', name: 'Quiz Master', emoji: '🧠', desc: 'Score 100% on a quiz' },
  { id: 'speed_demon', name: 'Speed Demon', emoji: '⚡', desc: 'Complete 20 cards in under 5 minutes' },
  { id: 'early_bird', name: 'Early Bird', emoji: '🌅', desc: 'Study before 7 AM' },
  { id: 'night_owl', name: 'Night Owl', emoji: '🦉', desc: 'Study after 11 PM' },
  { id: 'deck_creator', name: 'Creator', emoji: '🎨', desc: 'Create your first deck' },
  { id: 'five_decks', name: 'Collector', emoji: '📦', desc: 'Create 5 decks' },
  { id: 'level_5', name: 'Rising Star', emoji: '🌟', desc: 'Reach level 5' },
  { id: 'level_10', name: 'Scholar', emoji: '🎓', desc: 'Reach level 10' },
];

export default function Achievements({ unlocked = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const unlockedIds = new Set(unlocked.map((a) => a.id || a.achievement_id));

  function handleClick(ach) {
    setSelected(ach);
  }

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-grape-400" />
            Achievements
          </h2>
          <button onClick={() => setShowModal(true)} className="text-sm text-grape-400 hover:text-grape-300 transition-colors">
            View all
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {ALL_ACHIEVEMENTS.slice(0, 8).map((ach) => {
            const isUnlocked = unlockedIds.has(ach.id);
            const ua = unlocked.find((u) => (u.id || u.achievement_id) === ach.id);
            return (
              <button
                key={ach.id}
                onClick={() => handleClick(ach)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                  isUnlocked
                    ? 'bg-grape-500/10 hover:bg-grape-500/20 border border-grape-500/20'
                    : 'bg-gray-800/50 opacity-50 grayscale hover:opacity-70'
                }`}
              >
                <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>{ach.emoji}</span>
                <span className="text-[10px] text-center leading-tight text-gray-400">{ach.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-grape-400" />
                All Achievements
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {ALL_ACHIEVEMENTS.map((ach) => {
                  const isUnlocked = unlockedIds.has(ach.id);
                  return (
                    <button
                      key={ach.id}
                      onClick={() => handleClick(ach)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        isUnlocked
                          ? 'bg-grape-500/10 hover:bg-grape-500/20 border border-grape-500/20'
                          : 'bg-gray-800/50 opacity-50 grayscale hover:opacity-70'
                      }`}
                    >
                      <span className="text-3xl">{isUnlocked ? ach.emoji : '?'}</span>
                      <span className="text-xs text-center leading-tight text-gray-400">{ach.name}</span>
                      {isUnlocked && (
                        <span className="text-[10px] text-grape-400">Unlocked</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 w-80 text-center mx-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-5xl block mb-3">{unlockedIds.has(selected.id) ? selected.emoji : '?'}</span>
            <h4 className="text-lg font-bold mb-1">{selected.name}</h4>
            <p className="text-sm text-gray-400 mb-3">{selected.desc}</p>
            {unlockedIds.has(selected.id) ? (
              <p className="text-xs text-grape-400">Unlocked</p>
            ) : (
              <p className="text-xs text-gray-500">Not yet unlocked</p>
            )}
            <button onClick={() => setSelected(null)} className="mt-4 btn-primary text-sm py-2 px-4">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
