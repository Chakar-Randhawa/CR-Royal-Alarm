import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFade(true), 1200);
    const doneTimer = setTimeout(onComplete, 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-600"
      style={{
        backgroundColor: 'var(--c-bg)',
        opacity: fade ? 0 : 1,
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
          style={{
            backgroundColor: 'var(--c-surface)',
            border: `2px solid var(--c-primary)`,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="13" r="9" stroke="var(--c-primary)" strokeWidth="2" />
            <path d="M12 8v5l3 3" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 3 2 6M22 6l-3-3" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--c-text)' }}>
          CR Royal Alarm
        </h1>
        <div className="mt-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: 'var(--c-primary)',
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
