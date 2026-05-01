import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/profile': 'Profile',
};

export default function Navbar() {
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);

  const title = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'TaskFlow';

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="btn-ghost p-2 rounded-lg relative">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
