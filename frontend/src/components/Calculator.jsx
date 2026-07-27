import { useState, useRef, useEffect } from 'react';
import { X, Calculator as CalcIcon, Delete, FlaskConical } from 'lucide-react';

export default function Calculator({ open, onClose }) {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const [history, setHistory] = useState('');
  const [justEval, setJustEval] = useState(false);
  const [sciMode, setSciMode] = useState(false);
  const dragRef = useRef(null);
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: 100 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e) {
      if (!dragging) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    }
    function onUp() { setDragging(false); }
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  function startDrag(e) {
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDragging(true);
  }

  function input(val) {
    if (justEval) { setDisplay(val === '.' ? '0.' : val); setExpr(''); setJustEval(false); return; }
    setDisplay((d) => {
      if (val === '.' && d.includes('.')) return d;
      if (d === '0' && val !== '.') return val;
      return d + val;
    });
  }

  function op(operator) {
    if (justEval) setJustEval(false);
    setExpr(display + ' ' + operator + ' ');
    setHistory(display + ' ' + operator + ' ');
    setDisplay('0');
  }

  function equals() {
    try {
      const full = expr + display;
      const safe = full.replace(/[^-()\d/*+.%e]/g, '');
      const result = Function('"use strict";return (' + safe + ')')();
      setHistory(full + ' =');
      setDisplay(String(result));
      setExpr('');
      setJustEval(true);
    } catch { setDisplay('Error'); setJustEval(true); }
  }

  function clear() { setDisplay('0'); setExpr(''); setHistory(''); setJustEval(false); }

  function backspace() { setDisplay((d) => d.length > 1 ? d.slice(0, -1) : '0'); }

  function percent() { setDisplay(String(parseFloat(display) / 100)); }

  function negate() { setDisplay((d) => d.startsWith('-') ? d.slice(1) : '-' + d); }

  function sciFn(fn) {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    let result;
    switch (fn) {
      case 'sin': result = Math.sin(val * Math.PI / 180); break;
      case 'cos': result = Math.cos(val * Math.PI / 180); break;
      case 'tan': result = Math.tan(val * Math.PI / 180); break;
      case 'log': result = val <= 0 ? NaN : Math.log10(val); break;
      case 'ln': result = val <= 0 ? NaN : Math.log(val); break;
      case 'sqrt': result = val < 0 ? NaN : Math.sqrt(val); break;
      case 'x2': result = val * val; break;
      case 'x3': result = val * val * val; break;
      case '1/x': result = val === 0 ? NaN : 1 / val; break;
      case 'pi': result = Math.PI; break;
      case 'e': result = Math.E; break;
      case '(': setExpr((e) => e + '('); setHistory((h) => h + '('); return;
      case ')': setExpr((d) => d + ')'); setHistory((h) => h + ')'); return;
      case '^': op('**'); return;
      default: return;
    }
    if (isNaN(result) || !isFinite(result)) {
      setDisplay('Error');
    } else {
      const label = ['pi', 'e'].includes(fn) ? fn : `${fn}(${display})`;
      setHistory(label + ' =');
      setDisplay(String(result));
    }
    setJustEval(true);
  }

  if (!open) return null;

  const basicButtons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
  ];

  const sciButtons = [
    ['sin', 'cos', 'tan', '^'],
    ['log', 'ln', '√', 'x²'],
    ['x³', '1/x', 'π', 'e'],
    ['(', ')', '', ''],
  ];

  const basicActions = {
    'C': clear, '±': negate, '%': percent,
    '÷': () => op('/'), '×': () => op('*'), '−': () => op('-'), '+': () => op('+'),
    '=': equals, '.': () => input('.'), '⌫': backspace,
  };

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className={`${sciMode ? 'w-[340px]' : 'w-[300px]'} bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all`}>
        {/* Title bar */}
        <div
          onMouseDown={startDrag}
          className="flex items-center justify-between px-4 py-2.5 bg-gray-800 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-grape-400">
            <CalcIcon className="w-4 h-4" /> {sciMode ? 'Scientific' : 'Calculator'}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSciMode(!sciMode)}
              title="Toggle scientific mode"
              className={`p-1.5 rounded-lg transition-colors ${sciMode ? 'bg-grape-600/30 text-grape-400' : 'hover:bg-gray-700 text-gray-400'}`}
            >
              <FlaskConical className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Display */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-xs text-gray-500 text-right h-4 truncate">{history}</p>
          <p className="text-3xl font-light text-right text-white truncate mt-1">{display}</p>
        </div>

        {/* Scientific buttons */}
        {sciMode && (
          <div className="grid grid-cols-4 gap-1.5 px-3 pb-2">
            {sciButtons.map((row, ri) => row.map((btn) => {
              if (!btn) return <div key={`sci-${ri}-${btn}`} />;
              return (
                <button
                  key={`sci-${ri}-${btn}`}
                  onClick={() => sciFn(btn)}
                  className="h-10 rounded-xl font-medium text-xs bg-gray-800 hover:bg-grape-600/20 text-grape-300 transition-all active:scale-95"
                >
                  {btn}
                </button>
              );
            }))}
          </div>
        )}

        {/* Basic buttons */}
        <div className={`grid grid-cols-4 gap-1.5 p-3 ${sciMode ? 'pt-0' : 'pt-0'}`}>
          {basicButtons.map((row, ri) => row.map((btn) => {
            const isAction = basicActions[btn] !== undefined;
            const isEquals = btn === '=';
            const isClear = btn === 'C';
            let cls = 'bg-gray-800 hover:bg-gray-700 text-gray-100';
            if (isEquals) cls = 'bg-grape-600 hover:bg-grape-700 text-white';
            if (isClear) cls = 'bg-red-600/20 hover:bg-red-600/30 text-red-400';
            if (['÷', '×', '−', '+'].includes(btn)) cls = 'bg-gray-750 hover:bg-grape-600/20 text-grape-400';
            return (
              <button
                key={`${ri}-${btn}`}
                onClick={() => basicActions[btn] ? basicActions[btn]() : input(btn)}
                className={`h-12 rounded-xl font-medium text-base transition-all active:scale-95 ${cls}`}
              >
                {btn}
              </button>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
