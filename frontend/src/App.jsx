import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Layers, BarChart3, FileText, PenTool, Calculator } from 'lucide-react';
import Home_page from './pages/Home.jsx';
import Decks_page from './pages/Decks.jsx';
import DeckDetail_page from './pages/DeckDetail.jsx';
import Study_page from './pages/Study.jsx';
import Quiz_page from './pages/Quiz.jsx';
import Stats_page from './pages/Stats.jsx';
import Notes_page from './pages/Notes.jsx';
import Whiteboard_page from './pages/Whiteboard.jsx';
import CalculatorPopup from './components/Calculator.jsx';

function NavBar({ onToggleCalc, calcOpen }) {
  const location = useLocation();
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/decks', icon: Layers, label: 'Decks' },
    { to: '/stats', icon: BarChart3, label: 'Stats' },
    { to: '/notes', icon: FileText, label: 'Notes' },
    { to: '/whiteboard', icon: PenTool, label: 'Whiteboard' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-grape-400 font-bold text-xl">
          <BookOpen className="w-6 h-6" />
          Omoikane
        </Link>
        <div className="flex gap-1 items-center">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === to
                  ? 'bg-grape-500/20 text-grape-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <button
            onClick={onToggleCalc}
            title="Calculator"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ml-1 ${
              calcOpen
                ? 'bg-grape-500/20 text-grape-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Calc</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <BrowserRouter>
      <NavBar calcOpen={calcOpen} onToggleCalc={() => setCalcOpen(!calcOpen)} />
      <CalculatorPopup open={calcOpen} onClose={() => setCalcOpen(false)} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home_page />} />
          <Route path="/decks" element={<Decks_page />} />
          <Route path="/decks/:id" element={<DeckDetail_page />} />
          <Route path="/study/:id" element={<Study_page />} />
          <Route path="/quiz/:id" element={<Quiz_page />} />
          <Route path="/stats" element={<Stats_page />} />
          <Route path="/notes" element={<Notes_page />} />
          <Route path="/whiteboard" element={<Whiteboard_page />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
