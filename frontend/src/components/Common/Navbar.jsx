import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, Sun, Moon, Check, X, Command } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toggleTheme } from '../../store/themeSlice';
import {
  setNotifications,
  markOneRead as markOneReadAction,
  markAllRead as markAllReadAction,
} from '../../store/notificationSlice';
import * as notifApi from '../../api/notifications';
import api from '../../api/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const titles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/tasks': 'Task Details',
  '/team': 'Team',
};

const TYPE_ICONS = {
  task_assigned: '📋',
  member_added: '👥',
  task_due_soon: '⏰',
  task_overdue: '🔴',
  default: '🔔',
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { mode } = useSelector((s) => s.theme);
  const { items: notifications, unreadCount } = useSelector((s) => s.notifications);

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  const isDark = mode === 'dark';

  // Fetch notifications — runs on mount AND every 30 s (real-time bell update)
  const hasToasted = useRef(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await notifApi.getNotifications();
      dispatch(setNotifications(r.data.data));

      // Show login toast ONCE per session when there are unread notifications
      if (!hasToasted.current) {
        hasToasted.current = true;
        const unread = r.data.data.filter((n) => !n.read).length;
        if (unread > 0) {
          toast.info(`You have ${unread} unread notification${unread > 1 ? 's' : ''}`, {
            description: 'Click the bell icon to view them.',
            duration: 4500,
          });
        }
      }
    } catch (_) {}
  }, [dispatch]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30 s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close notification panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ⌘K / Ctrl+K shortcut to focus search
  const searchInputRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearch(true);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showSearch]);

  // Debounced search
  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const [tasks, projects] = await Promise.all([
          api.get('/tasks', { params: { search: q, limit: 5 } }),
          api.get('/projects', { params: { search: q } }),
        ]);
        const taskResults = (tasks.data.tasks || []).map((t) => ({
          id: t._id, type: 'task', label: t.title,
          sub: t.project?.name || 'Task',
          href: `/projects/${t.project?._id || t.project}/board`,
        }));
        const projectResults = (projects.data.projects || [])
          .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 3)
          .map((p) => ({
            id: p._id, type: 'project', label: p.name,
            sub: `${p.taskCount || 0} tasks`,
            href: `/projects/${p._id}`,
          }));
        setSearchResults([...projectResults, ...taskResults]);
      } catch (_) {}
      finally { setSearchLoading(false); }
    }, 350);
  }, []);

  const handleMarkOne = async (id) => {
    dispatch(markOneReadAction(id));
    try { await notifApi.markOneRead(id); } catch (_) {}
  };

  const handleMarkAll = async () => {
    dispatch(markAllReadAction());
    try { await notifApi.markAllRead(); } catch (_) {}
  };

  const title = Object.entries(titles).find(([p]) => location.pathname.startsWith(p))?.[1] || 'TaskFlow';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  // Theme-aware class helpers
  const navBg = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400';
  const iconBtn = isDark
    ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800';
  const dropdownBg = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200';

  return (
    <header className={`h-16 flex-shrink-0 border-b flex items-center justify-between px-xl sticky top-0 z-20 ${navBg}`}>
      <div className="flex items-center gap-lg">
        <h1 className={`text-h3 font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">

        {/* ── Search ── */}
        <div className="relative" ref={searchRef}>
          <div className={`hidden md:flex items-center border rounded-lg px-3 py-1.5 transition-all w-56 focus-within:w-72 focus-within:ring-2 focus-within:ring-primary-500/30 ${inputBg}`}>
            <Search size={15} className={`mr-2 shrink-0 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks & projects..."
              value={searchQuery}
              onChange={(e) => { handleSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="bg-transparent border-none outline-none text-body-sm w-full"
            />
            {searchQuery ? (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="ml-1">
                <X size={14} className={isDark ? 'text-neutral-500' : 'text-slate-400'} />
              </button>
            ) : (
              <kbd className={`hidden lg:inline-flex items-center gap-0.5 ml-1 px-2 py-0.5 rounded text-xs font-bold border shrink-0 tracking-widest ${isDark ? 'border-neutral-600 text-neutral-400 bg-neutral-800' : 'border-slate-300 text-slate-500 bg-slate-50'}`}>
                {typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘K' : 'Ctrl K'}
              </kbd>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearch && searchQuery && (
            <div className={`absolute top-full mt-2 left-0 w-80 rounded-xl shadow-xl border z-50 overflow-hidden animate-scale-in ${dropdownBg}`}>
              {searchLoading ? (
                <div className={`p-4 text-center text-body-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { navigate(r.href); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${r.type === 'project' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {r.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-body-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.label}</p>
                        <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>{r.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`p-4 text-center text-body-sm ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  No results for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Theme Toggle ── */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className={`p-2 rounded-lg transition-all ${iconBtn}`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* ── Notifications ── */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => {
              const next = !showNotifications;
              setShowNotifications(next);
              if (next) fetchNotifications(); // instant refresh on open
            }}
            className={`p-2 rounded-lg transition-all relative ${showNotifications
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : iconBtn}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-neutral-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-scale-in ${dropdownBg}`}>
              {/* Header */}
              <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-body-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAll} className="flex items-center gap-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-wider">
                    <Check size={11} /> All read
                  </button>
                )}
              </div>

              {/* List */}
              <div className={`max-h-[360px] overflow-y-auto flex flex-col divide-y ${isDark ? 'divide-neutral-800/50' : 'divide-slate-50'}`}>
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <Bell size={32} className={`mb-3 ${isDark ? 'text-neutral-700' : 'text-slate-200'}`} />
                    <p className={`text-body-sm font-bold ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>You're all caught up!</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-neutral-600' : 'text-slate-300'}`}>No new notifications right now.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkOne(n._id)}
                      className={`p-4 transition-colors cursor-pointer flex gap-3 ${!n.read
                        ? isDark ? 'bg-primary-900/10' : 'bg-primary-50/50'
                        : ''} ${isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="text-xl shrink-0 mt-0.5">{TYPE_ICONS[n.type] || TYPE_ICONS.default}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-body-sm font-bold leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{n.title}</p>
                        <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{n.message}</p>
                        <p className={`text-[10px] font-semibold uppercase mt-1.5 tracking-wider ${isDark ? 'text-neutral-600' : 'text-slate-300'}`}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className={`p-3 text-center border-t ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-slate-100 bg-slate-50'}`}>
                <button onClick={() => setShowNotifications(false)} className={`text-xs font-bold transition-colors ${isDark ? 'text-neutral-500 hover:text-primary-400' : 'text-slate-400 hover:text-primary-600'}`}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`h-8 w-[1px] mx-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />

        {/* ── User ── */}
        <Link to="/profile" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:ring-2 group-hover:ring-primary-500/50 transition-all overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : initial}
          </div>
          <div className="hidden lg:block text-left">
            <p className={`text-body-sm font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
            <p className={`text-[10px] font-medium uppercase mt-1 tracking-wider ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>Member</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
