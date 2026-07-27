import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Undo2, Redo2, Trash2, Download, Minus, Eraser, Sparkles, X, Loader2, Plus, Save, PenTool, LogIn } from 'lucide-react';
import { analyzeWhiteboard, getBoards, getBoard, createBoard, updateBoard, deleteBoard } from '../api.js';

const COLORS = ['#ffffff', '#a855f7', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4'];
const SIZES = [2, 4, 8, 16];

export default function Whiteboard({ user }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(4);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const lastPoint = useRef(null);

  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [boardName, setBoardName] = useState('');
  const [saving, setSaving] = useState(false);
  const [boardsLoading, setBoardsLoading] = useState(true);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!user) { setBoardsLoading(false); return; }
    getBoards().then((b) => {
      setBoards(b);
      if (b.length > 0) loadBoard(b[0].id);
      setBoardsLoading(false);
    }).catch(() => setBoardsLoading(false));
  }, [user]);

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => { initCanvas(); }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory((h) => {
      const newH = h.slice(0, historyIdx + 1);
      newH.push(dataUrl);
      return newH;
    });
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  async function loadBoard(id) {
    try {
      const board = await getBoard(id);
      setActiveBoard(board);
      setBoardName(board.name);
      setHistory([]);
      setHistoryIdx(-1);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      if (board.canvas_data) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); saveState(); };
        img.src = board.canvas_data;
      } else {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    } catch {}
  }

  async function handleNewBoard() {
    const board = await createBoard('Untitled Whiteboard', null);
    setBoards([board, ...boards]);
    loadBoard(board.id);
  }

  async function handleSaveBoard() {
    if (!activeBoard) return;
    setSaving(true);
    const canvasData = canvasRef.current?.toDataURL('image/png');
    await updateBoard(activeBoard.id, boardName, canvasData);
    setBoards(boards.map((b) => b.id === activeBoard.id ? { ...b, name: boardName } : b));
    setSaving(false);
  }

  async function handleDeleteBoard(id) {
    await deleteBoard(id);
    const newBoards = boards.filter((b) => b.id !== id);
    setBoards(newBoards);
    if (activeBoard?.id === id) {
      if (newBoards.length > 0) loadBoard(newBoards[0].id);
      else { setActiveBoard(null); initCanvas(); }
    }
  }

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#030712' : color;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    lastPoint.current = null;
    saveState();
  }

  function undo() {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    restoreState(history[newIdx]);
  }

  function redo() {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    restoreState(history[newIdx]);
  }

  function restoreState(dataUrl) {
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); ctx.drawImage(img, 0, 0); };
    img.src = dataUrl;
  }

  function clearCanvas() {
    initCanvas();
    saveState();
  }

  function download() {
    const link = document.createElement('a');
    link.download = `${boardName || 'whiteboard'}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  }

  async function handleAnalyze() {
    setAiOpen(true); setAiLoading(true); setAiError(''); setAiResult(null);
    try {
      const result = await analyzeWhiteboard(canvasRef.current.toDataURL('image/png'));
      setAiResult(result);
    } catch (err) { setAiError(err.message); }
    finally { setAiLoading(false); }
  }

  if (!user) {
    return (
      <div className="card text-center py-16 max-w-lg mx-auto">
        <PenTool className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in to use Whiteboard</h2>
        <p className="text-gray-400 mb-6">Your whiteboards are saved to your account and synced across devices.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
          <LogIn className="w-4 h-4" /> Sign In
        </Link>
      </div>
    );
  }

  if (boardsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Board selector bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => loadBoard(b.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeBoard?.id === b.id ? 'bg-grape-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <PenTool className="w-3 h-3" />
            {b.name}
          </button>
        ))}
        <button onClick={handleNewBoard} className="shrink-0 p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-200">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-t-2xl">
            <div className="flex gap-1 bg-gray-800 p-1 rounded-xl">
              {[{ id: 'pen', icon: Minus, label: 'Pen' }, { id: 'eraser', icon: Eraser, label: 'Eraser' }].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setTool(id)} title={label}
                  className={`p-2 rounded-lg transition-all ${tool === id ? 'bg-grape-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-gray-700" />
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button key={c} onClick={() => { setColor(c); setTool('pen'); }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && tool === 'pen' ? 'border-white scale-110' : 'border-gray-700 hover:border-gray-500'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="w-px h-6 bg-gray-700" />
            <div className="flex gap-1.5 items-center">
              {SIZES.map((s) => (
                <button key={s} onClick={() => setSize(s)}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${size === s ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
                  <div className="rounded-full bg-gray-300" style={{ width: s + 2, height: s + 2 }} />
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex gap-1 items-center">
              {activeBoard && (
                <input value={boardName} onChange={(e) => setBoardName(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none w-32" placeholder="Board name..." />
              )}
              <button onClick={handleAnalyze} title="AI Analyze"
                className="flex items-center gap-1.5 px-3 py-2 bg-grape-600 hover:bg-grape-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95">
                <Sparkles className="w-4 h-4" /> AI
              </button>
              <button onClick={handleSaveBoard} title="Save"
                className="p-2 text-gray-400 hover:text-grape-400 rounded-lg hover:bg-gray-800 transition-all">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={undo} disabled={historyIdx <= 0} title="Undo"
                className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all">
                <Undo2 className="w-4 h-4" />
              </button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo"
                className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all">
                <Redo2 className="w-4 h-4" />
              </button>
              <button onClick={clearCanvas} title="Clear" className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={download} title="Download" className="p-2 text-gray-400 hover:text-grape-400 rounded-lg hover:bg-gray-800 transition-all">
                <Download className="w-4 h-4" />
              </button>
              {activeBoard && (
                <button onClick={() => handleDeleteBoard(activeBoard.id)} title="Delete board"
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 border border-gray-800 rounded-b-2xl overflow-hidden cursor-crosshair bg-[#030712]">
            <canvas ref={canvasRef} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} className="w-full h-full" />
          </div>
        </div>

        {/* AI Panel */}
        {aiOpen && (
          <div className="w-80 shrink-0 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-grape-400">
                <Sparkles className="w-4 h-4" /> AI Analysis
              </h3>
              <button onClick={() => setAiOpen(false)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-grape-400 mb-3" />
                  <p className="text-sm">Analyzing your drawing...</p>
                </div>
              )}
              {aiError && <div className="bg-red-600/20 border border-red-600/30 text-red-400 rounded-xl p-4 text-sm">{aiError}</div>}
              {aiResult && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Identified</p>
                    <p className="font-semibold text-grape-300">{aiResult.identification}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Analysis</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{aiResult.description}</p>
                  </div>
                  {aiResult.relatedConcepts?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Related Concepts</p>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.relatedConcepts.map((c, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-grape-600/20 text-grape-300 border border-grape-600/30 rounded-lg">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiResult.suggestion && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Suggestion</p>
                      <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 p-3 rounded-xl border border-gray-700">{aiResult.suggestion}</p>
                    </div>
                  )}
                  <button onClick={handleAnalyze} className="w-full btn-secondary text-sm flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Re-analyze
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
