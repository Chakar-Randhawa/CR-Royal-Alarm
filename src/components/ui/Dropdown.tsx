import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@/components/icons/AlarmIcons';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function Dropdown({ value, options, onChange, label, placeholder }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="w-full" ref={ref}>
      {label && (
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--c-text)' }}>
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors"
        style={{
          backgroundColor: 'var(--c-surface)',
          border: `1px solid var(--c-border)`,
          color: 'var(--c-text)',
        }}
      >
        <span className="text-sm">
          {selected ? selected.label : placeholder || 'Select...'}
        </span>
        <ChevronDownIcon
          size={16}
          color="var(--c-textMuted)"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-xl"
          style={{
            backgroundColor: 'var(--c-surface)',
            border: `1px solid var(--c-border)`,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex items-center justify-between w-full px-4 py-3 text-sm transition-colors hover:opacity-80"
              style={{
                backgroundColor: option.value === value ? 'var(--c-bgTertiary)' : 'transparent',
                color: 'var(--c-text)',
              }}
            >
              {option.label}
              {option.value === value && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--c-primary)' }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
