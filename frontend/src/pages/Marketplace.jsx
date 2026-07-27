import { useState, useEffect } from 'react';
import { Search, Download, Star, Layers, ArrowUpDown } from 'lucide-react';
import { getMarketplace, downloadFromMarketplace } from '../api.js';
import { useToast } from '../components/Toast.jsx';

export default function Marketplace() {
  const [decks, setDecks] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    getMarketplace(query, sort).then(setDecks).finally(() => setLoading(false));
  }, [query, sort]);

  async function handleDownload(id) {
    try {
      await downloadFromMarketplace(id);
      toast('Deck imported to your collection');
    } catch {
      toast('Download failed', 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-8">
        <Search className="w-6 h-6 text-grape-400" />
        Marketplace
      </h1>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search decks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input-field w-auto"
        >
          <option value="newest">Newest</option>
          <option value="downloads">Most Downloads</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
        </div>
      ) : decks.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Layers className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          No decks found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div key={deck.id} className="card hover:border-grape-500/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{deck.title}</h3>
                <button
                  onClick={() => handleDownload(deck.id)}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Get
                </button>
              </div>
              {deck.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{deck.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {deck.card_count} cards
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {deck.downloads || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {deck.rating || 0}
                </span>
              </div>
              {deck.author && (
                <p className="text-xs text-gray-600 mt-2">by {deck.author}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
