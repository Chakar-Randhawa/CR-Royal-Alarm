import { useEffect, useState } from 'react';

type ToastType = 'default' | 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

let toastSetter: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = 'default') {
  if (toastSetter) toastSetter(message, type);
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastState>({ id: 0, message: '', type: 'default', visible: false });

  useEffect(() => {
    toastSetter = (message: string, type: ToastType) => {
      setToast({ id: Date.now(), message, type, visible: true });
    };
    return () => {
      toastSetter = null;
    };
  }, []);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, toast.id]);

  if (!toast.visible) return null;

  const borderColor =
    toast.type === 'success' ? 'var(--c-success)' : toast.type === 'error' ? 'var(--c-error)' : 'var(--c-border)';

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl shadow-2xl animate-in"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
        backgroundColor: 'var(--c-surface)',
        border: `1px solid ${borderColor}`,
        maxWidth: '90vw',
      }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
        {toast.message}
      </p>
    </div>
  );
}
