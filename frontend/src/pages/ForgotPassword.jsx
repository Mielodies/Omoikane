import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { forgotPassword } from '../api.js';

export default function ForgotPassword() {
  const [login, setLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetToken('');
    try {
      const data = await forgotPassword(login);
      setMessage(data.message);
      if (data._dev_token) setResetToken(data._dev_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <Link to="/auth" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-grape-400">Forgot Password</span>
        </h1>
        <p className="text-gray-400">Enter your username or email to get a reset token</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username or email"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="input-field"
            required
          />

          {error && (
            <div className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl px-4 py-3 text-sm">
              {message}
            </div>
          )}

          {resetToken && (
            <div className="bg-grape-600/20 text-grape-300 border border-grape-600/30 rounded-xl px-4 py-3 text-sm">
              <p className="mb-1 font-medium">Dev mode — your reset token:</p>
              <code className="block break-all text-xs bg-black/30 rounded-lg p-2 mt-1">{resetToken}</code>
              <Link
                to={`/reset-password?token=${resetToken}`}
                className="mt-3 inline-flex items-center gap-1 text-grape-400 hover:text-grape-300 text-sm"
              >
                <KeyRound className="w-4 h-4" /> Use this token now
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Working...</>
            ) : (
              'Send Reset Token'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
