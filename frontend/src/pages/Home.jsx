import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Youtube, ClipboardPaste, Loader2, Sparkles, ImagePlus, X } from 'lucide-react';
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
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  function handleImageSelect(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(selected);
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(blob);
        return;
      }
    }
  }

  function removeImage() {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        sourceType: activeTab,
        text: activeTab === 'text' ? text : undefined,
        youtubeUrl: activeTab === 'youtube' ? youtubeUrl : undefined,
        file: activeTab === 'pdf' ? file : undefined,
        title: title || undefined,
      };
      if (imagePreview) {
        payload.image = imagePreview;
      }
      const result = await processDocument(payload);
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
              onPaste={activeTab === 'text' ? handlePaste : undefined}
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

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:border-grape-500/50 hover:text-grape-400 transition-all"
            >
              <ImagePlus className="w-4 h-4" />
              {imagePreview ? 'Change Image' : 'Add Image'}
            </button>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} className="h-16 w-16 object-cover rounded-lg border border-gray-700" alt="Preview" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

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
