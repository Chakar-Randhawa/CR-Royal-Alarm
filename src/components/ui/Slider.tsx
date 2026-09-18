interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (value: number) => string;
}

export function Slider({ value, min, max, step = 1, onChange, label, formatValue }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
            {label}
          </span>
          {formatValue && (
            <span className="text-sm" style={{ color: 'var(--c-accent)' }}>
              {formatValue(value)}
            </span>
          )}
        </div>
      )}
      <div className="relative py-2">
        <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--c-border)' }}>
          <div
            className="h-2 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%`, backgroundColor: 'var(--c-primary)' }}
          />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all duration-150 pointer-events-none"
          style={{
            left: `calc(${percentage}% - 10px)`,
            backgroundColor: 'var(--c-surface)',
            borderColor: 'var(--c-primary)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
