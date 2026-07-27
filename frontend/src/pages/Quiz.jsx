import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Trophy, RotateCcw } from 'lucide-react';
import { getAllCards, saveSession } from '../api.js';

export default function Quiz() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCards(id).then((allCards) => {
      setQuestions(allCards.filter((c) => c.type === 'quiz'));
      setLoading(false);
    });
  }, [id]);

  function parseOptions(card) {
    if (Array.isArray(card.options)) return card.options;
    try { return JSON.parse(card.options); } catch { return []; }
  }

  function getCorrectIndex(card) {
    return parseOptions(card).indexOf(card.answer);
  }

  async function handleSelect(index) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    const isCorrect = index === getCorrectIndex(questions[currentIndex]);
    if (isCorrect) setCorrectCount(correctCount + 1);

    setTimeout(async () => {
      if (currentIndex + 1 >= questions.length) {
        await saveSession({
          deckId: parseInt(id),
          cardsStudied: questions.length,
          correctCount: correctCount + (isCorrect ? 1 : 0),
        });
        setFinished(true);
      } else {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
        setAnswered(false);
      }
    }, 1200);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card text-center py-16 max-w-lg mx-auto">
        <p className="text-gray-400 mb-4">No quiz questions in this deck.</p>
        <Link to={`/decks/${id}`} className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to deck
        </Link>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="card text-center py-16 max-w-lg mx-auto">
        <Trophy className="w-12 h-12 text-grape-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Quiz Complete!</h2>
        <div className="flex justify-center gap-8 my-6">
          <div><p className="text-3xl font-bold text-green-400">{correctCount}</p><p className="text-xs text-gray-400">correct</p></div>
          <div><p className="text-3xl font-bold text-red-400">{questions.length - correctCount}</p><p className="text-xs text-gray-400">wrong</p></div>
          <div><p className="text-3xl font-bold text-grape-400">{pct}%</p><p className="text-xs text-gray-400">score</p></div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to={`/decks/${id}`} className="btn-secondary">Back to deck</Link>
          <button onClick={() => { setCurrentIndex(0); setSelected(null); setAnswered(false); setCorrectCount(0); setFinished(false); }} className="btn-primary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const correctIdx = getCorrectIndex(q);
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/decks/${id}`} className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to deck
      </Link>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>{correctCount} correct</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8">
        <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="card mb-6">
        <p className="text-lg leading-relaxed">{q.question}</p>
      </div>

      <div className="space-y-3">
        {parseOptions(q).map((option, i) => {
          let style = 'bg-gray-800 border-gray-700 hover:border-gray-500';
          if (answered) {
            if (i === correctIdx) style = 'bg-green-600/20 border-green-500 text-green-300';
            else if (i === selected && i !== correctIdx) style = 'bg-red-600/20 border-red-500 text-red-300';
            else style = 'bg-gray-800 border-gray-700 opacity-50';
          } else if (i === selected) {
            style = 'bg-grape-500/20 border-grape-500 text-grape-300';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full text-left p-4 rounded-xl border font-medium transition-all ${style}`}
            >
              <span className="text-gray-500 mr-3">{String.fromCharCode(65 + i)}.</span>
              {option}
              {answered && i === correctIdx && <Check className="w-4 h-4 text-green-400 inline ml-2" />}
              {answered && i === selected && i !== correctIdx && <X className="w-4 h-4 text-red-400 inline ml-2" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-grape-400">Correct answer: </span>
            {q.answer}
          </p>
        </div>
      )}
    </div>
  );
}
