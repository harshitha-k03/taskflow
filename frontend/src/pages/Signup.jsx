import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, XCircle, CheckSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials } from '../store/authSlice';
import * as authApi from '../api/auth';

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

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(form.password);
  const strengthText = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] || 'Weak';
  const strengthColor = ['#ef4444', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][strength] || '#374151';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.signup(form);
      dispatch(setCredentials(data));
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
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
          <h1 className="text-display leading-tight text-center">Join TaskFlow</h1>
          <p className="text-neutral-500 font-medium text-body-sm mt-1 text-center px-4">Create an account to start managing projects and collaborating with your team.</p>
        </div>

        <div className="card !p-8 sm:!p-10">
          {error && (
            <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-100 dark:border-error-800 rounded-xl text-error-600 dark:text-error-400 text-sm flex items-center gap-3 mb-6">
              <AlertCircle size={18} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="label">Full Name</label>
              <input 
                name="name" 
                required 
                value={form.name} 
                onChange={handleChange}
                className="input font-bold" 
                placeholder="John Doe" 
              />
            </div>

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
              <label className="label">Password</label>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPass ? 'text' : 'password'}
                  required 
                  value={form.password} 
                  onChange={handleChange}
                  className="input !pr-12" 
                  placeholder="At least 8 characters" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ width: `${(strength / 4) * 100}%`, background: strengthColor }}
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: strengthColor }}>{strengthText}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input 
                  name="confirmPassword" 
                  type={showPass ? 'text' : 'password'}
                  required 
                  value={form.confirmPassword} 
                  onChange={handleChange}
                  className="input !pr-12" 
                  placeholder="Repeat your password" 
                />
                {form.confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-all">
                    {form.password === form.confirmPassword 
                      ? <CheckCircle2 size={20} className="text-success-500" />
                      : <XCircle size={20} className="text-error-500" />
                    }
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading || (form.password && form.password !== form.confirmPassword)} 
              className="btn-primary w-full !py-4 shadow-lg shadow-primary-500/25 mt-4">
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span className="font-black tracking-wide uppercase">GET STARTED</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800 text-center">
            <p className="text-neutral-500 text-body-sm font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-black hover:underline underline-offset-4">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
