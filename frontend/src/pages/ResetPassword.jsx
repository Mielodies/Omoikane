import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { resetPassword } from '../api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
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
          <span className="text-grape-400">Reset Password</span>
        </h1>
        <p className="text-gray-400">Enter your reset token and new password</p>
      </div>

      <div className="card">
        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-gray-200">Password reset successful!</p>
            <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input-field font-mono text-sm"
              required
            />

            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
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
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
