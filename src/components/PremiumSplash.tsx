import { useEffect, useState } from 'react';

interface PremiumSplashProps {
  onComplete: () => void;
}

/**
 * Shown exactly once — the very first time the app is ever opened.
 * Every subsequent launch uses the lightweight SplashScreen instead.
 */
export function PremiumSplash({ onComplete }: PremiumSplashProps) {
  const [stage, setStage] = useState<'icon' | 'name' | 'tagline' | 'exit'>('icon');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('name'), 500);
    const t2 = setTimeout(() => setStage('tagline'), 1300);
    const t3 = setTimeout(() => setStage('exit'), 3000);
    const t4 = setTimeout(onComplete, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500"
      style={{
        background: 'radial-gradient(circle at 50% 40%, var(--c-bgTertiary) 0%, var(--c-bg) 75%)',
        opacity: stage === 'exit' ? 0 : 1,
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="cr-particle"
            style={{
              left: `${(i * 173) % 100}%`,
              animationDelay: `${(i * 0.5) % 5}s`,
              animationDuration: `${6 + (i % 4)}s`,
              opacity: 0.12 + (i % 3) * 0.04,
            }}
          />
        ))}
      </div>

      <div
        className="relative w-28 h-28 rounded-[28px] flex items-center justify-center mb-7 transition-all duration-700"
        style={{
          backgroundColor: 'var(--c-surface)',
          border: '2px solid var(--c-primary)',
          boxShadow: '0 0 60px rgba(220,38,38,0.35)',
          transform: stage === 'icon' ? 'scale(0.85)' : 'scale(1)',
          opacity: 1,
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="13" r="9" stroke="var(--c-primary)" strokeWidth="2" />
          <path d="M12 8v5l3 3" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 3 2 6M22 6l-3-3" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h1
        className="text-3xl font-bold tracking-tight text-center transition-all duration-500"
        style={{
          color: 'var(--c-text)',
          opacity: stage === 'icon' ? 0 : 1,
          transform: stage === 'icon' ? 'translateY(8px)' : 'translateY(0)',
        }}
      >
        CR Royal Alarm
      </h1>

      <p
        className="text-sm mt-2 tracking-wide transition-all duration-500"
        style={{
          color: 'var(--c-textMuted)',
          opacity: stage === 'tagline' || stage === 'exit' ? 1 : 0,
          transform: stage === 'tagline' || stage === 'exit' ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        Founder By Chakar Randhawa
      </p>

      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: 'var(--c-primary)', animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
