import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import * as authApi from '../../api/auth';
import toast from 'react-hot-toast';
import { LayoutDashboard, FolderKanban, User as UserIcon, LogOut, CheckSquare } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/profile', label: 'Profile', icon: UserIcon },
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
    <aside className="w-64 flex-shrink-0 bg-primary-900 text-white flex flex-col h-full shadow-xl z-30">
      {/* Logo */}
      <div className="p-lg border-b border-primary-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shadow-inner">
          <CheckSquare className="text-white" size={24} />
        </div>
        <span className="text-h2 font-bold tracking-tight">TaskFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-md space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-md py-sm rounded-md transition-all duration-150 font-medium
              ${isActive 
                ? 'bg-white/20 text-white shadow-sm' 
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Area */}
      <div className="p-md border-t border-primary-800">
        <div className="flex items-center gap-3 px-md py-sm mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-primary-800">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-bold truncate">{user?.name}</p>
            <p className="text-[10px] text-white/50 truncate uppercase tracking-wider font-semibold">{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-md py-sm rounded-md text-white/70 hover:bg-error-500/20 hover:text-error-400 transition-all duration-150 font-medium"
        >
          <LogOut size={20} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
