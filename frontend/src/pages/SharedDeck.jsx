import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { getSharedDeck } from '../api.js';

export default function SharedDeck() {
  const { token } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSharedDeck(token)
      .then((data) => { setDeck(data.deck); setCards(data.cards || []); })
      .catch(() => setError('Failed to load shared deck or link expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-16 max-w-lg mx-auto">
        <p className="text-gray-400 mb-6">{error}</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go to Omoikane
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Omoikane
      </Link>

      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-grape-400" />
          <h1 className="text-2xl font-bold">{deck?.title || 'Shared Deck'}</h1>
        </div>
        <p className="text-sm text-gray-400">{cards.length} cards</p>
      </div>

      <div className="space-y-2">
        {cards.map((card, i) => (
          <div key={card.id || i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4">
            <span className="text-xs text-gray-500 mt-1 shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{card.question}</p>
              <p className="text-xs text-gray-400 mt-1">{card.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 mb-8">
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Study on Omoikane
        </Link>
      </div>
    </div>
  );
}
