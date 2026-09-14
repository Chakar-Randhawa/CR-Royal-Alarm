import { useEffect, useState } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
}

let toastSetter: ((message: string) => void) | null = null;

export function showToast(message: string) {
  if (toastSetter) toastSetter(message);
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });

  useEffect(() => {
    toastSetter = (message: string) => {
      setToast({ message, visible: true });
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
  }, [toast.visible]);

  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl shadow-2xl animate-in"
      style={{
        backgroundColor: 'var(--c-surface)',
        border: `1px solid var(--c-border)`,
        maxWidth: '90vw',
      }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
        {toast.message}
      </p>
    </div>
  );
}
