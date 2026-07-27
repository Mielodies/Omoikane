import { useState, useRef, useEffect, useCallback } from 'react';
import { Undo2, Redo2, Trash2, Download, Minus, Eraser, Sparkles, X, Loader2 } from 'lucide-react';
import { analyzeWhiteboard } from '../api.js';

const STORAGE_KEY = 'omoikane-whiteboard';

const COLORS = ['#ffffff', '#a855f7', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4'];
const SIZES = [2, 4, 8, 16];

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(4);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const lastPoint = useRef(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0); saveState(); };
      img.src = saved;
    } else {
      resizeCanvas();
      saveState();
    }
  }, []);

  function resizeCanvas() {
    const canvas = canvasRef.current;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    setHistory((h) => {
      const newH = h.slice(0, historyIdx + 1);
      newH.push(dataUrl);
      return newH;
    });
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  function persistCanvas() {
    const canvas = canvasRef.current;
    localStorage.setItem(STORAGE_KEY, canvas.toDataURL());
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

    if (tool === 'line' && lastPoint.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (historyIdx >= 0 && history[historyIdx]) {
        const img = new Image();
        img.src = history[historyIdx];
        ctx.drawImage(img, 0, 0);
      }
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  }

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    lastPoint.current = null;
    saveState();
    persistCanvas();
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
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  function clearCanvas() {
    resizeCanvas();
    saveState();
    persistCanvas();
  }

  function download() {
    const link = document.createElement('a');
    link.download = 'omoikane-whiteboard.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  }

  async function handleAnalyze() {
    setAiOpen(true);
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const imageData = canvasRef.current.toDataURL('image/png');
      const result = await analyzeWhiteboard(imageData);
      setAiResult(result);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex gap-4 h-full">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-t-2xl">
            <div className="flex gap-1 bg-gray-800 p-1 rounded-xl">
              {[
                { id: 'pen', icon: Minus, label: 'Pen' },
                { id: 'eraser', icon: Eraser, label: 'Eraser' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTool(id)}
                  title={label}
                  className={`p-2 rounded-lg transition-all ${tool === id ? 'bg-grape-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-700" />

            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool('pen'); }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && tool === 'pen' ? 'border-white scale-110' : 'border-gray-700 hover:border-gray-500'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="w-px h-6 bg-gray-700" />

            <div className="flex gap-1.5 items-center">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${size === s ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <div className="rounded-full bg-gray-300" style={{ width: s + 2, height: s + 2 }} />
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <div className="flex gap-1">
              <button onClick={handleAnalyze} title="AI Analyze Drawing" className="flex items-center gap-1.5 px-3 py-2 bg-grape-600 hover:bg-grape-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95">
                <Sparkles className="w-4 h-4" /> AI Analyze
              </button>
              <div className="w-px h-6 bg-gray-700 mx-1" />
              <button onClick={undo} disabled={historyIdx <= 0} title="Undo" className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all">
                <Undo2 className="w-4 h-4" />
              </button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo" className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all">
                <Redo2 className="w-4 h-4" />
              </button>
              <button onClick={clearCanvas} title="Clear" className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={download} title="Download" className="p-2 text-gray-400 hover:text-grape-400 rounded-lg hover:bg-gray-800 transition-all">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 border border-gray-800 rounded-b-2xl overflow-hidden cursor-crosshair bg-[#030712]">
            <canvas
              ref={canvasRef}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
              className="w-full h-full"
            />
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

              {aiError && (
                <div className="bg-red-600/20 border border-red-600/30 text-red-400 rounded-xl p-4 text-sm">
                  {aiError}
                </div>
              )}

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
                        {aiResult.relatedConcepts.map((concept, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-grape-600/20 text-grape-300 border border-grape-600/30 rounded-lg">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResult.suggestion && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Suggestion</p>
                      <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                        {aiResult.suggestion}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                  >
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
