import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

const STORAGE_KEY = 'omoikane-notes';

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setNotes(loadNotes()); }, []);

  const activeNote = notes.find((n) => n.id === activeId);

  function createNote() {
    const note = { id: Date.now().toString(), title: 'Untitled Note', body: '', createdAt: new Date().toISOString() };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setActiveId(note.id);
    setTitle(note.title);
    setBody('');
  }

  function selectNote(id) {
    if (activeId) handleSave();
    const note = notes.find((n) => n.id === id);
    setActiveId(id);
    setTitle(note.title);
    setBody(note.body);
  }

  function handleSave() {
    if (!activeId) return;
    const updated = notes.map((n) => n.id === activeId ? { ...n, title, body, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    saveNotes(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function deleteNote(id) {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (activeId === id) { setActiveId(null); setTitle(''); setBody(''); }
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <div className="w-64 shrink-0 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-grape-400" /> My Notes
          </h2>
          <button onClick={createNote} className="p-1.5 bg-grape-600 hover:bg-grape-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.length === 0 && <p className="text-xs text-gray-500 text-center mt-8">No notes yet</p>}
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => selectNote(note.id)}
              className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                activeId === note.id ? 'bg-grape-600/20 border border-grape-600/30' : 'hover:bg-gray-800 border border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{note.title}</p>
                <p className="text-xs text-gray-500 truncate">{note.body.slice(0, 40) || 'Empty'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {activeId ? (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-transparent text-lg font-semibold focus:outline-none"
                placeholder="Note title..."
              />
              <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2">
                <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing..."
              className="flex-1 bg-transparent p-6 resize-none focus:outline-none text-gray-300 leading-relaxed font-mono text-sm"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <FileText className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-lg mb-2">No note selected</p>
            <p className="text-sm mb-4">Pick a note or create a new one</p>
            <button onClick={createNote} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
