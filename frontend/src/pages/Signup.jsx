import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Zap, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials } from '../store/authSlice';
import * as authApi from '../api/auth';

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[@$!%*?&]/.test(p) },
];

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.signup(form);
      dispatch(setCredentials(data));
      toast.success(`Welcome to TaskFlow, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">TaskFlow</span>
        </div>

        <div className="card p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-gray-400 text-sm">Start managing projects with your team</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" type="text" required value={form.name}
                onChange={handleChange} className="input" placeholder="John Doe" />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" name="email" type="email" required value={form.email}
                onChange={handleChange} className="input" placeholder="you@example.com" />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPass ? 'text' : 'password'}
                  required value={form.password} onChange={handleChange}
                  className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div className="mt-2 grid grid-cols-1 gap-1">
                  {passwordRules.map((rule) => {
                    const ok = rule.test(form.password);
                    return (
                      <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-400' : 'text-gray-500'}`}>
                        <Check className={`w-3 h-3 ${ok ? 'opacity-100' : 'opacity-30'}`} />
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password"
                required value={form.confirmPassword} onChange={handleChange}
                className="input" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
