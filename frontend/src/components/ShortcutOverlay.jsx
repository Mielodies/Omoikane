import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { section: 'Study', items: [
    { keys: ['Space'], desc: 'Flip card' },
    { keys: ['←'], desc: 'Mark incorrect' },
    { keys: ['→'], desc: 'Mark correct' },
  ]},
  { section: 'Quiz', items: [
    { keys: ['1-4'], desc: 'Select answer' },
    { keys: ['Enter'], desc: 'Next question' },
  ]},
  { section: 'General', items: [
    { keys: ['C'], desc: 'Toggle calculator' },
    { keys: ['T'], desc: 'Toggle timer' },
    { keys: ['/'], desc: 'Search' },
    { keys: ['D'], desc: 'Toggle theme' },
    { keys: ['?'], desc: 'Toggle shortcuts' },
    { keys: ['Esc'], desc: 'Close overlay' },
  ]},
];

export default function ShortcutOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-grape-400" />
            Keyboard Shortcuts
          </h3>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {shortcuts.map((group) => (
            <div key={group.section}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.section}</h4>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-300">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key) => (
                        <kbd key={key} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded-md text-xs font-mono text-gray-400">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
