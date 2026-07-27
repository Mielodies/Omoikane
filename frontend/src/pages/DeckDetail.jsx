import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Brain, Target, Zap, Play, HelpCircle, ArrowLeft, Share2, Copy, Check } from 'lucide-react';
import { getDeck, getDeckStats, createShareLink } from '../api.js';
import { useToast } from '../components/Toast.jsx';

export default function DeckDetail() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([getDeck(id), getDeckStats(id)])
      .then(([d, s]) => { setDeck(d.deck); setCards(d.cards); setStats(s); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleShare() {
    try {
      const data = await createShareLink(id);
      const link = `${window.location.origin}/shared/${data.token}`;
      setShareLink(link);
    } catch {
      toast('Failed to create share link', 'error');
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!deck) return <p className="text-center py-20 text-gray-400">Deck not found</p>;

  const flashcards = cards.filter((c) => c.type === 'flashcard');
  const quizzes = cards.filter((c) => c.type === 'quiz');

  return (
    <div>
      <Link to="/decks" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to decks
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{deck.title}</h1>
        <button
          onClick={handleShare}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {shareLink && (
        <div className="card mb-6 flex items-center gap-3">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="input-field flex-1 text-sm"
          />
          <button onClick={handleCopy} className="btn-primary flex items-center gap-2 text-sm shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-grape-500/20 rounded-lg"><Target className="w-5 h-5 text-grape-400" /></div>
            <div><p className="text-xs text-gray-400">Due today</p><p className="text-xl font-bold">{stats.dueToday}</p></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg"><Zap className="w-5 h-5 text-green-400" /></div>
            <div><p className="text-xs text-gray-400">Mastered</p><p className="text-xl font-bold">{stats.mastered}</p></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Brain className="w-5 h-5 text-blue-400" /></div>
            <div><p className="text-xs text-gray-400">Accuracy</p><p className="text-xl font-bold">{stats.accuracy}%</p></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg"><BookOpen className="w-5 h-5 text-purple-400" /></div>
            <div><p className="text-xs text-gray-400">Total cards</p><p className="text-xl font-bold">{stats.totalCards}</p></div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          to={`/study/${id}`}
          className="card flex items-center gap-4 hover:border-grape-500/30 transition-all group cursor-pointer"
        >
          <div className="p-3 bg-grape-500/20 rounded-xl group-hover:bg-grape-500/30 transition-colors">
            <Play className="w-6 h-6 text-grape-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Study Flashcards</h3>
            <p className="text-sm text-gray-400">{flashcards.length} cards to review</p>
          </div>
        </Link>
        <Link
          to={`/quiz/${id}`}
          className="card flex items-center gap-4 hover:border-grape-500/30 transition-all group cursor-pointer"
        >
          <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
            <HelpCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Take Quiz</h3>
            <p className="text-sm text-gray-400">{quizzes.length} questions</p>
          </div>
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-4">All Cards</h2>
      <div className="space-y-2">
        {cards.map((card, i) => (
          <div key={card.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4">
            <span className="text-xs text-gray-500 mt-1 shrink-0">{i + 1}</span>
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
          </div>
        ))}
      </div>
    </div>
  );
}
