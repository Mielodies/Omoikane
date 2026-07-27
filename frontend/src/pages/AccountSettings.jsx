import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, User, KeyRound, CheckCircle } from 'lucide-react';
import { changeUsername, changePassword } from '../api.js';

export default function AccountSettings({ user, onUpdate }) {
  const [usernameForm, setUsernameForm] = useState({ newUsername: '', password: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

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
