import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Loader2, Mail } from 'lucide-react';
import * as authApi from '../api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">TaskFlow</span>
        </div>

        <div className="card p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-6">
                If <strong className="text-gray-200">{email}</strong> is registered, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="btn-secondary">Back to login</Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
                <p className="text-gray-400 text-sm">Enter your email and we'll send you a reset link</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="email" className="label">Email address</label>
                  <input id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input" placeholder="you@example.com" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                  ← Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
