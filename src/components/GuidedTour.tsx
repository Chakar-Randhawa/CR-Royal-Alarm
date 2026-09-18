import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons/AlarmIcons';

interface TourStep {
  selector: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="fab"]',
    title: 'Create an alarm',
    body: 'Tap this button any time to set up a new alarm — time, repeat days, missions, custom sound, everything.',
  },
  {
    selector: '[data-tour="quicknap"]',
    title: 'Quick power naps',
    body: 'One tap sets a one-time alarm this many minutes from now — no need to open the full editor.',
  },
  {
    selector: '[data-tour="filters"]',
    title: 'Filter your alarms',
    body: 'Switch between All, Active, Weekdays or Weekends to quickly find the alarm you need.',
  },
  {
    selector: '[data-tour="sort"]',
    title: 'Sort your list',
    body: 'Order alarms by time, by which one rings next, or alphabetically by label.',
  },
  {
    selector: '[data-tour="settings"]',
    title: 'Themes & defaults',
    body: 'Pick from 5 themes and set your default snooze, vibration and volume behavior for new alarms.',
  },
];

interface GuidedTourProps {
  onFinish: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function GuidedTour({ onFinish }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    function measure() {
      const step = STEPS[stepIndex];
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    }
    // Give the dashboard a frame to finish laying out before measuring.
    const t = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [stepIndex]);

  function next() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onFinish();
    }
  }

  const step = STEPS[stepIndex];
  const pad = 8;

  // Position the tooltip card above or below the highlighted element,
  // whichever fits the viewport better.
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const showBelow = rect ? rect.top < viewportH * 0.55 : true;

  return (
    <div className="fixed inset-0 z-[150]">
      {/* Dimmed backdrop with a transparent cutout around the target element */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="cr-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - pad}
                y={rect.top - pad}
                width={rect.width + pad * 2}
                height={rect.height + pad * 2}
                rx={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#cr-tour-mask)" />
        {rect && (
          <rect
            x={rect.left - pad}
            y={rect.top - pad}
            width={rect.width + pad * 2}
            height={rect.height + pad * 2}
            rx={16}
            fill="none"
            stroke="var(--c-primary)"
            strokeWidth={2}
          />
        )}
      </svg>

      <div className="absolute inset-0" onClick={onFinish} style={{ pointerEvents: rect ? 'none' : 'auto' }} />

      <div
        className="absolute rounded-2xl p-4 w-[calc(100vw-48px)] max-w-sm animate-in"
        style={{
          backgroundColor: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          left: 24,
          top: rect ? (showBelow ? rect.top + rect.height + pad + 12 : undefined) : '40%',
          bottom: rect && !showBelow ? viewportH - (rect.top - pad) + 12 : undefined,
          pointerEvents: 'auto',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>
            {step.title}
          </p>
          <button onClick={onFinish} className="shrink-0 p-1 -mt-1 -mr-1 rounded-full hover:opacity-70">
            <CloseIcon size={16} color="var(--c-textMuted)" />
          </button>
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--c-textSecondary)' }}>
          {step.body}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === stepIndex ? 16 : 6,
                  backgroundColor: i === stepIndex ? 'var(--c-primary)' : 'var(--c-border)',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onFinish} className="text-xs font-medium" style={{ color: 'var(--c-textMuted)' }}>
              Skip tour
            </button>
            <button
              onClick={next}
              className="px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-primaryText)' }}
            >
              {stepIndex === STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
