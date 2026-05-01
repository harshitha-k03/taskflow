import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const titles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/tasks': 'Task',
};

export default function Navbar() {
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const title = Object.entries(titles).find(([p]) => location.pathname.startsWith(p))?.[1] || 'TaskFlow';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header style={{
      height: 64, flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(13,20,33,0.6)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#F2F4F7', letterSpacing: '-0.1px' }}>
        {title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          onClick={() => toast.success('No new notifications!')}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#B1B4BA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 150ms ease, color 150ms ease, transform 150ms ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#F2F4F7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B1B4BA'; }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#F2F4F7', fontSize: 14, fontWeight: 700,
          boxShadow: '0 2px 12px rgba(43,140,220,0.25)'
        }}>
          {initial}
        </div>
      </div>
    </header>
  );
}
