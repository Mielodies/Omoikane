import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, RotateCcw, Trophy } from 'lucide-react';
import { getDueCards, getAllCards, submitReview, saveSession } from '../api.js';

export default function Study() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDueCards(id).then((dueCards) => {
      if (dueCards.length === 0) {
        getAllCards(id).then((allCards) => {
          setCards(allCards.filter((c) => c.type === 'flashcard').slice(0, 20));
          setLoading(false);
        });
      } else {
        setCards(dueCards.filter((c) => c.type === 'flashcard'));
        setLoading(false);
      }
    });
  }, [id]);

  async function handleAnswer(isCorrect) {
    const card = cards[currentIndex];
    await submitReview({
      cardId: card.id,
      quality: isCorrect ? 4 : 1,
      isCorrect,
    });

    setStudiedCount(studiedCount + 1);
    if (isCorrect) setCorrectCount(correctCount + 1);

    if (currentIndex + 1 >= cards.length) {
      await saveSession({
        deckId: parseInt(id),
        cardsStudied: studiedCount + 1,
        correctCount: correctCount + (isCorrect ? 1 : 0),
      });
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="card text-center py-16 max-w-lg mx-auto">
        <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">All caught up!</h2>
        <p className="text-gray-400 mb-6">No cards are due for review right now.</p>
        <Link to={`/decks/${id}`} className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to deck
        </Link>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correctCount / studiedCount) * 100);
    return (
      <div className="card text-center py-16 max-w-lg mx-auto">
        <Trophy className="w-12 h-12 text-grape-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Session Complete!</h2>
        <div className="flex justify-center gap-8 my-6">
          <div><p className="text-3xl font-bold text-grape-400">{studiedCount}</p><p className="text-xs text-gray-400">studied</p></div>
          <div><p className="text-3xl font-bold text-green-400">{correctCount}</p><p className="text-xs text-gray-400">correct</p></div>
          <div><p className="text-3xl font-bold text-blue-400">{pct}%</p><p className="text-xs text-gray-400">accuracy</p></div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to={`/decks/${id}`} className="btn-secondary">Back to deck</Link>
          <button onClick={() => { setCurrentIndex(0); setFlipped(false); setCorrectCount(0); setStudiedCount(0); setFinished(false); }} className="btn-primary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Study again
          </button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/decks/${id}`} className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to deck
      </Link>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <span>{correctCount} correct</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8">
        <div className="bg-grape-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="card min-h-[300px] flex flex-col items-center justify-center cursor-pointer select-none hover:border-grape-500/30 transition-all"
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-6">
          {flipped ? 'Answer' : 'Question'}
        </p>
        <p className="text-xl text-center leading-relaxed px-4">
          {flipped ? card.answer : card.question}
        </p>
        {!flipped && <p className="text-xs text-gray-500 mt-8">Click to reveal answer</p>}
      </div>

      {flipped && (
        <div className="flex gap-4 mt-6">
          <button onClick={() => handleAnswer(false)} className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 font-semibold py-4 rounded-xl transition-all active:scale-95">
            <X className="w-5 h-5" /> Incorrect
          </button>
          <button onClick={() => handleAnswer(true)} className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 font-semibold py-4 rounded-xl transition-all active:scale-95">
            <Check className="w-5 h-5" /> Got it!
          </button>
        </div>
      )}
    </div>
  );
}
