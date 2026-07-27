import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Layers, CreditCard, Loader2 } from 'lucide-react';
import { searchAll } from '../api.js';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      searchAll(query.trim())
        .then(setResults)
        .catch(() => setResults({ decks: [], cards: [] }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <SearchIcon className="w-6 h-6 text-grape-400" />
        Search
      </h1>

      <div className="relative mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search decks and cards..."
          className="input-field pl-12"
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-grape-500 border-t-transparent rounded-full" />
        </div>
      )}

      {results && !loading && (
        <div className="space-y-6">
          {results.decks?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Decks
              </h2>
              <div className="space-y-2">
                {results.decks.map((deck) => (
                  <Link
                    key={deck.id}
                    to={`/decks/${deck.id}`}
                    className="card flex items-center justify-between hover:border-grape-500/30 transition-all"
                  >
                    <div>
                      <h3 className="font-medium">{deck.title}</h3>
                      <p className="text-sm text-gray-400">{deck.card_count} cards</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.cards?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Cards
              </h2>
              <div className="space-y-2">
                {results.cards.map((card) => (
                  <Link
                    key={card.id}
                    to={`/decks/${card.deck_id}`}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 hover:border-grape-500/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{card.question}</p>
                      <p className="text-xs text-gray-400 mt-1">{card.answer}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg shrink-0 ${
                      card.type === 'flashcard'
                        ? 'bg-grape-500/20 text-grape-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {card.type}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.decks?.length === 0 && results.cards?.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="text-center py-12">
          <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Type to search across all your decks and cards</p>
        </div>
      )}
    </div>
  );
}
