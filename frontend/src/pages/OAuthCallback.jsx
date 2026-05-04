import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { Loader2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasRun = useRef(false); // prevents React Strict Mode double-fire

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const user = {
      _id:             params.get('userId'),
      name:            params.get('name'),
      email:           params.get('email'),
      avatar:          params.get('avatar') || null,
      isEmailVerified: params.get('isEmailVerified') === 'true',
    };

    if (!accessToken || !user._id) {
      toast.error('Authentication error. Please try again.');
      navigate('/login');
      return;
    }

    dispatch(setCredentials({ accessToken, refreshToken, user }));
    toast.success(`Welcome, ${user.name}! 🎉`);
    navigate('/dashboard');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/20 animate-pulse">
        <CheckSquare className="text-white" size={32} />
      </div>
      <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-semibold">Signing you in with Google…</span>
      </div>
    </div>
  );
}
