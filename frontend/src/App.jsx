import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Layers, BarChart3, FileText, PenTool, Calculator, LogIn, LogOut, User } from 'lucide-react';
import { getMe, logout } from './api.js';
import Home_page from './pages/Home.jsx';
import Decks_page from './pages/Decks.jsx';
import DeckDetail_page from './pages/DeckDetail.jsx';
import Study_page from './pages/Study.jsx';
import Quiz_page from './pages/Quiz.jsx';
import Stats_page from './pages/Stats.jsx';
import Notes_page from './pages/Notes.jsx';
import Whiteboard_page from './pages/Whiteboard.jsx';
import Auth_page from './pages/Auth.jsx';
import CalculatorPopup from './components/Calculator.jsx';

function NavBar({ user, onLogout, onToggleCalc, calcOpen }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.username}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { onLogout(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-grape-600 hover:bg-grape-700 text-white transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [calcOpen, setCalcOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((data) => {
      setUser(data.user);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-grape-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={handleLogout} calcOpen={calcOpen} onToggleCalc={() => setCalcOpen(!calcOpen)} />
      <CalculatorPopup open={calcOpen} onClose={() => setCalcOpen(false)} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home_page />} />
          <Route path="/decks" element={<Decks_page />} />
          <Route path="/decks/:id" element={<DeckDetail_page />} />
          <Route path="/study/:id" element={<Study_page />} />
          <Route path="/quiz/:id" element={<Quiz_page />} />
          <Route path="/stats" element={<Stats_page />} />
          <Route path="/notes" element={<Notes_page user={user} />} />
          <Route path="/whiteboard" element={<Whiteboard_page user={user} />} />
          <Route path="/auth" element={<Auth_page onAuth={setUser} />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
