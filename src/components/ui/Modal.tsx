import { type ReactNode, useEffect } from 'react';
import { CloseIcon } from '@/components/icons/AlarmIcons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  fullScreen?: boolean;
}

export function Modal({ open, onClose, title, children, fullScreen }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${fullScreen ? 'sm:max-w-full h-full' : 'sm:max-w-md'} rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col`}
        style={{
          backgroundColor: 'var(--c-bg)',
          border: `1px solid var(--c-border)`,
          maxHeight: fullScreen ? '100%' : '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{
              borderBottom: `1px solid var(--c-border)`,
              paddingTop: fullScreen ? 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))' : '16px',
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--c-text)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full transition-colors hover:opacity-70"
              style={{ backgroundColor: 'var(--c-surface)' }}
            >
              <CloseIcon size={20} color="var(--c-text)" />
            </button>
          </div>
        )}
        <div
          className="overflow-y-auto flex-1 px-5 py-4"
          style={{ paddingBottom: fullScreen ? 'calc(env(safe-area-inset-bottom, 0px) + 24px)' : '16px' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
