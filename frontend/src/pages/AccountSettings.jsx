import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, User, KeyRound, CheckCircle, BarChart3, Layers, CreditCard, FileText, PenTool, Trophy, AlertTriangle } from 'lucide-react';
import { changeUsername, changePassword, getAccountStats } from '../api.js';

export default function AccountSettings({ user, onUpdate }) {
  const [usernameForm, setUsernameForm] = useState({ newUsername: '', password: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getAccountStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  function clearState() {
    setError('');
    setMsg('');
  }

  async function handleUsername(e) {
    e.preventDefault();
    setLoading(true);
    clearState();
    try {
      const data = await changeUsername(usernameForm.newUsername, usernameForm.password);
      onUpdate(data.user);
      setMsg('Username changed!');
      setUsernameForm({ newUsername: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    setLoading(true);
    clearState();
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setMsg('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const statCards = stats ? [
    { label: 'Decks', value: stats.decks, icon: Layers, color: 'text-blue-400' },
    { label: 'Cards', value: stats.cards, icon: CreditCard, color: 'text-grape-400' },
    { label: 'Mastered', value: stats.mastered, icon: Trophy, color: 'text-yellow-400' },
    { label: 'Due', value: stats.due, icon: AlertTriangle, color: 'text-orange-400' },
    { label: 'Sessions', value: stats.sessions, icon: BarChart3, color: 'text-green-400' },
    { label: 'Notes', value: stats.notes, icon: FileText, color: 'text-cyan-400' },
    { label: 'Whiteboards', value: stats.whiteboards, icon: PenTool, color: 'text-pink-400' },
  ] : [];

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Link to="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-2xl font-bold mb-2">
        <span className="text-grape-400">Account Settings</span>
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Signed in as <span className="text-gray-200">{user?.username}</span> ({user?.email})
        {user?.created_at && (
          <span className="text-gray-600 ml-2">· Joined {new Date(user.created_at).toLocaleDateString()}</span>
        )}
      </p>

      {msg && (
        <div className="bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {msg}
        </div>
      )}
      {error && (
        <div className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-grape-400" />
          <h2 className="text-lg font-semibold">Your Stats</h2>
        </div>
        {statsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-grape-400" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gray-800/60 rounded-xl p-3 text-center">
                <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
            <div className="bg-gray-800/60 rounded-xl p-3 text-center col-span-2 sm:col-span-4">
              <p className="text-xs text-gray-500">
                Accuracy: {stats.cards > 0 ? Math.round((stats.mastered / stats.cards) * 100) : 0}% mastered · {stats.due} cards due
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No stats available</p>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-grape-400" />
          <h2 className="text-lg font-semibold">Change Username</h2>
        </div>
        <form onSubmit={handleUsername} className="space-y-3">
          <input
            type="text"
            placeholder="New username"
            value={usernameForm.newUsername}
            onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
            className="input-field"
            required
            minLength={2}
            maxLength={30}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={usernameForm.password}
            onChange={(e) => setUsernameForm({ ...usernameForm, password: e.target.value })}
            className="input-field"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
            Update Username
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-grape-400" />
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handlePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            className="input-field"
            required
            minLength={6}
          />
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
