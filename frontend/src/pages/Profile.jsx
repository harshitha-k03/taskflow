import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Save, Loader2 } from 'lucide-react';
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
    <div className="animate-enter" style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div>
        <h1 className="page-title">Profile Settings</h1>
        <p style={{ color: '#B1B4BA', fontSize: 14, margin: '4px 0 0' }}>Manage your account information</p>
      </div>

      {/* Avatar + Profile */}
      <div className="card stagger-1" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F2F4F7', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} color="#00D5B0" /> Profile Information
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#F2F4F7', fontSize: 28, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(43,140,220,0.3)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#F2F4F7' }}>{user?.name}</p>
            <p style={{ margin: '4px 0 8px 0', fontSize: 14, color: '#B1B4BA' }}>{user?.email}</p>
            <span style={{ 
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: user?.isEmailVerified ? 'rgba(0,213,176,0.15)' : 'rgba(255,162,0,0.15)',
              color: user?.isEmailVerified ? '#00D5B0' : '#FFA200',
              border: `1px solid ${user?.isEmailVerified ? 'rgba(0,213,176,0.25)' : 'rgba(255,162,0,0.25)'}`
            }}>
              {user?.isEmailVerified ? 'Email verified' : 'Email not verified'}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Full name</label>
            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Your name" required minLength={2} maxLength={50} />
          </div>
          <div className="form-group">
            <label className="label">Avatar URL <span style={{ color: 'rgba(242,244,247,0.4)', fontWeight: 400 }}>(optional)</span></label>
            <input value={profileForm.avatar} onChange={e => setProfileForm(f => ({ ...f, avatar: e.target.value }))}
              className="input" placeholder="https://example.com/avatar.jpg" type="url" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" disabled={profileLoading} className="btn btn-primary btn-md">
              {profileLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card stagger-2" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F2F4F7', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} color="#00D5B0" /> Change Password
        </h2>

        {passError && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,63,109,0.1)', border: '1px solid rgba(255,63,109,0.2)', borderRadius: 12, color: '#FF3F6D', fontSize: 14, marginBottom: 20 }}>
            {passError}
          </div>
        )}

        <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" disabled={passLoading} className="btn btn-primary btn-md">
              {passLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="card stagger-3" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F2F4F7', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={18} color="#00D5B0" /> Account Info
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#B1B4BA', fontSize: 14 }}>Email</span>
            <span style={{ color: '#F2F4F7', fontSize: 14, fontWeight: 500 }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
            <span style={{ color: '#B1B4BA', fontSize: 14 }}>Member since</span>
            <span style={{ color: '#F2F4F7', fontSize: 14, fontWeight: 500 }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
