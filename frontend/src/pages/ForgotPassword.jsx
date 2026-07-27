import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { forgotPassword } from '../api.js';

export default function ForgotPassword() {
  const [login, setLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await forgotPassword(login);
      setMessage(data.message);
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
        <p className="text-gray-400">Enter your username or email and we'll send you a reset link</p>
      </div>

      <div className="card">
        {message ? (
          <div className="text-center space-y-4">
            <MailCheck className="w-12 h-12 text-grape-400 mx-auto" />
            <p className="text-gray-200">{message}</p>
            <p className="text-gray-500 text-sm">Check your inbox (and spam folder) for the reset link.</p>
            <Link to="/auth" className="btn-primary inline-flex items-center gap-2 mt-2">
              Back to Sign In
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Working...</>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
