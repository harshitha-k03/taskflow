import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Loader2, ArrowRight, CheckSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { setCredentials } from '../store/authSlice';
import * as authApi from '../api/auth';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Google G logo SVG
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error') === 'oauth_failed' ? 'Google sign-in failed. Please try another method.' : '');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleDemoLogin = () => {
    setForm({ email: 'demo@taskflow.com', password: 'password123' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(form);
      dispatch(setCredentials(data));
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-500/10 blur-[120px] rounded-full -ml-48 -mb-48"></div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/20 mb-4">
            <CheckSquare className="text-white" size={32} />
          </div>
          <h1 className="text-display leading-tight text-center">Welcome back</h1>
          <p className="text-neutral-500 font-medium text-body-sm mt-1">Sign in to manage your tasks efficiently</p>
        </div>

        <div className="card !p-8 sm:!p-10">
          {error && (
            <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-100 dark:border-error-800 rounded-xl text-error-600 dark:text-error-400 text-sm flex items-center gap-3 mb-6">
              <AlertCircle size={18} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <div className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 text-primary-800 dark:text-primary-300">
            <h3 className="font-bold mb-1">Try the Live Demo!</h3>
            <p className="text-sm mb-3">You can use our pre-populated demo account to explore TaskFlow's features without signing up.</p>
            <button type="button" onClick={handleDemoLogin} className="text-xs font-bold bg-primary-100 dark:bg-primary-800 px-3 py-2 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-700 transition-colors w-full">
              Auto-fill Demo Credentials
            </button>
          </div>

          {/* Google OAuth Button */}
          <a
            href={`${BACKEND}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-150 shadow-sm hover:shadow-md"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="label">Email Address</label>
              <input 
                name="email" 
                type="email" 
                required 
                value={form.email}
                onChange={handleChange} 
                className="input" 
                placeholder="name@company.com" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="label">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPass ? 'text' : 'password'}
                  required 
                  value={form.password} 
                  onChange={handleChange}
                  className="input !pr-12" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-4 shadow-lg shadow-primary-500/25 mt-4">
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span className="font-black tracking-wide">SIGN IN</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800 text-center">
            <p className="text-neutral-500 text-body-sm font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 dark:text-primary-400 font-black hover:underline underline-offset-4">
                Create one for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
