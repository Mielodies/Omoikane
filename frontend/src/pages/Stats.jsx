import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Target, Zap, Layers, TrendingUp } from 'lucide-react';
import { getGlobalStats, getDecks } from '../api.js';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getGlobalStats(), getDecks()])
      .then(([s, d]) => { setStats(s); setDecks(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-8">
        <BarChart3 className="w-6 h-6 text-grape-400" />
        Progress
      </h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
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
