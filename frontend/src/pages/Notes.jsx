import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, Save, LogIn } from 'lucide-react';
import { getNotes, createNote, updateNote, deleteNote } from '../api.js';

export default function Notes({ user }) {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getNotes().then(setNotes).finally(() => setLoading(false));
  }, [user]);

  const activeNote = notes.find((n) => n.id === activeId);

  async function createNewNote() {
    const note = await createNote('Untitled Note', '');
    setNotes([note, ...notes]);
    setActiveId(note.id);
    setTitle(note.title);
    setBody('');
  }

  function selectNote(note) {
    if (activeId) handleSave();
    setActiveId(note.id);
    setTitle(note.title);
    setBody(note.body);
  }

  async function handleSave() {
    if (!activeId) return;
    await updateNote(activeId, title, body);
    setNotes(notes.map((n) => n.id === activeId ? { ...n, title, body } : n));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleDelete(id) {
    await deleteNote(id);
    setNotes(notes.filter((n) => n.id !== id));
    if (activeId === id) { setActiveId(null); setTitle(''); setBody(''); }
  }

  if (!user) {
    return (
      <div className="card text-center py-16 max-w-lg mx-auto">
        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in to use Notes</h2>
        <p className="text-gray-400 mb-6">Your notes are saved to your account and synced across devices.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
          <LogIn className="w-4 h-4" /> Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="w-64 shrink-0 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-grape-400" /> My Notes
          </h2>
          <button onClick={createNewNote} className="p-1.5 bg-grape-600 hover:bg-grape-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.length === 0 && <p className="text-xs text-gray-500 text-center mt-8">No notes yet</p>}
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => selectNote(note)}
              className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                activeId === note.id ? 'bg-grape-600/20 border border-grape-600/30' : 'hover:bg-gray-800 border border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{note.title}</p>
                <p className="text-xs text-gray-500 truncate">{(note.body || '').slice(0, 40) || 'Empty'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

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
            <button onClick={createNewNote} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
