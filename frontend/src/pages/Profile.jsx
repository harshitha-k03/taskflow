import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Save, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUser } from '../store/authSlice';
import * as authApi from '../api/auth';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      dispatch(updateUser(res.data.user));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassError('');
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassLoading(true);
    try {
      await authApi.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Profile Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar + Profile */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-400" /> Profile Information
        </h2>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="font-medium text-white">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className={`badge text-xs mt-1 ${user?.isEmailVerified ? 'bg-green-900/40 text-green-300' : 'bg-yellow-900/40 text-yellow-300'}`}>
              {user?.isEmailVerified ? 'Email verified' : 'Email not verified'}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="form-group">
            <label className="label">Full name</label>
            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Your name" required minLength={2} maxLength={50} />
          </div>
          <div className="form-group">
            <label className="label">Avatar URL <span className="text-gray-500 font-normal">(optional)</span></label>
            <input value={profileForm.avatar} onChange={e => setProfileForm(f => ({ ...f, avatar: e.target.value }))}
              className="input" placeholder="https://example.com/avatar.jpg" type="url" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-400" /> Change Password
        </h2>

        {passError && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">{passError}</div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div className="form-group">
            <label className="label">Current password</label>
            <input type="password" value={passForm.currentPassword}
              onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="input" required placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="label">New password</label>
            <input type="password" value={passForm.newPassword}
              onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
              className="input" required minLength={8} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="label">Confirm new password</label>
            <input type="password" value={passForm.confirmPassword}
              onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="input" required placeholder="••••••••" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passLoading} className="btn-primary">
              {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary-400" /> Account Info
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400">Email</span>
            <span className="text-gray-200">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">Member since</span>
            <span className="text-gray-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
