import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Common/Sidebar';
import Navbar from './Common/Navbar';
import NotificationListener from './Common/NotificationListener';
import AIChatbot from './AIChatbot/AIChatbot';

export default function Layout() {
  const { mode } = useSelector((s) => s.theme);

  return (
    <div className={`flex h-screen overflow-hidden ${mode === 'dark' ? 'bg-neutral-950' : 'bg-slate-50'}`}>
      <Sidebar />
      <NotificationListener />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className={`flex-1 overflow-y-auto p-6 animate-fade-in ${mode === 'dark' ? 'bg-neutral-950' : 'bg-slate-50'}`}>
          <Outlet />
        </main>
      </div>
      <AIChatbot />
    </div>
  );
}
