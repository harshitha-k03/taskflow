import { useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const titles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/profile': 'Profile',
  '/tasks': 'Task Details',
};

export default function Navbar() {
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const [isDark, setIsDark] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Task Assigned', desc: 'You were assigned to "Update UI Components"', time: '2m ago', unread: true },
    { id: 2, title: 'Project Update', desc: 'Frontend Revamp status changed to In Progress', time: '1h ago', unread: true },
    { id: 3, title: 'Mention', desc: 'Alex mentioned you in a comment', time: '3h ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const title = Object.entries(titles).find(([p]) => location.pathname.startsWith(p))?.[1] || 'TaskFlow';
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="h-16 flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-xl sticky top-0 z-20">
      <div className="flex items-center gap-lg">
        <h1 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-md">
        {/* Search - Desktop only */}
        <div className="hidden md:flex items-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all w-64">
          <Search size={16} className="text-neutral-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="bg-transparent border-none outline-none text-body-sm w-full placeholder:text-neutral-500"
          />
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-all text-neutral-500 dark:text-neutral-400"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-md transition-all relative ${showNotifications ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-20 animate-scale-in">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-50 text-body-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-wider">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto flex flex-col">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer flex gap-3 ${n.unread ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-primary-500' : 'bg-transparent'}`} />
                      <div>
                        <p className="text-body-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight mb-1">{n.title}</p>
                        <p className="text-xs text-neutral-500 mb-2">{n.desc}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <button onClick={() => setShowNotifications(false)} className="text-xs font-bold text-neutral-500 hover:text-primary-600 transition-colors">Close Activity</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-2"></div>

        {/* User Info */}
        <Link to="/profile" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:ring-2 group-hover:ring-primary-500/50 transition-all">
            {initial}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-body-sm font-bold text-neutral-900 dark:text-neutral-50 leading-none">{user?.name}</p>
            <p className="text-[10px] text-neutral-500 font-medium uppercase mt-1 tracking-wider">Member</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
