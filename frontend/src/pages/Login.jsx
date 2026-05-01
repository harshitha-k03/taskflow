import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Loader2, ArrowRight, CheckSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials } from '../store/authSlice';
import * as authApi from '../api/auth';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
