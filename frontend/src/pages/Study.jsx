import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, RotateCcw, Trophy, Keyboard, MousePointerClick, Volume2 } from 'lucide-react';
import { getDueCards, getAllCards, submitReview, saveSession } from '../api.js';
import LaTeX from '../components/LaTeX.jsx';

function parseCloze(text) {
  const regex = /\{\{c\d+::([^}]+)\}\}/g;
  const answers = [];
  let match;
  while ((match = regex.exec(text)) !== null) answers.push(match[1]);
  const blanked = text.replace(regex, '______');
  return { blanked, answers, hasCloze: answers.length > 0 };
}

export default function Study() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('flip');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

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

  function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function handleFlip() {
    window.speechSynthesis.cancel();
    setFlipped(!flipped);
  }

  function handleSubmitType() {
    const card = cards[currentIndex];
    const { answers, hasCloze } = parseCloze(card.question);
    const input = typedAnswer.trim().toLowerCase();
    let isMatch = false;
    if (hasCloze) {
      isMatch = answers.some((a) => input === a.trim().toLowerCase());
    } else {
      isMatch = input === card.answer.trim().toLowerCase();
    }
    setMatchResult(isMatch);
    setSubmitted(true);
  }

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
      setTypedAnswer('');
      setSubmitted(false);
      setMatchResult(null);
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
          <button onClick={() => { setCurrentIndex(0); setFlipped(false); setCorrectCount(0); setStudiedCount(0); setFinished(false); setTypedAnswer(''); setSubmitted(false); setMatchResult(null); }} className="btn-primary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Study again
          </button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const { blanked, hasCloze } = parseCloze(card.question);
  const opts = card.options ? JSON.parse(card.options) : {};

  function renderQuestionText(original, blankedText, isFlipped) {
    if (hasCloze) {
      return isFlipped ? (
        <LaTeX text={original} className="text-xl text-center leading-relaxed px-4 [&_.cloze-answer]:text-grape-400 [&_.cloze-answer]:font-semibold" />
      ) : (
        <LaTeX text={blankedText} className="text-xl text-center leading-relaxed px-4" />
      );
    }
    return <LaTeX text={original} className="text-xl text-center leading-relaxed px-4" />;
  }

  const clozeHighlightStyle = hasCloze && flipped
    ? card.question.replace(/\{\{c\d+::([^}]+)\}\}/g, '<span class="text-grape-400 font-semibold">$1</span>')
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/decks/${id}`} className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to deck
      </Link>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMode('flip'); setTypedAnswer(''); setSubmitted(false); setMatchResult(null); setFlipped(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'flip' ? 'bg-grape-600/20 text-grape-400 border border-grape-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" /> Flip
          </button>
          <button
            onClick={() => { setMode('type'); setFlipped(false); setTypedAnswer(''); setSubmitted(false); setMatchResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'type' ? 'bg-grape-600/20 text-grape-400 border border-grape-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" /> Type
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <span>{correctCount} correct</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8">
        <div className="bg-grape-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {mode === 'flip' ? (
        <>
          <div
            onClick={handleFlip}
            className="card min-h-[300px] flex flex-col items-center justify-center cursor-pointer select-none hover:border-grape-500/30 transition-all"
          >
            {opts.image && <img src={opts.image} className="max-h-48 rounded-xl mb-4 object-contain" alt="" />}
            <div className="flex items-center gap-2 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {flipped ? 'Answer' : 'Question'}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); speak(flipped ? card.answer : card.question); }}
                className="p-1 text-gray-500 hover:text-grape-400 transition-colors"
                title="Read aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {hasCloze && flipped ? (
              <p
                className="text-xl text-center leading-relaxed px-4"
                dangerouslySetInnerHTML={{
                  __html: card.question.replace(/\{\{c\d+::([^}]+)\}\}/g, '<span class="text-grape-400 font-semibold">$1</span>'),
                }}
              />
            ) : (
              renderQuestionText(card.question, blanked, flipped)
            )}
            {!flipped && <p className="text-xs text-gray-500 mt-8">Click to reveal answer</p>}
          </div>

          {flipped && (
            <>
              {hasCloze ? (
                <div className="card mt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Full text</p>
                  <p className="text-lg leading-relaxed">{card.answer || card.question.replace(/\{\{c\d+::([^}]+)\}\}/g, '$1')}</p>
                </div>
              ) : null}
              <div className="flex gap-4 mt-6">
                <button onClick={() => handleAnswer(false)} className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 font-semibold py-4 rounded-xl transition-all active:scale-95">
                  <X className="w-5 h-5" /> Incorrect
                </button>
                <button onClick={() => handleAnswer(true)} className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 font-semibold py-4 rounded-xl transition-all active:scale-95">
                  <Check className="w-5 h-5" /> Got it!
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="card min-h-[200px] flex flex-col items-center justify-center select-none">
            {opts.image && <img src={opts.image} className="max-h-48 rounded-xl mb-4 object-contain" alt="" />}
            <div className="flex items-center gap-2 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Question</p>
              <button
                onClick={() => speak(card.question)}
                className="p-1 text-gray-500 hover:text-grape-400 transition-colors"
                title="Read aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderQuestionText(card.question, blanked, false)}
          </div>

          {!submitted ? (
            <div className="mt-6 space-y-3">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && typedAnswer.trim()) handleSubmitType(); }}
                placeholder={hasCloze ? 'Type the missing word...' : 'Type your answer...'}
                className="input-field"
                autoFocus
              />
              <button
                onClick={handleSubmitType}
                disabled={!typedAnswer.trim()}
                className="btn-primary w-full"
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className={`card border-2 ${matchResult ? 'border-green-500/50' : 'border-red-500/50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Your answer</p>
                  <button
                    onClick={() => speak(typedAnswer)}
                    className="p-1 text-gray-500 hover:text-grape-400 transition-colors"
                    title="Read aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className={`text-lg ${matchResult ? 'text-green-400' : 'text-red-400'}`}>{typedAnswer}</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Correct answer</p>
                  <button
                    onClick={() => speak(hasCloze ? parseCloze(card.question).answers.join(' or ') : card.answer)}
                    className="p-1 text-gray-500 hover:text-grape-400 transition-colors"
                    title="Read aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-lg text-green-400">
                  {hasCloze ? parseCloze(card.question).answers.join(' or ') : <LaTeX text={card.answer} />}
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleAnswer(false)} className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 font-semibold py-4 rounded-xl transition-all active:scale-95">
                  <X className="w-5 h-5" /> Incorrect
                </button>
                <button onClick={() => handleAnswer(true)} className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 font-semibold py-4 rounded-xl transition-all active:scale-95">
                  <Check className="w-5 h-5" /> Got it!
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
