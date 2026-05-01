import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
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
  const strengthColor = ['#C3284D', '#C3284D', '#FFA200', '#2B8CDC', '#00D5B0'][strength] || '#374151';

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
    <div className="flex items-center justify-center p-4 relative overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,213,176,0.12) 0%, transparent 60%)',
        pointerEvents: 'none', filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(43,140,220,0.12) 0%, transparent 60%)',
        pointerEvents: 'none', filter: 'blur(40px)'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }} className="animate-enter">
        {/* Logo mark */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(96.54deg, #2B8CDC 5.62%, #00D5B0 91.41%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(43,140,220,0.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F2F4F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="4"/>
            </svg>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '40px 32px' }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <h1 className="page-title" style={{ marginBottom: 8 }}>Create an account</h1>
            <p style={{ fontSize: 14, color: '#B1B4BA' }}>
              Join TaskFlow and manage your projects.
            </p>
          </div>

          {error && (
            <div className="animate-enter stagger-1" style={{
              marginBottom: 20, padding: '12px 16px',
              background: 'rgba(195,40,77,0.1)', border: '1px solid rgba(195,40,77,0.3)',
              borderRadius: 12, color: '#FF3F6D', fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group animate-enter stagger-2">
              <label className="label">Full Name</label>
              <input name="name" required value={form.name} onChange={handleChange}
                className="input" placeholder="John Doe" />
            </div>

            <div className="form-group animate-enter stagger-3">
              <label className="label">Email address</label>
              <input name="email" type="email" required value={form.email}
                onChange={handleChange} className="input" placeholder="you@example.com" />
            </div>

            <div className="form-group animate-enter stagger-4">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPass ? 'text' : 'password'}
                  required value={form.password} onChange={handleChange}
                  className="input" placeholder="••••••••" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#B1B4BA',
                  display: 'flex', alignItems: 'center', padding: 4, outline: 'none'
                }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(strength / 4) * 100}%`,
                      background: strengthColor, transition: 'all 300ms ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: strengthColor, fontWeight: 500 }}>{strengthText}</span>
                </div>
              )}
            </div>

            <div className="form-group animate-enter stagger-5">
              <label className="label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input name="confirmPassword" type={showPass ? 'text' : 'password'}
                  required value={form.confirmPassword} onChange={handleChange}
                  className="input" placeholder="••••••••" />
                {form.confirmPassword && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    {form.password === form.confirmPassword 
                      ? <CheckCircle2 size={18} color="#00D5B0" />
                      : <XCircle size={18} color="#FF3F6D" />
                    }
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading || (form.password && form.password !== form.confirmPassword)} 
              className="btn btn-primary btn-lg animate-enter stagger-5" style={{ width: '100%', marginTop: 8, animationDelay: '250ms' }}>
              {loading
                ? <Loader2 size={20} className="animate-spin" />
                : <ArrowRight size={20} />}
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="animate-enter" style={{ textAlign: 'center', fontSize: 14, color: '#B1B4BA', marginTop: 32, marginBottom: 0, animationDelay: '300ms' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00D5B0', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
