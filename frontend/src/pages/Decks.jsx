import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Trash2, FileText, Youtube, ClipboardPaste, Clock, Sparkles, Download, Upload } from 'lucide-react';
import { getDecks, deleteDeck, exportDeck, importDeck } from '../api.js';
import { useToast } from '../components/Toast.jsx';

const sourceIcons = {
  text: ClipboardPaste,
  pdf: FileText,
  youtube: Youtube,
};

export default function Decks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const fileInputRef = useRef(null);

  useEffect(() => {
    getDecks().then(setDecks).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this deck and all its cards?')) return;
    await deleteDeck(id);
    setDecks(decks.filter((d) => d.id !== id));
  }

  async function handleExport(deckId, deckTitle) {
    try {
      const data = await exportDeck(deckId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deckTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Deck exported successfully');
    } catch {
      toast('Export failed', 'error');
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importDeck(data);
      toast('Deck imported successfully');
      const updated = await getDecks();
      setDecks(updated);
    } catch {
      toast('Import failed. Please check the file format.', 'error');
    }
    e.target.value = '';
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Deck
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Link to="/" className="btn-primary text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            New Deck
          </Link>
        </div>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExport(deck.id, deck.title)}
                      title="Export deck"
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-grape-400 transition-all"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(deck.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
