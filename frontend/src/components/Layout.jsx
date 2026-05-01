import { Outlet } from 'react-router-dom';
import Sidebar from './Common/Sidebar';
import Navbar from './Common/Navbar';

export default function Layout() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #0D1421 0%, #152036 100%)',
    }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
