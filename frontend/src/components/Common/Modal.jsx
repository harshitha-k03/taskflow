import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  if (!isOpen) return null;

  const widths = { sm: 380, md: 480, lg: 640, xl: 800 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      {/* Backdrop — Nefee: rgba(13,20,33,0.6) */}
      <div onClick={onClose} className="animate-fade-in" style={{
        position: 'absolute', inset: 0,
        background: 'rgba(13,20,33,0.75)',
        backdropFilter: 'blur(4px)',
      }} />

      {/* Panel */}
      <div className="animate-pop-in" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: widths[size],
        background: 'linear-gradient(-20.95deg, rgba(255,255,255,0.06) 40.13%, rgba(255,255,255,0.1) 97.02%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#F2F4F7' }}>{title}</h2>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, width: 30, height: 30,
              cursor: 'pointer', color: '#B1B4BA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms ease, color 150ms ease',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1, padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
