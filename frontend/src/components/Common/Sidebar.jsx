import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { updateUser } from '../../store/authSlice';
import * as authApi from '../../api/auth';
import { updateAvailability } from '../../api/tasks';
import { getUnreadCounts } from '../../api/messages';
import { toast } from 'sonner';
import { LayoutDashboard, FolderKanban, User as UserIcon, LogOut, CheckSquare, UsersRound, MessageSquare, ChevronsLeft, ChevronsRight } from 'lucide-react';

const AVAIL_CYCLE = ['available', 'busy', 'ooo'];
const AVAIL_META = {
  available: { dot: 'bg-emerald-500', label: 'Available' },
  busy:      { dot: 'bg-amber-500',   label: 'Busy'      },
  ooo:       { dot: 'bg-red-500',     label: 'Out of Office' },
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/team', label: 'Team', icon: UsersRound },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const availStatus = user?.availability?.status || 'available';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const [totalUnread, setTotalUnread] = useState(0);
  const pollRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Poll for unread message counts every 15s (industry standard: Slack polls every 10-30s)
  useEffect(() => {
    const fetchUnread = () => {
      getUnreadCounts()
        .then((r) => {
          const counts = r.data.data || {};
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          setTotalUnread(total);
        })
        .catch(() => {});
    };
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 15000);
    return () => clearInterval(pollRef.current);
  }, []);

  // Clear badge when user navigates to /chat
  useEffect(() => {
    if (location.pathname === '/chat') {
      setTotalUnread(0);
    }
  }, [location.pathname]);

  const cycleAvailability = async () => {
    const next = AVAIL_CYCLE[(AVAIL_CYCLE.indexOf(availStatus) + 1) % AVAIL_CYCLE.length];
    try {
      await updateAvailability(next);
      dispatch(updateUser({ availability: { status: next } }));
      toast.success(`Status → ${AVAIL_META[next].label}`, { icon: next === 'available' ? '🟢' : next === 'busy' ? '🟡' : '🔴' });
    } catch (_) {
      toast.error('Could not update status');
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    dispatch(logout());
    navigate('/login');
    toast.success('Signed out');
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col h-full shadow-xl z-30 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-64'}`}
      style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}
    >
      {/* Logo */}
      <div className={`p-lg border-b border-white/10 flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3'}`}>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner backdrop-blur-sm shrink-0">
          <CheckSquare className="text-white" size={22} />
        </div>
        {!collapsed && (
          <div>
            <span className="text-h2 font-bold tracking-tight text-white">TaskFlow</span>
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">Workspace</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 p-md space-y-1 overflow-y-auto pt-4 ${collapsed ? 'px-2' : ''}`}>
        {!collapsed && <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest px-md mb-3">Navigation</p>}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `
              flex items-center gap-3 ${collapsed ? 'justify-center px-0 py-[10px]' : 'px-md py-[10px]'} rounded-lg transition-all duration-150 font-semibold text-body-sm
              ${isActive
                ? 'bg-white/20 text-white shadow-sm border border-white/10'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-white/20' : 'bg-transparent'}`}>
                  <Icon size={18} />
                </div>
                {!collapsed && <span>{label}</span>}
                {/* Unread badge for Chat */}
                {to === '/chat' && totalUnread > 0 && !isActive ? (
                  <span className={`${collapsed ? 'absolute top-0 right-0' : 'ml-auto'} flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse shadow-lg shadow-red-500/30`}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                ) : isActive && !collapsed ? (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-md pb-2">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white/40 hover:bg-white/10 hover:text-white/70 transition-all text-[11px] font-semibold"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> <span>Collapse</span></>}
        </button>
      </div>

      {/* User Area */}
      <div className={`p-md border-t border-white/10 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-2 py-3'} mb-2 rounded-lg bg-white/5`}>
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white font-bold shadow-md border-2 border-white/20 text-sm overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : initial}
            </div>
            {/* Clickable availability dot */}
            <button
              onClick={cycleAvailability}
              title={`Status: ${AVAIL_META[availStatus].label} — click to change`}
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-neutral-900 ${AVAIL_META[availStatus].dot} hover:scale-125 transition-transform cursor-pointer`}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-bold truncate text-white">{user?.name}</p>
              <p className={`text-[10px] font-semibold truncate uppercase tracking-wider ${
                availStatus === 'available' ? 'text-emerald-400' : availStatus === 'busy' ? 'text-amber-400' : 'text-red-400'
              }`}>{AVAIL_META[availStatus].label}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-md'} py-[10px] rounded-lg text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150 font-semibold text-body-sm`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
