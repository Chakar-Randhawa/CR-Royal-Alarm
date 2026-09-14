import { ZapIcon } from '@/components/icons/AlarmIcons';

interface QuickNapTilesProps {
  onQuickNap: (minutes: number) => void;
}

const NAP_OPTIONS = [
  { minutes: 15, label: '+15 min' },
  { minutes: 30, label: '+30 min' },
  { minutes: 45, label: '+45 min' },
  { minutes: 60, label: '+1 hr' },
];

export function QuickNapTiles({ onQuickNap }: QuickNapTilesProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {NAP_OPTIONS.map((opt) => (
        <button
          key={opt.minutes}
          onClick={() => onQuickNap(opt.minutes)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl shrink-0 transition-all hover:opacity-80 active:scale-95"
          style={{
            backgroundColor: 'var(--c-surface)',
            border: `1px solid var(--c-border)`,
          }}
        >
          <ZapIcon size={16} color="var(--c-accent)" />
          <span className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
