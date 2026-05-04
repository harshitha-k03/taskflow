import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  User, Mail, Lock, Save, Loader2, Shield, Calendar, KeyRound,
  CheckCircle, AlertCircle, Wifi, WifiOff, Coffee,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateUser } from '../store/authSlice';
import * as authApi from '../api/auth';
import { updateAvailability } from '../api/tasks';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  // All hooks MUST be before any early return
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [availability, setAvailability] = useState(user?.availability?.status || 'available');
  const [availLoading, setAvailLoading] = useState(false);

  const AVAIL_OPTIONS = [
    { key: 'available', label: 'Available',     icon: Wifi,    bg: 'bg-emerald-500', ring: 'ring-emerald-400', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
    { key: 'busy',      label: 'Busy',           icon: Coffee,  bg: 'bg-amber-500',   ring: 'ring-amber-400',   light: 'bg-amber-50 text-amber-700 border-amber-200',     dark: 'dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'     },
    { key: 'ooo',       label: 'Out of Office',  icon: WifiOff, bg: 'bg-red-500',     ring: 'ring-red-400',     light: 'bg-red-50 text-red-700 border-red-200',           dark: 'dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'           },
  ];

  const handleAvailability = async (status) => {
    if (status === availability) return;
    setAvailLoading(true);
    try {
      await updateAvailability(status);
      setAvailability(status);
      dispatch(updateUser({ ...user, availability: { status } }));
      toast.success(`Status set to ${AVAIL_OPTIONS.find(o => o.key === status)?.label}!`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setAvailLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      dispatch(updateUser(res.data.user));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    if (passForm.newPassword.length < 8) {
      setPassError('Password must be at least 8 characters.');
      return;
    }
    setPassLoading(true);
    try {
      await authApi.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPassSuccess(true);
      toast.success('Password changed successfully!');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="page-enter max-w-3xl mx-auto flex flex-col gap-lg pb-xl">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-xl shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-black shadow-lg border-2 border-white/30 flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{user.name}</h1>
            <p className="text-primary-200 text-sm font-medium mt-0.5 truncate">{user.email}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                user.isEmailVerified
                  ? 'bg-success-500/20 text-success-200 border border-success-500/30'
                  : 'bg-warning-500/20 text-warning-200 border border-warning-500/30'
              }`}>
                <CheckCircle size={12} />
                {user.isEmailVerified ? 'Verified Account' : 'Email Not Verified'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/20 text-primary-100">
                <Calendar size={12} />
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-xl shadow-sm">
        <div className="flex items-center gap-3 mb-xl pb-lg border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <User size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50">Profile Information</h2>
            <p className="text-body-sm text-neutral-500">Update your display name and avatar</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-md">
          <div className="flex flex-col gap-1.5">
            <label className="label">Full Name</label>
            <input
              value={profileForm.name}
              onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={50}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">Avatar URL <span className="font-normal text-neutral-400">(optional)</span></label>
            <input
              value={profileForm.avatar}
              onChange={e => setProfileForm(f => ({ ...f, avatar: e.target.value }))}
              className="input"
              placeholder="https://example.com/your-photo.jpg"
              type="url"
            />
            <p className="text-[11px] text-neutral-400 font-medium">Leave blank to use your initials as avatar</p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary shadow-md shadow-primary-500/20"
            >
              {profileLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* ── Availability Status Card ── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-xl shadow-sm">
        <div className="flex items-center gap-3 mb-xl pb-lg border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Wifi size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-h3 font-bold text-slate-900 dark:text-slate-50">Your Availability</h2>
            <p className="text-body-sm text-slate-500">Let your team know if you're reachable</p>
          </div>
          {availLoading && <Loader2 size={16} className="ml-auto animate-spin text-slate-400" />}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {AVAIL_OPTIONS.map(({ key, label, icon: Icon, bg, ring, light, dark }) => {
            const isActive = availability === key;
            return (
              <button
                key={key}
                onClick={() => handleAvailability(key)}
                disabled={availLoading}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold text-body-sm transition-all duration-150 ${
                  isActive
                    ? `${light} ${dark} border-current ring-2 ${ring} ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-[1.02] shadow-md`
                    : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${isActive ? bg : 'bg-slate-200 dark:bg-neutral-700'}`}>
                  <Icon size={18} />
                </div>
                <span>{label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-4 text-center">
          Your status is visible to all team members on the Team page and Dashboard.
        </p>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-xl shadow-sm">
        <div className="flex items-center gap-3 mb-xl pb-lg border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center">
            <Lock size={20} className="text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <h2 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50">Change Password</h2>
            <p className="text-body-sm text-neutral-500">Keep your account secure with a strong password</p>
          </div>
        </div>

        {passError && (
          <div className="flex items-center gap-3 p-md bg-error-50 dark:bg-error-900/20 border border-error-100 dark:border-error-800 rounded-lg text-error-700 dark:text-error-400 text-sm mb-lg">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="font-semibold">{passError}</span>
          </div>
        )}
        {passSuccess && (
          <div className="flex items-center gap-3 p-md bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 rounded-lg text-success-700 dark:text-success-400 text-sm mb-lg">
            <CheckCircle size={16} className="flex-shrink-0" />
            <span className="font-semibold">Password changed successfully!</span>
          </div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-md">
          <div className="flex flex-col gap-1.5">
            <label className="label">Current Password</label>
            <input
              type="password"
              value={passForm.currentPassword}
              onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="input"
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-1.5">
              <label className="label">New Password</label>
              <input
                type="password"
                value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                className="input"
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                value={passForm.confirmPassword}
                onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="input"
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="p-md bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Password requirements</p>
            <ul className="space-y-1">
              {['At least 8 characters', 'A mix of letters and numbers recommended'].map(req => (
                <li key={req} className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passLoading}
              className="btn-primary shadow-md shadow-primary-500/20"
            >
              {passLoading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Account Details Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-xl shadow-sm">
        <div className="flex items-center gap-3 mb-xl pb-lg border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Mail size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50">Account Details</h2>
            <p className="text-body-sm text-neutral-500">Read-only information about your account</p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {[
            { label: 'Email Address', value: user.email, icon: Mail },
            { label: 'Account Status', value: user.isEmailVerified ? 'Verified' : 'Unverified', icon: Shield, highlight: user.isEmailVerified ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400' },
            { label: 'Member Since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A', icon: Calendar },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className="flex justify-between items-center py-md">
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-neutral-400 flex-shrink-0" />
                <span className="text-body-sm text-neutral-500 font-medium">{label}</span>
              </div>
              <span className={`text-body-sm font-bold ${highlight || 'text-neutral-900 dark:text-neutral-50'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
