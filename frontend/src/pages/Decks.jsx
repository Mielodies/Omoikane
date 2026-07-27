import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Trash2, FileText, Youtube, ClipboardPaste, Clock, Sparkles } from 'lucide-react';
import { getDecks, deleteDeck } from '../api.js';

const sourceIcons = {
  text: ClipboardPaste,
  pdf: FileText,
  youtube: Youtube,
};

export default function Decks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDecks().then(setDecks).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this deck and all its cards?')) return;
    await deleteDeck(id);
    setDecks(decks.filter((d) => d.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-grape-400" />
          Your Decks
        </h1>
        <Link to="/" className="btn-primary text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          New Deck
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="card text-center py-16">
          <Layers className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">No decks yet</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create your first deck
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => {
            const SourceIcon = sourceIcons[deck.source_type] || FileText;
            return (
              <div key={deck.id} className="card group hover:border-grape-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/decks/${deck.id}`} className="font-semibold text-lg hover:text-grape-400 transition-colors">
                    {deck.title}
                  </Link>
                  <button
                    onClick={() => handleDelete(deck.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <SourceIcon className="w-3.5 h-3.5" />
                    {deck.source_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {deck.card_count} cards
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(deck.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
