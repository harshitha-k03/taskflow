import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import * as authApi from '../../api/auth';
import toast from 'react-hot-toast';

const navItems = [
  {
    to: '/dashboard', label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    to: '/projects', label: 'Projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  {
    to: '/profile', label: 'Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    dispatch(logout());
    navigate('/login');
    toast.success('Signed out');
  };

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'rgba(13,20,33,0.8)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #2B8CDC 0%, #00D5B0 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,213,176,0.2)', flexShrink: 0
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2F4F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="4"/>
          </svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F2F4F7', letterSpacing: '-0.3px' }}>TaskFlow</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              background: isActive ? 'rgba(0,213,176,0.1)' : 'transparent',
              color: isActive ? '#00D5B0' : '#B1B4BA',
              transition: 'all 150ms ease',
            })}
            onMouseEnter={(e) => { if (e.currentTarget.style.background === 'transparent') e.currentTarget.style.color = '#F2F4F7'; }}
            onMouseLeave={(e) => { if (e.currentTarget.style.background === 'transparent') e.currentTarget.style.color = '#B1B4BA'; }}
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 12px', marginBottom: 12
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#F2F4F7', fontSize: 14, fontWeight: 700, flexShrink: 0
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F2F4F7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#B1B4BA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
        
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent',
          color: '#FF3F6D', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          transition: 'all 150ms ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,63,109,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
