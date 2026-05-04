import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { updateUser } from '../../store/authSlice';
import * as authApi from '../../api/auth';
import { updateAvailability } from '../../api/tasks';
import { toast } from 'sonner';
import { LayoutDashboard, FolderKanban, User as UserIcon, LogOut, CheckSquare, Users } from 'lucide-react';

const AVAIL_CYCLE = ['available', 'busy', 'ooo'];
const AVAIL_META = {
  available: { dot: 'bg-emerald-500', label: 'Available' },
  busy:      { dot: 'bg-amber-500',   label: 'Busy'      },
  ooo:       { dot: 'bg-red-500',     label: 'Out of Office' },
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [availStatus, setAvailStatus] = useState(user?.availability?.status || 'available');
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const cycleAvailability = async () => {
    const next = AVAIL_CYCLE[(AVAIL_CYCLE.indexOf(availStatus) + 1) % AVAIL_CYCLE.length];
    try {
      await updateAvailability(next);
      setAvailStatus(next);
      dispatch(updateUser({ ...user, availability: { status: next } }));
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
    <aside className="w-64 flex-shrink-0 flex flex-col h-full shadow-xl z-30"
      style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}
    >
      {/* Logo */}
      <div className="p-lg border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner backdrop-blur-sm">
          <CheckSquare className="text-white" size={22} />
        </div>
        <div>
          <span className="text-h2 font-bold tracking-tight text-white">TaskFlow</span>
          <p className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">Workspace</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-md space-y-1 overflow-y-auto pt-4">
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest px-md mb-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-md py-[10px] rounded-lg transition-all duration-150 font-semibold text-body-sm
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
                <span>{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Area */}
      <div className="p-md border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-lg bg-white/5">
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
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-bold truncate text-white">{user?.name}</p>
            <p className={`text-[10px] font-semibold truncate uppercase tracking-wider ${
              availStatus === 'available' ? 'text-emerald-400' : availStatus === 'busy' ? 'text-amber-400' : 'text-red-400'
            }`}>{AVAIL_META[availStatus].label}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-md py-[10px] rounded-lg text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150 font-semibold text-body-sm"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
