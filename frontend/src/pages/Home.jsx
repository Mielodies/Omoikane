import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Youtube, ClipboardPaste, Loader2, Sparkles } from 'lucide-react';
import { processDocument } from '../api.js';

const TABS = [
  { id: 'text', label: 'Paste Text', icon: ClipboardPaste },
  { id: 'pdf', label: 'Upload PDF', icon: FileText },
  { id: 'youtube', label: 'YouTube URL', icon: Youtube },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('text');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await processDocument({
        sourceType: activeTab,
        text: activeTab === 'text' ? text : undefined,
        youtubeUrl: activeTab === 'youtube' ? youtubeUrl : undefined,
        file: activeTab === 'pdf' ? file : undefined,
        title: title || undefined,
      });
      navigate(`/decks/${result.deck.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-grape-400">Omoikane</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Paste content, get flashcards & quizzes. Free forever.
        </p>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-grape-500 text-gray-900 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Deck title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />

          {activeTab === 'text' && (
            <textarea
              placeholder="Paste your study material here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input-field h-48 resize-none"
            />
          )}

          {activeTab === 'pdf' && (
            <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-grape-500/50 cursor-pointer transition-all">
              <FileText className="w-10 h-10 text-gray-500" />
              <span className="text-gray-400">
                {file ? file.name : 'Click to upload PDF (max 20MB)'}
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          )}

          {activeTab === 'youtube' && (
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="input-field"
            />
          )}

          {error && (
            <div className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (activeTab === 'text' && !text.trim()) || (activeTab === 'pdf' && !file) || (activeTab === 'youtube' && !youtubeUrl.trim())}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating cards...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Study Cards
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
