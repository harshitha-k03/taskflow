import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ show, isOpen, onClose, title, children, size = 'md' }) {
  const isVisible = show !== undefined ? show : isOpen;

  useEffect(() => {
    if (isVisible) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isVisible]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && isVisible) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, isVisible]);

  if (!isVisible) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm animate-fade-in"
      />

      {/* Panel */}
      <div className={`relative z-10 w-full ${widths[size]} bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]`}>
        {title && (
          <div className="flex items-center justify-between px-lg py-md border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/50">
            <h2 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50">{title}</h2>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
