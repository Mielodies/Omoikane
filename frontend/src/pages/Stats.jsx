import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Target, Zap, Layers, TrendingUp, Flame } from 'lucide-react';
import { getGlobalStats, getDecks, getStudyHistory, getDeckStats, getGamificationProfile, getDailyChallenges } from '../api.js';
import XPBar from '../components/XPBar.jsx';
import Achievements from '../components/Achievements.jsx';
import DailyChallenges from '../components/DailyChallenges.jsx';
import StudyCalendar from '../components/StudyCalendar.jsx';

function calculateStreaks(history) {
  if (!history || history.length === 0) return { current: 0, longest: 0 };
  const allDates = [...new Set(history.map((h) => h.study_date))].sort();
  let longest = 0;
  let streak = 0;
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(allDates[i - 1]);
      const curr = new Date(allDates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else streak = 1;
    }
    if (streak > longest) longest = streak;
  }
  let current = 0;
  let checkDate = new Date();
  const recentDates = [...new Set(history.map((h) => h.study_date))].sort().reverse();
  if (recentDates[0] !== checkDate.toISOString().slice(0, 10)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  for (const d of recentDates) {
    if (d === checkDate.toISOString().slice(0, 10)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  return { current, longest };
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [decks, setDecks] = useState([]);
  const [deckStats, setDeckStats] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState(null);
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    Promise.all([getGlobalStats(), getDecks(), getStudyHistory()])
      .then(([s, d, h]) => {
        setStats(s);
        setDecks(d);
        setHistory(h.history || []);
        return Promise.all(d.map((deck) => getDeckStats(deck.id).then((ds) => [deck.id, ds])));
      })
      .then((entries) => {
        const map = {};
        entries.forEach(([id, ds]) => { map[id] = ds; });
        setDeckStats(map);
      })
      .finally(() => setLoading(false));

    getGamificationProfile().then((p) => setGamification(p)).catch(() => {});
    getDailyChallenges().then((c) => setChallenges(c.challenges || c)).catch(() => {});
  }, []);

  const streaks = useMemo(() => calculateStreaks(history), [history]);

  const heatmapData = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      map[h.study_date] = (map[h.study_date] || 0) + h.cards_studied;
    });
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: map[key] || 0 });
    }
    return days;
  }, [history]);

  const maxCount = useMemo(() => Math.max(1, ...heatmapData.map((d) => d.count)), [heatmapData]);

  function getHeatColor(count) {
    if (count === 0) return 'bg-gray-800';
    const ratio = count / maxCount;
    if (ratio < 0.33) return 'bg-grape-300';
    if (ratio < 0.66) return 'bg-grape-500';
    return 'bg-grape-700';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-8">
        <BarChart3 className="w-6 h-6 text-grape-400" />
        Progress
      </h1>

      <StudyCalendar history={history} />

      {gamification && (
        <XPBar
          xp={gamification.xp || 0}
          level={gamification.level || 1}
          title={gamification.title || 'Learner'}
          nextLevelXp={gamification.nextLevelXp || 100}
          currentLevelXp={gamification.currentLevelXp || 0}
        />
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-grape-500/20 rounded-lg"><Layers className="w-5 h-5 text-grape-400" /></div>
            <div><p className="text-xs text-gray-400">Total decks</p><p className="text-2xl font-bold">{stats.totalDecks}</p></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-400" /></div>
            <div><p className="text-xs text-gray-400">Total cards</p><p className="text-2xl font-bold">{stats.totalCards}</p></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg"><Target className="w-5 h-5 text-orange-400" /></div>
            <div><p className="text-xs text-gray-400">Due today</p><p className="text-2xl font-bold">{stats.totalDue}</p></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg"><Zap className="w-5 h-5 text-green-400" /></div>
            <div><p className="text-xs text-gray-400">Mastered</p><p className="text-2xl font-bold">{stats.totalMastered}</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg"><Flame className="w-5 h-5 text-orange-400" /></div>
          <div><p className="text-xs text-gray-400">Current streak</p><p className="text-2xl font-bold">{streaks.current} <span className="text-sm font-normal text-gray-400">days</span></p></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg"><Flame className="w-5 h-5 text-yellow-400" /></div>
          <div><p className="text-xs text-gray-400">Longest streak</p><p className="text-2xl font-bold">{streaks.longest} <span className="text-sm font-normal text-gray-400">days</span></p></div>
        </div>
      </div>

      <div className="mb-8">
        <DailyChallenges challenges={challenges} />
      </div>

      <div className="mb-8">
        <Achievements unlocked={gamification?.achievements || []} />
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Study Activity</h2>
        <div className="flex gap-[3px] flex-wrap">
          {heatmapData.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} cards`}
              className={`w-3 h-3 rounded-sm ${getHeatColor(day.count)} transition-colors`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-grape-300" />
          <div className="w-3 h-3 rounded-sm bg-grape-500" />
          <div className="w-3 h-3 rounded-sm bg-grape-700" />
          <span>More</span>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Mastery Progress</h2>
        {decks.length === 0 ? (
          <p className="text-gray-400 text-sm">No decks yet</p>
        ) : (
          <div className="space-y-4">
            {decks.map((deck) => {
              const ds = deckStats[deck.id];
              const total = ds ? ds.totalCards : (deck.card_count || 0);
              const mastered = ds ? ds.mastered : 0;
              const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
              return (
                <div key={deck.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{deck.title}</span>
                    <span className="text-gray-500">{mastered}/{total} mastered</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div className="bg-grape-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4">By Deck</h2>
      {decks.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No decks yet</div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              to={`/decks/${deck.id}`}
              className="card flex items-center justify-between hover:border-grape-500/30 transition-all"
            >
              <div>
                <h3 className="font-medium">{deck.title}</h3>
                <p className="text-sm text-gray-400">{deck.card_count} cards</p>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>{new Date(deck.created_at).toLocaleDateString()}</p>
                <p className="text-xs">{deck.source_type}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
