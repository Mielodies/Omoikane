import { useState, useRef, useEffect } from 'react';
import { X, Timer, Play, Pause, RotateCcw } from 'lucide-react';

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800;
  gain.gain.value = 0.3;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.stop(ctx.currentTime + 0.5);
}

const MODES = {
  work: { label: 'Focus', duration: 25 * 60, color: 'text-grape-400' },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: 'text-green-400' },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: 'text-blue-400' },
};

export default function Pomodoro({ open, onClose }) {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const dragRef = useRef(null);
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: 120 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const intervalRef = useRef(null);

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

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && running) {
      setRunning(false);
      playBeep();
      if (mode === 'work') {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        if (newSessions % 4 === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('work');
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft, mode]);

  function switchMode(newMode) {
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setRunning(false);
  }

  function toggleTimer() {
    setRunning(!running);
  }

  function resetTimer() {
    setRunning(false);
    setTimeLeft(MODES[mode].duration);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalDuration = MODES[mode].duration;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const circumference = 2 * Math.PI * 58;
  const dashOffset = circumference - (progress / 100) * circumference;

  if (!open) return null;

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="w-[280px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div
          onMouseDown={startDrag}
          className="flex items-center justify-between px-4 py-2.5 bg-gray-800 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-grape-400">
            <Timer className="w-4 h-4" /> Pomodoro
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex justify-center pt-6 pb-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-800" />
              <circle
                cx="64" cy="64" r="58" fill="none"
                stroke="currentColor" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`${MODES[mode].color} transition-all duration-1000`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-light text-white">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className={`text-xs mt-1 ${MODES[mode].color}`}>{MODES[mode].label}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 pb-2 px-4">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-grape-600 hover:bg-grape-700 text-white text-sm font-medium transition-all active:scale-95"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-center gap-1 pb-4 px-4">
          {['work', 'shortBreak', 'longBreak'].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === m
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-800 px-4 py-2.5 text-center">
          <p className="text-xs text-gray-500">Sessions: <span className="text-gray-300">{sessions}</span> {sessions > 0 && sessions % 4 === 0 && <span className="text-blue-400">· Long break taken</span>}</p>
        </div>
      </div>
    </div>
  );
}
